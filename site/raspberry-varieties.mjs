// A source-backed expansion of the raspberry atlas. Source descriptions are
// classification evidence, never regional recommendations or stock promises.
const sources = {
  fncBreeding: {
    url: 'https://vstisp.org/vstisp/index.php/nauchnaya-deyatelnost/genetika-i-selektsiya',
    label: 'ФНЦ Садоводства · генетика и селекция',
    context: 'ФНЦ Садоводства относит сорт к ремонтантной малине.'
  },
  fncAtlant: {
    url: 'https://vstisp.org/vstisp/index.php/11-icetheme/sample-news/1450-atlant',
    label: 'ФНЦ Садоводства · Атлант',
    context: 'В описании ФНЦ сорт назван ремонтантным, ягоды — ярко-красными.'
  },
  vniispkRemontant: {
    url: 'https://vniispk.ru/pages/activities/science-activities/conference-2008/publ-2008-13',
    label: 'ВНИИСПК · исследование ремонтантной малины',
    context: 'Исследование И. В. Казакова и С. Н. Евдокименко описывает окраску и ремонтантное плодоношение сорта.'
  },
  fncYellow: {
    url: 'https://vstisp.org/vstisp/index.php/2-icetheme/sample-news/uncategorized/1542-ivan-kupala-i-salyut-dva-novykh-konkurentosposobnykh-sorta-maliny',
    label: 'ФНЦ Садоводства · желтоплодные сорта',
    context: 'ФНЦ Садоводства называет сорт желтоплодным.'
  },
  fncNursery: {
    url: 'https://vstisp.org/vstisp/index.php/component/content/article/11-icetheme/sample-news/1460-oks-vesna-2022',
    label: 'ФНЦ Садоводства · каталог питомника 2022',
    context: 'Каталог питомника ФНЦ Садоводства указывает окраску ягод и отдельные признаки сорта.'
  },
  fncNursery2026: {
    url: 'https://vstisp.org/vstisp/images/malina_2026.pdf',
    label: 'ФНЦ Садоводства · каталог малины 2026',
    context: 'Питомник ФНЦ разделяет обычную и ремонтантную малину; сорта приведены по группам.'
  },
  fncSeminar: {
    url: 'https://vstisp.org/vstisp/index.php/2-uncategorized/492-seminar-lektorij-po-maline',
    label: 'ФНЦ Садоводства · семинар по сортам',
    context: 'На семинаре ФНЦ сорт назван по имени; у Жёлтого гиганта указана окраска ягод.'
  },
  yellowAntwerp: {
    url: 'https://www.chrisbowers.co.uk/product/yellow-antwerp-raspberry-canes/',
    label: 'Питомник Chris Bowers · Yellow Antwerp',
    context: 'Питомник описывает жёлтые ягоды и летнее плодоношение.'
  },
  allGold: {
    url: 'https://www.provendernurseries.co.uk/product/raspberry-all-gold-b1',
    label: 'Питомник Provender · All Gold',
    context: 'Питомник описывает жёлтые ягоды и осеннее плодоношение.'
  },
  umn: {
    url: 'https://extension.umn.edu/agriculture/specialty-crops/commercial-fruit-production/raspberry-farming/raspberry-types-and-varieties',
    label: 'University of Minnesota Extension · сорта малины',
    context: 'Университет Миннесоты указывает окраску ягод и группу плодоношения; характеристики приведены для сравнения.'
  },
  spbgauRemontant: {
    url: 'https://spbgau.ru/upload/iblock/adf/worxb9mmx2b0mkfa8t4nq9g31fjfr95i.pdf',
    label: 'СПбГАУ · подбор сортов ремонтантной малины для Ленинградской области',
    context: 'Сортоописание опубликовано в исследовании СПбГАУ; коллекционные посадки изучались в Ленинградской области.'
  },
  samaraCollection2026: {
    url: 'https://ssaa.ru/structur/riz/sbornik_selek_i_sort_2026.pdf',
    label: 'Самарский ГАУ · коллекция сортов малины, 2026',
    context: 'Масса ягод приведена в исследовании коллекции в Самарской области; таблица содержит показатели за 2025 год.'
  },
  tarusaDescription: {
    url: 'https://www.opitomnik.ru/files/novie-sorta-malini.pdf',
    label: 'Опытно-селекционный питомник · описание Тарусы',
    context: 'В описании питомника Таруса указана как летний красноплодный сорт штамбового типа.'
  },
  tarusaWinterStudy: {
    url: 'https://vniispk.ru/pages/activities/science-activities/conference-2007/publ-2007-56',
    label: 'ВНИИСПК · исследование зимостойкости Тарусы',
    context: 'В исследовании 2005–2006 годов побеги Тарусы отнесены к достаточно морозоустойчивым в условиях Центрального региона.'
  },
  tarusaIdentity: {
    url: 'https://old.journal-vniispk.ru/pdf/2019/4/46.pdf',
    label: 'ВНИИСПК · российские сорта и штамбовые формы малины',
    context: 'В публикации Таруса названа крупноплодным сортом штамбового типа с пряморослыми, твёрдыми и жёсткими побегами.'
  },
  lyachkaDescription: {
    url: 'https://www.vhoz.ru/articles/sad/malina-lyachka-opisanie-sorta-vyrashchivanie-i-ukhod/',
    label: 'Ваше хозяйство · описание малины Лячка',
    context: 'Сортовое описание относит Лячку к ранней летней малине с ярко-красными ягодами.'
  },
  lyachkaIdentity: {
    url: 'https://vniispk.ru/docs/unu/12_raspberry.pdf',
    label: 'ВНИИСПК · каталог коллекции малины',
    context: 'В каталоге ВНИИСПК образец М-31 «Лячка» указан как Rubus idaeus L.; место происхождения — Польша.'
  },
  maroseykaDescription: {
    url: 'https://www.opitomnik.ru/files/novie-sorta-malini.pdf',
    label: 'Опытно-селекционный питомник · описание Маросейки',
    context: 'В сортовом описании Маросейка указана как среднеранний летний сорт со светло-красными ягодами.'
  },
  maroseykaIdentity: {
    url: 'https://vniispk.ru/docs/unu/12_raspberry.pdf',
    label: 'ВНИИСПК · каталог коллекции малины',
    context: 'В каталоге ВНИИСПК образец М-17 «Маросейка» указан как Rubus idaeus L.; происхождение — Россия, ВСТИСП.'
  },
  brilliantovaya: {
    url: 'https://vniispk.ru/pages/activities/science-activities/conference-2008/publ-2008-13',
    label: 'ВНИИСПК · исследование ремонтантной малины',
    context: 'В исследовании И. В. Казакова и С. Н. Евдокименко приведены результаты сортоиспытания в Брянской области.'
  },
  gossortPohvalinka: {
    url: 'https://gossortrf.ru/registry/gosudarstvennyy-reestr-selektsionnykh-dostizheniy-dopushchennykh-k-ispolzovaniyu-tom-1-sorta-rasteni/pokhvalinka-malina-8456207/',
    label: 'Госсорткомиссия · Похвалинка',
    context: 'Карточка сорта и Государственный реестр подтверждают официальную запись Похвалинки.'
  },
  remontantTrial2024: {
    url: 'https://journals.rcsi.science/2500-2082/article/view/258955',
    label: 'Евдокименко, Подгаецкий · сортоиспытание ремонтантной малины, 2020–2023',
    context: 'Опыт проведён на коллекционном участке Кокинской станции ФНЦ Садоводства в Брянской области.'
  },
  gossortArisha: {
    url: 'https://gossortrf.ru/registry/gosudarstvennyy-reestr-selektsionnykh-dostizheniy-dopushchennykh-k-ispolzovaniyu-tom-1-sorta-rasteni/arisha-malina-7954570/',
    label: 'Госсорткомиссия · Ариша, запись 7954570',
    context: 'Сортовая запись Госсорткомиссии указывает признаки и регион допуска сорта Ариша.'
  }
};

