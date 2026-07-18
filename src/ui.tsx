import type { Child } from 'hono/jsx';
import { formatDate, formatNumber } from './lib/utils';

const CSS = `
:root {
  color-scheme: dark;
  --ink: #07111d;
  --panel: #0d1b2a;
  --line: #20374a;
  --muted: #8ca1b2;
  --text: #e9f1f4;
  --orange: #f48120;
  --orange-soft: #ffb36b;
  --teal: #43d3b2;
  --red: #f87171;
  --mono: "IBM Plex Mono", "SFMono-Regular", Consolas, monospace;
  --sans: "Avenir Next", "Segoe UI", system-ui, sans-serif;
}
* { box-sizing: border-box; }
html { background: var(--ink); }
body {
  margin: 0;
  min-height: 100vh;
  color: var(--text);
  font-family: var(--sans);
  background: radial-gradient(circle at 84% -10%, #15334d 0, transparent 38%), var(--ink);
}
body::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  opacity: .08;
  background-image: linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: linear-gradient(to bottom, #000, transparent 90%);
}
a { color: inherit; text-decoration: none; }
button { font: inherit; cursor: pointer; }
h1, h2, h3, p { margin: 0; }
.shell { width: min(1180px, calc(100% - 40px)); margin: 0 auto; }
.topbar {
  height: 74px;
  border-bottom: 1px solid rgba(140,161,178,.18);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  z-index: 2;
}
.brand { display: flex; align-items: center; gap: 12px; font-weight: 750; letter-spacing: -.03em; }
.brand-mark {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  color: #241207;
  background: var(--orange);
  box-shadow: 0 0 30px rgba(244,129,32,.22);
}
.brand small { display: block; color: var(--muted); font: 10px var(--mono); letter-spacing: .1em; text-transform: uppercase; }
.nav { display: flex; align-items: center; gap: 6px; }
.nav a { padding: 9px 12px; color: var(--muted); border: 1px solid transparent; border-radius: 8px; font-size: 13px; }
.nav a:hover { color: var(--text); border-color: var(--line); background: rgba(255,255,255,.03); }
.nav .accent { color: var(--orange-soft); }
.hero { padding: 76px 0 42px; display: grid; grid-template-columns: 1.05fr .95fr; gap: 54px; align-items: center; }
.eyebrow { font: 11px var(--mono); letter-spacing: .16em; text-transform: uppercase; color: var(--orange-soft); display: flex; align-items: center; gap: 10px; }
.eyebrow::before { content: ""; width: 24px; height: 1px; background: var(--orange); }
.hero h1 { font-size: clamp(42px, 6vw, 78px); line-height: .98; letter-spacing: -.065em; max-width: 660px; margin: 20px 0; }
.hero h1 em { font-style: normal; color: var(--orange); }
.lede { max-width: 550px; color: var(--muted); font-size: 17px; line-height: 1.65; }
.hero-actions { display: flex; gap: 12px; margin-top: 28px; flex-wrap: wrap; }
.button {
  min-height: 42px;
  padding: 0 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 9px;
  border: 1px solid var(--line);
  background: rgba(255,255,255,.04);
  color: var(--text);
  font-size: 13px;
  font-weight: 700;
  transition: .2s;
}
.button:hover { transform: translateY(-1px); border-color: #3b617a; background: rgba(255,255,255,.08); }
.button.primary { background: var(--orange); border-color: var(--orange); color: #251509; }
.button.small { min-height: 34px; padding: 0 11px; font-size: 12px; }
.signal-board {
  padding: 22px;
  position: relative;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(25,53,75,.85), rgba(10,24,38,.92));
  box-shadow: 0 20px 70px rgba(0,0,0,.22);
}
.signal-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
.signal-head strong { font-size: 13px; }
.signal-head span { font: 11px var(--mono); color: var(--teal); }
.signal-line { height: 126px; position: relative; }
.signal-line::before { content: ""; position: absolute; left: 8%; right: 8%; top: 54px; height: 1px; background: linear-gradient(90deg, var(--orange), #6db9e8, var(--teal)); opacity: .6; }
.signal-pulse { position: absolute; top: 49px; left: 9%; width: 11px; height: 11px; border-radius: 999px; background: var(--orange); box-shadow: 0 0 0 7px rgba(244,129,32,.14), 0 0 30px var(--orange); animation: travel 4s ease-in-out infinite; }
.signal-node { position: absolute; top: 35px; display: grid; gap: 8px; justify-items: center; }
.signal-node i { display: block; width: 38px; height: 38px; border: 1px solid var(--line); background: #0b1826; border-radius: 12px; }
.signal-node b { color: var(--muted); font: 10px var(--mono); font-weight: 500; }
.signal-node.one { left: 3%; }
.signal-node.two { left: 44%; }
.signal-node.three { right: 1%; }
.signal-node.two i { border-color: rgba(244,129,32,.6); background: rgba(244,129,32,.12); }
.signal-foot { padding-top: 17px; border-top: 1px solid rgba(140,161,178,.14); display: flex; justify-content: space-between; color: var(--muted); font: 11px var(--mono); }
@keyframes travel { 0%, 100% { left: 9%; } 50% { left: 87%; } }
.section { padding: 36px 0; }
.section-head { display: flex; align-items: end; justify-content: space-between; gap: 18px; margin-bottom: 16px; }
.section-head h2 { font-size: 21px; letter-spacing: -.04em; }
.section-head p { color: var(--muted); font-size: 13px; }
.grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 14px; }
.panel { min-width: 0; padding: 20px; border: 1px solid var(--line); border-radius: 13px; background: rgba(13,27,42,.78); }
.metric { grid-column: span 3; min-height: 126px; display: flex; flex-direction: column; justify-content: space-between; }
.metric.orange { border-color: rgba(244,129,32,.35); }
.metric.teal { border-color: rgba(67,211,178,.3); }
.metric-label { color: var(--muted); font: 11px var(--mono); text-transform: uppercase; letter-spacing: .1em; }
.metric-value { font-size: 36px; letter-spacing: -.07em; }
.metric-note { color: var(--muted); font-size: 12px; }
.lists { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.list-panel { min-height: 420px; }
.list-title { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }
.list-title h3 { font-size: 16px; }
.badge { padding: 5px 8px; border: 1px solid var(--line); border-radius: 999px; color: var(--muted); font: 10px var(--mono); }
.key-list { display: grid; gap: 8px; }
.key-row { padding: 10px 11px; display: flex; align-items: center; justify-content: space-between; gap: 10px; border: 1px solid rgba(140,161,178,.13); border-radius: 8px; background: rgba(255,255,255,.035); }
.key-row code { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font: 12px var(--mono); }
.copy { padding: 4px 6px; border: 0; background: none; color: var(--muted); font: 11px var(--mono); }
.copy:hover { color: var(--orange-soft); }
.empty { padding: 34px 0; color: var(--muted); text-align: center; font: 12px var(--mono); }
.run-strip { display: flex; align-items: center; gap: 10px; color: var(--muted); font: 12px var(--mono); }
.dot { width: 7px; height: 7px; display: inline-block; border-radius: 50%; background: var(--teal); box-shadow: 0 0 12px var(--teal); }
.dot.warn { background: var(--orange); box-shadow: 0 0 12px var(--orange); }
.dot.red { background: var(--red); box-shadow: 0 0 12px var(--red); }
.api-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.api-card { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.api-url { color: var(--orange-soft); word-break: break-all; font: 12px var(--mono); }
.footer { margin-top: 60px; padding: 24px 0; display: flex; justify-content: space-between; gap: 20px; border-top: 1px solid rgba(140,161,178,.15); color: var(--muted); font: 11px var(--mono); }
@media (max-width: 850px) {
  .hero { grid-template-columns: 1fr; gap: 32px; padding-top: 46px; }
  .hero h1 { font-size: 54px; }
  .metric { grid-column: span 6; }
  .lists, .api-grid { grid-template-columns: 1fr; }
}
@media (max-width: 560px) {
  .shell { width: min(calc(100% - 24px), 1180px); }
  .topbar { height: 66px; }
  .brand small { display: none; }
  .nav a { padding: 7px; font-size: 11px; }
  .nav a:nth-child(3) { display: none; }
  .hero h1 { font-size: 46px; }
  .metric { grid-column: span 12; }
  .panel { padding: 16px; }
  .footer { flex-direction: column; }
  .api-card { align-items: flex-start; flex-direction: column; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
}
`;

