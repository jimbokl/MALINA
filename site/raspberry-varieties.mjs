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
  ['zhuravlik', 'Журавлик', 'red', 'remontant', 'fncNursery', 'В каталоге питомника указан как ремонтантный красноплодный сорт.'],
  ['beglyanka', 'Беглянка', 'yellow', 'unknown', 'fncNursery', 'Жёлтая окраска подтверждена; группа плодоношения в источниках различается.'],
  ['meteor', 'Метеор', 'red', 'summer', 'fncNursery', 'Питомник отмечает красную окраску ягоды; каталог 2026 года помещает сорт в группу обычной малины.'],
  ['solnyshko', 'Солнышко', 'red', 'summer', 'fncNursery', 'Питомник отмечает малиновую окраску ягоды; каталог 2026 года помещает сорт в группу обычной малины.'],
  ['peresvet', 'Пересвет', 'red', 'summer', 'fncNursery', 'Питомник описывает малиновую окраску ягоды; каталог 2026 года помещает сорт в группу обычной малины.'],
  ['poklon-kazakovu', 'Поклон Казакову', 'unknown', 'remontant', 'fncNursery2026', 'В каталоге питомника 2026 года указан среди ремонтантной малины; окраска ягод в источнике не указана.'],
  ['podarok-kashinu', 'Подарок Кашину', 'unknown', 'remontant', 'fncNursery2026', 'В каталоге питомника 2026 года указан среди ремонтантной малины; окраска ягод в источнике не указана.'],
  ['medvezhonok', 'Медвежонок', 'unknown', 'remontant', 'remontantTrial2024', 'В сортоиспытании Кокинской станции 2020–2023 годов средняя масса ягод составила 4,9 г; тип плодоношения — ремонтантный.'],
  ['skromnitsa', 'Скромница', 'unknown', 'summer', 'fncNursery2026', 'В каталоге питомника 2026 года указан среди обычной малины; окраска ягод в источнике не указана.'],
  ['krasa-rossii', 'Краса России', 'unknown', 'summer', 'fncNursery2026', 'В каталоге питомника 2026 года указан среди обычной малины; окраска ягод в источнике не указана.'],
  ['balzam', 'Бальзам', 'unknown', 'unknown', 'fncSeminar', 'ФНЦ называет сорт в числе селекции Кокинского пункта; сорт упомянут на семинаре ФНЦ.'],
  ['zheltyy-gigant', 'Жёлтый гигант', 'yellow', 'unknown', 'fncSeminar', 'ФНЦ прямо называет сорт жёлтоплодным; сорт упомянут на семинаре ФНЦ.'],
  ['atlant', 'Атлант', 'red', 'remontant', 'fncAtlant', 'ФНЦ Садоводства описывает сорт как ремонтантный с ярко-красными ягодами.'],
  ['abrikosovaya', 'Абрикосовая', 'yellow', 'remontant', 'vniispkRemontant', 'Селекционеры описывают сорт как ремонтантный желтоплодный, с золотисто-абрикосовой окраской ягод.'],
  ['bryanskoe-divo', 'Брянское диво', 'unknown', 'remontant', 'fncBreeding', 'ФНЦ относит сорт к ремонтантной группе.'],
  ['gerakl', 'Геракл', 'red', 'remontant', 'vniispkRemontant', 'Селекционеры описывают сорт как ремонтантный, с ягодами рубинового цвета.'],
  ['evraziya', 'Евразия', 'unknown', 'remontant', 'fncBreeding', 'ФНЦ относит сорт к ремонтантной группе.'],
  ['zhar-ptitsa', 'Жар-птица', 'unknown', 'remontant', 'fncBreeding', 'ФНЦ относит сорт к ремонтантной группе.'],
  ['oranzhevoe-chudo', 'Оранжевое чудо', 'yellow', 'remontant', 'fncBreeding', 'ФНЦ относит сорт к жёлтоплодной группе; в селекционном перечне он указан как ремонтантный.'],
  ['pingvin', 'Пингвин', 'unknown', 'remontant', 'fncBreeding', 'ФНЦ относит сорт к ремонтантной группе.'],
  ['rubinovoe-ozherele', 'Рубиновое ожерелье', 'unknown', 'remontant', 'fncBreeding', 'ФНЦ относит сорт к ремонтантной группе; окраска в источнике не указана.'],
  ['zolotaya-osen', 'Золотая осень', 'yellow', 'unknown', 'fncYellow', 'ФНЦ называет сорт жёлтоплодным; сорт указан среди жёлтоплодных.'],
  ['zolotye-kupola', 'Золотые купола', 'yellow', 'unknown', 'fncYellow', 'ФНЦ называет сорт жёлтоплодным; сорт указан среди жёлтоплодных.'],
  ['yellow-antwerp', 'Йеллоу Антверп', 'yellow', 'summer', 'yellowAntwerp', 'Жёлтые ягоды и летний сбор.'],
  ['all-gold', 'Олл Голд', 'yellow', 'remontant', 'allGold', 'Жёлтые ягоды и плодоношение на побегах текущего года.'],
  ['polana', 'Полана', 'red', 'remontant', 'umn', 'В таблице университета указан красноплодным сортом с плодоношением на побегах текущего года.'],
  ['caroline', 'Кэролайн', 'red', 'remontant', 'umn', 'В таблице университета указан красноплодным сортом с плодоношением на побегах текущего года.'],
  ['heritage', 'Херитейдж', 'red', 'remontant', 'umn', 'В таблице университета указан красноплодным сортом с плодоношением на побегах текущего года.'],
  ['anne', 'Энн', 'yellow', 'remontant', 'umn', 'В таблице университета указан золотистый цвет ягод и плодоношение на побегах текущего года.'],
  ['double-gold', 'Дабл Голд', 'yellow', 'remontant', 'umn', 'В таблице университета указан золотистый цвет ягод и плодоношение на побегах текущего года.'],
  ['prelude', 'Прелюд', 'red', 'summer', 'umn', 'В таблице университета указан красноплодным сортом летней группы.'],
  ['nova', 'Нова', 'red', 'summer', 'umn', 'В таблице университета указан красноплодным сортом летней группы.'],
  ['encore', 'Энкор', 'red', 'summer', 'umn', 'В таблице университета указан красноплодным сортом летней группы.'],
  ['pshehiba', 'Пшехиба', 'unknown', 'unknown', 'samaraCollection2026', 'В коллекции «Жигулёвских садов» средняя масса ягоды в 2025 году составила 3,99 г, максимальная — 5,6 г.'],
  ['karamelka', 'Карамелька', 'unknown', 'remontant', 'spbgauRemontant', 'Ремонтантный сорт среднераннего срока созревания. Средняя масса ягоды — 3,8 г, максимальная — до 8,0 г.'],
  ['samohval', 'Самохвал', 'unknown', 'remontant', 'spbgauRemontant', 'Ремонтантный сорт позднего срока созревания. Средняя масса ягоды — 5,9 г, максимальная — до 9,1 г.'],
  ['patritsiya', 'Патриция', 'unknown', 'unknown', 'samaraCollection2026', 'В коллекции «Жигулёвских садов» средняя масса ягоды в 2025 году составила 2,93 г, максимальная — 3,9 г.'],
  ['tarusa', 'Таруса', 'red', 'summer', 'tarusaDescription', 'Штамбовый летний сорт с ярко-красными ягодами и пряморослыми жёсткими побегами.'],
  ['lyachka', 'Лячка', 'red', 'summer', 'lyachkaDescription', 'Ранний летний сорт с ярко-красными ягодами; в описании приведены масса ягод 6–8 г и урожайность 3–6 кг с куста.'],
  ['maroseyka', 'Маросейка', 'red', 'summer', 'maroseykaDescription', 'Среднеранний летний сорт со светло-красными ягодами; в описании указаны масса ягод 4–12 г и урожайность 4–5 кг с куста.'],
  ['brilliantovaya', 'Бриллиантовая', 'red', 'remontant', 'brilliantovaya', 'В исследовании сортоиспытания в Брянской области указаны средняя масса ягоды 4,0–4,5 г, начало созревания в первой декаде августа и созревание 80–90% потенциального урожая до осенних заморозков. Урожайность в источнике приведена как до 2,5–3,0 кг с куста или до 16 т/га.'],
  ['pohvalinka', 'Похвалинка', 'red', 'remontant', 'gossortPohvalinka', 'Сорт среднего срока созревания. Средняя масса ягоды — 6,4 г, максимальная — до 10,5 г. Средняя урожайность — 194 ц/га по данным заявителя.'],
  ['salyut', 'Салют', 'red', 'remontant', 'remontantTrial2024', 'В опыте в Брянской области за 2020–2023 годы средняя масса ягоды составила 4,5 г, урожайность — 18,7 т/га; созревание начиналось 20–22 июля.'],
  ['yubileinaya-kulikova', 'Юбилейная Куликова', 'red', 'remontant', 'remontantTrial2024', 'В опыте в Брянской области за 2020–2023 годы урожайность составила 16,2 т/га, биологическая продуктивность куста — 2750,2 г, средняя масса ягоды — 4,7 г. Плодоношение завершалось к середине сентября.'],
  ['arisha', 'Ариша', 'red', 'remontant', 'gossortArisha', 'В записи Госсорткомиссии указаны средняя масса ягоды 4,9 г, вкус 4,6 балла и урожайность 197,8 ц/га по данным заявителя; допуск — Уральский регион.']
];

