const traits = [
  ['light', 'unknown', 'освещённость'],
  ['setting', 'all', 'место выращивания'],
  ['fruiting', 'all', 'тип плодоношения'],
  ['harvestTiming', 'all', 'срок сбора']
];

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
