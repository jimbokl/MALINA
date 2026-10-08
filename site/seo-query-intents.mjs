import { normalizeQuery } from './seo-programmatic.mjs';

// Explicit spelling variants; do not merge similarly named cultivars by fuzzy match.
const spellingVariants = {
  raspberry: {
    polka: ['полка'],
    gerakl: ['геракла'],
    heritage: ['харитейдж', 'харитедж', 'херитедж'],
    maroseyka: ['моросейка'],
    'glen-ample': ['глен эмпл'],
    'raspberry-nantahala': ['нантхала'],
    lyachka: ['ляшка', 'лашка'],
    caroline: ['каролайн'],
  },
  strawberry: {
    cabrillo: ['кабрило', 'кабрильо'],
    malga: ['малга'],
    kleri: ['клэри'],
    murano: ['мурана'],
    'strawberry-darselect': ['дерселект'],
    'zenga-zengana': ['зинга зинга', 'зенгана'],
    'strawberry-florence': ['флоренция'],
    'strawberry-sonsation': ['сенсейшен'],
    'strawberry-solnechnaya-polyanka-krasnoyarsk': ['солнечная поляна'],
    'san-andreas': ['санандрес', 'сан андрес', 'санандреас'],
    'strawberry-polka': ['полька'],
  },
};

export function cultivarQueryAliases(item, record, extras = []) {
  const cropWord = item.cropKey === 'raspberry' ? 'малина' : '(?:клубника|земляника)';
  const prefix = new RegExp(`^${cropWord} `);
  const suffix = new RegExp(` ${cropWord}$`);
  const supplied = [item.name, ...(item.aliases || []), ...(record?.aliases || []).map(alias => alias.alias), ...extras.flatMap(value => value.aliases || []), ...(spellingVariants[item.cropKey]?.[item.slug] || [])];
  return [...new Set(supplied.flatMap(value => {
    const normalized = normalizeQuery(value);
    return [normalized, normalized.replace(prefix, '').replace(suffix, '')];
  }))].filter(alias => alias.length > 2);
}

export function isDiagnosticQuery(q) {
  const disease = /болезн|заболеван|заболел|болеет|болеют|больн|грибок|хлороз|галлиц|малинов.*мух|малинн.*мух|мух.*малин|сер.*гнил|трипс|тл[яию]|тлей|мозаик|мозаич|курчав|парша|махров|ведьмин.*метл|метельчат|пятн|ржавчин|антракноз|фитофт|мучнист.*рос|вирус|клещ|нематод|червив|черви|вредител|фитоспорин|хорус|фунгицид/.test(q);
  const action = /леч|борьб|обработ|почему|как защит|что делать/.test(q);
  const comparison = /устойчив|устойчивая|устойчивые/.test(q);
  const symptom = /желте|красне|обожж|(?:сох|вян|увяд).*(?:лист|побег|ягод)|(?:лист|побег|ягод).*(?:сох|вян|увяд)|гни.*ягод|ягод.*гни|утолщ|шишк|нарост/.test(q);
  return symptom || (disease && (!comparison || action)) || /обработ/.test(q);
}

export function matchCultivarQuery(q, crop, candidates) {
  if (isDiagnosticQuery(q)) return undefined;
  const genericVictoriaCare = /виктори/.test(q) && /уход|подкорм|полив|сажать|посад|размнож|ус[ыов]/.test(q);
  return candidates.find(candidate => (!crop || candidate.item.cropKey === crop) && !(genericVictoriaCare && candidate.alias === 'виктория') && (` ${q} `).includes(` ${candidate.alias} `));
}