const SCRIPT = `
document.addEventListener('click', async (event) => {
  const target = event.target.closest('[data-copy]');
  if (!target) return;
  const value = target.getAttribute('data-copy');
  if (!value) return;
  try {
    await navigator.clipboard.writeText(value);
    target.textContent = 'COPIED';
    setTimeout(() => target.textContent = 'COPY', 1200);
  } catch (_) {
    target.textContent = 'FAILED';
  }
});
`;

export type Locale = 'zh' | 'en';

const COPY = {
  zh: {
    title: 'WarpKey / 边缘密钥库',
    nav: { overview: '首页', api: 'API', github: 'GitHub' },
    eyebrow: '公开数据 / 每小时更新',
    hero: <>Cloudflare Warp+<br/><em>密钥列表</em></>,
    lede: '提供 Full 和 Lite 两个公开列表，系统会定时从来源频道更新。',
    browse: '浏览密钥',
    readApi: '查看 API',
    path: '采集链路',
    sources: '数据源',
    registry: 'D1 密钥库',
    publicApi: '公开 API',
    cron: '每小时自动采集',
    firstSync: '等待首次采集',
    lastSync: '最近采集',
    active: '有效密钥',
    activeNote: '当前公开可用',
    addedRemoved: '新增 / 移除',
    latestRun: '最近一次采集',
    freshness: '更新时间',
    d1Time: 'D1 记录时间',
    pool: '当前密钥库',
    poolDesc: 'Full 与 Lite 均无需登录即可访问。',
    full: '完整列表',
    lite: '精简列表',
    max: '上限',
    waiting: '等待首次采集',
    endpoints: '直接访问',
    endpointDesc: '纯文本返回，每行一个密钥。',
    copy: '复制',
    apiTitle: 'API / WarpKey',
    apiEyebrow: '公开 API / 无需认证',
    apiHero: <>一个地址，<br/><em>无需登录。</em></>,
    apiLead: '所有接口均可公开读取，并在边缘节点缓存。',
    open: '打开',
    endpointItems: [
      { path: '/api/full', title: '完整列表', description: '最多返回 100 个有效密钥，纯文本格式。' },
      { path: '/api/lite', title: '精简列表', description: '最多返回 15 个密钥，每次采集后刷新。' },
      { path: '/api/diff', title: '最近变化', description: 'JSON 格式，包含最近新增和移除的密钥。' },
      { path: '/api/status', title: '服务状态', description: 'JSON 格式，包含密钥数量、来源数量和更新时间。' },
    ],
  },
  en: {
    title: 'WarpKey / Edge Console',
    nav: { overview: 'Overview', api: 'API', github: 'GitHub' },
    eyebrow: 'Public data / hourly updates',
    hero: <>Cloudflare Warp+<br/><em>key lists</em></>,
    lede: 'Public Full and Lite lists, refreshed on a schedule from the configured source channels.',
    browse: 'Browse keys',
    readApi: 'Read the API',
    path: 'Collection path',
    sources: 'Sources',
    registry: 'D1 registry',
    publicApi: 'Public API',
    cron: 'Cron / hourly',
    firstSync: 'Waiting for first sync',
    lastSync: 'Last sync',
    active: 'Active keys',
    activeNote: 'currently available',
    addedRemoved: 'Added / removed',
    latestRun: 'latest run',
    freshness: 'Freshness',
    d1Time: 'D1 timestamp',
    pool: 'Current key pool',
    poolDesc: 'Full and Lite are both available without signing in.',
    full: 'Full collection',
    lite: 'Lite selection',
    max: 'Max',
    waiting: 'Waiting for the first collection',
    endpoints: 'Direct endpoints',
    endpointDesc: 'Plain text, one key per line.',
    copy: 'Copy',
    apiTitle: 'API / WarpKey',
    apiEyebrow: 'Public API / no authentication',
    apiHero: <>One URL.<br/><em>No login.</em></>,
    apiLead: 'All endpoints are publicly readable and cached at the edge.',
    open: 'Open',
    endpointItems: [
      { path: '/api/full', title: 'Full collection', description: 'Up to 100 active keys in plain text.' },
      { path: '/api/lite', title: 'Lite selection', description: 'Up to 15 keys refreshed after each collection.' },
      { path: '/api/diff', title: 'Latest diff', description: 'JSON with the latest added and removed keys.' },
      { path: '/api/status', title: 'Service status', description: 'JSON status, source count and freshness.' },
    ],
  },
} as const;

