export const calendarSources = Object.freeze({
  raspberryPlanting: { label: 'Россельхозцентр · посадка малины', url: 'https://rosselhoscenter.ru/ob-uchrezhdenii/filialy/severo-kavkazskiy/respublika-severnaya-osetiya-alaniya/malina/' },
  raspberryPlantingSeason: { label: 'Россельхозцентр · сроки посадки малины', url: 'https://rosselhoscenter.ru/ob-uchrezhdenii/filialy/severo-kavkazskiy/stavropolskiy-kray/osennyaya-posadka-maliny-organizuem-yagodnik-ratsionalno/' },
  raspberryCare: { label: 'Россельхозцентр · уход за малиной весной', url: 'https://rosselhoscenter.ru/ob-uchrezhdenii/filialy/severo-kavkazskiy/respublika-ingushetiya/ukhod-za-malinoy-vesnoy/' },
  raspberryHarvest: { label: 'Россельхозцентр · уход за малиной в июле', url: 'https://rosselhoscenter.ru/ob-uchrezhdenii/filialy/dalnevostochnyy/khabarovskiy-kray-i-eao/ukhazhivaem-pravilno-za-malinoy-v-iyule/' },
  raspberryPruning: { label: 'Россельхозцентр · обрезка малины', url: 'https://rosselhoscenter.ru/ob-uchrezhdenii/filialy/tsentralnyy-okrug/tulskaya-oblast/obrezka-maliny-osenyu/' },
  strawberryPlanting: { label: 'Россельхозцентр · посадка клубники', url: 'https://rosselhoscenter.ru/ob-uchrezhdenii/filialy/sibirskiy/omskaya-oblast/osennyaya-posadka-sadovoy-zemlyaniki/' },
  strawberryPlantingSeason: { label: 'Россельхозцентр · сроки работ с клубникой', url: 'https://rosselhoscenter.ru/ob-uchrezhdenii/filialy/uralskiy/kurganskaya-oblast/na-zametku-sadovodu/' },
  strawberryCare: { label: 'Россельхозцентр · уход за клубникой', url: 'https://rosselhoscenter.ru/ob-uchrezhdenii/filialy/sibirskiy/omskaya-oblast/vyrashchivanie-i-pravilnyy-ukhod-za-sadovoy-zemlyanikoy/' },
  strawberryFrost: { label: 'Россельхозцентр · возвратные заморозки', url: 'https://rosselhoscenter.ru/ob-uchrezhdenii/filialy/privolzhskiy/respublika-bashkortostan/informatsionnyy-listok-rosselkhoztsentra-vozvratnye-vesennie-kholoda/' },
  strawberryHarvest: { label: 'Россельхозцентр · сбор ягод', url: 'https://rosselhoscenter.ru/ob-uchrezhdenii/filialy/sibirskiy/omskaya-oblast/raboty-v-sadu-i-ogorode-v-iyule/' },
  strawberryAfter: { label: 'Россельхозцентр · уход после сбора', url: 'https://rosselhoscenter.ru/ob-uchrezhdenii/filialy/tsentralnyy-okrug/kaluzhskaya-oblast/chto-delat-s-klubnikoy-posle-sbora-urozhaya-shpargalka-dlya-dachnikov/' },
  strawberryWinter: { label: 'Россельхозцентр · подготовка к зиме', url: 'https://rosselhoscenter.ru/ob-uchrezhdenii/filialy/severo-zapadnyy/kaliningradskaya-oblast/podgotovka-zemlyaniki-k-zime/' }
});

export const calendarPhases = Object.freeze([
  { id: 'planted', label: 'Посадка' },
  { id: 'growth', label: 'Новые побеги и листья' },
  { id: 'flowers', label: 'Цветение' },
  { id: 'harvest', label: 'Сбор ягод' },
  { id: 'after', label: 'Сбор завершён' },
  { id: 'dormant', label: 'Покой растения' }
]);

const item = (title, check, action, source, caveat = '') => ({ title, check, action, source, caveat });

