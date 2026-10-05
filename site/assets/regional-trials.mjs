const traits = new Map([
  ['yield', 'Урожай в испытании'],
  ['berry_weight_g', 'Масса ягоды']
]);
const number = value => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(value);

// Observations describe a particular trial. They never create a recommendation
// or borrow eligibility from an admission for a larger climatic region.
export function getRegionalTrials(catalog, regionCode, crop = 'all') {
  if (!regionCode || !Array.isArray(catalog?.cultivars)) return [];
  return catalog.cultivars.flatMap(cultivar => {
    if (crop !== 'all' && cultivar.crop_slug !== crop) return [];
    const findings = (cultivar.observations || []).flatMap(observation => {
      const evidence = observation.evidence;
      if (observation.region_code !== regionCode || !traits.has(observation.trait_code) ||
        !Number.isFinite(observation.value_number) || observation.value_number <= 0 ||
        !String(observation.unit || '').trim() || !evidence ||
        !['published_study', 'field_observation'].includes(evidence.evidence_kind) ||
        !String(evidence.place_text || '').trim() || !String(evidence.setting_text || '').trim() ||
        !String(evidence.source_locator || '').trim() ||
        !(String(evidence.period_from || '').trim() || String(evidence.period_to || '').trim()) ||
        !String(observation.source_title || '').trim()) return [];
      let sourceUrl;
      try {
        const url = new URL(observation.source_url);
        if (url.protocol !== 'https:') return [];
        sourceUrl = url.href;
      } catch { return []; }
      const from = String(evidence.period_from || '').trim();
      const to = String(evidence.period_to || '').trim();
      const period = from && to && from !== to ? `${from}–${to}` : to || from;
      const value = `${number(observation.value_number)}${Number.isFinite(observation.value_max) && observation.value_max > observation.value_number ? `–${number(observation.value_max)}` : ''} ${observation.unit.trim()}`;
      return [{
        traitCode: observation.trait_code, value,
        label: traits.get(observation.trait_code), period, place: evidence.place_text,
        placeLabel: evidence.place_text.startsWith('Московская область указана в заголовке публикации')
          ? 'Московская область' : evidence.place_text,
        sourceUrl, sourceTitle: observation.source_title, sourceLocator: evidence.source_locator,
        conditions: evidence.setting_text, method: evidence.method_text || '',
        uncertainty: evidence.uncertainty_text || '',
        sourceKey: observation.source_key || sourceUrl,
        year: Number.parseInt(to || from, 10) || 0
      }];
    }).sort((a, b) => b.year - a.year || Number(a.traitCode !== 'yield') - Number(b.traitCode !== 'yield'));
    const seen = new Set();
    const unique = findings.filter(finding => {
      const key = `${finding.sourceKey}:${finding.traitCode}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return unique.length ? [{ slug: cultivar.slug, name: cultivar.canonical_name, cropSlug: cultivar.crop_slug, findings: unique }] : [];
  });
}
