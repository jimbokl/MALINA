export const seasonMonths = Object.freeze([
  { number: 1, label: 'Январь', short: 'Янв' },
  { number: 2, label: 'Февраль', short: 'Фев' },
  { number: 3, label: 'Март', short: 'Мар' },
  { number: 4, label: 'Апрель', short: 'Апр' },
  { number: 5, label: 'Май', short: 'Май' },
  { number: 6, label: 'Июнь', short: 'Июн' },
  { number: 7, label: 'Июль', short: 'Июл' },
  { number: 8, label: 'Август', short: 'Авг' },
  { number: 9, label: 'Сентябрь', short: 'Сен' },
  { number: 10, label: 'Октябрь', short: 'Окт' },
  { number: 11, label: 'Ноябрь', short: 'Ноя' },
  { number: 12, label: 'Декабрь', short: 'Дек' }
].map(month => Object.freeze(month)));

// Months help readers find a task. The trigger, rather than a calendar date,
// determines whether the action applies to a particular garden.
export const seasonActivities = Object.freeze([
  {
    id: 'raspberry-plan', crop: 'raspberry', kind: 'care', title: 'Уточнить тип малины',
    months: [12, 1, 2], window: 'Перед началом сезона',
    trigger: 'Вы не знаете, летняя это малина или ремонтантная.',
    action: 'Найдите сорт в каталоге или посмотрите записи прошлого урожая. Тип плодоношения определит схему обрезки.',
    source: 'raspberryPruning', href: '/sorta/'
  },
  {
    id: 'raspberry-plant-spring', crop: 'raspberry', kind: 'planting', title: 'Посадить малину весной',
    months: [3, 4, 5], window: 'Весна, до распускания почек',
    trigger: 'Почва готова к посадке, почки на саженце ещё не раскрылись.',
    action: 'Подготовьте место, посадите саженец и полейте. Проверьте положение корней и влажность почвы.',
    source: 'raspberryPlantingSeason', href: '/instrumenty/glubina-posadki/'
  },
  {
    id: 'raspberry-prune-primocane-spring', crop: 'raspberry', kind: 'pruning', type: 'primocane', title: 'Обрезать ремонтантную малину',
    months: [3, 4], window: 'Ранняя весна, до набухания почек',
    trigger: 'Для одного позднего урожая вы оставили прошлогодние побеги на зиму.',
    action: 'Обрежьте прошлогодние побеги до начала роста новых. Для двух урожаев сначала откройте отдельную схему.',
    source: 'raspberryCare', href: '/instrumenty/obrezka-maliny/'
  },
  {
    id: 'raspberry-spring-care', crop: 'raspberry', kind: 'care', title: 'Осмотреть побеги малины',
    months: [3, 4, 5, 6], window: 'Когда начинается рост',
    trigger: 'Появились новые побеги и листья.',
    action: 'Осмотрите побеги, проверьте опору и влажность почвы; подвяжите нуждающиеся в опоре стебли.',
    source: 'raspberryCare', href: '/instrumenty/kalendar-uhoda/'
  },
  {
    id: 'raspberry-harvest-summer', crop: 'raspberry', kind: 'harvest', type: 'summer', title: 'Собирать летнюю малину',
    months: [6, 7, 8], window: 'Когда ягоды созревают',
    trigger: 'Ягоды полностью созрели и легко снимаются.',
    action: 'Собирайте спелые ягоды регулярно и отметьте, какие побеги плодоносили.',
    source: 'raspberryHarvest', href: '/instrumenty/zhurnal-uchastka/'
  },
  {
    id: 'raspberry-prune-summer', crop: 'raspberry', kind: 'pruning', type: 'summer', title: 'Обрезать летнюю малину после сбора',
    months: [7, 8, 9], window: 'После окончания сбора',
    trigger: 'На летней малине закончился урожай; отплодоносившие побеги можно отличить от молодых.',
    action: 'Удалите отплодоносившие побеги. Молодые сохраните для следующего урожая.',
    source: 'raspberryPruning', href: '/instrumenty/obrezka-maliny/'
  },
  {
    id: 'raspberry-harvest-primocane', crop: 'raspberry', kind: 'harvest', type: 'primocane', title: 'Собирать ремонтантную малину',
    months: [7, 8, 9, 10], window: 'Пока продолжается плодоношение',
    trigger: 'На побегах текущего года созрели ягоды.',
    action: 'Собирайте спелые ягоды регулярно. Запишите фактические даты начала и конца сбора.',
    source: 'raspberryHarvest', href: '/instrumenty/zhurnal-uchastka/'
  },
  {
    id: 'raspberry-plant-autumn', crop: 'raspberry', kind: 'planting', title: 'Посадить малину осенью',
    months: [8, 9, 10, 11], window: 'Осень, до устойчивых холодов',
    trigger: 'До первых заморозков остаётся около месяца на укоренение саженца.',
    action: 'Подготовьте место, посадите саженец и полейте. Ориентируйтесь на местную погоду.',
    source: 'raspberryPlantingSeason', href: '/instrumenty/glubina-posadki/'
  },
  {
    id: 'raspberry-prune-primocane-autumn', crop: 'raspberry', kind: 'pruning', type: 'primocane', title: 'Выбрать осеннюю обрезку ремонтантной малины',
    months: [10, 11], window: 'После окончания плодоношения, в период покоя',
    trigger: 'Урожай завершился, и вы знаете, нужен один поздний урожай или два.',
    action: 'Для одного позднего урожая обрежьте отплодоносившие побеги. Для двух урожаев сохраните побеги по отдельной схеме.',
    source: 'raspberryPruning', href: '/instrumenty/obrezka-maliny/'
  },
  {
    id: 'strawberry-plan', crop: 'strawberry', kind: 'care', title: 'Уточнить тип клубники',
    months: [12, 1, 2], window: 'Перед началом сезона',
    trigger: 'Неясно, плодоносит посадка один раз или длительное время.',
    action: 'Найдите название сорта и записи прошлого сбора. Это поможет выбрать уход после урожая.',
    source: 'strawberryAfter', href: '/sorta/'
  },
  {
    id: 'strawberry-spring-care', crop: 'strawberry', kind: 'care', title: 'Проверить клубнику после зимы',
    months: [3, 4, 5], window: 'Когда начинается рост листьев',
    trigger: 'Грядка освободилась от снега и видны новые листья.',
    action: 'Осмотрите сердечки и листья, уберите отмершие части, проверьте почву и сорняки.',
    source: 'strawberryCare', href: '/instrumenty/kalendar-uhoda/'
  },
  {
    id: 'strawberry-plant-spring', crop: 'strawberry', kind: 'planting', title: 'Посадить клубнику весной',
    months: [4, 5, 6], window: 'Весна, когда готова почва',
    trigger: 'Почва готова, а после посадки можно следить за влажностью до укоренения.',
    action: 'Посадите растения, оставив сердечко у поверхности почвы. Полейте и проверьте влажность.',
    source: 'strawberryPlantingSeason', href: '/instrumenty/glubina-posadki/'
  },
  {
    id: 'strawberry-frost', crop: 'strawberry', kind: 'care', title: 'Защитить цветущую клубнику',
    months: [4, 5, 6], window: 'Во время цветения',
    trigger: 'Для участка прогнозируют заморозок, а растения цветут.',
    action: 'Укройте цветущие растения на ночь подходящим материалом; после опасности снимите укрытие.',
    source: 'strawberryFrost', href: '/instrumenty/kalendar-uhoda/'
  },
  {
    id: 'strawberry-harvest-june', crop: 'strawberry', kind: 'harvest', type: 'june', title: 'Собирать клубнику однократного плодоношения',
    months: [5, 6, 7, 8], window: 'Когда ягоды созревают',
    trigger: 'Ягоды полностью окрасились и созрели.',
    action: 'Собирайте спелые ягоды регулярно. Запишите даты начала и конца сбора на своей грядке.',
    source: 'strawberryHarvest', href: '/instrumenty/zhurnal-uchastka/'
  },
  {
    id: 'strawberry-harvest-day-neutral', crop: 'strawberry', kind: 'harvest', type: 'day-neutral', title: 'Собирать клубнику длительного плодоношения',
    months: [6, 7, 8, 9, 10], window: 'Пока созревают новые ягоды',
    trigger: 'На растениях продолжают появляться спелые ягоды.',
    action: 'Собирайте созревшие ягоды регулярно и отмечайте паузы и новые волны плодоношения.',
    source: 'strawberryHarvest', href: '/instrumenty/zhurnal-uchastka/'
  },
  {
    id: 'strawberry-after-june', crop: 'strawberry', kind: 'pruning', type: 'june', title: 'Убрать старые листья клубники после сбора',
    months: [6, 7, 8, 9], window: 'После окончания однократного сбора',
    trigger: 'Плодоношение завершилось, грядку сохраняют на следующий сезон.',
    action: 'Осмотрите посадку и удалите больные и старые листья, не повреждая сердечко.',
    source: 'strawberryAfter', href: '/instrumenty/kalendar-uhoda/'
  },
  {
    id: 'strawberry-after-day-neutral', crop: 'strawberry', kind: 'pruning', type: 'day-neutral', title: 'Убирать повреждённые листья у плодоносящей клубники',
    months: [6, 7, 8, 9, 10], window: 'Пока есть цветки и новые ягоды',
    trigger: 'После первого сбора продолжается цветение или завязались новые ягоды.',
    action: 'Удаляйте повреждённые листья по мере необходимости; не обрезайте всю листву по схеме однократного сбора.',
    source: 'strawberryAfter', href: '/instrumenty/kalendar-uhoda/'
  },
  {
    id: 'strawberry-plant-late', crop: 'strawberry', kind: 'planting', title: 'Посадить клубнику после укоренения усов',
    months: [7, 8, 9], window: 'Конец лета, с запасом до холодов',
    trigger: 'Молодые розетки укоренились, и до холодов остаётся время прижиться.',
    action: 'Перенесите укоренённые растения на подготовленную грядку. Оставьте сердечко у поверхности почвы и полейте.',
    source: 'strawberryPlanting', href: '/instrumenty/glubina-posadki/'
  },
  {
    id: 'strawberry-winter', crop: 'strawberry', kind: 'care', title: 'Подготовить клубнику к зиме',
    months: [9, 10, 11], window: 'После окончания роста, до устойчивых холодов',
    trigger: 'Плодоношение закончилось и приближаются устойчивые холода.',
    action: 'Осмотрите грядку и уберите больные листья. Решите по местным условиям, нужна ли защита посадки.',
    source: 'strawberryWinter', href: '/instrumenty/kalendar-uhoda/'
  }
].map(activity => Object.freeze({ ...activity, months: Object.freeze(activity.months) })));

export function selectSeasonActivities({ crop = 'all', kind = 'all', month } = {}) {
  if (!['all', 'raspberry', 'strawberry'].includes(crop)) throw new RangeError('Неизвестная культура');
  if (!['all', 'planting', 'pruning', 'harvest', 'care'].includes(kind)) throw new RangeError('Неизвестная задача');
  const selectedMonth = month === undefined || month === null || month === '' ? null : Number(month);
  if (selectedMonth !== null && (!Number.isInteger(selectedMonth) || selectedMonth < 1 || selectedMonth > 12)) throw new RangeError('Неизвестный месяц');
  return seasonActivities.filter(activity =>
    (crop === 'all' || activity.crop === crop) &&
    (kind === 'all' || activity.kind === kind) &&
    (selectedMonth === null || activity.months.includes(selectedMonth))
  );
}