// slug, Russian name, berry color, fruiting group, source, distinguishing fact
// Unknown is deliberate: neither names nor a generic group list prove a color.
const rows = [
  ['zhuravlik', 'Журавлик', 'red', 'remontant', 'fncNursery', 'Красные ягоды Журавлика созревают на побегах, выросших в этом году. Это ремонтантная малина.'],
  ['beglyanka', 'Беглянка', 'yellow', 'unknown', 'fncNursery', 'Беглянку легко заметить по жёлтым ягодам.'],
  ['meteor', 'Метеор', 'red', 'summer', 'fncNursery', 'Метеор даёт красные ягоды летом.'],
  ['solnyshko', 'Солнышко', 'red', 'summer', 'fncNursery', 'Солнышко — летняя малина с ягодами малинового цвета.'],
  ['peresvet', 'Пересвет', 'red', 'summer', 'fncNursery', 'Пересвет даёт ягоды малинового цвета в летний сезон.'],
  ['poklon-kazakovu', 'Поклон Казакову', 'unknown', 'remontant', 'fncNursery2026', 'Поклон Казакову даёт урожай на побегах, выросших в этом году: это ремонтантная малина.'],
  ['podarok-kashinu', 'Подарок Кашину', 'unknown', 'remontant', 'fncNursery2026', 'У Подарка Кашину ягоды появляются на побегах текущего года.'],
  ['medvezhonok', 'Медвежонок', 'unknown', 'remontant', 'remontantTrial2024', 'Медвежонок — ремонтантная малина. В Брянской области у него получали ягоды средней массой около 5 г.'],
  ['skromnitsa', 'Скромница', 'unknown', 'summer', 'fncNursery2026', 'У Скромницы основной урожай поспевает на прошлогодних побегах. Это летняя малина.'],
  ['krasa-rossii', 'Краса России', 'unknown', 'summer', 'fncNursery2026', 'Краса России даёт один основной летний урожай.'],
  ['balzam', 'Бальзам', 'unknown', 'unknown', 'fncSeminar', 'Бальзам — сорт малины кокинской селекции.'],
  ['zheltyy-gigant', 'Жёлтый гигант', 'yellow', 'unknown', 'fncSeminar', 'У Жёлтого гиганта ягоды жёлтого цвета.'],
  ['atlant', 'Атлант', 'red', 'remontant', 'fncAtlant', 'Атлант даёт ярко-красные ягоды на побегах текущего года.'],
  ['abrikosovaya', 'Абрикосовая', 'yellow', 'remontant', 'vniispkRemontant', 'Абрикосовую узнают по золотисто-абрикосовым ягодам. Она плодоносит на побегах текущего года.'],
  ['bryanskoe-divo', 'Брянское диво', 'unknown', 'remontant', 'fncBreeding', 'Брянское диво — ремонтантная малина: урожай появляется на побегах этого года.'],
  ['gerakl', 'Геракл', 'red', 'remontant', 'vniispkRemontant', 'У Геракла рубиновые ягоды; урожай он даёт на побегах текущего года.'],
  ['evraziya', 'Евразия', 'unknown', 'remontant', 'fncBreeding', 'Евразия даёт урожай на побегах этого года.'],
  ['zhar-ptitsa', 'Жар-птица', 'unknown', 'remontant', 'fncBreeding', 'Жар-птица — ремонтантная малина с урожаем на побегах текущего года.'],
  ['oranzhevoe-chudo', 'Оранжевое чудо', 'yellow', 'remontant', 'fncBreeding', 'Оранжевое чудо — ремонтантная малина с жёлтыми ягодами.'],
  ['pingvin', 'Пингвин', 'unknown', 'remontant', 'fncBreeding', 'Пингвин даёт урожай на побегах, выросших в этом году.'],
  ['rubinovoe-ozherele', 'Рубиновое ожерелье', 'unknown', 'remontant', 'fncBreeding', 'Рубиновое ожерелье плодоносит на побегах текущего года.'],
  ['zolotaya-osen', 'Золотая осень', 'yellow', 'unknown', 'fncYellow', 'Золотая осень порадует жёлтыми ягодами.'],
  ['zolotye-kupola', 'Золотые купола', 'yellow', 'unknown', 'fncYellow', 'У Золотых куполов жёлтые ягоды.'],
  ['yellow-antwerp', 'Йеллоу Антверп', 'yellow', 'summer', 'yellowAntwerp', 'Йеллоу Антверп — летняя малина с жёлтыми ягодами.'],
  ['all-gold', 'Олл Голд', 'yellow', 'remontant', 'allGold', 'Олл Голд даёт жёлтые ягоды на побегах текущего года.'],
  ['polana', 'Полана', 'red', 'remontant', 'umn', 'Полана даёт красные ягоды на побегах этого года.'],
  ['caroline', 'Кэролайн', 'red', 'remontant', 'umn', 'Кэролайн — ремонтантная малина с красными ягодами.'],
  ['heritage', 'Херитейдж', 'red', 'remontant', 'umn', 'Херитейдж плодоносит красными ягодами на побегах текущего года.'],
  ['anne', 'Энн', 'yellow', 'remontant', 'umn', 'Энн даёт золотистые ягоды на побегах этого года.'],
  ['double-gold', 'Дабл Голд', 'yellow', 'remontant', 'umn', 'У Дабл Голд золотистые ягоды; сорт ремонтантный.'],
  ['prelude', 'Прелюд', 'red', 'summer', 'umn', 'Прелюд — летняя малина с красными ягодами.'],
  ['nova', 'Нова', 'red', 'summer', 'umn', 'Нова даёт красные ягоды летом.'],
  ['encore', 'Энкор', 'red', 'summer', 'umn', 'Энкор плодоносит красными ягодами летом.'],
  ['pshehiba', 'Пшехиба', 'unknown', 'unknown', 'samaraCollection2026', 'У Пшехибы бывают крупные ягоды. В самарском опыте они заметно различались по размеру.'],
  ['karamelka', 'Карамелька', 'unknown', 'remontant', 'spbgauRemontant', 'Карамелька — ремонтантная малина среднераннего срока. На кустах встречаются и особенно крупные ягоды.'],
  ['samohval', 'Самохвал', 'unknown', 'remontant', 'spbgauRemontant', 'Самохвал плодоносит поздно. Ягоды у него могут вырасти крупными.'],
  ['patritsiya', 'Патриция', 'unknown', 'unknown', 'samaraCollection2026', 'Ягоды Патриции бывают разного размера. В самарском опыте среди них встречались и крупные.'],
  ['tarusa', 'Таруса', 'red', 'summer', 'tarusaDescription', 'Тарусу легко узнать по прямым крепким побегам. Ягоды у неё ярко-красные, а урожай летний.'],
  ['lyachka', 'Лячка', 'red', 'summer', 'lyachkaDescription', 'Лячка рано даёт ярко-красные ягоды. Это летняя малина с одним основным урожаем.'],
  ['maroseyka', 'Маросейка', 'red', 'summer', 'maroseykaDescription', 'Маросейка — летняя малина со светло-красными ягодами. Среди них встречаются и очень крупные.'],
  ['brilliantovaya', 'Бриллиантовая', 'red', 'remontant', 'brilliantovaya', 'Бриллиантовая начинает отдавать ягоды во второй половине лета. В брянском опыте большая часть урожая поспевала до осенних заморозков.'],
  ['pohvalinka', 'Похвалинка', 'red', 'remontant', 'gossortPohvalinka', 'Похвалинка — ремонтантная малина среднего срока с красными ягодами. Некоторые вырастают особенно крупными.'],
  ['salyut', 'Салют', 'red', 'remontant', 'remontantTrial2024', 'Салют в брянском опыте начинал созревать уже во второй половине июля.'],
  ['yubileinaya-kulikova', 'Юбилейная Куликова', 'red', 'remontant', 'remontantTrial2024', 'У Юбилейной Куликовой в брянском опыте сбор продолжался до середины сентября.'],
  ['arisha', 'Ариша', 'red', 'remontant', 'gossortArisha', 'Ариша — ремонтантная малина среднего срока с красными ягодами. Её вкус получил высокую оценку.']
];

