// Shared by the static renderer and browser. Counts always come from the server.
export function validateVoteSnapshot(value, expectedSlugs = []) {
  if (!value || !Array.isArray(value.votes) || typeof value.as_of !== 'string' ||
      !/^\d{4}-\d\d-\d\dT.*(?:Z|\+00:00)$/.test(value.as_of) || !Number.isFinite(Date.parse(value.as_of))) {
    throw new Error('Invalid vote snapshot');
  }
  const seen = new Set();
  const votes = value.votes.map(row => {
    if (!row || typeof row.cultivar_slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.cultivar_slug) ||
        !Number.isSafeInteger(row.count) || row.count < 0 || seen.has(row.cultivar_slug)) throw new Error('Invalid vote count');
    seen.add(row.cultivar_slug);
    return { cultivar_slug: row.cultivar_slug, count: row.count };
  });
  if (expectedSlugs.some(slug => !seen.has(slug))) throw new Error('Missing cultivar vote count');
  return { votes, as_of: value.as_of };
}

export function rankCultivars(cultivars, votes, crop = 'all') {
  const counts = new Map(votes.map(row => [row.cultivar_slug, row.count]));
  const rows = cultivars.filter(v => crop === 'all' || v.cropKey === crop)
    .map(v => ({ ...v, count: counts.get(v.slug) ?? 0 }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'ru') || a.slug.localeCompare(b.slug));
  let rank = null;
  return rows.map((v, index) => {
    if (v.count > 0 && (index === 0 || v.count !== rows[index - 1].count)) rank = index + 1;
    return { ...v, rank: v.count > 0 ? rank : null };
  });
}

export function recommendationLabel(count) {
  const last = count % 10, lastTwo = count % 100;
  const word = last === 1 && lastTwo !== 11 ? 'рекомендация' : last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14) ? 'рекомендации' : 'рекомендаций';
  return `${new Intl.NumberFormat('ru-RU').format(count)} ${word}`;
}

export function snapshotDate(asOf) {
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }).format(new Date(asOf)) + ' UTC';
}
