import type { Env, CollectionResult, RunTrigger, Source } from './types';
import { now, randomId } from './lib/utils';

const KEY_PATTERN = /\b[A-Za-z0-9]{8}(?:-[A-Za-z0-9]{8}){2}\b/g;
const REQUEST_TIMEOUT_MS = 12_000;

interface SourceFetch {
  source: Source;
  keys: string[];
  error?: string;
}

function decodeHtml(value: string) {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'");
}

function parseKeys(html: string) {
  const found = new Set<string>();
  const codeBlocks = html.match(/<code\b[^>]*>[\s\S]*?<\/code>/gi) ?? [];
  for (const block of codeBlocks) {
    const value = decodeHtml(block);
    for (const match of value.matchAll(KEY_PATTERN)) found.add(match[0]);
  }
  return [...found];
}

async function fetchSource(source: Source): Promise<SourceFetch> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(source.url, {
      signal: controller.signal,
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'WarpKeyEdgeConsole/2.0 (+https://github.com/nas-tool/warpkey)',
      },
    });
    if (!response.ok) return { source, keys: [], error: `HTTP ${response.status}` };
    const keys = parseKeys(await response.text());
    if (!keys.length) return { source, keys: [], error: '页面中没有匹配的密钥' };
    return { source, keys };
  } catch (error) {
    return { source, keys: [], error: error instanceof Error ? error.message : '请求失败' };
  } finally {
    clearTimeout(timeout);
  }
}

async function runBatches(env: Env, statements: D1PreparedStatement[]) {
  for (let index = 0; index < statements.length; index += 75) {
    const chunk = statements.slice(index, index + 75);
    if (chunk.length) await env.DB.batch(chunk);
  }
}

function shuffled<T>(values: T[]) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

async function acquireLock(env: Env) {
  const timestamp = now();
  const result = await env.DB.prepare('UPDATE collection_lock SET locked_until = ? WHERE id = 1 AND locked_until < ?').bind(timestamp + 600, timestamp).run();
  return Number(result.meta?.changes ?? 0) === 1;
}

async function releaseLock(env: Env) {
  await env.DB.prepare('UPDATE collection_lock SET locked_until = 0 WHERE id = 1').run();
}

export async function listSources(env: Env, includeDisabled = false) {
  const query = includeDisabled ? 'SELECT * FROM sources ORDER BY name' : 'SELECT * FROM sources WHERE enabled = 1 ORDER BY name';
  const result = await env.DB.prepare(query).all<Source>();
  return result.results;
}

