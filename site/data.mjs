import { additionalRaspberryVarieties } from './raspberry-varieties.mjs';

export const reviewedAt = '26.09.2026';

export const varieties = [
  {
    slug: 'gusar', name: 'Гусар', latin: 'Rubus idaeus L. · Гусар', crop: 'Малина', cropKey: 'raspberry', reviewedAt: '26.09.2026',
    type: 'Летний сорт', period: 'Средний срок в описании оригинатора', place: 'Открытый грунт',
    note: 'В Госреестре 2024 года сорт допущен для регионов 2, 3, 4, 6 и 7.',
    traits: ['Летний сорт', 'Регионы допуска 2, 3, 4, 6, 7 · 2024'],
    source: 'https://vstisp.org/vstisp/index.php/11-icetheme/sample-news/1448-gusar',
    sourceLabel: 'ФНЦ Садоводства · Гусар', season: 'summer', harvestTiming: 'middle', setting: 'ground', light: 'unknown',
    fruiting: 'summer', fruitingLabel: 'Летняя малина', fruitColor: 'red'
  },
  {
    slug: 'polka', name: 'Полька', latin: "Rubus idaeus ‘Polka’", crop: 'Малина', cropKey: 'raspberry',
    type: 'На побегах текущего года', period: 'Осеннее плодоношение', place: 'Открытый грунт',
    note: 'Плодоносит на побегах текущего года; основной сбор — осенью.',
    traits: ['Побеги с небольшими шипами', 'Основной сбор осенью', 'Солнечное место'],
    source: 'https://www.ontario.ca/page/raspberry-variety-description',
    sourceLabel: 'Министерство сельского хозяйства Онтарио · Полька', season: 'late', harvestTiming: 'autumn', setting: 'ground', light: 'sun',
    fruiting: 'remontant', fruitingLabel: 'Ремонтантная малина', fruitColor: 'red'
  },
  {
    slug: 'joan-j', name: 'Джоан Джей', latin: "Rubus idaeus ‘Joan J’", crop: 'Малина', cropKey: 'raspberry',
    type: 'На побегах текущего года', period: 'Осеннее плодоношение', place: 'Открытый грунт',
    note: 'Осеннее плодоношение на прямостоячих побегах без шипов.',
    traits: ['Побеги без шипов', 'Осеннее плодоношение', 'Солнечное место'],
    source: 'https://active.inspection.gc.ca/english/plaveg/pbrpov/cropreport/ra/app00006387e.shtml',
    sourceLabel: 'Канадское агентство инспекции пищевых продуктов · Joan J', season: 'late', harvestTiming: 'autumn', setting: 'ground', light: 'sun',
    fruiting: 'remontant', fruitingLabel: 'Ремонтантная малина', fruitColor: 'red'
  },
  ...additionalRaspberryVarieties,
  {
    slug: 'aziya', name: 'Азия', latin: 'Fragaria × ananassa · Asia NF421', crop: 'Земляника садовая', cropKey: 'strawberry', reviewedAt: '26.09.2026',
    type: '—', period: 'Среднеранний срок по описанию итальянского питомника', place: 'Грядка; питомник советует защищённый грунт в дождливых районах',
    note: 'Питомник описывает «Азию» как среднеранний сорт и отмечает чувствительность к мучнистой росе.',
    traits: ['Среднеранний срок в условиях источника', 'Чувствительность к мучнистой росе по данным питомника'],
    source: 'https://geoplantvivai.com/fragola-asia-nf421/',
    sourceLabel: 'Geoplant Vivai · Asia NF421', season: 'unknown', harvestTiming: 'early', setting: 'ground', light: 'unknown',
    fruiting: 'unknown', fruitingLabel: '—'
  },
  {
    slug: 'festivalnaya', name: 'Фестивальная', latin: 'Fragaria L. · Фестивальная', crop: 'Земляника садовая', cropKey: 'strawberry', reviewedAt: '26.09.2026',
    type: '—', period: '—', place: '—',
    note: 'В Госреестре 2024 года «Фестивальная» указана с допуском для регионов 1–11.',
    traits: ['Регионы допуска 1–11 · 2024'],
    source: 'https://gossortrf.ru/upload/iblock/00a/clri6obhudueqx6t1f6awcrsp6vm6psk.pdf#page=415',
    sourceLabel: 'Госреестр 2024 · Фестивальная', season: 'unknown', harvestTiming: 'unknown', setting: 'unknown', light: 'unknown',
    fruiting: 'unknown', fruitingLabel: '—'
  },
  {
    slug: 'murano', name: 'Мурано', latin: 'Fragaria × ananassa · Murano', crop: 'Земляника садовая', cropKey: 'strawberry', reviewedAt: '26.09.2026',
    type: 'Повторное плодоношение', period: 'Продолжительный период сбора в описании оригинатора', place: '—',
    note: 'Оригинатор CIV описывает «Мурано» как сорт с повторным плодоношением и высокими требованиями к холодному периоду.',
    traits: ['Повторное плодоношение по данным оригинатора', 'Требования к холодному периоду отмечены в описании CIV'],
    source: 'https://civ.it/wp-content/uploads/2025/01/Murano_EN.pdf',
    sourceLabel: 'CIV · техническое описание Murano', season: 'long', harvestTiming: 'repeat', setting: 'unknown', light: 'unknown',
    fruiting: 'remontant', fruitingLabel: 'Повторное плодоношение'
  },
  {
    slug: 'alba', name: 'Альба', latin: 'Fragaria × ananassa · Alba NF311', crop: 'Земляника садовая', cropKey: 'strawberry', reviewedAt: '26.09.2026',
    type: '—', period: 'Ранний сбор в условиях итальянского питомника', place: 'Грядка; требуется хорошо дренированная почва',
    note: 'Питомник Geoplant Vivai описывает ранний сбор «Альбы» и отмечает восприимчивость к отдельным заболеваниям.',
    traits: ['Ранний сбор в условиях источника', 'Хорошо дренированная почва по рекомендации питомника'],
    source: 'https://geoplantvivai.com/en/alba-strawberry-plants/',
    sourceLabel: 'Geoplant Vivai · Alba NF311', season: 'unknown', harvestTiming: 'early', setting: 'ground', light: 'unknown',
    fruiting: 'unknown', fruitingLabel: '—'
  },
  {
    slug: 'cambridge-favourite', name: 'Кембридж Фаворит', latin: "Fragaria × ananassa ‘Cambridge Favourite’", crop: 'Земляника садовая', cropKey: 'strawberry',
    type: 'Летнее плодоношение', period: 'Средний срок в исходном описании', place: 'Грядка',
    note: 'Сорт с летним плодоношением и образованием усов.',
    traits: ['Летнее плодоношение', 'Образует усы', 'Солнечное место'],
    source: 'https://rwwalpole.co.uk/plants/cambridge-favourite-strawberry/',
    sourceLabel: 'Питомник R.W. Walpole · Cambridge Favourite', season: 'summer', harvestTiming: 'middle', setting: 'ground', light: 'sun',
    fruiting: 'summer', fruitingLabel: 'Летнее плодоношение'
  },
  {
    slug: 'elan', name: 'Элан', latin: "Fragaria × ananassa ‘Elan’", crop: 'Земляника садовая', cropKey: 'strawberry',
    type: 'Повторное плодоношение', period: 'Повторное плодоношение в описании', place: 'Контейнер',
    note: 'Оригинатор отмечает повторное плодоношение и выращивание в контейнерах.',
    traits: ['Повторное плодоношение', 'Подходит для контейнера', 'Солнечное место'],
    source: 'https://abzseeds.abzstrawberry.nl/en/assortment/elan-f1',
    sourceLabel: 'Оригинатор ABZ Seeds · Elan F1', season: 'long', harvestTiming: 'repeat', setting: 'container', light: 'sun',
    fruiting: 'remontant', fruitingLabel: 'Ремонтантная клубника'
  }
];