function Layout({ title, locale, children }: { title: string; locale: Locale; children: Child }) {
  return <html lang={locale === 'zh' ? 'zh-CN' : 'en'}><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><meta name="theme-color" content="#07111d"/><title>{title}</title><style dangerouslySetInnerHTML={{ __html: CSS }}/></head><body>{children}<script dangerouslySetInnerHTML={{ __html: SCRIPT }}/></body></html>;
}

function Header({ locale, page }: { locale: Locale; page: 'home' | 'api' }) {
  const t = COPY[locale];
  const otherLocale: Locale = locale === 'zh' ? 'en' : 'zh';
  const otherPath = page === 'api' ? `/${otherLocale}/api` : `/${otherLocale}`;
  return <header class="topbar shell"><a class="brand" href={`/${locale}`}><span class="brand-mark">W</span><span>WarpKey<small>edge key registry</small></span></a><nav class="nav"><a href={`/${locale}`}>{t.nav.overview}</a><a href={`/${locale}/api`}>{t.nav.api}</a><a href="https://github.com/nas-tool/warpkey">{t.nav.github}</a><a class="accent lang-switch" href={otherPath}>{locale === 'zh' ? 'EN' : '中文'}</a></nav></header>;
}

function Shell({ title, locale, page, baseUrl, children }: { title: string; locale: Locale; page: 'home' | 'api'; baseUrl: string; children: Child }) {
  const authorUrl = `https://www.wanghaoyu.com.cn/?utm_source=${encodeURIComponent(baseUrl)}`;
  return <Layout title={title} locale={locale}><Header locale={locale} page={page}/>{children}<footer class="footer shell"><a href={authorUrl}>Powered By HaoyuWang</a></footer></Layout>;
}