export async function runCollection(env: Env, trigger: RunTrigger): Promise<CollectionResult> {
  const startedAt = now();
  const runId = randomId('run_');
  if (!(await acquireLock(env))) {
    return { runId, status: 'skipped', found: [], added: [], removed: [], fetchedSourceCount: 0, sourceCount: 0, startedAt, finishedAt: now(), error: '已有采集任务正在运行' };
  }

  try {
    const sources = await listSources(env);
    await env.DB.prepare('INSERT INTO collection_runs (id, trigger, status, started_at, source_count) VALUES (?, ?, ?, ?, ?)').bind(runId, trigger, 'running', startedAt, sources.length).run();
    if (!sources.length) throw new Error('没有启用的来源');

    const fetched = await Promise.all(sources.map(fetchSource));
    const successful = fetched.filter((item) => !item.error);
    const foundSet = new Set<string>();
    const sourceKeys = new Map<string, Set<string>>();
    for (const item of successful) {
      sourceKeys.set(item.source.id, new Set(item.keys));
      for (const key of item.keys) foundSet.add(key);
    }

    const currentRows = await env.DB.prepare("SELECT value, status FROM keys WHERE status = 'active'").all<{ value: string; status: string }>();
    const activeBefore = new Set(currentRows.results.map((row) => row.value));
    const found = [...foundSet];
    const added = found.filter((key) => !activeBefore.has(key));
    const fullSuccess = successful.length === sources.length;
    const removed = fullSuccess ? [...activeBefore].filter((key) => !foundSet.has(key)) : [];
    const timestamp = now();
    const statements: D1PreparedStatement[] = [];

    for (const key of found) {
      statements.push(env.DB.prepare(
        "INSERT INTO keys (value, status, first_seen_at, last_seen_at, last_validated_at, last_run_id) VALUES (?, 'active', ?, ?, ?, ?) ON CONFLICT(value) DO UPDATE SET status = 'active', last_seen_at = excluded.last_seen_at, last_validated_at = excluded.last_validated_at, last_run_id = excluded.last_run_id",
      ).bind(key, timestamp, timestamp, timestamp, runId));
    }
    for (const key of removed) {
      statements.push(env.DB.prepare("UPDATE keys SET status = 'inactive', last_run_id = ? WHERE value = ?").bind(runId, key));
    }
    for (const [sourceId, keys] of sourceKeys) {
      for (const key of keys) {
        statements.push(env.DB.prepare(
          'INSERT INTO key_sources (key_value, source_id, first_seen_at, last_seen_at) VALUES (?, ?, ?, ?) ON CONFLICT(key_value, source_id) DO UPDATE SET last_seen_at = excluded.last_seen_at',
        ).bind(key, sourceId, timestamp, timestamp));
      }
    }
    for (const key of added) statements.push(env.DB.prepare('INSERT INTO key_events (run_id, key_value, event_type, created_at) VALUES (?, ?, ?, ?)').bind(runId, key, 'added', timestamp));
    for (const key of removed) statements.push(env.DB.prepare('INSERT INTO key_events (run_id, key_value, event_type, created_at) VALUES (?, ?, ?, ?)').bind(runId, key, 'removed', timestamp));
    await runBatches(env, statements);

    const activeAfter = await env.DB.prepare("SELECT value FROM keys WHERE status = 'active' ORDER BY last_seen_at DESC LIMIT 100").all<{ value: string }>();
    const lite = shuffled(activeAfter.results.map((row) => row.value)).slice(0, 15);
    const liteStatements: D1PreparedStatement[] = [env.DB.prepare('DELETE FROM lite_keys')];
    lite.forEach((key, position) => liteStatements.push(env.DB.prepare('INSERT INTO lite_keys (key_value, position) VALUES (?, ?)').bind(key, position)));
    await runBatches(env, liteStatements);

    const status = fullSuccess ? 'success' : successful.length ? 'partial' : 'failed';
    const errors = fetched.filter((item) => item.error).map((item) => `${item.source.name}: ${item.error}`).join('; ');
    await env.DB.prepare('UPDATE collection_runs SET status = ?, finished_at = ?, fetched_source_count = ?, found_count = ?, added_count = ?, removed_count = ?, error = ? WHERE id = ?').bind(status, now(), successful.length, found.length, added.length, removed.length, errors || null, runId).run();
    return { runId, status, found, added, removed, fetchedSourceCount: successful.length, sourceCount: sources.length, startedAt, finishedAt: now(), error: errors || undefined };
  } catch (error) {
    const message = error instanceof Error ? error.message : '采集失败';
    await env.DB.prepare('UPDATE collection_runs SET status = ?, finished_at = ?, error = ? WHERE id = ?').bind('failed', now(), message, runId).run().catch(() => undefined);
    return { runId, status: 'failed', found: [], added: [], removed: [], fetchedSourceCount: 0, sourceCount: 0, startedAt, finishedAt: now(), error: message };
  } finally {
    await releaseLock(env);
  }
}

export async function toggleSource(env: Env, sourceId: string, enabled: boolean) {
  await env.DB.prepare('UPDATE sources SET enabled = ?, updated_at = ? WHERE id = ?').bind(enabled ? 1 : 0, now(), sourceId).run();
}

export async function createSource(env: Env, name: string, url: string) {
  const id = randomId('src_');
  await env.DB.prepare('INSERT INTO sources (id, name, url, enabled, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)').bind(id, name.trim(), url.trim(), now(), now()).run();
}
