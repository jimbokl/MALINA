// Each characteristic below is limited to what the linked breeder or research centre says.
// Foreign growing conditions are not converted into regional recommendations for Russia.
export const additionalStrawberryVarieties = [
  {
    slug: 'tsaritsa', name: 'Царица', latin: 'Fragaria × ananassa · Царица',
    type: '—', period: 'Средний срок в описании ФНЦ Садоводства', place: '—',
    note: 'ФНЦ Садоводства описывает «Царицу» как крупноплодный сорт среднего срока созревания с плотными ягодами.',
    traits: ['Средний срок созревания', 'Плотные ягоды по описанию ФНЦ Садоводства'],
    source: 'https://vstisp.org/vstisp/index.php/11-icetheme/sample-news/1442-tsaritsa',
    sourceLabel: 'ФНЦ Садоводства · Царица', harvestTiming: 'middle', setting: 'unknown',
    fruiting: 'unknown', fruitingLabel: '—'
  },
  {
    slug: 'bereginya', name: 'Берегиня', latin: 'Fragaria × ananassa · Берегиня',
    type: '—', period: 'Поздний срок в описании ФНЦ Садоводства', place: '—',
    note: 'ФНЦ Садоводства относит «Берегиню» к поздним сортам и описывает плотные ягоды с кисло-сладким вкусом.',
    traits: ['Поздний срок созревания', 'Плотные ягоды по описанию ФНЦ Садоводства'],
    source: 'https://vstisp.org/vstisp/index.php/component/content/article/11-icetheme/sample-news/1446-bereginya',
    sourceLabel: 'ФНЦ Садоводства · Берегиня', harvestTiming: 'late', setting: 'unknown',
    fruiting: 'unknown', fruitingLabel: '—'
  },
  {
    slug: 'kleri', name: 'Клери', latin: 'Fragaria × ananassa · Clery',
    type: 'Однократное плодоношение', period: 'Ранний срок в описании оригинатора', place: 'Грядка',
    note: 'Оригинатор CIV описывает «Клери» как ранний сорт с однократным плодоношением и коническими красными ягодами.',
    traits: ['Ранний срок в условиях оригинатора', 'Однократное плодоношение'],
    source: 'https://civ.it/en/strawberries/clery/', sourceLabel: 'CIV · Clery',
    harvestTiming: 'early', setting: 'ground', fruiting: 'summer', fruitingLabel: 'Однократное плодоношение'
  },
  {
    slug: 'aprika', name: 'Априка', latin: 'Fragaria × ananassa · Aprica',
    type: 'Однократное плодоношение', period: 'Весенне-летний сбор в описании оригинатора', place: 'Грядка',
    note: 'Оригинатор CIV относит «Априку» к сортам с однократным плодоношением и описывает ровные крупные ягоды.',
    traits: ['Однократное плодоношение', 'Крупные ягоды по описанию оригинатора'],
    source: 'https://civ.it/en/strawberries/apricapbr/', sourceLabel: 'CIV · Aprica',
    harvestTiming: 'unknown', setting: 'ground', fruiting: 'summer', fruitingLabel: 'Однократное плодоношение'
  },
  {
    slug: 'dzholi', name: 'Джоли', latin: 'Fragaria × ananassa · Joly',
    type: 'Однократное плодоношение', period: 'Весенне-летний сбор в описании оригинатора', place: 'Грядка',
    note: 'Оригинатор CIV описывает «Джоли» как сорт с однократным плодоношением, приятным вкусом и плотной ягодой.',
    traits: ['Однократное плодоношение', 'Плотные ягоды по описанию оригинатора'],
    source: 'https://civ.it/en/strawberries/jolypbr/', sourceLabel: 'CIV · Joly',
    harvestTiming: 'unknown', setting: 'ground', fruiting: 'summer', fruitingLabel: 'Однократное плодоношение'
  },
  {
    slug: 'siriya', name: 'Сирия', latin: 'Fragaria × ananassa · Syria NF137',
    type: '—', period: 'Средний срок относительно «Альбы» у питомника', place: '—',
    note: 'Питомник Geoplant относит «Сирию» к среднему сроку сбора и описывает плотные красные ягоды.',
    traits: ['Средний срок в условиях питомника', 'Плотные ягоды по описанию питомника'],
    source: 'https://geoplantvivai.com/en/syria-strawberry-plant/', sourceLabel: 'Geoplant Vivai · Syria NF137',
    harvestTiming: 'middle', setting: 'unknown', fruiting: 'unknown', fruitingLabel: '—'
  },
  {
    slug: 'malga', name: 'Мальга', latin: 'Fragaria × ananassa · Malga SG134',
    type: 'Повторное плодоношение', period: 'Длительный сбор в описании питомника', place: '—',
    note: 'Питомник Geoplant описывает «Мальгу» как сорт с повторным плодоношением и ранним началом цветения.',
    traits: ['Повторное плодоношение', 'Раннее цветение в условиях питомника'],
    source: 'https://geoplantvivai.com/en/malga-strawberry-plant/', sourceLabel: 'Geoplant Vivai · Malga SG134',
    harvestTiming: 'repeat', setting: 'unknown', fruiting: 'remontant', fruitingLabel: 'Повторное плодоношение'
  },
  {
    slug: 'aniya', name: 'Ания', latin: 'Fragaria × ananassa · Ania CIVRH612',
    type: 'Повторное плодоношение', period: 'Длительный сбор в описании оригинатора', place: '—',
    note: 'Оригинатор CIV относит «Анию» к сортам с повторным плодоношением и отмечает аромат лесной земляники.',
    traits: ['Повторное плодоношение', 'Аромат лесной земляники по описанию оригинатора'],
    source: 'https://civ.it/en/strawberries/ania-civrh612pbr/', sourceLabel: 'CIV · Ania CIVRH612',
    harvestTiming: 'repeat', setting: 'unknown', fruiting: 'remontant', fruitingLabel: 'Повторное плодоношение'
  },
  {
    slug: 'malvina', name: 'Мальвина', latin: 'Fragaria × ananassa · Мальвина',
    type: '—', period: 'Максимальное подмерзание в испытании: 3,0–4,0 балла', place: 'Кокино, Брянская область · 2013–2017',
    note: 'В испытании Кокинского пункта ВСТИСП «Мальвина» вошла в группу с максимальным подмерзанием растений 3,0–4,0 балла.',
    traits: ['Максимальное подмерзание растений 3,0–4,0 балла в испытании 2013–2017 годов'],
    source: 'https://vstisp.org/vstisp/images/stories/horticulture/S-and-V-2018-4/32-37-4-2018.pdf',
    sourceLabel: 'ВСТИСП · сортоиспытание в Кокино, 2013–2017',
    harvestTiming: 'unknown', setting: 'unknown', fruiting: 'unknown', fruitingLabel: '—'
  },
  {
    slug: 'albion', name: 'Альбион', latin: 'Fragaria × ananassa · Альбион',
    type: '—', period: 'Максимальное подмерзание в испытании: 4,5–5,0 балла', place: 'Кокино, Брянская область · 2013–2017',
    note: 'В испытании Кокинского пункта ВСТИСП «Альбион» вошёл в группу с максимальным подмерзанием растений 4,5–5,0 балла.',
    traits: ['Максимальное подмерзание растений 4,5–5,0 балла в испытании 2013–2017 годов'],
    source: 'https://vstisp.org/vstisp/images/stories/horticulture/S-and-V-2018-4/32-37-4-2018.pdf',
    sourceLabel: 'ВСТИСП · сортоиспытание в Кокино, 2013–2017',
    harvestTiming: 'unknown', setting: 'unknown', fruiting: 'unknown', fruitingLabel: '—'
  },
  {
    slug: 'honey', name: 'Хоней', latin: 'Fragaria × ananassa · Хоней',
    type: '—', period: 'Максимальное подмерзание в испытании: 3,0–4,0 балла', place: 'Кокино, Брянская область · 2013–2017',
    note: 'В испытании Кокинского пункта ВСТИСП «Хоней» вошёл в группу с максимальным подмерзанием растений 3,0–4,0 балла.',
    traits: ['Максимальное подмерзание растений 3,0–4,0 балла в испытании 2013–2017 годов'],
    source: 'https://vstisp.org/vstisp/images/stories/horticulture/S-and-V-2018-4/32-37-4-2018.pdf',
    sourceLabel: 'ВСТИСП · сортоиспытание в Кокино, 2013–2017',
    harvestTiming: 'unknown', setting: 'unknown', fruiting: 'unknown', fruitingLabel: '—'
  },
  {
    slug: 'kimberli', name: 'Кимберли', latin: 'Fragaria × ananassa · Вима Кимберли',
    type: '—', period: 'Максимальное подмерзание в испытании: 3,0–4,0 балла', place: 'Кокино, Брянская область · 2013–2017',
    note: 'В испытании Кокинского пункта ВСТИСП «Вима Кимберли» вошла в группу с максимальным подмерзанием растений 3,0–4,0 балла.',
    traits: ['Максимальное подмерзание растений 3,0–4,0 балла в испытании 2013–2017 годов'],
    source: 'https://vstisp.org/vstisp/images/stories/horticulture/S-and-V-2018-4/32-37-4-2018.pdf',
    sourceLabel: 'ВСТИСП · сортоиспытание в Кокино, 2013–2017',
    harvestTiming: 'unknown', setting: 'unknown', fruiting: 'unknown', fruitingLabel: '—'
  },
  {
    slug: 'cabrillo', name: 'Кабрилло', latin: 'Fragaria × ananassa · Cabrillo',
    type: 'Нейтрального светового дня', period: 'Показатель Fruit Size: 32 г/ягоду в сравнительной таблице', place: 'Уотсонвилл, Калифорния · 2012–2013',
    note: 'Селекционная программа UC Davis описывает Кабрилло как сорт нейтрального светового дня. В сравнительной таблице испытаний в Уотсонвилле указан размер ягоды 32 г.',
    traits: ['Нейтральный световой день по описанию UC Davis', 'В таблице испытаний UC Davis показатель Fruit Size составил 32 г/ягоду'],
    source: 'https://research.ucdavis.edu/industry-support/plant-variety-licensing-program/strawberry-licensing-program/',
    sourceLabel: 'UC Davis · Cabrillo', harvestTiming: 'unknown', setting: 'unknown',
    fruiting: 'unknown', fruitingLabel: 'Нейтральный световой день', reviewedAt: '27.09.2026'
  },
  {
    slug: 'brilla', name: 'Брилла', latin: 'Fragaria × ananassa · Brilla',
    type: 'Однократное плодоношение', period: 'Ранний срок в описании оригинатора', place: '—',
    note: 'Оригинатор описывает Бриллу как ранний сорт с однократным плодоношением и крупными удлинённо-коническими красно-оранжевыми ягодами.',
    traits: ['Раннее созревание в описании оригинатора', 'Плотная мякоть и средне-сладкий вкус по описанию оригинатора'],
    source: 'https://www.coviro.it/brilla/', sourceLabel: 'COVIRO · Brilla',
    harvestTiming: 'early', setting: 'unknown', fruiting: 'summer', fruitingLabel: 'Однократное плодоношение', reviewedAt: '27.09.2026'
  },
  {
    slug: 'magnus', name: 'Магнус', latin: 'Fragaria × ananassa · Magnus',
    type: 'Однократное плодоношение', period: 'Поздний срок июньского плодоношения в описании оригинатора', place: '—',
    note: 'Оригинатор относит Магнус к поздним сортам июньского плодоношения и описывает крупные ярко-красные конические ягоды. Сбор указан на 10 дней позже Faith в условиях оригинатора.',
    traits: ['Поздний срок в сравнении оригинатора', 'Крупные ярко-красные конические ягоды'],
    source: 'https://flevoberry.nl/variety/magnus/', sourceLabel: 'Flevo Berry · Magnus',
    harvestTiming: 'late', setting: 'unknown', fruiting: 'summer', fruitingLabel: 'Однократное плодоношение', reviewedAt: '27.09.2026'
  },
  {
    slug: 'rumba', name: 'Румба', latin: 'Fragaria × ananassa · Rumba',
    type: 'Однократное плодоношение', period: 'Ранний срок в описании оригинатора', place: '—',
    note: 'Оригинатор описывает Румбу как ранний сорт с ярко-красными блестящими выровненными ягодами. В сравнении с Sonata сбор указан на 5–6 дней раньше.',
    traits: ['Ранний срок по описанию оригинатора', 'Выращивание в открытом грунте и туннелях указано в описании оригинатора'],
    source: 'https://www.fresh-forward.nl/en/breed/rumba', sourceLabel: 'Fresh Forward · Rumba',
    harvestTiming: 'early', setting: 'unknown', fruiting: 'summer', fruitingLabel: 'Однократное плодоношение', reviewedAt: '27.09.2026',
    secondarySource: 'https://www.fresh-forward.nl/en/download/77/rumba-uknew', secondarySourceLabel: 'Fresh Forward · сортовой лист Rumba'
  },
  {
    slug: 'elsanta', name: 'Эльсанта', latin: 'Fragaria × ananassa · Эльсанта',
    type: 'Однократное плодоношение', period: 'Среднеранний срок по Госреестру', place: 'Регионы допуска Госреестра: 4, 6 и 10',
    note: 'В записи Госреестра у Эльсанты указаны среднеранний срок созревания, красные ягоды средней массой 13,1 г и урожайность 54,7–73,4 ц/га. Сорт допущен в регионах 4, 6 и 10.',
    traits: ['Среднеранний срок созревания по Госреестру', 'Однократное плодоношение', 'Красная ягода', 'Средняя масса ягоды 13,1 г', 'Урожайность 54,7–73,4 ц/га', 'Регионы допуска Госреестра: 4, 6 и 10'],
    source: 'https://gossortrf.ru/registry/gosudarstvennyy-reestr-selektsionnykh-dostizheniy-dopushchennykh-k-ispolzovaniyu-tom-1-sorta-rasteni/elsanta-zemlyanika-9610367/',
    sourceLabel: 'Госсорткомиссия · Эльсанта, запись 9610367',
    harvestTiming: 'unknown', setting: 'unknown', fruiting: 'summer', fruitingLabel: 'Однократное плодоношение', reviewedAt: '27.09.2026'
  },
  {
    slug: 'borovitskaya', name: 'Боровицкая', latin: 'Fragaria × ananassa · Боровицкая',
    type: '—', period: 'Среднепоздний срок в описании ФНЦ Садоводства', place: '—',
    note: 'ФНЦ Садоводства указывает среднепоздний срок созревания Боровицкой и описывает её ширококонические оранжево-красные ягоды. Средняя масса — 15–16 г, первых ягод — до 20 г; вкус кисло-сладкий, 3,8–4,0 балла. Средняя урожайность в описании — 11,7 т/га.',
    traits: ['Среднепоздний срок созревания', 'Оранжево-красная блестящая ягода', 'Средняя масса 15–16 г; первые ягоды до 20 г', 'Кисло-сладкий освежающий вкус, 3,8–4,0 балла', 'Урожайность 11,7 т/га', 'Средняя зимостойкость и засухоустойчивость'],
    source: 'https://vstisp.org/vstisp/index.php/11-icetheme/sample-news/1447-borovitskaya',
    sourceLabel: 'ФНЦ Садоводства · Боровицкая', harvestTiming: 'unknown', setting: 'unknown',
    fruiting: 'unknown', fruitingLabel: '—', reviewedAt: '27.09.2026'
  },
  {
    slug: 'nashe-podmoskove', name: 'Наше Подмосковье', latin: 'Fragaria × ananassa · Наше Подмосковье',
    type: '—', period: 'Средний срок в описании ФНЦ Садоводства', place: '—',
    note: 'ФНЦ Садоводства описывает средние по размеру блестящие плотные ягоды округло-конической формы, массой 7–8 г в среднем и до 30 г максимальной. Вкус кисло-сладкий, мякоть тёмно-красная. В описании указаны продуктивность 700–800 г с куста, урожайность 15–20 т/га, высокая зимостойкость и устойчивость к грибным заболеваниям листьев и земляничному клещу.',
    traits: ['Средний срок созревания', 'Тёмно-красная плотная ягода', 'Средняя масса 7–8 г; максимальная — до 30 г', 'Кисло-сладкий вкус', 'Урожайность 15–20 т/га; продуктивность 700–800 г с куста', 'Высокие зимостойкость и засухоустойчивость', 'Устойчивость к грибным заболеваниям листьев и земляничному клещу'],
    source: 'https://vstisp.org/vstisp/index.php/component/content/article/11-icetheme/sample-news/1441-nashe-podmoskove',
    sourceLabel: 'ФНЦ Садоводства · Наше Подмосковье', harvestTiming: 'middle', setting: 'unknown',
    fruiting: 'unknown', fruitingLabel: '—', reviewedAt: '27.09.2026'
  },
  {
    slug: 'darenka', name: 'Дарёнка', latin: 'Fragaria × ananassa · Дарёнка',
    type: '—', period: 'Ранний срок в полевом исследовании ФНЦ Садоводства', place: 'Регионы допуска Госреестра: 3, 4, 10 и 11',
    note: 'В опыте Оренбургского филиала ФНЦ Садоводства за 2020–2021 годы средняя урожайность составила 10,3 т/га, средняя масса ягод — 12,0 г. В группе раннего срока созревания.',
    traits: ['Ранний срок в исследовании', 'Средняя масса ягоды 12,0 г', 'Урожайность 10,3 т/га', 'Среднее число цветоносов — 5,7 на куст; плодов — 23,8', 'Поражение белой пятнистостью — 0 баллов в опыте'],
    source: 'https://vstisp.org/vstisp/images/Salimova.pdf', sourceLabel: 'ФНЦ Садоводства · опыт в Оренбургской области, 2020–2021',
    harvestTiming: 'early', setting: 'unknown', fruiting: 'unknown', fruitingLabel: '—', reviewedAt: '27.09.2026',
    secondarySource: 'https://gossortrf.ru/upload/iblock/00a/clri6obhudueqx6t1f6awcrsp6vm6psk.pdf#page=414',
    secondarySourceLabel: 'Госреестр 2024 · запись 9705077'
  },
  {
    slug: 'zenga-zengana', name: 'Зенга Зенгана', latin: 'Fragaria × ananassa · Зенга Зенгана',
    type: '—', period: 'Группа среднего и позднего срока в полевом исследовании ФНЦ Садоводства', place: 'Регионы допуска Госреестра: 2–9',
    note: 'В опыте Оренбургского филиала ФНЦ Садоводства за 2020–2021 годы средняя урожайность составила 7,7 т/га, средняя масса ягод — 8,2 г. В таблице опыта указаны 6,5 цветоноса и 25,8 плода на куст в среднем.',
    traits: ['Средняя масса ягоды 8,2 г', 'Урожайность 7,7 т/га', 'Среднее число цветоносов — 6,5 на куст; плодов — 25,8', 'Степень подмерзания — 1,8 балла в среднем за 2020–2021 годы', 'Поражение белой пятнистостью — 0,3 балла в опыте'],
    source: 'https://vstisp.org/vstisp/images/Salimova.pdf', sourceLabel: 'ФНЦ Садоводства · опыт в Оренбургской области, 2020–2021',
    harvestTiming: 'unknown', setting: 'unknown', fruiting: 'unknown', fruitingLabel: '—', reviewedAt: '27.09.2026',
    secondarySource: 'https://gossortrf.ru/upload/iblock/00a/clri6obhudueqx6t1f6awcrsp6vm6psk.pdf#page=414',
    secondarySourceLabel: 'Госреестр 2024 · запись 6950361'
  },
  {
    slug: 'desnyanka-kokinskaya', name: 'Деснянка Кокинская', latin: 'Fragaria × ananassa · Деснянка Кокинская',
    type: '—', period: 'Группа среднего и позднего срока в полевом исследовании ФНЦ Садоводства', place: 'Регионы допуска Госреестра: 4 и 10',
    note: 'В опыте Оренбургского филиала ФНЦ Садоводства за 2020–2021 годы средняя урожайность составила 9,4 т/га, средняя масса ягод — 10,3 г. Степень подмерзания в среднем составила 1,3 балла.',
    traits: ['Средняя масса ягоды 10,3 г; первых ягод — 12,8 г', 'Урожайность 9,4 т/га', 'Степень подмерзания — 1,3 балла в среднем за 2020–2021 годы', 'Поражение бурой пятнистостью — 0,3 балла в опыте', 'Среднее число цветоносов — 4,3 на куст; плодов — 22,0'],
    source: 'https://vstisp.org/vstisp/images/Salimova.pdf', sourceLabel: 'ФНЦ Садоводства · опыт в Оренбургской области, 2020–2021',
    harvestTiming: 'unknown', setting: 'unknown', fruiting: 'unknown', fruitingLabel: '—', reviewedAt: '27.09.2026',
    secondarySource: 'https://gossortrf.ru/upload/iblock/00a/clri6obhudueqx6t1f6awcrsp6vm6psk.pdf#page=414',
    secondarySourceLabel: 'Госреестр 2024 · запись 7404999'
  },
  {
    slug: 'vityaz', name: 'Витязь', latin: 'Fragaria × ananassa · Витязь',
    type: '—', period: 'Средний срок в испытании ВНИИСПК', place: 'Кокино, Брянская область · 2006–2007',
    note: 'В испытании ВНИИСПК средняя урожайность «Витязя» составила 22,5 т/га, продуктивность куста — 380,5 г.',
    traits: ['Средний срок созревания', 'Средняя урожайность 22,5 т/га', 'Продуктивность куста 380,5 г'],
    source: 'https://vniispk.ru/pages/activities/science-activities/conference-2008/publ-2008-2',
    sourceLabel: 'ВНИИСПК · сортоиспытание в Кокино, 2006–2007', harvestTiming: 'middle', setting: 'unknown',
    fruiting: 'unknown', fruitingLabel: '—', reviewedAt: '27.09.2026',
    secondarySource: 'https://gossortrf.ru/upload/iblock/00a/clri6obhudueqx6t1f6awcrsp6vm6psk.pdf#page=413',
    secondarySourceLabel: 'Госреестр 2024 · запись 9800425'
  },
  {
    slug: 'slavutich', name: 'Славутич', latin: 'Fragaria × ananassa · Славутич',
    type: '—', period: 'Средний срок в испытании ВНИИСПК', place: 'Кокино, Брянская область · 2006–2007',
    note: 'В испытании ВНИИСПК средняя урожайность «Славутича» составила 15,7 т/га, продуктивность куста — 310,3 г.',
    traits: ['Средний срок созревания', 'Средняя урожайность 15,7 т/га', 'Продуктивность куста 310,3 г'],
    source: 'https://vniispk.ru/pages/activities/science-activities/conference-2008/publ-2008-2',
    sourceLabel: 'ВНИИСПК · сортоиспытание в Кокино, 2006–2007', harvestTiming: 'middle', setting: 'unknown',
    fruiting: 'unknown', fruitingLabel: '—', reviewedAt: '27.09.2026',
    secondarySource: 'https://gossortrf.ru/upload/iblock/00a/clri6obhudueqx6t1f6awcrsp6vm6psk.pdf#page=414',
    secondarySourceLabel: 'Госреестр 2024 · запись 9908142'
  },
  {
    slug: 'rusich', name: 'Русич', latin: 'Fragaria × ananassa · Русич',
    type: '—', period: 'Поздний срок в испытании ВНИИСПК', place: 'Кокино, Брянская область · 2006–2007',
    note: 'В испытании ВНИИСПК средняя урожайность «Русича» составила 21,6 т/га, продуктивность куста — 349,5 г.',
    traits: ['Поздний срок созревания', 'Средняя урожайность 21,6 т/га', 'Продуктивность куста 349,5 г'],
    source: 'https://vniispk.ru/pages/activities/science-activities/conference-2008/publ-2008-2',
    sourceLabel: 'ВНИИСПК · сортоиспытание в Кокино, 2006–2007', harvestTiming: 'late', setting: 'unknown',
    fruiting: 'unknown', fruitingLabel: '—', reviewedAt: '27.09.2026',
    secondarySource: 'https://gossortrf.ru/upload/iblock/00a/clri6obhudueqx6t1f6awcrsp6vm6psk.pdf#page=414',
    secondarySourceLabel: 'Госреестр 2024 · запись 9907662'
  },
  {
    slug: 'alfa', name: 'Альфа', latin: 'Fragaria × ananassa · Альфа',
    type: '—', period: 'Поздний срок в испытании ВНИИСПК', place: 'Кокино, Брянская область · 2006–2007',
    note: 'В испытании ВНИИСПК средняя урожайность «Альфы» составила 21,1 т/га, продуктивность куста — 612,7 г.',
    traits: ['Поздний срок созревания', 'Средняя урожайность 21,1 т/га', 'Продуктивность куста 612,7 г'],
    source: 'https://vniispk.ru/pages/activities/science-activities/conference-2008/publ-2008-2',
    sourceLabel: 'ВНИИСПК · сортоиспытание в Кокино, 2006–2007', harvestTiming: 'late', setting: 'unknown',
    fruiting: 'unknown', fruitingLabel: '—', reviewedAt: '27.09.2026',
    secondarySource: 'https://gossortrf.ru/upload/iblock/00a/clri6obhudueqx6t1f6awcrsp6vm6psk.pdf#page=412',
    secondarySourceLabel: 'Госреестр 2024 · запись 9908141'
  },
  {
    slug: 'solovushka', name: 'Соловушка', latin: 'Fragaria × ananassa · Соловушка',
    type: '—', period: 'Средний срок в испытании ВНИИСПК', place: 'Кокино, Брянская область · 2006–2007',
    note: 'В испытании ВНИИСПК средняя урожайность «Соловушки» составила 29,7 т/га, продуктивность куста — 579,3 г.',
    traits: ['Средний срок созревания', 'Средняя урожайность 29,7 т/га', 'Продуктивность куста 579,3 г'],
    source: 'https://vniispk.ru/pages/activities/science-activities/conference-2008/publ-2008-2',
    sourceLabel: 'ВНИИСПК · сортоиспытание в Кокино, 2006–2007', harvestTiming: 'middle', setting: 'unknown',
    fruiting: 'unknown', fruitingLabel: '—', reviewedAt: '27.09.2026'
  },
  {
    slug: 'divnaya', name: 'Дивная', latin: 'Fragaria × ananassa · Дивная',
    type: '—', period: 'Средний срок созревания по опытам ВИР', place: 'Ленинградская область · 2010–2015',
    note: 'В опытах ВИР урожайность сорта составила 13 т/га, средняя масса ягоды — 12,5 г, вкусовая оценка — 4,6 балла.',
    traits: ['Средний срок созревания', 'Урожайность 13 т/га', 'Средняя масса ягоды 12,5 г', 'Вкус 4,6 балла'],
    source: 'https://www.vir.nw.ru/wp-content/uploads/2018/09/trud177_v2.pdf',
    sourceLabel: 'ВИР · сравнительные опыты в Ленинградской области, 2010–2015', harvestTiming: 'middle', setting: 'unknown',
    fruiting: 'unknown', fruitingLabel: '—', reviewedAt: '27.09.2026',
    secondarySource: 'https://gossortrf.ru/upload/iblock/00a/clri6obhudueqx6t1f6awcrsp6vm6psk.pdf#page=414',
    secondarySourceLabel: 'Госреестр 2024 · запись 9204342'
  },
  {
    slug: 'tsarskoselskaya', name: 'Царскосельская', latin: 'Fragaria × ananassa · Царскосельская',
    type: '—', period: 'Среднепоздний срок созревания по опытам ВИР', place: 'Ленинградская область · 2010–2015',
    note: 'В опытах ВИР средняя урожайность сорта составила 15,5 т/га, средняя масса ягоды — 11 г.',
    traits: ['Среднепоздний срок созревания', 'Урожайность 15,5 т/га', 'Средняя масса ягоды 11 г'],
    source: 'https://www.vir.nw.ru/wp-content/uploads/2018/09/trud177_v2.pdf',
    sourceLabel: 'ВИР · сравнительные опыты в Ленинградской области, 2010–2015', harvestTiming: 'unknown', setting: 'unknown',
    fruiting: 'unknown', fruitingLabel: '—', reviewedAt: '27.09.2026',
    secondarySource: 'https://gossortrf.ru/upload/iblock/00a/clri6obhudueqx6t1f6awcrsp6vm6psk.pdf#page=415',
    secondarySourceLabel: 'Госреестр 2024 · запись 9204369'
  },
  {
    slug: 'sudarushka', name: 'Сударушка', latin: 'Fragaria × ananassa · Сударушка',
    type: '—', period: 'Средний срок созревания по опытам ВИР', place: 'Ленинградская область · 2010–2015',
    note: 'В опытах ВИР средняя урожайность сорта составила 9 т/га, масса ягоды — 9,4 г; после зимовки отмечено вымерзание около 15% рожков.',
    traits: ['Средний срок созревания', 'Урожайность 9 т/га', 'Средняя масса ягоды 9,4 г', 'Оценка зимнего повреждения — 2 балла'],
    source: 'https://www.vir.nw.ru/wp-content/uploads/2018/09/trud177_v2.pdf',
    sourceLabel: 'ВИР · сравнительные опыты в Ленинградской области, 2010–2015', harvestTiming: 'middle', setting: 'unknown',
    fruiting: 'unknown', fruitingLabel: '—', reviewedAt: '27.09.2026',
    secondarySource: 'https://gossortrf.ru/upload/iblock/00a/clri6obhudueqx6t1f6awcrsp6vm6psk.pdf#page=415',
    secondarySourceLabel: 'Госреестр 2024 · запись 9204350'
  },
  {
    slug: 'zenit', name: 'Зенит', latin: 'Fragaria × ananassa · Зенит',
    type: '—', period: 'Крупноплодный сорт по данным ВИР', place: 'Ленинградская область · 2010–2015',
    note: 'ВИР относит «Зенит» к группе крупноплодных сортов со средней массой ягоды более 12 г; оценка вкуса — от 4,5 балла, созревание дружное.',
    traits: ['Средняя масса ягоды в группе свыше 12 г', 'Вкусовая оценка в группе от 4,5 балла', 'Дружное созревание'],
    source: 'https://www.vir.nw.ru/wp-content/uploads/2018/09/trud177_v2.pdf',
    sourceLabel: 'ВИР · сравнительные опыты в Ленинградской области, 2010–2015', harvestTiming: 'unknown', setting: 'unknown',
    fruiting: 'unknown', fruitingLabel: '—', reviewedAt: '27.09.2026',
    secondarySource: 'https://gossortrf.ru/upload/iblock/00a/clri6obhudueqx6t1f6awcrsp6vm6psk.pdf#page=414',
    secondarySourceLabel: 'Госреестр 2024 · запись 7905050'
  },
  {
    slug: 'kokinskaya-rannyaya', name: 'Кокинская ранняя', latin: 'Fragaria × ananassa · Кокинская ранняя',
    type: '—', period: 'Ранний срок созревания в опыте ВНИИСПК', place: 'Кокино, Брянская область · 2006–2008',
    note: 'Средняя урожайность за 2006–2007 годы составила 10,2 т/га, продуктивность куста — 108,3 г. Степень подмерзания в 2006, 2007 и 2008 годах — 2,0; 0,8 и 3,0 балла.',
    traits: ['Ранний срок созревания', 'Урожайность 10,2 т/га', 'Продуктивность куста 108,3 г', 'Подмерзание: 2,0 / 0,8 / 3,0 балла по годам'],
    source: 'https://vniispk.ru/pages/activities/science-activities/conference-2008/publ-2008-2',
    sourceLabel: 'ВНИИСПК · опыт в Кокино, 2006–2008', harvestTiming: 'early', setting: 'unknown',
    fruiting: 'unknown', fruitingLabel: '—', reviewedAt: '27.09.2026',
    secondarySource: 'https://gossortrf.ru/upload/iblock/00a/clri6obhudueqx6t1f6awcrsp6vm6psk.pdf#page=414',
    secondarySourceLabel: 'Госреестр 2024 · запись 7405006'
  }
].map(variety => ({
  crop: 'Клубника', cropKey: 'strawberry', season: variety.fruiting === 'remontant' ? 'long' : variety.fruiting === 'summer' ? 'summer' : 'unknown',
  light: 'unknown', reviewedAt: '26.09.2026', ...variety
}));