function KeyList({ keys, tone = 'normal', locale }: { keys: string[]; tone?: 'normal' | 'orange'; locale: Locale }) {
  const t = COPY[locale];
  if (!keys.length) return <div class="empty">{t.waiting.toUpperCase()}</div>;
  return <div class="key-list">{keys.map((key, index) => <div class="key-row" key={key}><code style={tone === 'orange' ? 'color:var(--orange-soft)' : undefined}>{String(index + 1).padStart(2, '0')} · {key}</code><button class="copy" data-copy={key}>{t.copy.toUpperCase()}</button></div>)}</div>;
}

export interface DashboardData {
  full: string[];
  lite: string[];
  activeCount: number;
  sourceCount: number;
  lastUpdated: number | null;
  latestRun: { status: string; added_count: number; removed_count: number; fetched_source_count: number; source_count: number } | null;
}

export function PublicPage({ data, baseUrl, locale }: { data: DashboardData; baseUrl: string; locale: Locale }) {
  const t = COPY[locale];
  const status = data.latestRun?.status ?? 'waiting';
  return <Shell title={t.title} locale={locale} page="home" baseUrl={baseUrl}><main class="shell"><section class="hero" style="grid-template-columns:1fr;max-width:760px"><div><div class="eyebrow">{t.eyebrow}</div><h1>{t.hero}</h1><p class="lede">{t.lede}</p><div class="hero-actions"><a class="button primary" href="#keys">{t.browse}</a><a class="button" href={`/${locale}/api`}>{t.readApi}</a></div></div></section><section class="section"><div class="grid"><div class="panel metric orange"><span class="metric-label">{t.active}</span><strong class="metric-value">{formatNumber(data.activeCount)}</strong><span class="metric-note">{t.activeNote}</span></div><div class="panel metric"><span class="metric-label">{t.sources}</span><strong class="metric-value">{formatNumber(data.sourceCount)}</strong><span class="metric-note">{t.sources}</span></div><div class="panel metric teal"><span class="metric-label">{t.addedRemoved}</span><strong class="metric-value">{formatNumber(data.latestRun?.added_count ?? 0)} <span style="font-size:18px;color:var(--muted)">/</span> {formatNumber(data.latestRun?.removed_count ?? 0)}</strong><span class="metric-note">{t.latestRun}</span></div><div class="panel metric"><span class="metric-label">{t.freshness}</span><strong class="metric-value" style="font-size:20px;margin-top:14px">{data.lastUpdated ? formatDate(data.lastUpdated) : t.firstSync}</strong><span class="metric-note">{t.d1Time}</span></div></div></section><section class="section" id="keys"><div class="section-head"><div><h2>{t.pool}</h2><p>{t.poolDesc}</p></div><div class="run-strip"><i class={`dot ${status === 'failed' ? 'red' : status === 'partial' ? 'warn' : ''}`}/>{status.toUpperCase()}</div></div><div class="lists"><div class="panel list-panel"><div class="list-title"><h3>{t.full}</h3><span class="badge">{t.max.toUpperCase()} 100</span></div><KeyList keys={data.full} locale={locale}/></div><div class="panel list-panel"><div class="list-title"><h3>{t.lite}</h3><span class="badge">{t.max.toUpperCase()} 15</span></div><KeyList keys={data.lite} tone="orange" locale={locale}/></div></div></section><section class="section"><div class="section-head"><div><h2>{t.endpoints}</h2><p>{t.endpointDesc}</p></div></div><div class="api-grid"><div class="panel api-card"><div><div class="metric-label">{t.full}</div><div class="api-url">{baseUrl}/api/full</div></div><button class="button small" data-copy={baseUrl + '/api/full'}>{t.copy.toUpperCase()}</button></div><div class="panel api-card"><div><div class="metric-label">{t.lite}</div><div class="api-url">{baseUrl}/api/lite</div></div><button class="button small" data-copy={baseUrl + '/api/lite'}>{t.copy.toUpperCase()}</button></div></div></section></main></Shell>;
}

export function ApiPage({ baseUrl, locale }: { baseUrl: string; locale: Locale }) {
  const t = COPY[locale];
  return <Shell title={t.apiTitle} locale={locale} page="api" baseUrl={baseUrl}><main class="shell"><section class="hero" style="grid-template-columns:1fr;padding-bottom:20px"><div><div class="eyebrow">{t.apiEyebrow}</div><h1>{t.apiHero}</h1><p class="lede">{t.apiLead}</p></div></section><section class="section"><div class="api-grid">{t.endpointItems.map((endpoint) => <div class="panel" key={endpoint.path}><div class="metric-label">GET {endpoint.path}</div><h2 style="margin:12px 0 8px">{endpoint.title}</h2><p style="color:var(--muted);font-size:13px;line-height:1.6">{endpoint.description}</p><div class="api-url" style="margin-top:18px">{baseUrl}{endpoint.path}</div><div class="hero-actions" style="margin-top:14px"><button class="button small" data-copy={`${baseUrl}${endpoint.path}`}>{t.copy.toUpperCase()}</button><a class="button small primary" href={endpoint.path}>{t.open.toUpperCase()}</a></div></div>)}</div></section></main></Shell>;
}