export const additionalRaspberryVarieties = rows.map(([slug, name, fruitColor, fruiting, sourceKey, detail]) => {
  const source = sources[sourceKey];
  const fruitingLabel = fruiting === 'remontant' ? 'Ремонтантная малина' : fruiting === 'summer' ? 'Летняя малина' : 'Малина';
  return {
    slug, name, latin: `Rubus idaeus · ${name}`, crop: 'Малина', cropKey: 'raspberry', reviewedAt: '26.09.2026',
    fruitColor, fruiting, fruitingLabel,
    type: fruiting === 'remontant' ? 'Плодоношение на побегах текущего года' : fruiting === 'summer' ? 'Летнее плодоношение' : '',
    period: '', place: '',
    note: detail,
    traits: [source.context, detail],
    source: source.url, sourceLabel: source.label,
    ...(slug === 'oranzhevoe-chudo' ? { secondarySource: sources.fncYellow.url, secondarySourceLabel: sources.fncYellow.label } : {}),
    ...(['salyut', 'yubileinaya-kulikova'].includes(slug) ? {
      reviewedAt: '27.09.2026',
      place: 'Кокино, Брянская область · 2020–2023',
      secondarySource: 'https://gossortrf.ru/upload/iblock/00a/clri6obhudueqx6t1f6awcrsp6vm6psk.pdf#page=419',
      secondarySourceLabel: 'Госреестр 2024 · Центральный регион допуска'
    } : {}),
    ...(slug === 'arisha' ? {
      reviewedAt: '27.09.2026',
      period: 'Средний срок созревания по Госреестру',
      place: 'Уральский регион допуска · Госреестр 2024',
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
      period: 'Среднепоздний срок в описании питомника',
      traits: [sources.tarusaIdentity.context, sources.tarusaWinterStudy.context]
    } : {}),
    ...(slug === 'lyachka' ? {
      reviewedAt: '27.09.2026',
      secondarySource: sources.lyachkaIdentity.url,
      secondarySourceLabel: sources.lyachkaIdentity.label,
      period: 'Ранний срок в сортовом описании',
      traits: [sources.lyachkaIdentity.context, 'В описании ВХОЗ ягоды названы ярко-красными; средняя масса указана как 6–8 г, урожайность — 3–6 кг с куста.']
    } : {}),
    ...(slug === 'maroseyka' ? {
      reviewedAt: '27.09.2026',
      secondarySource: sources.maroseykaIdentity.url,
      secondarySourceLabel: sources.maroseykaIdentity.label,
      period: 'Среднеранний срок в сортовом описании',
      traits: [sources.maroseykaIdentity.context, 'В описании питомника указаны масса ягод 4–12 г и урожайность 4–5 кг с куста.']
    } : {}),
    ...(slug === 'brilliantovaya' ? {
      reviewedAt: '27.09.2026',
      period: 'Начало созревания — первая декада августа в испытании в Брянской области',
      traits: [sources.brilliantovaya.context, detail]
    } : {}),
    ...(slug === 'pohvalinka' ? {
      reviewedAt: '27.09.2026',
      period: 'Среднего срока созревания по Госреестру',
      type: 'Ремонтантное плодоношение',
      secondarySource: 'https://gossortrf.ru/upload/iblock/00a/clri6obhudueqx6t1f6awcrsp6vm6psk.pdf#page=418',
      secondarySourceLabel: 'Госреестр 2024 · строка 8456207',
      traits: [sources.gossortPohvalinka.context, detail],
      note: 'Ремонтантный сорт среднего срока созревания. Ягоды красные; средняя масса — 6,4 г, максимальная — до 10,5 г. Урожайность — 194 ц/га по данным заявителя.'
    } : {}),
    season: 'unknown', harvestTiming: 'unknown', setting: 'unknown', light: 'unknown'
  };
});
