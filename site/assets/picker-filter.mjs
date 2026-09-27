const traits = [
  ['light', 'unknown', 'освещённость'],
  ['setting', 'all', 'место выращивания'],
  ['fruiting', 'all', 'тип плодоношения'],
  ['harvestTiming', 'all', 'срок сбора']
];

const conditionNames = {
  light: { sun: 'солнечное место', shade: 'заметная тень' },
  setting: { ground: 'грядка', container: 'контейнер' },
  fruiting: { summer: 'летнее плодоношение', remontant: 'ремонтантное плодоношение' },
  harvestTiming: { early: 'ранний срок', middle: 'средний срок', late: 'поздний срок', autumn: 'осенний срок', repeat: 'продолжительный сбор' }
};

export function classifyPickerCard(card, selected) {
  if (selected.crop !== 'all' && card.crop !== selected.crop) {
    return { status: 'exclude', missing: [] };
  }
  const missing = [];
  for (const [field, neutral, label] of traits) {
    const wanted = selected[field];
    if (wanted === neutral) continue;
    const known = card[field];
    if (!known || known === 'unknown') missing.push(label);
    else if (known !== wanted) return { status: 'exclude', missing: [] };
  }
  return { status: missing.length ? 'needs-evidence' : 'match', missing };
}

export function describePickerCardReason(selected, result) {
  if (result.status !== 'match') return '';
  const facts = Object.entries(conditionNames)
    .filter(([field]) => selected[field] && selected[field] !== 'unknown' && selected[field] !== 'all')
    .map(([field, names]) => names[selected[field]])
    .filter(Boolean);
  return facts.join(' · ');
}

export function cityForPickerContext(city, cityRegion, selectedRegion) {
  const normalize = value => String(value || '').trim().toLocaleLowerCase('ru-RU').replace(/ё/g, 'е').replace(/\s+/g, ' ');
  return city && normalize(cityRegion) && normalize(cityRegion) === normalize(selectedRegion) ? city : '';
}
