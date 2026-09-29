import { additionalRaspberryVarieties } from './raspberry-varieties.mjs';
import { additionalStrawberryVarieties } from './strawberry-varieties.mjs';

export const reviewedAt = '26.09.2026';

export const varieties = [
  {
    slug: 'gusar', name: 'Гусар', latin: 'Rubus idaeus L. · Гусар', crop: 'Малина', cropKey: 'raspberry', reviewedAt: '26.09.2026',
    type: 'Летний сорт', period: 'Средний срок созревания', place: 'Открытый грунт',
    note: 'Гусар подойдёт тем, кто ищет летнюю малину с одним основным сбором в середине сезона.',
    traits: ['Летний сорт', 'Средний срок созревания', 'Открытый грунт'],
    evidenceNote: 'В Госреестре 2024 года сорт указан для пяти регионов России.',
    source: 'https://vstisp.org/vstisp/index.php/11-icetheme/sample-news/1448-gusar',
    sourceLabel: 'ФНЦ Садоводства · Гусар', season: 'summer', harvestTiming: 'middle', setting: 'ground', light: 'unknown',
    fruiting: 'summer', fruitingLabel: 'Летняя малина', fruitColor: 'red'
  },
  {
    slug: 'polka', name: 'Полька', latin: "Rubus idaeus ‘Polka’", crop: 'Малина', cropKey: 'raspberry', reviewedAt: '26.09.2026',
    type: 'На побегах текущего года', period: 'Осеннее плодоношение', place: 'Открытый грунт',
    note: 'Полька даёт осеннюю малину на побегах, выросших в этом году. Это удобно учитывать, когда планируете уход за кустами.',
    traits: ['Побеги с небольшими шипами', 'Основной сбор осенью', 'Солнечное место'],
    source: 'https://www.ontario.ca/page/raspberry-variety-description',
    sourceLabel: 'Министерство сельского хозяйства Онтарио · Полька', season: 'late', harvestTiming: 'autumn', setting: 'ground', light: 'sun',
    fruiting: 'remontant', fruitingLabel: 'Ремонтантная малина', fruitColor: 'red'
  },
  {
    slug: 'joan-j', name: 'Джоан Джей', latin: "Rubus idaeus ‘Joan J’", crop: 'Малина', cropKey: 'raspberry', reviewedAt: '26.09.2026',
    type: 'На побегах текущего года', period: 'Осеннее плодоношение', place: 'Открытый грунт',
    note: 'У Джоан Джей прямые побеги без шипов, а ягоды поспевают осенью. Собирать с таких кустов приятнее.',
    traits: ['Побеги без шипов', 'Осеннее плодоношение', 'Солнечное место'],
    source: 'https://active.inspection.gc.ca/english/plaveg/pbrpov/cropreport/ra/app00006387e.shtml',
    sourceLabel: 'Канадское агентство инспекции пищевых продуктов · Joan J', season: 'late', harvestTiming: 'autumn', setting: 'ground', light: 'sun',
    fruiting: 'remontant', fruitingLabel: 'Ремонтантная малина', fruitColor: 'red'
  },
  ...additionalRaspberryVarieties,
  {
    slug: 'aziya', name: 'Азия', latin: 'Fragaria × ananassa · Asia NF421', crop: 'Клубника', cropKey: 'strawberry', reviewedAt: '26.09.2026',
    type: '—', period: 'Среднеранний срок созревания', place: 'Грядка; в дождливых районах — защищённый грунт',
    note: 'Азия начинает отдавать ягоды довольно рано. На грядке мы бы особенно следили за признаками мучнистой росы: сорт к ней чувствителен.',
    traits: ['Среднеранний срок созревания', 'Чувствительность к мучнистой росе'],
    source: 'https://geoplantvivai.com/fragola-asia-nf421/',
    sourceLabel: 'Geoplant Vivai · Asia NF421', season: 'unknown', harvestTiming: 'early', setting: 'ground', light: 'unknown',
    fruiting: 'unknown', fruitingLabel: '—'
  },
  {
    slug: 'festivalnaya', name: 'Фестивальная', latin: 'Fragaria L. · Фестивальная', crop: 'Клубника', cropKey: 'strawberry', reviewedAt: '26.09.2026',
    type: '—', period: '—', place: '—',
    note: 'У Фестивальной ароматные ягоды: под Уфой их запах оценили высоко, а первые ягоды собирали уже в середине июня.',
    evidenceNote: 'В испытании под Уфой в 2019–2021 годах аромат ягод оценили в 4,9 балла из 5; первые ягоды поспевали 15–16 июня. Сорт также указан в Госреестре 2024 года для 11 регионов сортоиспытаний России.',
    traits: ['Ароматные ягоды', 'Сбор в середине июня в опыте под Уфой'],
    source: 'https://gossortrf.ru/upload/iblock/00a/clri6obhudueqx6t1f6awcrsp6vm6psk.pdf#page=415',
    sourceLabel: 'Госреестр 2024 · Фестивальная', secondarySource: 'https://vstisp.org/vstisp/images/valitov-ahiarov.pdf', secondarySourceLabel: 'Башкирский ГАУ · испытание сортов клубники 2019–2021', season: 'unknown', harvestTiming: 'unknown', setting: 'unknown', light: 'unknown',
    fruiting: 'unknown', fruitingLabel: '—'
  },
  {
    slug: 'murano', name: 'Мурано', latin: 'Fragaria × ananassa · Murano', crop: 'Клубника', cropKey: 'strawberry', reviewedAt: '26.09.2026',
    type: 'Повторное плодоношение', period: 'Продолжительный период сбора', place: '—',
    note: 'Мурано радует ягодами не один раз за сезон: сбор растягивается. Перед посадкой стоит учесть, что сорту нужен достаточно долгий холодный период.',
    traits: ['Повторное плодоношение', 'Высокая потребность в холодном периоде'],
    source: 'https://civ.it/wp-content/uploads/2025/01/Murano_EN.pdf',
    sourceLabel: 'CIV · техническое описание Murano', season: 'long', harvestTiming: 'repeat', setting: 'unknown', light: 'unknown',
    fruiting: 'remontant', fruitingLabel: 'Повторное плодоношение'
  },
  {
    slug: 'alba', name: 'Альба', latin: 'Fragaria × ananassa · Alba NF311', crop: 'Клубника', cropKey: 'strawberry', reviewedAt: '26.09.2026',
    type: '—', period: 'Ранний срок созревания', place: 'Грядка с хорошо дренированной почвой',
    note: 'Альба — ранняя клубника для грядки, где не застаивается вода. Мы бы также следили за здоровьем листьев: сорт восприимчив к отдельным болезням.',
    traits: ['Ранний срок созревания', 'Хорошо дренированная почва'],
    source: 'https://geoplantvivai.com/en/alba-strawberry-plants/',
    sourceLabel: 'Geoplant Vivai · Alba NF311', season: 'unknown', harvestTiming: 'early', setting: 'ground', light: 'unknown',
    fruiting: 'unknown', fruitingLabel: '—'
  },
  {
    slug: 'cambridge-favourite', name: 'Кембридж Фаворит', latin: "Fragaria × ananassa ‘Cambridge Favourite’", crop: 'Клубника', cropKey: 'strawberry', reviewedAt: '26.09.2026',
    type: 'Летнее плодоношение', period: 'Средний срок созревания', place: 'Грядка',
    note: 'Кембридж Фаворит даёт ягоды летом и выпускает усы. Для него подойдёт солнечная грядка.',
    traits: ['Летнее плодоношение', 'Образует усы', 'Солнечное место'],
    source: 'https://rwwalpole.co.uk/plants/cambridge-favourite-strawberry/',
    sourceLabel: 'Питомник R.W. Walpole · Cambridge Favourite', season: 'summer', harvestTiming: 'middle', setting: 'ground', light: 'sun',
    fruiting: 'summer', fruitingLabel: 'Летнее плодоношение'
  },
  {
    slug: 'elan', name: 'Элан', latin: "Fragaria × ananassa ‘Elan’", crop: 'Клубника', cropKey: 'strawberry', reviewedAt: '26.09.2026',
    type: 'Повторное плодоношение', period: 'Повторное плодоношение', place: 'Контейнер',
    note: 'Элан можно посадить в контейнер на солнечном месте. Ягоды у него появляются повторно в течение сезона.',
    traits: ['Повторное плодоношение', 'Подходит для контейнера', 'Солнечное место'],
    source: 'https://abzseeds.abzstrawberry.nl/en/assortment/elan-f1',
    sourceLabel: 'Оригинатор ABZ Seeds · Elan F1', season: 'long', harvestTiming: 'repeat', setting: 'container', light: 'sun',
    fruiting: 'remontant', fruitingLabel: 'Ремонтантная клубника'
  },
  ...additionalStrawberryVarieties
];
