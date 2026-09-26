export const reviewedAt = '24.09.2026';

export const varieties = [
  {
    slug: 'gusar', name: 'Гусар', latin: 'Rubus idaeus L. · Гусар', crop: 'Малина', cropKey: 'raspberry', reviewedAt: '26.09.2026',
    type: 'Летний сорт', period: 'Средний срок в описании оригинатора', place: 'Открытый грунт',
    note: 'В Госреестре 2024 года сорт допущен для регионов 2, 3, 4, 6 и 7. Это официальный допуск, а не прогноз зимовки или урожая на вашем участке.',
    traits: ['Летний сорт', 'Регионы допуска 2, 3, 4, 6, 7 · 2024', 'Местные результаты нужно проверять отдельно'],
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
    slug: 'murano', name: 'Мурано', latin: 'Fragaria × ananassa · Murano', crop: 'Земляника садовая', cropKey: 'strawberry', reviewedAt: '26.09.2026',
    type: 'Повторное плодоношение', period: 'Продолжительный период сбора в описании оригинатора', place: 'Условия выращивания для России не подтверждены',
    note: 'Оригинатор CIV описывает «Мурано» как сорт с повторным плодоношением и высокими требованиями к холодному периоду. Это описание для условий источника: сроки, урожайность и пригодность для регионов России пока не проверены.',
    traits: ['Повторное плодоношение по данным оригинатора', 'Требования к холодному периоду отмечены в описании CIV', 'Региональные испытания в России не подтверждены'],
    source: 'https://civ.it/wp-content/uploads/2025/01/Murano_EN.pdf',
    sourceLabel: 'CIV · техническое описание Murano', season: 'long', setting: 'unknown', light: 'unknown',
    fruiting: 'remontant', fruitingLabel: 'Повторное плодоношение'
  },
  {
    slug: 'alba', name: 'Альба', latin: 'Fragaria × ananassa · Alba NF311', crop: 'Земляника садовая', cropKey: 'strawberry', reviewedAt: '26.09.2026',
    type: 'Тип плодоношения не подтверждён', period: 'Ранний сбор в условиях итальянского питомника', place: 'Грядка; требуется хорошо дренированная почва',
    note: 'Питомник Geoplant Vivai описывает ранний сбор «Альбы» в своих условиях и отмечает восприимчивость к отдельным заболеваниям. Сроки, урожайность и пригодность для регионов России пока не проверены.',
    traits: ['Ранний сбор в условиях источника', 'Хорошо дренированная почва по рекомендации питомника', 'Региональные испытания в России не подтверждены'],
    source: 'https://geoplantvivai.com/en/alba-strawberry-plants/',
    sourceLabel: 'Geoplant Vivai · Alba NF311', season: 'unknown', setting: 'ground', light: 'unknown',
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
