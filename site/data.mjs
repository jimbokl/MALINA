export const reviewedAt = '24.09.2026';

export const varieties = [
  {
    slug: 'gusar', name: 'Гусар', latin: 'Rubus idaeus L. · Гусар', crop: 'Малина', cropKey: 'raspberry', reviewedAt: '26.09.2026',
    type: 'Летний сорт', period: 'Средний срок в описании оригинатора', place: 'Открытый грунт',
    note: 'В Госреестре 2024 года сорт допущен для Центрального региона (3). Это официальный допуск, а не прогноз зимовки или урожая на вашем участке.',
    traits: ['Летний сорт', 'Центральный регион допуска · 2024', 'Местные результаты нужно проверять отдельно'],
    source: 'https://vstisp.org/vstisp/index.php/11-icetheme/sample-news/1448-gusar',
    sourceLabel: 'ФНЦ Садоводства · Гусар', season: 'summer', setting: 'ground', light: 'unknown',
    fruiting: 'summer', fruitingLabel: 'Летняя малина'
  },
  {
    slug: 'polka', name: 'Полька', latin: "Rubus idaeus ‘Polka’", crop: 'Малина', cropKey: 'raspberry',
    type: 'На побегах текущего года', period: 'Осеннее плодоношение', place: 'Открытый грунт',
    note: 'В исходном описании указано плодоношение на побегах текущего года; основной сбор — осенью. Региональная пригодность в России пока не проверена.',
    traits: ['Побеги с небольшими шипами', 'Основной сбор осенью', 'Солнечное место'],
    source: 'https://www.rhs.org.uk/plants/226503/rubus-idaeus-polka-f/details',
    sourceLabel: 'Исходная карточка · Полька', season: 'late', setting: 'ground', light: 'sun',
    fruiting: 'remontant', fruitingLabel: 'Ремонтантная малина'
  },
  {
    slug: 'joan-j', name: 'Джоан Джей', latin: "Rubus idaeus ‘Joan J’", crop: 'Малина', cropKey: 'raspberry',
    type: 'На побегах текущего года', period: 'Осеннее плодоношение', place: 'Открытый грунт',
    note: 'В исходном описании указаны осеннее плодоношение и прямостоячие побеги без шипов. Региональная пригодность в России пока не проверена.',
    traits: ['Побеги без шипов', 'Осеннее плодоношение', 'Солнечное место'],
    source: 'https://www.rhs.org.uk/plants/195937/rubus-idaeus-joan-j-f/details',
    sourceLabel: 'Исходная карточка · Джоан Джей', season: 'late', setting: 'ground', light: 'sun',
    fruiting: 'remontant', fruitingLabel: 'Ремонтантная малина'
  },
  {
    slug: 'aziya', name: 'Азия', latin: 'Fragaria × ananassa · Asia NF421', crop: 'Земляника садовая', cropKey: 'strawberry', reviewedAt: '26.09.2026',
    type: 'Тип плодоношения не подтверждён', period: 'Среднеранний срок по описанию итальянского питомника', place: 'Грядка; питомник советует защищённый грунт в дождливых районах',
    note: 'Питомник описывает «Азию» как среднеранний сорт и отмечает чувствительность к мучнистой росе. Это сведения из Италии: сроки, урожайность и пригодность для регионов России пока не проверены.',
    traits: ['Среднеранний срок в условиях источника', 'Чувствительность к мучнистой росе по данным питомника', 'Региональные испытания в России не подтверждены'],
    source: 'https://geoplantvivai.com/fragola-asia-nf421/',
    sourceLabel: 'Geoplant Vivai · Asia NF421', season: 'unknown', setting: 'ground', light: 'unknown',
    fruiting: 'unknown', fruitingLabel: 'Тип плодоношения не проверен'
  },
  {
    slug: 'cambridge-favourite', name: 'Кембридж Фаворит', latin: "Fragaria × ananassa ‘Cambridge Favourite’", crop: 'Земляника садовая', cropKey: 'strawberry',
    type: 'Летнее плодоношение', period: 'Средний срок в исходном описании', place: 'Грядка',
    note: 'Исходное описание относит сорт к летнему плодоношению. Срок созревания для регионов России не проверен.',
    traits: ['Летнее плодоношение', 'Образует усы', 'Солнечное место'],
    source: 'https://www.rhs.org.uk/plants/69875/fragaria-%C3%97-ananassa-cambridge-favourite-f/details',
    sourceLabel: 'Исходная карточка · Кембридж Фаворит', season: 'summer', setting: 'ground', light: 'sun',
    fruiting: 'summer', fruitingLabel: 'Летнее плодоношение'
  },
  {
    slug: 'elan', name: 'Элан', latin: "Fragaria × ananassa ‘Elan’", crop: 'Земляника садовая', cropKey: 'strawberry',
    type: 'Повторное плодоношение', period: 'Повторное плодоношение в описании', place: 'Контейнер',
    note: 'Исходное описание отмечает повторное плодоношение и выращивание в контейнерах. Условия для регионов России не проверены.',
    traits: ['Повторное плодоношение', 'Подходит для контейнера', 'Солнечное место'],
    source: 'https://www.rhs.org.uk/plants/191614/fragaria-%C3%97-ananassa-elan-f/details',
    sourceLabel: 'Исходная карточка · Элан', season: 'long', setting: 'container', light: 'sun',
    fruiting: 'remontant', fruitingLabel: 'Ремонтантная клубника'
  }
];
