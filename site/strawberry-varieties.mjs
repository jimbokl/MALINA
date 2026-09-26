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
  }
].map(variety => ({
  crop: 'Клубника', cropKey: 'strawberry', season: variety.fruiting === 'remontant' ? 'long' : variety.fruiting === 'summer' ? 'summer' : 'unknown',
  light: 'unknown', reviewedAt: '26.09.2026', ...variety
}));
