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
  limit: 'Такой приём удобен для летней клубники. Для нейтральнодневной грядки схему мульчирования подберите отдельно.',
  source: 'strawberryHome'
};

export function compareMulch({ crop, system, goal }) {
  if (!['strawberry', 'raspberry'].includes(crop) || !['berries', 'weeds', 'winter'].includes(goal)) throw new RangeError('Неизвестная культура или задача');
  if (crop === 'strawberry' && !['june', 'day-neutral'].includes(system)) throw new RangeError('Укажите систему выращивания клубники');
  if (crop === 'raspberry') {
    if (goal === 'berries') return {
      title: 'Для этой задачи нужна другая опора',
      context: 'Если ягоды касаются земли, начните со шпалеры: она поднимет побеги. Мульча поможет почве, но не заменит опору.',
      options: [], next: { label: 'Рассчитать шпалеру', url: '/instrumenty/raschet-shpalery/' }, source: 'raspberry'
    };
    return {
      title: goal === 'weeds' ? 'Мульча в ряду малины' : 'Защита основания куста зимой',
      context: 'Положите мульчу вокруг основания куста, оставив корневую шейку открытой. Для зимней защиты ориентируйтесь на погоду и состояние своего участка.',
      options: [{ material: 'Органическая мульча', benefit: goal === 'weeds' ? 'Может сдерживать однолетние сорняки и сохранять влагу.' : 'В местах с промерзанием и оттаиванием почвы мульча вокруг основания может уменьшить холодовое повреждение.', maintenance: 'Осматривайте основание куста: мульча не должна засыпать корневую шейку.', limit: 'Удалите многолетние сорняки до посадки; при толстом слое соломы следите за грызунами.', source: 'raspberry' }],
      next: { label: 'Проверить глубину посадки', url: '/instrumenty/glubina-posadki/' }
    };
  }
  if (system === 'june') {
    return {
      title: goal === 'winter' ? 'Зимняя мульча для многолетней клубники' : 'Солома для летней грядки',
      context: 'Для грядки с летней клубникой солома помогает держать ягоды подальше от почвы. На зиму её используют по другой схеме.',
      options: [goal === 'winter' ? {
        material: 'Солома после перехода растений в покой', benefit: 'Защищает посадку от зимнего повреждения.', maintenance: 'Весной вовремя уберите солому с растений и оставьте часть между ними.', limit: 'День укрытия и раскрытия выбирайте по температуре почвы и состоянию растений.', source: 'strawberryWinter'
      } : strawberrySummer, ...(goal === 'winter' ? [] : [{ status: 'Иная схема выращивания', material: 'Плёнка на гряде', benefit: 'Плёнку обычно выбирают для нейтральнодневной клубники; на многолетней летней грядке сначала продумайте, как будут укореняться усы.', maintenance: 'Если планируете плёнку, заранее решите вопрос с поливом и размножением.', limit: 'Дочерним розеткам нужен контакт с почвой, а плёнка закрывает гряду.', source: 'strawberrySystems' }])],
      next: { label: 'Проверить глубину посадки', url: '/instrumenty/glubina-posadki/' }
    };
  }
  if (goal === 'winter') return {
    title: 'Сначала решите, сохраняете ли посадку на второй год',
    context: 'Нейтральнодневную клубнику нередко выращивают один сезон. Если хотите сохранить посадку на следующий год, подумайте о зимнем укрытии соломой и учтите, что следующий сезон может быть менее урожайным.',
    options: [{ material: 'Солома только при запланированной зимовке', benefit: 'Помогает защитить растения от зимнего повреждения.', maintenance: 'Укрывайте после перехода в покой, раскрывайте по состоянию растений весной.', limit: 'Летом не укрывайте соломой сами растения: это приём для зимовки.', source: 'strawberryWinter' }],
    next: { label: 'Подобрать сорт', url: '/podbor/' }
  };
  return {
    title: 'Покрытие гряды для нейтральнодневной клубники',
    context: 'Для нейтральнодневной клубники можно рассмотреть приподнятую гряду с плёнкой. Сразу решите, как будете поливать растения и ухаживать за междурядьями.',
    options: [{ status: 'Приём для гряды', material: 'Плёночная мульча на гряде', benefit: goal === 'weeds' ? 'Сдерживает сорняки на закрытой части гряды.' : 'Отделяет ягоды от открытой почвы на гряде.', maintenance: 'Заранее продумайте полив и прополку междурядий.', limit: 'Оцените стоимость покрытия, нагрев почвы и уборку плёнки после сезона.', source: 'strawberrySystems' }, { status: 'Для зимовки', material: 'Солома поверх растений', benefit: 'Помогает, если вы оставляете нейтральнодневную клубнику на зиму.', maintenance: 'Летом ухаживайте за грядой по выбранной схеме; солому поверх растений оставьте для зимовки.', limit: 'Речь об укрытии самих растений, а не о соломе в междурядьях.', source: 'strawberryWinter' }],
    next: { label: 'Рассчитать саженцы', url: '/instrumenty/raschet-sazhencev/' }
  };
}