const evidenceBySlug = {
  medvezhonok: 'В опыте Кокинской станции в Брянской области в 2020–2023 годах средняя масса ягоды составила 4,9 г.',
  pshehiba: 'В коллекционном опыте в Самарской области в 2025 году средняя масса ягоды составила 3,99 г, максимальная — 5,6 г.',
  karamelka: 'В исследовании СПбГАУ средняя масса ягоды составила 3,8 г, максимальная — 8,0 г; сорт отнесён к среднеранним ремонтантным.',
  samohval: 'В исследовании СПбГАУ средняя масса ягоды составила 5,9 г, максимальная — 9,1 г; сорт отнесён к поздним ремонтантным.',
  patritsiya: 'В коллекционном опыте в Самарской области в 2025 году средняя масса ягоды составила 2,93 г, максимальная — 3,9 г.',
  tarusa: 'В исследовании 2005–2006 годов в Центральном регионе побеги Тарусы показали достаточную морозоустойчивость.',
  lyachka: 'В сортовом описании указаны масса ягоды 6–8 г и урожайность 3–6 кг с куста.',
  maroseyka: 'В сортовом описании указаны масса ягод 4–12 г и урожайность 4–5 кг с куста.',
  brilliantovaya: 'В опыте в Брянской области созревание начиналось в первой декаде августа. Средняя масса ягоды — 4,0–4,5 г; до заморозков созревало 80–90% потенциального урожая. Урожайность оценена до 2,5–3,0 кг с куста, или до 16 т/га.',
  pohvalinka: 'По сортовой записи средняя масса ягоды — 6,4 г, максимальная — до 10,5 г. Урожайность 194 ц/га приведена заявителем сорта.',
  salyut: 'В опыте в Брянской области в 2020–2023 годах созревание начиналось 20–22 июля. Средняя масса ягоды составила 4,5 г, урожайность — 18,7 т/га.',
  'yubileinaya-kulikova': 'В опыте в Брянской области в 2020–2023 годах плодоношение завершалось к середине сентября. Средняя масса ягоды составила 4,7 г, урожайность — 16,2 т/га, биологическая продуктивность куста — 2750,2 г.',
  arisha: 'По сортовой записи средняя масса ягоды — 4,9 г, вкус оценён в 4,6 балла. Урожайность 197,8 ц/га приведена заявителем; официальный допуск указан для Уральского региона.'
};

