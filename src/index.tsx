import { Hono } from 'hono';
import type { MiddlewareHandler } from 'hono';
import { runCollection } from './collector';
import { now } from './lib/utils';
import type { Env } from './types';
import { ApiPage, PublicPage, type DashboardData, type Locale } from './ui';
import { notifyWebhook } from './webhooks';

type AppBindings = { Bindings: Env };
const app = new Hono<AppBindings>();

const securityHeaders: MiddlewareHandler<AppBindings> = async (c, next) => {
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  c.header('Content-Security-Policy', "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'self'; frame-ancestors 'none'");
};

app.use('*', securityHeaders);

async function dashboardData(env: Env): Promise<DashboardData> {
  const [full, lite, count, sourceCount, latestRun] = await Promise.all([
    env.DB.prepare("SELECT value FROM keys WHERE status = 'active' ORDER BY last_seen_at DESC LIMIT 100").all<{ value: string }>(),
    env.DB.prepare('SELECT key_value FROM lite_keys ORDER BY position').all<{ key_value: string }>(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM keys WHERE status = 'active'").first<{ count: number }>(),
    env.DB.prepare('SELECT COUNT(*) AS count FROM sources WHERE enabled = 1').first<{ count: number }>(),
    env.DB.prepare("SELECT status, added_count, removed_count, fetched_source_count, source_count, finished_at FROM collection_runs WHERE status != 'running' ORDER BY started_at DESC LIMIT 1").first<{ status: string; added_count: number; removed_count: number; fetched_source_count: number; source_count: number; finished_at: number }>(),
  ]);

  return {
    full: full.results.map((row) => row.value),
    lite: lite.results.map((row) => row.key_value),
    activeCount: Number(count?.count ?? 0),
    sourceCount: Number(sourceCount?.count ?? 0),
    lastUpdated: latestRun?.finished_at ?? null,
    latestRun,
  };
}

function publicHeaders(c: { header(name: string, value: string): void }) {
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Cache-Control', 'public, max-age=30, s-maxage=120, stale-while-revalidate=300');
}

function preferredLocale(header: string | undefined): Locale {
  return header?.toLowerCase().includes('zh') ? 'zh' : 'en';
}

app.get('/', (c) => {
  c.header('Vary', 'Accept-Language');
  return c.redirect(`/${preferredLocale(c.req.header('Accept-Language'))}`, 302);
});
app.get('/api', (c) => {
  c.header('Vary', 'Accept-Language');
  return c.redirect(`/${preferredLocale(c.req.header('Accept-Language'))}/api`, 302);
});
app.get('/zh', async (c) => c.html(PublicPage({ data: await dashboardData(c.env), baseUrl: new URL(c.req.url).origin, locale: 'zh' })));
app.get('/en', async (c) => c.html(PublicPage({ data: await dashboardData(c.env), baseUrl: new URL(c.req.url).origin, locale: 'en' })));
app.get('/zh/api', (c) => c.html(ApiPage({ baseUrl: new URL(c.req.url).origin, locale: 'zh' })));
app.get('/en/api', (c) => c.html(ApiPage({ baseUrl: new URL(c.req.url).origin, locale: 'en' })));

app.get('/api/full', async (c) => {
  const result = await c.env.DB.prepare("SELECT value FROM keys WHERE status = 'active' ORDER BY last_seen_at DESC LIMIT 100").all<{ value: string }>();
  publicHeaders(c);
  return c.text(result.results.map((row) => row.value).join('\n'), result.results.length ? 200 : 404, { 'Content-Type': 'text/plain; charset=utf-8' });
});

app.get('/api/lite', async (c) => {
  const result = await c.env.DB.prepare('SELECT key_value FROM lite_keys ORDER BY position').all<{ key_value: string }>();
  publicHeaders(c);
  return c.text(result.results.map((row) => row.key_value).join('\n'), result.results.length ? 200 : 404, { 'Content-Type': 'text/plain; charset=utf-8' });
});

app.get('/api/diff', async (c) => {
  const run = await c.env.DB.prepare("SELECT * FROM collection_runs WHERE status != 'running' ORDER BY started_at DESC LIMIT 1").first<Record<string, unknown>>();
  publicHeaders(c);
  if (!run) return c.json({ run: null, added: [], removed: [] });
  const events = await c.env.DB.prepare('SELECT key_value, event_type FROM key_events WHERE run_id = ? ORDER BY id').bind(run.id).all<{ key_value: string; event_type: string }>();
  return c.json({
    run,
    added: events.results.filter((event) => event.event_type === 'added').map((event) => event.key_value),
    removed: events.results.filter((event) => event.event_type === 'removed').map((event) => event.key_value),
  });
});

app.get('/api/status', async (c) => {
  publicHeaders(c);
  const data = await dashboardData(c.env);
  return c.json({ active: data.activeCount, sources: data.sourceCount, lastUpdated: data.lastUpdated, latestRun: data.latestRun });
});

app.get('/health', (c) => c.json({ ok: true, service: c.env.APP_NAME ?? 'WarpKey Edge Console', time: now() }));
app.get('/favicon.ico', () => new Response(null, { status: 204 }));
app.notFound((c) => c.text('Not Found', 404));
app.onError((error, c) => {
  console.error(error);
  return c.json({ error: 'Internal Server Error' }, 500);
});

export default {
  fetch: app.fetch,
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil((async () => {
      const result = await runCollection(env, 'cron');
      await notifyWebhook(env, result);
    })());
  },
} satisfies ExportedHandler<Env>;
