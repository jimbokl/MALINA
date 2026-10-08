import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const research = join(root, 'research/wordstat/wordcraft-2026-10-08');
const coverage = JSON.parse(await readFile(join(research, 'query-coverage.json'), 'utf8'));
const dist = join(root, 'dist');
const sitemap = await readFile(join(dist, 'sitemap.xml'), 'utf8');
const failures = [];
const queries = new Set();
const targets = new Map();
const allHtml = [];
async function visit(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) await visit(join(directory, entry.name));
    else if (entry.name.endsWith('.html')) allHtml.push(join(directory, entry.name));
  }
}
await visit(dist);
const incoming = new Map();
for (const file of allHtml) {
  const html = await readFile(file, 'utf8');
  const currentPath = file.slice(dist.length).replace(/index\.html$/, '');
  for (const [, href] of html.matchAll(/href="(\/[^"?#]*)(?:[?#][^"]*)?"/g)) {
    if (href === currentPath) continue;
    if (!incoming.has(href)) incoming.set(href, new Set());
    incoming.get(href).add(currentPath);
  }
}
for (const record of coverage.records) {
  if (queries.has(record.query)) failures.push(`Duplicate query: ${record.query}`);
  queries.add(record.query);
  if (!['LOW', 'AVERAGE'].includes(record.competition_code)) failures.push(`Competition out of scope: ${record.query}`);
  if (!Number.isFinite(record.demand) || record.demand < 0) failures.push(`Invalid source demand: ${record.query}`);
  if (record.disposition === 'out_of_scope' && !record.reason) failures.push(`Missing exclusion reason: ${record.query}`);
  if (record.disposition !== 'covered') continue;
  const path = record.canonicalPath;
  if (!/^\/[a-z0-9/-]+\/$/.test(path || '')) { failures.push(`Invalid canonical path: ${record.query}`); continue; }
  if (!targets.has(path)) {
    try { targets.set(path, await readFile(join(dist, path, 'index.html'), 'utf8')); }
    catch { failures.push(`Missing built page: ${path}`); targets.set(path, ''); }
  }
  const html = targets.get(path);
  const escapeAttribute = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
  if (record.photoSourceUrl && !html.includes(`href="${escapeAttribute(record.photoSourceUrl)}"`)) failures.push(`Missing photograph source link: ${path}`);
  if (record.photoAssetPath) {
    if (!html.includes(`src="${escapeAttribute(record.photoAssetPath)}"`)) failures.push(`Missing local cultivar photograph: ${path}`);
    try { await readFile(join(dist, record.photoAssetPath)); }
    catch { failures.push(`Missing photograph asset: ${record.photoAssetPath}`); }
  }
  for (const url of record.reviewSourceUrls || []) if (!html.includes(`href="${escapeAttribute(url)}"`)) failures.push(`Missing reader source link: ${path}`);
  const canonical = `https://malinaklubnika.ru${path}`;
  if (record.canonicalUrl !== canonical) failures.push(`Mapping canonical mismatch: ${record.query}`);
  if (!html.includes(`<link rel="canonical" href="${canonical}"`)) failures.push(`HTML canonical mismatch: ${path}`);
  if (!sitemap.includes(`<loc>${canonical}</loc>`)) failures.push(`Missing sitemap entry: ${path}`);
  if (!incoming.get(path)?.size) failures.push(`No incoming link: ${path}`);
  const anchor = String(record.answerAnchor || '');
  const marker = `id="${anchor}"`;
  const offset = html.indexOf(marker);
  if (!anchor || offset < 0) { failures.push(`Missing answer anchor: ${path}#${anchor}`); continue; }
  const nextSection = html.indexOf('</section>', offset);
  const fragment = html.slice(offset, nextSection < 0 ? offset + 6000 : nextSection);
  const text = fragment.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (text.length < 80 && !(record.missingResources?.length && ['seo-photo', 'seo-reviews', 'otzyvy'].includes(anchor) && text.length > 20)) failures.push(`Empty answer section: ${path}#${anchor}`);
  if (/<meta[^>]+name="robots"[^>]+noindex/i.test(html)) failures.push(`Mapped page is noindex: ${path}`);
}
const gaps = coverage.records.filter(record => record.disposition === 'gap').length;
const queriesWithMissingResources = coverage.records.filter(record => record.missingResources?.length).length;
const report = { completionScope: 'canonical_routes_and_answer_anchors', resourceComplete: queriesWithMissingResources === 0, queriesWithMissingResources, checkedAt: new Date().toISOString(), queries: queries.size, mappedPages: targets.size, gaps, assertionsPassed: failures.length === 0, complete: failures.length === 0 && gaps === 0, failures: [...new Set(failures)] };
await writeFile(join(research, 'coverage-verification.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ queries: report.queries, mappedPages: report.mappedPages, gaps, queriesWithMissingResources, failures: report.failures.length, complete: report.complete }));
if (failures.length || (process.argv.includes('--require-complete') && gaps)) process.exitCode = 1;
