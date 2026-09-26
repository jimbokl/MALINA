export const calendarSources = Object.freeze({
  raspberry: { label: 'Россельхозцентр · обрезка малины', url: 'https://rosselhoscenter.ru/ob-uchrezhdenii/filialy/tsentralnyy-okrug/tulskaya-oblast/obrezka-maliny-osenyu/' },
  strawberry: { label: 'Россельхозцентр · посадка земляники', url: 'https://rosselhoscenter.ru/ob-uchrezhdenii/filialy/sibirskiy/omskaya-oblast/osennyaya-posadka-sadovoy-zemlyaniki/' },
  systems: { label: 'University of Minnesota Extension · системы выращивания клубники', url: 'https://extension.umn.edu/agriculture/specialty-crops/commercial-fruit-production/strawberry-farming/choosing-a-strawberry-production-system' }
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
    case 'planted': return item('Проверить укоренение', 'Проверьте, закрыты ли верхние корни и не пересохла ли почва после посадки.', 'Полейте после посадки; в первый сезон проверяйте влажность в сухие периоды.', 'raspberry');
    case 'growth': return item('Осмотреть новые побеги', 'Есть ли здоровые новые побеги и достаточно ли опоры для растущих стеблей?', 'Подвяжите нуждающиеся в опоре побеги и наблюдайте за состоянием почвы.', 'raspberry');
    case 'flowers': return item('Проверить цветение', 'Осмотрите цветки и побеги, отметьте фактическое начало цветения на своём участке.', 'Следите за влажностью во время длительной засухи; точную потребность проверяйте по почве.', 'raspberry', frostForecast ? 'При прогнозе заморозка следите за температурой на участке.' : '');
    case 'harvest': return item('Собирать по зрелости', 'Проверяйте зрелость ягод и состояние побегов, которые плодоносят.', 'Собирайте спелые ягоды регулярно и отметьте, какие побеги дали урожай.', 'raspberry');
    case 'after':
      if (type === 'summer') return item('Отделить отплодоносившие побеги', 'Убедитесь, какие побеги уже дали урожай, а какие выросли в этом сезоне.', 'После сбора удалите только отплодоносившие побеги; молодые сохраните для следующего урожая.', 'raspberry');
      if (type === 'primocane') return item('Не спешить с обрезкой', 'Проверьте, полностью ли закончилось плодоношение и какой режим сбора выбран.', 'Для одного позднего урожая обрезку всех побегов планируют в период покоя, а не сразу по факту последней ягоды.', 'raspberry', scheme === 'double' ? 'Для двух урожаев откройте отдельную схему обрезки.' : '');
      return item('Сначала уточнить тип малины', 'Летняя и ремонтантная малина плодоносят на побегах разного возраста.', 'Уточните тип по карточке сорта или наблюдайте за плодоношением до обрезки.', 'raspberry');
    case 'dormant':
      if (type === 'primocane' && scheme === 'single') return item('Обрезка одного позднего урожая', 'Подтвердите, что это ремонтантная малина и вы выращиваете её ради одного позднего урожая.', 'В период покоя обрежьте отплодоносившие побеги по схеме одного урожая до появления новых побегов.', 'raspberry');
      if (type === 'primocane') return item('Сверить схему двух урожаев', 'Вы выбрали два урожая; полная обрезка уничтожит возможность раннего сбора на сохранённых побегах.', 'Откройте отдельную схему обрезки и сохраните побеги согласно выбранному режиму.', 'raspberry');
      return item('Проверить тип перед обрезкой', 'Проверьте тип сорта и состояние оставленных побегов.', 'Летняя малина плодоносит на побегах прошлого года; сохраните молодые побеги для следующего сбора.', 'raspberry');
  }
}

function strawberryPhase(phase, type, frostForecast) {
  switch (phase) {
    case 'planted': return item('Проверить сердечко и укоренение', 'Сердечко находится у поверхности, корни прикрыты, почва не пересохла?', 'Полейте после посадки и проверяйте влажность, пока растения приживаются.', 'strawberry');
    case 'growth': return item('Осмотреть листья и усы', 'Проверьте состояние листьев, сорняки и появление усов.', 'Решите, нужны ли усы для размножения; лишние удаляйте по выбранной системе выращивания.', 'strawberry');
    case 'flowers': return item('Проверить прогноз и цветки', 'Есть ли прогноз заморозка во время цветения?', frostForecast ? 'При угрозе заморозка укройте цветущие растения на ночь подходящим материалом и снимите укрытие после опасности.' : 'Наблюдайте за цветками и прогнозом; укрытие от заморозка нужно только при реальной угрозе.', 'strawberry');
    case 'harvest': return item('Собирать полностью спелые ягоды', 'Ягоды полностью окрасились и созрели?', 'Собирайте созревшие ягоды регулярно; клубника после сбора не дозревает.', 'strawberry');
    case 'after':
      if (type === 'june') return item('Оценить уход после летнего сбора', 'Посадка действительно плодоносит однократно и будет сохранена на следующий сезон?', 'Для многолетней посадки после сбора рассмотрите удаление старых листьев, не повреждая сердечко; сначала проверьте состояние посадки и систему выращивания.', 'strawberry');
      if (type === 'day-neutral') return item('Продолжать наблюдение', 'Длительное плодоношение действительно закончилось или продолжаются новые цветки?', 'Удаляйте повреждённые и отмершие листья по мере необходимости; не применяйте сплошную обрезку листьев по схеме однократного сбора.', 'strawberry');
      return item('Уточнить тип плодоношения', 'Однократный это сбор или длительное плодоношение?', 'Уточните сорт и схему посадки перед обрезкой листьев.', 'strawberry');
    case 'dormant': return item('Оценить состояние посадки', 'Как зимуют растения и нужна ли защита именно в ваших условиях?', 'Осмотрите посадку и сверяйте защиту с местной погодой и устройством грядки.', 'systems');
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
    uncertainty: type === 'unknown' ? 'Уточните тип плодоношения перед обрезкой.' : '',
    sequence: calendarPhases.map((entry, position) => ({ ...entry, state: position < index ? 'past' : position === index ? 'current' : 'future' }))
  };
}
