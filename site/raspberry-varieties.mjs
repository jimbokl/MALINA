// A source-backed expansion of the raspberry atlas. Source descriptions are
// classification evidence, never regional recommendations or stock promises.
const sources = {
  fncBreeding: {
    url: 'https://vstisp.org/vstisp/index.php/nauchnaya-deyatelnost/genetika-i-selektsiya',
    label: 'ФНЦ Садоводства · генетика и селекция',
    context: 'ФНЦ Садоводства относит сорт к ремонтантной малине.'
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
    context: 'Питомник ФНЦ разделяет обычную и ремонтантную малину; сроки в прайсе не перенесены на регионы.'
  },
  fncSeminar: {
    url: 'https://vstisp.org/vstisp/index.php/2-uncategorized/492-seminar-lektorij-po-maline',
    label: 'ФНЦ Садоводства · семинар по сортам',
    context: 'На семинаре ФНЦ сорт назван по имени; у Жёлтого гиганта указана окраска ягод.'
  },
  rhsYellowAntwerp: {
    url: 'https://www.rhs.org.uk/plants/131912/rubus-idaeus-yellow-antwerp-f/details',
    label: 'RHS · Yellow Antwerp',
    context: 'RHS описывает жёлтые ягоды и летний сбор в британских условиях.'
  },
  rhsAllGold: {
    url: 'https://www.rhs.org.uk/plants/226554/rubus-idaeus-all-gold-f/details',
    label: 'RHS · All Gold',
    context: 'RHS описывает жёлтоплодный сорт с плодоношением на побегах текущего года.'
  },
  umn: {
    url: 'https://extension.umn.edu/agriculture/specialty-crops/commercial-fruit-production/raspberry-farming/raspberry-types-and-varieties',
    label: 'University of Minnesota Extension · сорта малины',
    context: 'Университет Миннесоты указывает окраску ягод и группу плодоношения; наблюдения относятся к Миннесоте.'
  }
};

