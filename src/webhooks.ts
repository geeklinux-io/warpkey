import type { CollectionResult, Env } from './types';
import { csv, hmacSha256, now } from './lib/utils';

function enabled(env: Env) {
  return env.WEBHOOK_ENABLED === 'true' && Boolean(env.WEBHOOK_URL);
}

function payloadFor(result: CollectionResult, baseUrl: string | undefined) {
  return {
    event: result.status === 'failed' ? 'collection.failed' : 'keys.changed',
    sent_at: new Date().toISOString(),
    run: {
      id: result.runId,
      status: result.status,
      started_at: result.startedAt,
      finished_at: result.finishedAt,
      sources: `${result.fetchedSourceCount}/${result.sourceCount}`,
    },
    changes: { added: result.added, removed: result.removed },
    links: baseUrl ? {
      full: `${baseUrl}/api/full`,
      lite: `${baseUrl}/api/lite`,
      diff: `${baseUrl}/api/diff`,
    } : undefined,
    error: result.error,
  };
}

async function deliver(env: Env, eventType: string, body: Record<string, unknown>) {
  const payload = JSON.stringify(body);
  const signature = env.WEBHOOK_SECRET ? await hmacSha256(env.WEBHOOK_SECRET, payload) : '';
  let statusCode: number | undefined;
  let error: string | undefined;
  let attempts = 0;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    attempts = attempt;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetch(env.WEBHOOK_URL!, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'content-type': 'application/json',
          'user-agent': 'WarpKeyEdgeConsole-Webhook/2.0',
          'x-warpkey-event': eventType,
          ...(signature ? { 'x-warpkey-signature': `sha256=${signature}` } : {}),
        },
        body: payload,
      });
      statusCode = response.status;
      if (response.ok) {
        error = undefined;
        break;
      }
      error = `HTTP ${response.status}`;
    } catch (caught) {
      error = caught instanceof Error ? caught.message : '发送失败';
    } finally {
      clearTimeout(timeout);
    }
  }

  await env.DB.prepare(
    'INSERT INTO webhook_deliveries (event_type, status_code, attempts, delivered_at, error, created_at) VALUES (?, ?, ?, ?, ?, ?)',
  ).bind(eventType, statusCode ?? null, attempts, statusCode && statusCode >= 200 && statusCode < 300 ? now() : null, error ?? null, now()).run();
}

export async function notifyWebhook(env: Env, result: CollectionResult) {
  if (!enabled(env)) return;
  const eventType = result.status === 'failed' ? 'collection.failed' : 'keys.changed';
  const events = csv(env.WEBHOOK_EVENTS ?? 'keys.changed,collection.failed');
  if (!events.includes(eventType)) return;
  if (eventType === 'keys.changed' && !result.added.length && !result.removed.length) return;
  await deliver(env, eventType, payloadFor(result, env.PUBLIC_BASE_URL));
}
