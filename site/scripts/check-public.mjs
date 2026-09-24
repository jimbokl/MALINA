// Read-only release check against the actual public HTTPS site.
const origin = new URL(process.env.SITE_URL || 'https://malinaklubnika.ru');
if (origin.protocol !== 'https:') throw new Error('SITE_URL must use HTTPS');

const get = async (path, expectedType) => {
  const url = new URL(path, origin);
  const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!response.ok || response.url !== url.href) {
    throw new Error(`${url}: expected direct 200, got ${response.status} at ${response.url}`);
  }
  const type = response.headers.get('content-type') || '';
  if (!type.includes(expectedType)) throw new Error(`${url}: unexpected content type ${type}`);
  return response.text();
};

try {
  const robots = await get('/robots.txt', 'text/plain');
  if (!robots.includes(`Sitemap: ${origin.origin}/sitemap.xml`)) throw new Error('robots.txt has no canonical sitemap');
  const sitemap = await get('/sitemap.xml', 'xml');
  const urls = [...sitemap.matchAll(/<loc>(https:\/\/[^<]+)<\/loc>/g)].map(match => new URL(match[1]));
  if (!urls.length) throw new Error('sitemap.xml has no URLs');

  for (const url of urls) {
    if (url.origin !== origin.origin) throw new Error(`Foreign sitemap URL: ${url}`);
    const html = await get(url.pathname, 'text/html');
    const canonical = `<link rel="canonical" href="${url.href}">`;
    for (const [label, present] of [
      ['title', /<title>[^<]+<\/title>/i.test(html)],
      ['description', /<meta name="description" content="[^"]+"/i.test(html)],
      ['h1', /<h1\b[^>]*>/.test(html)],
      ['canonical', html.includes(canonical)],
      ['noindex absent', !/<meta name="robots"[^>]*noindex/i.test(html)],
    ]) if (!present) throw new Error(`${url}: ${label} check failed`);
  }
  console.log(`Public HTTPS, robots, sitemap and ${urls.length} HTML pages passed`);
} catch (error) {
  console.error(`Public site check failed: ${error.cause?.message || error.message}`);
  process.exitCode = 1;
}