// slug, Russian name, berry color, fruiting group, source, distinguishing fact
// Unknown is deliberate: neither names nor a generic group list prove a color.
const rows = [
  ['zhuravlik', 'Журавлик', 'red', 'remontant', 'fncNursery', 'В каталоге питомника указан как ремонтантный красноплодный сорт.'],
  ['beglyanka', 'Беглянка', 'yellow', 'unknown', 'fncNursery', 'Жёлтая окраска подтверждена; выпуски каталога ФНЦ по-разному обозначают тип плодоношения, поэтому он требует дополнительной проверки.'],
  ['meteor', 'Метеор', 'red', 'summer', 'fncNursery', 'Питомник отмечает красную окраску ягоды; каталог 2026 года помещает сорт в группу обычной малины.'],
  ['solnyshko', 'Солнышко', 'red', 'summer', 'fncNursery', 'Питомник отмечает малиновую окраску ягоды; каталог 2026 года помещает сорт в группу обычной малины.'],
  ['peresvet', 'Пересвет', 'red', 'summer', 'fncNursery', 'Питомник описывает малиновую окраску ягоды; каталог 2026 года помещает сорт в группу обычной малины.'],
  ['poklon-kazakovu', 'Поклон Казакову', 'unknown', 'remontant', 'fncNursery2026', 'В каталоге питомника 2026 года указан среди ремонтантной малины; окраска ягод отдельно не проверена.'],
  ['podarok-kashinu', 'Подарок Кашину', 'unknown', 'remontant', 'fncNursery2026', 'В каталоге питомника 2026 года указан среди ремонтантной малины; окраска ягод отдельно не проверена.'],
  ['medvezhonok', 'Медвежонок', 'unknown', 'summer', 'fncNursery2026', 'В каталоге питомника 2026 года указан среди обычной малины; окраска ягод отдельно не проверена.'],
  ['skromnitsa', 'Скромница', 'unknown', 'summer', 'fncNursery2026', 'В каталоге питомника 2026 года указан среди обычной малины; окраска ягод отдельно не проверена.'],
  ['krasa-rossii', 'Краса России', 'unknown', 'summer', 'fncNursery2026', 'В каталоге питомника 2026 года указан среди обычной малины; окраска ягод отдельно не проверена.'],
  ['balzam', 'Бальзам', 'unknown', 'unknown', 'fncSeminar', 'ФНЦ называет сорт в числе селекции Кокинского пункта; цвет и группу плодоношения источник не уточняет.'],
  ['zheltyy-gigant', 'Жёлтый гигант', 'yellow', 'unknown', 'fncSeminar', 'ФНЦ прямо называет сорт жёлтоплодным; группа плодоношения в сообщении не указана.'],
  ['atlant', 'Атлант', 'unknown', 'remontant', 'fncBreeding', 'В перечне селекционных достижений ФНЦ указан среди ремонтантных сортов.'],
  ['abrikosovaya', 'Абрикосовая', 'unknown', 'remontant', 'fncBreeding', 'В перечне селекционных достижений ФНЦ указан среди ремонтантных сортов; окраску отдельно не проверяли.'],
  ['bryanskoe-divo', 'Брянское диво', 'unknown', 'remontant', 'fncBreeding', 'ФНЦ относит сорт к ремонтантной группе.'],
  ['gerakl', 'Геракл', 'unknown', 'remontant', 'fncBreeding', 'ФНЦ относит сорт к ремонтантной группе.'],
  ['evraziya', 'Евразия', 'unknown', 'remontant', 'fncBreeding', 'ФНЦ относит сорт к ремонтантной группе.'],
  ['zhar-ptitsa', 'Жар-птица', 'unknown', 'remontant', 'fncBreeding', 'ФНЦ относит сорт к ремонтантной группе.'],
  ['oranzhevoe-chudo', 'Оранжевое чудо', 'yellow', 'remontant', 'fncBreeding', 'ФНЦ относит сорт к жёлтоплодной группе; в селекционном перечне он указан как ремонтантный.'],
  ['pingvin', 'Пингвин', 'unknown', 'remontant', 'fncBreeding', 'ФНЦ относит сорт к ремонтантной группе.'],
  ['rubinovoe-ozherele', 'Рубиновое ожерелье', 'unknown', 'remontant', 'fncBreeding', 'ФНЦ относит сорт к ремонтантной группе; окраску не выводим из названия.'],
  ['zolotaya-osen', 'Золотая осень', 'yellow', 'unknown', 'fncYellow', 'ФНЦ называет сорт жёлтоплодным; группа плодоношения по этой публикации не подтверждена.'],
  ['zolotye-kupola', 'Золотые купола', 'yellow', 'unknown', 'fncYellow', 'ФНЦ называет сорт жёлтоплодным; группа плодоношения по этой публикации не подтверждена.'],
  ['yellow-antwerp', 'Йеллоу Антверп', 'yellow', 'summer', 'rhsYellowAntwerp', 'RHS указывает жёлтые ягоды и летний сбор в условиях Великобритании, но помечает статус названия как неподтверждённый.'],
  ['all-gold', 'Олл Голд', 'yellow', 'remontant', 'rhsAllGold', 'RHS описывает жёлтые ягоды и плодоношение на побегах текущего года.'],
  ['polana', 'Полана', 'red', 'remontant', 'umn', 'В таблице университета указан красноплодным сортом с плодоношением на побегах текущего года.'],
  ['caroline', 'Кэролайн', 'red', 'remontant', 'umn', 'В таблице университета указан красноплодным сортом с плодоношением на побегах текущего года.'],
  ['heritage', 'Херитейдж', 'red', 'remontant', 'umn', 'В таблице университета указан красноплодным сортом с плодоношением на побегах текущего года.'],
  ['anne', 'Энн', 'yellow', 'remontant', 'umn', 'В таблице университета указан золотистый цвет ягод и плодоношение на побегах текущего года.'],
  ['double-gold', 'Дабл Голд', 'yellow', 'remontant', 'umn', 'В таблице университета указан золотистый цвет ягод и плодоношение на побегах текущего года.'],
  ['prelude', 'Прелюд', 'red', 'summer', 'umn', 'В таблице университета указан красноплодным сортом летней группы.'],
  ['nova', 'Нова', 'red', 'summer', 'umn', 'В таблице университета указан красноплодным сортом летней группы.'],
  ['encore', 'Энкор', 'red', 'summer', 'umn', 'В таблице университета указан красноплодным сортом летней группы.']
];

export const additionalRaspberryVarieties = rows.map(([slug, name, fruitColor, fruiting, sourceKey, detail]) => {
  const source = sources[sourceKey];
  const foreign = sourceKey.startsWith('rhs') || sourceKey === 'umn';
  const caveat = foreign ? 'Пригодность для регионов России не проверена.' : 'Местную пригодность и урожайность нужно проверять отдельно.';
  const fruitingLabel = fruiting === 'remontant' ? 'Ремонтантная малина' : fruiting === 'summer' ? 'Летняя малина' : 'Группа плодоношения не проверена';
  return {
    slug, name, latin: `Rubus idaeus · ${name}`, crop: 'Малина', cropKey: 'raspberry', reviewedAt: '26.09.2026',
    fruitColor, fruiting, fruitingLabel,
    type: fruiting === 'remontant' ? 'Плодоношение на побегах текущего года' : fruiting === 'summer' ? 'Летнее плодоношение' : 'Тип плодоношения не подтверждён',
    period: 'Срок для регионов России не подтверждён', place: 'Условия выращивания для России не подтверждены',
    note: `${detail} ${caveat}`,
    traits: [source.context, detail, caveat],
    source: source.url, sourceLabel: source.label,
    ...(slug === 'oranzhevoe-chudo' ? { secondarySource: sources.fncYellow.url, secondarySourceLabel: sources.fncYellow.label } : {}),
    ...(['meteor', 'solnyshko', 'peresvet'].includes(slug) ? { secondarySource: sources.fncNursery2026.url, secondarySourceLabel: sources.fncNursery2026.label } : {}),
    season: 'unknown', harvestTiming: 'unknown', setting: 'unknown', light: 'unknown'
  };
});
