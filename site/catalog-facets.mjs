export const raspberryFacets = [
  {
    path: '/sorta/malina/krasnaya/',
    label: 'Красная малина',
    heading: 'Красная малина',
    title: 'Красная малина: сорта, описание и отзывы садоводов',
    description: 'Сравните красноплодные сорта малины: когда ждать ягоды, как растёт куст и что пишут садоводы.',
    intro: 'Собрали здесь красную малину. Откройте сорт, чтобы узнать, когда ждать ягоды, и почитать опыт садоводов.',
    field: 'fruitColor',
    value: 'red'
  },
  {
    path: '/sorta/malina/zheltaya/',
    label: 'Жёлтая малина',
    heading: 'Жёлтая малина',
    title: 'Жёлтая малина: сорта, описание и отзывы садоводов',
    description: 'Жёлтая и золотистая малина: сравните сорта, сроки сбора и отзывы садоводов.',
    intro: 'Любите жёлтую малину? Собрали сорта в одном месте: сравните сроки сбора и откройте отзывы садоводов.',
    field: 'fruitColor',
    value: 'yellow'
  },
  {
    path: '/sorta/malina/letnyaya/',
    label: 'Летняя малина',
    heading: 'Летняя малина',
    title: 'Летняя малина: сорта, сроки сбора и отзывы садоводов',
    description: 'Летняя малина: сравните сорта, сроки сбора и отзывы садоводов.',
    intro: 'Летняя малина даёт урожай на побегах прошлого года. Сравните сорта и выберите тот, который хочется посадить.',
    field: 'fruiting',
    value: 'summer'
  },
  {
    path: '/sorta/malina/remontantnaya/',
    label: 'Ремонтантная малина',
    heading: 'Ремонтантная малина',
    title: 'Ремонтантная малина: сорта, описание и отзывы садоводов',
    description: 'Ремонтантная малина: сравните сорта, урожайность и отзывы садоводов.',
    intro: 'Эта малина плодоносит на побегах текущего года. Посмотрите сорта, сравните ягоды и почитайте опыт садоводов.',
    field: 'fruiting',
    value: 'remontant'
  }
];

export function raspberryFacetVarieties(varieties, facet) {
  return varieties.filter(variety => variety.cropKey === 'raspberry' && variety[facet.field] === facet.value);
}