export const additionalRaspberryVarieties = rows.map(([slug, name, fruitColor, fruiting, sourceKey, detail]) => {
  const source = sources[sourceKey];
  const fruitingLabel = fruiting === 'remontant' ? 'Ремонтантная малина' : fruiting === 'summer' ? 'Летняя малина' : 'Малина';
  return {
    slug, name, latin: `Rubus idaeus · ${name}`, crop: 'Малина', cropKey: 'raspberry', reviewedAt: '26.09.2026',
    fruitColor, fruiting, fruitingLabel,
    type: fruiting === 'remontant' ? 'Плодоношение на побегах текущего года' : fruiting === 'summer' ? 'Летнее плодоношение' : '',
    period: '', place: '',
    note: detail,
    ...(evidenceBySlug[slug] ? { evidenceNote: evidenceBySlug[slug] } : {}),
    traits: [
      fruitColor === 'yellow' ? 'Жёлтые ягоды' : fruitColor === 'red' ? 'Красные ягоды' : null,
      fruiting === 'remontant' ? 'Урожай на побегах текущего года' : fruiting === 'summer' ? 'Летний урожай' : null
    ].filter(Boolean),
    source: source.url, sourceLabel: source.label,
    ...(slug === 'oranzhevoe-chudo' ? { secondarySource: sources.fncYellow.url, secondarySourceLabel: sources.fncYellow.label } : {}),
    ...(['salyut', 'yubileinaya-kulikova'].includes(slug) ? {
      reviewedAt: '27.09.2026',
      place: '',
      secondarySource: 'https://gossortrf.ru/upload/iblock/00a/clri6obhudueqx6t1f6awcrsp6vm6psk.pdf#page=419',
      secondarySourceLabel: 'Госреестр 2024 · Центральный регион допуска'
    } : {}),
    ...(slug === 'arisha' ? {
      reviewedAt: '27.09.2026',
      period: 'Средний срок созревания',
      place: '',
      secondarySource: 'https://gossortrf.ru/upload/iblock/00a/clri6obhudueqx6t1f6awcrsp6vm6psk.pdf#page=417',
      secondarySourceLabel: 'Госреестр 2024 · запись 7954570'
    } : {}),
    ...(['meteor', 'solnyshko', 'peresvet'].includes(slug) ? { secondarySource: sources.fncNursery2026.url, secondarySourceLabel: sources.fncNursery2026.label } : {}),
    ...(slug === 'tarusa' ? {
      reviewedAt: '27.09.2026',
      secondarySource: sources.tarusaWinterStudy.url,
      secondarySourceLabel: sources.tarusaWinterStudy.label,
      additionalSources: [
        { url: sources.tarusaIdentity.url, label: sources.tarusaIdentity.label }
      ],
      period: 'Среднепоздний срок созревания',
      traits: ['Прямые крепкие побеги', 'Летний урожай']
    } : {}),
    ...(slug === 'lyachka' ? {
      reviewedAt: '27.09.2026',
      secondarySource: sources.lyachkaIdentity.url,
      secondarySourceLabel: sources.lyachkaIdentity.label,
      period: 'Ранний срок созревания',
      traits: ['Ярко-красные ягоды', 'Ранний летний урожай']
    } : {}),
    ...(slug === 'maroseyka' ? {
      reviewedAt: '27.09.2026',
      secondarySource: sources.maroseykaIdentity.url,
      secondarySourceLabel: sources.maroseykaIdentity.label,
      period: 'Среднеранний срок созревания',
      traits: ['Светло-красные ягоды', 'Летний урожай']
    } : {}),
    ...(slug === 'brilliantovaya' ? {
      reviewedAt: '27.09.2026',
      period: 'Начало созревания в августе',
      traits: ['Красные ягоды', 'Урожай на побегах текущего года']
    } : {}),
    ...(slug === 'pohvalinka' ? {
      reviewedAt: '27.09.2026',
      period: 'Средний срок созревания',
      type: 'Ремонтантное плодоношение',
      secondarySource: 'https://gossortrf.ru/upload/iblock/00a/clri6obhudueqx6t1f6awcrsp6vm6psk.pdf#page=418',
      secondarySourceLabel: 'Госреестр 2024 · строка 8456207',
      traits: ['Красные ягоды', 'Средний срок созревания']
    } : {}),
    season: 'unknown', harvestTiming: 'unknown', setting: 'unknown', light: 'unknown'
  };
});
