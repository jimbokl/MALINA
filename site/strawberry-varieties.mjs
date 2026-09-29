// Each characteristic below is limited to what the linked breeder or research centre says.
// Foreign growing conditions are not converted into regional recommendations for Russia.
export const additionalStrawberryVarieties = [
  {
    slug: 'tsaritsa', name: 'Царица', latin: 'Fragaria × ananassa · Царица',
    type: '—', period: 'Средний срок созревания', place: '—',
    note: 'У Царицы крупные плотные ягоды. Они поспевают в середине сезона.',
    traits: ['Средний срок созревания', 'Крупные плотные ягоды'],
    source: 'https://vstisp.org/vstisp/index.php/11-icetheme/sample-news/1442-tsaritsa',
    sourceLabel: 'ФНЦ Садоводства · Царица', harvestTiming: 'middle', setting: 'unknown',
    fruiting: 'unknown', fruitingLabel: '—'
  },
  {
    slug: 'bereginya', name: 'Берегиня', latin: 'Fragaria × ananassa · Берегиня',
    type: '—', period: 'Поздний срок созревания', place: '—',
    note: 'Берегиня пригодится тем, кто хочет продлить клубничный сезон: её плотные кисло-сладкие ягоды созревают поздно.',
    traits: ['Поздний срок созревания', 'Плотные кисло-сладкие ягоды'],
    source: 'https://vstisp.org/vstisp/index.php/component/content/article/11-icetheme/sample-news/1446-bereginya',
    sourceLabel: 'ФНЦ Садоводства · Берегиня', harvestTiming: 'late', setting: 'unknown',
    fruiting: 'unknown', fruitingLabel: '—'
  },
  {
    slug: 'kleri', name: 'Клери', latin: 'Fragaria × ananassa · Clery',
    type: 'Однократное плодоношение', period: 'Ранний срок созревания', place: 'Грядка',
    note: 'Клери даёт ранний урожай красных ягод конической формы. Сбор бывает один раз за сезон.',
    traits: ['Ранний срок созревания', 'Однократное плодоношение', 'Красные конические ягоды'],
    source: 'https://civ.it/en/strawberries/clery/', sourceLabel: 'CIV · Clery',
    harvestTiming: 'early', setting: 'ground', fruiting: 'summer', fruitingLabel: 'Однократное плодоношение'
  },
  {
    slug: 'aprika', name: 'Априка', latin: 'Fragaria × ananassa · Aprica',
    type: 'Однократное плодоношение', period: 'Весенне-летний сбор', place: 'Грядка',
    note: 'У Априки крупные ровные ягоды. Сорт даёт один урожай за сезон.',
    traits: ['Однократное плодоношение', 'Крупные ровные ягоды'],
    source: 'https://civ.it/en/strawberries/apricapbr/', sourceLabel: 'CIV · Aprica',
    harvestTiming: 'unknown', setting: 'ground', fruiting: 'summer', fruitingLabel: 'Однократное плодоношение'
  },
  {
    slug: 'dzholi', name: 'Джоли', latin: 'Fragaria × ananassa · Joly',
    type: 'Однократное плодоношение', period: 'Весенне-летний сбор', place: 'Грядка',
    note: 'У Джоли плотные ягоды с приятным вкусом. Урожай собирают один раз за сезон.',
    traits: ['Однократное плодоношение', 'Плотные ягоды'],
    source: 'https://civ.it/en/strawberries/jolypbr/', sourceLabel: 'CIV · Joly',
    harvestTiming: 'unknown', setting: 'ground', fruiting: 'summer', fruitingLabel: 'Однократное плодоношение'
  },
  {
    slug: 'siriya', name: 'Сирия', latin: 'Fragaria × ananassa · Syria NF137',
    type: '—', period: 'Средний срок созревания', place: '—',
    note: 'Красные плотные ягоды Сирии поспевают в середине сезона.',
    traits: ['Средний срок созревания', 'Плотные красные ягоды'],
    source: 'https://geoplantvivai.com/en/syria-strawberry-plant/', sourceLabel: 'Geoplant Vivai · Syria NF137',
    harvestTiming: 'middle', setting: 'unknown', fruiting: 'unknown', fruitingLabel: '—'
  },
  {
    slug: 'malga', name: 'Мальга', latin: 'Fragaria × ananassa · Malga SG134',
    type: 'Повторное плодоношение', period: 'Длительный период сбора', place: '—',
    note: 'Мальга рано зацветает и даёт ягоды не один раз за сезон.',
    traits: ['Повторное плодоношение', 'Раннее цветение'],
    source: 'https://geoplantvivai.com/en/malga-strawberry-plant/', sourceLabel: 'Geoplant Vivai · Malga SG134',
    harvestTiming: 'repeat', setting: 'unknown', fruiting: 'remontant', fruitingLabel: 'Повторное плодоношение'
  },
  {
    slug: 'aniya', name: 'Ания', latin: 'Fragaria × ananassa · Ania CIVRH612',
    type: 'Повторное плодоношение', period: 'Длительный период сбора', place: '—',
    note: 'Ания даёт ягоды не один раз за сезон. В их аромате чувствуются лесные нотки.',
    traits: ['Повторное плодоношение', 'Аромат лесной земляники'],
    source: 'https://civ.it/en/strawberries/ania-civrh612pbr/', sourceLabel: 'CIV · Ania CIVRH612',
    harvestTiming: 'repeat', setting: 'unknown', fruiting: 'remontant', fruitingLabel: 'Повторное плодоношение'
  },
  {
    slug: 'malvina', name: 'Мальвина', latin: 'Fragaria × ananassa · Мальвина',
    type: '—', period: '—', place: '—',
    note: 'Под Брянском Мальвина после зимы подмерзала. Этот опыт стоит учесть, если у вас бывают суровые зимы.',
    evidenceNote: 'В испытании в Кокино Брянской области в 2013–2017 годах максимальное подмерзание растений Мальвины оценили в 3,0–4,0 балла.',
    traits: ['Зимние повреждения в брянском опыте'],
    source: 'https://vstisp.org/vstisp/images/stories/horticulture/S-and-V-2018-4/32-37-4-2018.pdf',
    sourceLabel: 'ВСТИСП · сортоиспытание в Кокино, 2013–2017',
    harvestTiming: 'unknown', setting: 'unknown', fruiting: 'unknown', fruitingLabel: '—'
  },
  {
    slug: 'albion', name: 'Альбион', latin: 'Fragaria × ananassa · Альбион',
    type: '—', period: '—', place: '—',
    note: 'Под Брянском Альбион после зимы подмерзал сильнее других сортов, с которыми его сравнивали.',
    evidenceNote: 'В испытании в Кокино Брянской области в 2013–2017 годах максимальное подмерзание растений Альбиона оценили в 4,5–5,0 балла.',
    traits: ['Зимние повреждения в брянском опыте'],
    source: 'https://vstisp.org/vstisp/images/stories/horticulture/S-and-V-2018-4/32-37-4-2018.pdf',
    sourceLabel: 'ВСТИСП · сортоиспытание в Кокино, 2013–2017',
    harvestTiming: 'unknown', setting: 'unknown', fruiting: 'unknown', fruitingLabel: '—'
  },
  {
    slug: 'honey', name: 'Хоней', latin: 'Fragaria × ananassa · Хоней',
    type: '—', period: '—', place: '—',
    note: 'Под Брянском Хоней после зимы подмерзал. При выборе сорта для своего участка стоит помнить об этом опыте.',
    evidenceNote: 'В испытании в Кокино Брянской области в 2013–2017 годах максимальное подмерзание растений Хонея оценили в 3,0–4,0 балла.',
    traits: ['Зимние повреждения в брянском опыте'],
    source: 'https://vstisp.org/vstisp/images/stories/horticulture/S-and-V-2018-4/32-37-4-2018.pdf',
    sourceLabel: 'ВСТИСП · сортоиспытание в Кокино, 2013–2017',
    harvestTiming: 'unknown', setting: 'unknown', fruiting: 'unknown', fruitingLabel: '—'
  },
  {
    slug: 'kimberli', name: 'Кимберли', latin: 'Fragaria × ananassa · Вима Кимберли',
    type: '—', period: '—', place: '—',
    note: 'Под Брянском Кимберли после зимы подмерзала. Этот опыт стоит учитывать в местах с холодными зимами.',
    evidenceNote: 'В испытании в Кокино Брянской области в 2013–2017 годах максимальное подмерзание растений Кимберли оценили в 3,0–4,0 балла.',
    traits: ['Зимние повреждения в брянском опыте'],
    source: 'https://vstisp.org/vstisp/images/stories/horticulture/S-and-V-2018-4/32-37-4-2018.pdf',
    sourceLabel: 'ВСТИСП · сортоиспытание в Кокино, 2013–2017',
    harvestTiming: 'unknown', setting: 'unknown', fruiting: 'unknown', fruitingLabel: '—'
  },
  {
    slug: 'cabrillo', name: 'Кабрилло', latin: 'Fragaria × ananassa · Cabrillo',
    type: 'Нейтрального светового дня', period: 'Повторное плодоношение', place: '—',
    note: 'Кабрилло плодоносит при разной длине дня. Ягоды у него бывают крупными.',
    evidenceNote: 'В сравнительном опыте в Калифорнии в 2012–2013 годах средний размер ягоды Кабрилло составил 32 г.',
    traits: ['Нейтральный световой день'],
    source: 'https://research.ucdavis.edu/industry-support/plant-variety-licensing-program/strawberry-licensing-program/',
    sourceLabel: 'UC Davis · Cabrillo', harvestTiming: 'unknown', setting: 'unknown',
    fruiting: 'unknown', fruitingLabel: 'Нейтральный световой день', reviewedAt: '27.09.2026'
  },
  {
    slug: 'brilla', name: 'Брилла', latin: 'Fragaria × ananassa · Brilla',
    type: 'Однократное плодоношение', period: 'Ранний срок созревания', place: '—',
    note: 'Брилла даёт ранний урожай крупных красно-оранжевых ягод. По форме они слегка вытянуты.',
    traits: ['Раннее созревание', 'Плотная мякоть и умеренно сладкий вкус'],
    source: 'https://www.coviro.it/brilla/', sourceLabel: 'COVIRO · Brilla',
    harvestTiming: 'early', setting: 'unknown', fruiting: 'summer', fruitingLabel: 'Однократное плодоношение', reviewedAt: '27.09.2026'
  },
  {
    slug: 'magnus', name: 'Магнус', latin: 'Fragaria × ananassa · Magnus',
    type: 'Однократное плодоношение', period: 'Поздний срок созревания', place: '—',
    note: 'Магнус поспевает поздно. У него крупные ярко-красные ягоды конической формы.',
    evidenceNote: 'В сравнении оригинатора сбор Магнуса начинался на 10 дней позже сорта Faith.',
    traits: ['Поздний срок в сравнении оригинатора', 'Крупные ярко-красные конические ягоды'],
    source: 'https://flevoberry.nl/variety/magnus/', sourceLabel: 'Flevo Berry · Magnus',
    harvestTiming: 'late', setting: 'unknown', fruiting: 'summer', fruitingLabel: 'Однократное плодоношение', reviewedAt: '27.09.2026'
  },
  {
    slug: 'rumba', name: 'Румба', latin: 'Fragaria × ananassa · Rumba',
    type: 'Однократное плодоношение', period: 'Ранний срок созревания', place: '—',
    note: 'Румба даёт ранний урожай ровных, блестящих ярко-красных ягод.',
    evidenceNote: 'В сравнении оригинатора сбор Румбы начинался на 5–6 дней раньше сорта Соната.',
    traits: ['Ранний срок созревания', 'Выращивание в открытом грунте и туннелях'],
    source: 'https://www.fresh-forward.nl/en/breed/rumba', sourceLabel: 'Fresh Forward · Rumba',
    harvestTiming: 'early', setting: 'unknown', fruiting: 'summer', fruitingLabel: 'Однократное плодоношение', reviewedAt: '27.09.2026',
    secondarySource: 'https://www.fresh-forward.nl/en/download/77/rumba-uknew', secondarySourceLabel: 'Fresh Forward · сортовой лист Rumba'
  },
  {
    slug: 'elsanta', name: 'Эльсанта', latin: 'Fragaria × ananassa · Эльсанта',
    type: 'Однократное плодоношение', period: 'Среднеранний срок созревания', place: '—',
    note: 'Эльсанта даёт красные ягоды в начале летнего сезона. Урожай у неё один раз за сезон.',
    evidenceNote: 'В сортовой записи средняя масса ягоды указана как 13,1 г, урожайность — 54,7–73,4 ц/га. Сорт внесён в реестр для Волго-Вятского, Северо-Кавказского и Западно-Сибирского регионов.',
    traits: ['Среднеранний срок созревания', 'Один урожай за сезон', 'Красные ягоды'],
    source: 'https://gossortrf.ru/registry/gosudarstvennyy-reestr-selektsionnykh-dostizheniy-dopushchennykh-k-ispolzovaniyu-tom-1-sorta-rasteni/elsanta-zemlyanika-9610367/',
    sourceLabel: 'Госсорткомиссия · Эльсанта, запись 9610367',
    harvestTiming: 'unknown', setting: 'unknown', fruiting: 'summer', fruitingLabel: 'Однократное плодоношение', reviewedAt: '27.09.2026'
  },
  {
    slug: 'borovitskaya', name: 'Боровицкая', latin: 'Fragaria × ananassa · Боровицкая',
    type: '—', period: 'Среднепоздний срок созревания', place: '—',
    note: 'Боровицкая поспевает ближе к концу клубничного сезона. У неё блестящие оранжево-красные ягоды с кисло-сладким вкусом.',
    evidenceNote: 'В сортовом описании средняя масса ягоды — 15–16 г, первых ягод — до 20 г; вкус оценён в 3,8–4,0 балла, средняя урожайность — 11,7 т/га. Зимостойкость и засухоустойчивость названы средними.',
    traits: ['Среднепоздний срок', 'Оранжево-красные ягоды', 'Кисло-сладкий вкус'],
    source: 'https://vstisp.org/vstisp/index.php/11-icetheme/sample-news/1447-borovitskaya',
    sourceLabel: 'ФНЦ Садоводства · Боровицкая', harvestTiming: 'unknown', setting: 'unknown',
    fruiting: 'unknown', fruitingLabel: '—', reviewedAt: '27.09.2026'
  },
  {
    slug: 'nashe-podmoskove', name: 'Наше Подмосковье', latin: 'Fragaria × ananassa · Наше Подмосковье',
    type: '—', period: 'Средний срок созревания', place: '—',
    note: 'У Нашего Подмосковья плотные блестящие ягоды с тёмно-красной мякотью и кисло-сладким вкусом. Сорт хорошо переносит зимние холода.',
    evidenceNote: 'В сортовом описании средняя масса ягоды — 7–8 г, отдельных ягод — до 30 г; продуктивность — 700–800 г с куста, урожайность — 15–20 т/га. Там же отмечены высокая зимостойкость и засухоустойчивость, устойчивость к грибным заболеваниям листьев и земляничному клещу.',
    traits: ['Средний срок созревания', 'Плотные тёмно-красные ягоды', 'Кисло-сладкий вкус'],
    source: 'https://vstisp.org/vstisp/index.php/component/content/article/11-icetheme/sample-news/1441-nashe-podmoskove',
    sourceLabel: 'ФНЦ Садоводства · Наше Подмосковье', harvestTiming: 'middle', setting: 'unknown',
    fruiting: 'unknown', fruitingLabel: '—', reviewedAt: '27.09.2026'
  },
  {
    slug: 'darenka', name: 'Дарёнка', latin: 'Fragaria × ananassa · Дарёнка',
    type: '—', period: 'Ранний срок созревания', place: '—',
    note: 'Дарёнка созревает рано. На кустах образуется много цветоносов и ягод.',
    evidenceNote: 'В опыте в Оренбургской области в 2020–2021 годах средняя масса ягоды Дарёнки — 12,0 г, урожайность — 10,3 т/га. На куст приходилось в среднем 5,7 цветоноса и 23,8 плода; поражение белой пятнистостью оценили в 0 баллов.',
    traits: ['Раннее созревание в оренбургском опыте'],
    source: 'https://vstisp.org/vstisp/images/Salimova.pdf', sourceLabel: 'ФНЦ Садоводства · опыт в Оренбургской области, 2020–2021',
    harvestTiming: 'early', setting: 'unknown', fruiting: 'unknown', fruitingLabel: '—', reviewedAt: '27.09.2026',
    secondarySource: 'https://gossortrf.ru/upload/iblock/00a/clri6obhudueqx6t1f6awcrsp6vm6psk.pdf#page=414',
    secondarySourceLabel: 'Госреестр 2024 · запись 9705077'
  },
  {
    slug: 'zenga-zengana', name: 'Зенга Зенгана', latin: 'Fragaria × ananassa · Зенга Зенгана',
    type: '—', period: 'Средние и поздние сроки созревания в опыте', place: '—',
    note: 'Зенга Зенгана образует много цветоносов и ягод. Под Оренбургом кусты после зимы подмерзали.',
    evidenceNote: 'В опыте в Оренбургской области в 2020–2021 годах средняя масса ягоды Зенги Зенганы — 8,2 г, урожайность — 7,7 т/га. На куст приходилось в среднем 6,5 цветоноса и 25,8 плода; подмерзание оценили в 1,8 балла, поражение белой пятнистостью — в 0,3 балла.',
    traits: ['Данные о плодоношении в оренбургском опыте'],
    source: 'https://vstisp.org/vstisp/images/Salimova.pdf', sourceLabel: 'ФНЦ Садоводства · опыт в Оренбургской области, 2020–2021',
    harvestTiming: 'unknown', setting: 'unknown', fruiting: 'unknown', fruitingLabel: '—', reviewedAt: '27.09.2026',
    secondarySource: 'https://gossortrf.ru/upload/iblock/00a/clri6obhudueqx6t1f6awcrsp6vm6psk.pdf#page=414',
    secondarySourceLabel: 'Госреестр 2024 · запись 6950361'
  },
  {
    slug: 'desnyanka-kokinskaya', name: 'Деснянка Кокинская', latin: 'Fragaria × ananassa · Деснянка Кокинская',
    type: '—', period: 'Средние и поздние сроки созревания в опыте', place: '—',
    note: 'Под Оренбургом первые ягоды Деснянки Кокинской были крупнее последующих. Зимовка кустов зависела от условий года.',
    evidenceNote: 'В опыте в Оренбургской области в 2020–2021 годах средняя масса ягоды — 10,3 г, первых ягод — 12,8 г; урожайность — 9,4 т/га. Подмерзание оценили в 1,3 балла, бурую пятнистость — в 0,3 балла. На куст приходилось в среднем 4,3 цветоноса и 22,0 плода.',
    traits: ['Первые ягоды крупнее последующих в оренбургском опыте'],
    source: 'https://vstisp.org/vstisp/images/Salimova.pdf', sourceLabel: 'ФНЦ Садоводства · опыт в Оренбургской области, 2020–2021',
    harvestTiming: 'unknown', setting: 'unknown', fruiting: 'unknown', fruitingLabel: '—', reviewedAt: '27.09.2026',
    secondarySource: 'https://gossortrf.ru/upload/iblock/00a/clri6obhudueqx6t1f6awcrsp6vm6psk.pdf#page=414',
    secondarySourceLabel: 'Госреестр 2024 · запись 7404999'
  },
  {
    slug: 'vityaz', name: 'Витязь', latin: 'Fragaria × ananassa · Витязь',
    type: '—', period: 'Средний срок созревания', place: '—',
    note: 'Витязь созревает в середине клубничного сезона. Под Брянском его кусты давали много ягод.',
    evidenceNote: 'В опыте в Кокино Брянской области в 2006–2007 годах урожайность Витязя составила 22,5 т/га, продуктивность куста — 380,5 г.',
    traits: ['Средний срок созревания'],
    source: 'https://vniispk.ru/pages/activities/science-activities/conference-2008/publ-2008-2',
    sourceLabel: 'ВНИИСПК · сортоиспытание в Кокино, 2006–2007', harvestTiming: 'middle', setting: 'unknown',
    fruiting: 'unknown', fruitingLabel: '—', reviewedAt: '27.09.2026',
    secondarySource: 'https://gossortrf.ru/upload/iblock/00a/clri6obhudueqx6t1f6awcrsp6vm6psk.pdf#page=413',
    secondarySourceLabel: 'Госреестр 2024 · запись 9800425'
  },
  {
    slug: 'slavutich', name: 'Славутич', latin: 'Fragaria × ananassa · Славутич',
    type: '—', period: 'Средний срок созревания', place: '—',
    note: 'Ягоды Славутича поспевают в середине сезона. Мы бы сочетали его с ранними и поздними сортами, чтобы собирать клубнику дольше.',
    evidenceNote: 'В опыте в Кокино Брянской области в 2006–2007 годах урожайность Славутича составила 15,7 т/га, продуктивность куста — 310,3 г.',
    traits: ['Средний срок созревания'],
    source: 'https://vniispk.ru/pages/activities/science-activities/conference-2008/publ-2008-2',
    sourceLabel: 'ВНИИСПК · сортоиспытание в Кокино, 2006–2007', harvestTiming: 'middle', setting: 'unknown',
    fruiting: 'unknown', fruitingLabel: '—', reviewedAt: '27.09.2026',
    secondarySource: 'https://gossortrf.ru/upload/iblock/00a/clri6obhudueqx6t1f6awcrsp6vm6psk.pdf#page=414',
    secondarySourceLabel: 'Госреестр 2024 · запись 9908142'
  },
  {
    slug: 'rusich', name: 'Русич', latin: 'Fragaria × ananassa · Русич',
    type: '—', period: 'Поздний срок созревания', place: '—',
    note: 'Русич поспевает поздно: его можно рассмотреть, если хочется ягод ближе к концу сезона.',
    evidenceNote: 'В опыте в Кокино Брянской области в 2006–2007 годах урожайность Русича составила 21,6 т/га, продуктивность куста — 349,5 г.',
    traits: ['Поздний срок созревания'],
    source: 'https://vniispk.ru/pages/activities/science-activities/conference-2008/publ-2008-2',
    sourceLabel: 'ВНИИСПК · сортоиспытание в Кокино, 2006–2007', harvestTiming: 'late', setting: 'unknown',
    fruiting: 'unknown', fruitingLabel: '—', reviewedAt: '27.09.2026',
    secondarySource: 'https://gossortrf.ru/upload/iblock/00a/clri6obhudueqx6t1f6awcrsp6vm6psk.pdf#page=414',
    secondarySourceLabel: 'Госреестр 2024 · запись 9907662'
  },
  {
    slug: 'alfa', name: 'Альфа', latin: 'Fragaria × ananassa · Альфа',
    type: '—', period: 'Поздний срок созревания', place: '—',
    note: 'Альфа поспевает поздно. Если собрать сорта разного срока созревания, с ней можно продлить клубничный сезон.',
    evidenceNote: 'В опыте в Кокино Брянской области в 2006–2007 годах урожайность Альфы составила 21,1 т/га, продуктивность куста — 612,7 г.',
    traits: ['Поздний срок созревания'],
    source: 'https://vniispk.ru/pages/activities/science-activities/conference-2008/publ-2008-2',
    sourceLabel: 'ВНИИСПК · сортоиспытание в Кокино, 2006–2007', harvestTiming: 'late', setting: 'unknown',
    fruiting: 'unknown', fruitingLabel: '—', reviewedAt: '27.09.2026',
    secondarySource: 'https://gossortrf.ru/upload/iblock/00a/clri6obhudueqx6t1f6awcrsp6vm6psk.pdf#page=412',
    secondarySourceLabel: 'Госреестр 2024 · запись 9908141'
  },
  {
    slug: 'solovushka', name: 'Соловушка', latin: 'Fragaria × ananassa · Соловушка',
    type: '—', period: 'Средний срок созревания', place: '—',
    note: 'Соловушка созревает в середине сезона. Под Брянском её кусты давали много ягод.',
    evidenceNote: 'В опыте в Кокино Брянской области в 2006–2007 годах урожайность Соловушки составила 29,7 т/га, продуктивность куста — 579,3 г.',
    traits: ['Средний срок созревания'],
    source: 'https://vniispk.ru/pages/activities/science-activities/conference-2008/publ-2008-2',
    sourceLabel: 'ВНИИСПК · сортоиспытание в Кокино, 2006–2007', harvestTiming: 'middle', setting: 'unknown',
    fruiting: 'unknown', fruitingLabel: '—', reviewedAt: '27.09.2026'
  },
  {
    slug: 'divnaya', name: 'Дивная', latin: 'Fragaria × ananassa · Дивная',
    type: '—', period: 'Средний срок созревания', place: '—',
    note: 'Дивная созревает в середине сезона. Вкус ягод — одна из её сильных сторон.',
    evidenceNote: 'В опытах в Ленинградской области в 2010–2015 годах урожайность Дивной составила 13 т/га, средняя масса ягоды — 12,5 г, оценка вкуса — 4,6 балла.',
    traits: ['Средний срок созревания', 'Хорошая оценка вкуса в опыте'],
    source: 'https://www.vir.nw.ru/wp-content/uploads/2018/09/trud177_v2.pdf',
    sourceLabel: 'ВИР · сравнительные опыты в Ленинградской области, 2010–2015', harvestTiming: 'middle', setting: 'unknown',
    fruiting: 'unknown', fruitingLabel: '—', reviewedAt: '27.09.2026',
    secondarySource: 'https://gossortrf.ru/upload/iblock/00a/clri6obhudueqx6t1f6awcrsp6vm6psk.pdf#page=414',
    secondarySourceLabel: 'Госреестр 2024 · запись 9204342'
  },
  {
    slug: 'tsarskoselskaya', name: 'Царскосельская', latin: 'Fragaria × ananassa · Царскосельская',
    type: '—', period: 'Среднепоздний срок созревания', place: '—',
    note: 'Царскосельская поспевает ближе к концу клубничного сезона. Её можно сочетать с ранними сортами, чтобы продлить сбор.',
    evidenceNote: 'В опытах в Ленинградской области в 2010–2015 годах урожайность Царскосельской составила 15,5 т/га, средняя масса ягоды — 11 г.',
    traits: ['Среднепоздний срок созревания'],
    source: 'https://www.vir.nw.ru/wp-content/uploads/2018/09/trud177_v2.pdf',
    sourceLabel: 'ВИР · сравнительные опыты в Ленинградской области, 2010–2015', harvestTiming: 'unknown', setting: 'unknown',
    fruiting: 'unknown', fruitingLabel: '—', reviewedAt: '27.09.2026',
    secondarySource: 'https://gossortrf.ru/upload/iblock/00a/clri6obhudueqx6t1f6awcrsp6vm6psk.pdf#page=415',
    secondarySourceLabel: 'Госреестр 2024 · запись 9204369'
  },
  {
    slug: 'sudarushka', name: 'Сударушка', latin: 'Fragaria × ananassa · Сударушка',
    type: '—', period: 'Средний срок созревания', place: '—',
    note: 'Сударушка созревает в середине сезона. В Ленинградской области часть рожков подмерзала зимой.',
    evidenceNote: 'В опытах в Ленинградской области в 2010–2015 годах урожайность Сударушки составила 9 т/га, средняя масса ягоды — 9,4 г; после зимовки вымерзло около 15% рожков, зимнее повреждение оценили в 2 балла.',
    traits: ['Средний срок созревания', 'Зимние повреждения в опыте'],
    source: 'https://www.vir.nw.ru/wp-content/uploads/2018/09/trud177_v2.pdf',
    sourceLabel: 'ВИР · сравнительные опыты в Ленинградской области, 2010–2015', harvestTiming: 'middle', setting: 'unknown',
    fruiting: 'unknown', fruitingLabel: '—', reviewedAt: '27.09.2026',
    secondarySource: 'https://gossortrf.ru/upload/iblock/00a/clri6obhudueqx6t1f6awcrsp6vm6psk.pdf#page=415',
    secondarySourceLabel: 'Госреестр 2024 · запись 9204350'
  },
  {
    slug: 'zenit', name: 'Зенит', latin: 'Fragaria × ananassa · Зенит',
    type: '—', period: '—', place: '—',
    note: 'У Зенита крупные ягоды, которые созревают дружно. Вкус — ещё одна сильная сторона сорта.',
    evidenceNote: 'В опытах в Ленинградской области в 2010–2015 годах средняя масса ягоды Зенита в группе была выше 12 г; вкус оценили не ниже 4,5 балла.',
    traits: ['Крупные ягоды в опыте', 'Дружное созревание'],
    source: 'https://www.vir.nw.ru/wp-content/uploads/2018/09/trud177_v2.pdf',
    sourceLabel: 'ВИР · сравнительные опыты в Ленинградской области, 2010–2015', harvestTiming: 'unknown', setting: 'unknown',
    fruiting: 'unknown', fruitingLabel: '—', reviewedAt: '27.09.2026',
    secondarySource: 'https://gossortrf.ru/upload/iblock/00a/clri6obhudueqx6t1f6awcrsp6vm6psk.pdf#page=414',
    secondarySourceLabel: 'Госреестр 2024 · запись 7905050'
  },
  {
    slug: 'kokinskaya-rannyaya', name: 'Кокинская ранняя', latin: 'Fragaria × ananassa · Кокинская ранняя',
    type: '—', period: 'Ранний срок созревания', place: '—',
    note: 'Кокинская ранняя поспевает одной из первых. Под Брянском кусты переживали зимы по-разному.',
    evidenceNote: 'В опыте в Брянской области урожайность за 2006–2007 годы составила 10,2 т/га, продуктивность куста — 108,3 г. Подмерзание в 2006, 2007 и 2008 годах оценили соответственно в 2,0; 0,8 и 3,0 балла.',
    traits: ['Ранний срок созревания', 'Зимние повреждения различались по годам'],
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
