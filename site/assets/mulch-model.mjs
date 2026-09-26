export const mulchSources = Object.freeze({
  strawberryHome: { label: 'University of Minnesota Extension · клубника в саду', url: 'https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/growing-strawberries-in-the-home-garden' },
  strawberrySystems: { label: 'University of Minnesota Extension · системы выращивания', url: 'https://extension.umn.edu/agriculture/specialty-crops/commercial-fruit-production/strawberry-farming/choosing-a-strawberry-production-system' },
  strawberryWinter: { label: 'University of Minnesota Extension · зимняя соломенная мульча', url: 'https://extension.umn.edu/agriculture/specialty-crops/commercial-fruit-production/strawberry-farming/adding-and-removing-straw-mulch-for-strawberries' },
  raspberry: { label: 'Oregon State University Extension · выращивание малины', url: 'https://extension.oregonstate.edu/catalog/ec-1306-growing-raspberries-your-home-garden' }
});

const strawberrySummer = {
  status: 'Описанный приём',
  material: 'Солома между растениями',
  benefit: 'Помогает отделить ягоды от почвы, сдерживать сорняки и удерживать влагу.',
  maintenance: 'Весной уберите солому с растений, оставив её между кустиками; следите, чтобы сердечко не оказалось закрыто.',
  limit: 'Основано на схеме многолетней клубники с однократным летним плодоношением. Не переносите её автоматически на нейтральнодневную посадку.',
  source: 'strawberryHome'
};

export function compareMulch({ crop, system, goal }) {
  if (!['strawberry', 'raspberry'].includes(crop) || !['berries', 'weeds', 'winter'].includes(goal)) throw new RangeError('Неизвестная культура или задача');
  if (crop === 'strawberry' && !['june', 'day-neutral'].includes(system)) throw new RangeError('Укажите систему выращивания клубники');
  if (crop === 'raspberry') {
    if (goal === 'berries') return {
      title: 'Для этой задачи нужна другая опора',
      context: 'OSU описывает шпалеру как способ не дать побегам и ягодам касаться земли. Мульча у малины решает прежде всего задачи почвы.',
      options: [], next: { label: 'Рассчитать шпалеру', url: '/instrumenty/raschet-shpalery/' }, source: 'raspberry'
    };
    return {
      title: goal === 'weeds' ? 'Мульча в ряду малины' : 'Защита основания куста зимой',
      context: 'Руководство OSU описывает эти приёмы для домашнего выращивания в Орегоне; местные сроки и необходимость зимней защиты для участка в России здесь не определяются.',
      options: [{ material: 'Органическая мульча', benefit: goal === 'weeds' ? 'Может сдерживать однолетние сорняки и сохранять влагу.' : 'В местах с промерзанием и оттаиванием почвы мульча вокруг основания может уменьшить холодовое повреждение.', maintenance: 'Осматривайте основание куста: мульча не должна засыпать корневую шейку.', limit: 'Удалите многолетние сорняки до посадки; при толстом слое соломы следите за грызунами.', source: 'raspberry' }],
      next: { label: 'Проверить глубину посадки', url: '/instrumenty/glubina-posadki/' }
    };
  }
  if (system === 'june') {
    return {
      title: goal === 'winter' ? 'Зимняя мульча для многолетней клубники' : 'Солома для летней грядки',
      context: 'Речь о многолетней клубнике с однократным летним плодоношением в системе, описанной University of Minnesota Extension.',
      options: [goal === 'winter' ? {
        material: 'Солома после перехода растений в покой', benefit: 'В описанных условиях защищает посадку от зимнего повреждения.', maintenance: 'Весной вовремя уберите солому с растений и оставьте часть между ними.', limit: 'Срок укрытия и раскрытия зависит от температуры почвы и состояния растений. Даты Миннесоты нельзя переносить на российский город.', source: 'strawberryWinter'
      } : strawberrySummer, ...(goal === 'winter' ? [] : [{ status: 'Иная схема выращивания', material: 'Плёнка на гряде', benefit: 'В источнике плёночное покрытие описано для нейтральнодневной клубники, а не для этой многолетней схемы.', maintenance: 'Если планируете плёнку, сначала пересмотрите схему размножения усами и полив.', limit: 'В многолетнем рядке дочерним розеткам нужен контакт с почвой. Этот вариант не подставляется автоматически вместо соломы.', source: 'strawberrySystems' }])],
      next: { label: 'Проверить глубину посадки', url: '/instrumenty/glubina-posadki/' }
    };
  }
  if (goal === 'winter') return {
    title: 'Сначала решите, сохраняете ли посадку на второй год',
    context: 'В руководстве UMN нейтральнодневную клубнику обычно ведут как однолетнюю. Для зимовки как многолетней описано соломенное укрытие, но следующий сезон может быть менее продуктивным.',
    options: [{ material: 'Солома только при запланированной зимовке', benefit: 'В описанной системе защищает растения от зимнего повреждения.', maintenance: 'Укрывайте после перехода в покой, раскрывайте по состоянию растений весной.', limit: 'Не является обычной летней мульчей для нейтральнодневной клубники; решение для российского участка требует местных данных.', source: 'strawberryWinter' }],
    next: { label: 'Подобрать сорт', url: '/podbor/' }
  };
  return {
    title: 'Покрытие гряды для нейтральнодневной клубники',
    context: 'В системе UMN нейтральнодневную клубнику чаще выращивают на приподнятых грядах с плёночной мульчей. Это описание практики, а не доказательство, что плёнка лучше на любом участке России.',
    options: [{ status: 'Описанный приём', material: 'Плёночная мульча на гряде', benefit: goal === 'weeds' ? 'Сдерживает сорняки на закрытой части гряды.' : 'Отделяет ягоды от открытой почвы на гряде.', maintenance: 'Заранее продумайте полив и уход за междурядьями; в источнике сорняки между рядами удаляют отдельно.', limit: 'Расходы, нагрев почвы, утилизация покрытия и совместимость с вашей схемой требуют отдельной оценки.', source: 'strawberrySystems' }, { status: 'Не для обычного летнего режима', material: 'Солома поверх растений', benefit: 'В руководстве UMN солома для нейтральнодневной клубники указана лишь при решении оставить посадку на зимовку.', maintenance: 'Для летнего режима не подменяйте ею технологию гряды без отдельной проверки.', limit: 'Это не запрет на любой органический материал в междурядье; речь об укрытии самих растений.', source: 'strawberryWinter' }],
    next: { label: 'Рассчитать саженцы', url: '/instrumenty/raschet-sazhencev/' }
  };
}
