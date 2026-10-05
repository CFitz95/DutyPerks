import { createHash, timingSafeEqual } from 'node:crypto';

export const officialHosts = new Set([
  'tickets.midway.org', 'www.midway.org', 'midway.org',
  'navysealmuseumsd.org', 'www.navysealmuseumsd.org',
  'seaworld.com', 'www.seaworld.com',
  'www.gondolacompany.com', 'gondolacompany.com',
  'wildpacificwhalewatch.com', 'www.wildpacificwhalewatch.com',
  'www.whidbeyislandkayaking.com', 'whidbeyislandkayaking.com',
  'whidbey.navylifepnw.com', 'sandiego.navylifesw.com',
  'www.chinacityrestaurant.com', 'chinacityrestaurant.com',
  'www.cafesevilla.com', 'cafesevilla.com',
  'www.rodiziogrill.com', 'rodiziogrill.com'
]);
export function safeSourceUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.port || !officialHosts.has(url.hostname)) throw new Error('Unsupported official source');
  if (url.hostname.replace(/^www\./, '') === 'seaworld.com' && url.pathname !== '/robots.txt' && !url.pathname.startsWith('/san-diego/')) throw new Error('Unsupported official source');
  if (url.hostname.replace(/^www\./, '') === 'rodiziogrill.com' && url.pathname !== '/robots.txt' && !url.pathname.startsWith('/san-diego/')) throw new Error('Unsupported official source');
  if (url.hostname.replace(/^www\./, '') === 'cafesevilla.com' && !['/robots.txt','/promos-san-diego/'].includes(url.pathname)) throw new Error('Unsupported official source');
  if (/idme|login|checkout|cart|auth|sign-in/i.test(url.pathname)) throw new Error('Private or transactional page');
  url.hash = '';
  if (isMwrSource(url.href)) url.searchParams.delete('__cb');
  return url.href;
}
export function authorizedCron(header, secret) {
  if (!secret || secret.length < 32 || !header) return false;
  const a = Buffer.from(header), b = Buffer.from(`Bearer ${secret}`);
  return a.length === b.length && timingSafeEqual(a, b);
}
function decode(text) {
  return text.replace(/&#(x[0-9a-f]+|[0-9]+);/gi, (_, n) => {
    const point = n[0].toLowerCase() === 'x' ? parseInt(n.slice(1), 16) : Number(n);
    return point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : '';
  }).replace(/&amp;/gi, '&').replace(/&nbsp;/gi, ' ').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&apos;/gi, "'");
}
export function extractEvidence(html, baseUrl) {
  const cleaned = html.replace(/<(script|style|nav|header|footer)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, ' ');
  const title = decode((html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? 'Official source')).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);
  const text = decode(cleaned.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
  const terms = /\b(military|veterans?|armed forces|waves of honor|reservists?|national guard|DEERS|MWR|discounted tickets|discount tickets)\b/gi;
  const ranges = [];
  for (const match of text.matchAll(terms)) {
    const start = Math.max(0, match.index - 800), end = Math.min(text.length, match.index + 1600);
    const last = ranges.at(-1);
    if (last && start <= last[1]) last[1] = Math.max(last[1], end); else ranges.push([start, end]);
    if (ranges.reduce((n, [a, b]) => n + b - a, 0) >= 16000) break;
  }
  const excerpt = ranges.map(([a, b]) => text.slice(a, b)).join('\n…\n').slice(0, 16000);
  const links = [];
  for (const match of cleaned.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const label = match[1] + ' ' + match[2];
    if (!/military|veteran|waves.of.honor/i.test(label) && !(isMwrSource(baseUrl) && /price.?list|ticket.?list/i.test(label))) continue;
    try {
      const candidate = safeSourceUrl(new URL(decode(match[1]), baseUrl).href);
      const host = new URL(candidate).hostname.replace(/^www\./, '');
      if (host === new URL(baseUrl).hostname.replace(/^www\./, '') && candidate !== baseUrl && !links.includes(candidate)) links.push(candidate);
    } catch { /* Do not follow unsupported links. */ }
    if (links.length >= 2) break;
  }
  return { title, excerpt, found: ranges.length > 0, fingerprint: createHash('sha256').update(excerpt || 'NO_MILITARY_TEXT').digest('hex'), links };
}
export function isMwrSource(value) {
  return ['whidbey.navylifepnw.com', 'sandiego.navylifesw.com'].includes(new URL(value).hostname);
}
export function pdfEvidence(bytes, url) {
  safeSourceUrl(url);
  if (!isMwrSource(url) || Buffer.from(bytes).subarray(0,5).toString() !== '%PDF-') throw new Error('Unsupported PDF document');
  return {
    title: 'MWR ticket price list — review the original PDF',
    excerpt: 'This official MWR ticket PDF is new or has changed. Open the original document to check its issue date, ticket prices, eligibility, purchase requirements and expiration dates. This monitor does not extract PDF prices. Do not assume an expired ticket is available. The ticket office and attraction may be in different cities. No public offer is created by this check.',
    found: true, fingerprint: createHash('sha256').update(bytes).digest('hex'), links: [],
  };
}
export function robotsAllows(text, pathname) {
  const groups = []; let agents = [], rules = [], inRules = false;
  const push = () => { if (agents.length) groups.push({ agents, rules }); agents = []; rules = []; inRules = false; };
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim(), split = line.indexOf(':');
    if (split < 0) continue;
    const key = line.slice(0, split).toLowerCase(), value = line.slice(split + 1).trim();
    if (key === 'user-agent') { if (inRules) push(); agents.push(value.toLowerCase()); }
    else if (key === 'allow' || key === 'disallow') { inRules = true; if (value) rules.push({ allow: key === 'allow', value }); }
  }
  push();
  const specific = groups.filter(g => g.agents.some(a => a === 'dutyperksbot'));
  const selected = specific.length ? specific : groups.filter(g => g.agents.includes('*'));
  const matches = selected.flatMap(g => g.rules).filter(r => {
    const pattern = r.value.replace(/[.+?^{}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
    return new RegExp('^' + pattern).test(pathname);
  }).sort((a, b) => b.value.length - a.value.length || Number(b.allow) - Number(a.allow));
  return matches[0]?.allow ?? true;
}