function raspberryPhase(phase, type, scheme, frostForecast) {
  switch (phase) {
    case 'planted': return item('Проверить укоренение', 'Проверьте, закрыты ли верхние корни и не пересохла ли почва после посадки.', 'Полейте после посадки; в первый сезон проверяйте влажность в сухие периоды.', 'raspberryPlanting');
    case 'growth': return item('Осмотреть новые побеги', 'Есть ли здоровые новые побеги и достаточно ли опоры для растущих стеблей?', 'Подвяжите нуждающиеся в опоре побеги и наблюдайте за состоянием почвы.', 'raspberryCare');
    case 'flowers': return item('Проверить цветение', 'Осмотрите цветки и побеги, отметьте фактическое начало цветения на своём участке.', 'Следите за влажностью во время длительной засухи; точную потребность проверяйте по почве.', 'raspberryCare', frostForecast ? 'При прогнозе заморозка следите за температурой на участке.' : '');
    case 'harvest': return item('Собирать по зрелости', 'Проверяйте зрелость ягод и состояние побегов, которые плодоносят.', 'Собирайте спелые ягоды регулярно и отметьте, какие побеги дали урожай.', 'raspberryHarvest');
    case 'after':
      if (type === 'summer') return item('Отделить отплодоносившие побеги', 'Убедитесь, какие побеги уже дали урожай, а какие выросли в этом сезоне.', 'После сбора удалите только отплодоносившие побеги; молодые сохраните для следующего урожая.', 'raspberryPruning');
      if (type === 'primocane') return item('Не спешить с обрезкой', 'Проверьте, полностью ли закончилось плодоношение и какой режим сбора выбран.', 'Для одного позднего урожая обрезку всех побегов планируют в период покоя, а не сразу по факту последней ягоды.', 'raspberryPruning', scheme === 'double' ? 'Для двух урожаев откройте отдельную схему обрезки.' : '');
      return item('Сначала уточнить тип малины', 'Летняя и ремонтантная малина плодоносят на побегах разного возраста.', 'Уточните тип по карточке сорта или наблюдайте за плодоношением до обрезки.', 'raspberryPruning');
    case 'dormant':
      if (type === 'primocane' && scheme === 'single') return item('Обрезка одного позднего урожая', 'Подтвердите, что это ремонтантная малина и вы выращиваете её ради одного позднего урожая.', 'В период покоя обрежьте отплодоносившие побеги по схеме одного урожая до появления новых побегов.', 'raspberryPruning');
      if (type === 'primocane') return item('Сверить схему двух урожаев', 'Вы выбрали два урожая; полная обрезка уничтожит возможность раннего сбора на сохранённых побегах.', 'Откройте отдельную схему обрезки и сохраните побеги согласно выбранному режиму.', 'raspberryPruning');
      return item('Проверить тип перед обрезкой', 'Проверьте тип сорта и состояние оставленных побегов.', 'Летняя малина плодоносит на побегах прошлого года; сохраните молодые побеги для следующего сбора.', 'raspberryPruning');
  }
}

function strawberryPhase(phase, type, frostForecast) {
  switch (phase) {
    case 'planted': return item('Проверить сердечко и укоренение', 'Сердечко находится у поверхности, корни прикрыты, почва не пересохла?', 'Полейте после посадки и проверяйте влажность, пока растения приживаются.', 'strawberryPlanting');
    case 'growth': return item('Осмотреть листья и усы', 'Проверьте состояние листьев, сорняки и появление усов.', 'Решите, нужны ли усы для размножения; лишние удаляйте по выбранной системе выращивания.', 'strawberryCare');
    case 'flowers': return item('Проверить прогноз и цветки', 'Есть ли прогноз заморозка во время цветения?', frostForecast ? 'При угрозе заморозка укройте цветущие растения на ночь подходящим материалом и снимите укрытие после опасности.' : 'Наблюдайте за цветками и прогнозом; укрытие от заморозка нужно только при реальной угрозе.', frostForecast ? 'strawberryFrost' : 'strawberryCare');
    case 'harvest': return item('Собирать полностью спелые ягоды', 'Ягоды полностью окрасились и созрели?', 'Собирайте созревшие ягоды регулярно; клубника после сбора не дозревает.', 'strawberryHarvest');
    case 'after':
      if (type === 'june') return item('Оценить уход после летнего сбора', 'Посадка действительно плодоносит однократно и будет сохранена на следующий сезон?', 'Для многолетней посадки после сбора рассмотрите удаление старых листьев, не повреждая сердечко; сначала проверьте состояние посадки и систему выращивания.', 'strawberryAfter');
      if (type === 'day-neutral') return item('Продолжать наблюдение', 'Длительное плодоношение действительно закончилось или продолжаются новые цветки?', 'Удаляйте повреждённые и отмершие листья по мере необходимости; не применяйте сплошную обрезку листьев по схеме однократного сбора.', 'strawberryAfter');
      return item('Уточнить тип плодоношения', 'Однократный это сбор или длительное плодоношение?', 'Уточните сорт и схему посадки перед обрезкой листьев.', 'strawberryAfter');
    case 'dormant': return item('Оценить состояние посадки', 'Как зимуют растения и нужна ли защита именно в ваших условиях?', 'Осмотрите посадку и сверяйте защиту с местной погодой и устройством грядки.', 'strawberryWinter');
  }
}

export function makeCalendar({ crop, type = 'unknown', scheme = 'single', phase, frostForecast = false }) {
  if (!['raspberry', 'strawberry'].includes(crop)) throw new RangeError('Неизвестная культура');
  if (!calendarPhases.some(entry => entry.id === phase)) throw new RangeError('Неизвестное событие');
  if (!['unknown', ...(crop === 'raspberry' ? ['summer', 'primocane'] : ['june', 'day-neutral'])].includes(type)) throw new RangeError('Неизвестный тип плодоношения');
  if (!['single', 'double'].includes(scheme)) throw new RangeError('Неизвестный режим сбора');
  const current = crop === 'raspberry' ? raspberryPhase(phase, type, scheme, Boolean(frostForecast)) : strawberryPhase(phase, type, Boolean(frostForecast));
  const index = calendarPhases.findIndex(entry => entry.id === phase);
  return {
    crop, type, phase,
    phaseLabel: calendarPhases[index].label,
    current,
    next: calendarPhases[index + 1] || null,
    uncertainty: type === 'unknown' && ['after', 'dormant'].includes(phase) ? 'Уточните тип плодоношения перед обрезкой.' : '',
    sequence: calendarPhases.map((entry, position) => ({ ...entry, state: position < index ? 'past' : position === index ? 'current' : 'future' }))
  };
}
