// Editorial copy for selected feed offers. The full catalog identity lives in
// shop-catalog.json; prices, links and stock come from the current feed.
// Growing advice and cultivar traits below are backed by the linked Russian sources.
import { readFileSync } from 'node:fs';
import { varieties } from './data.mjs';
const raspberryPlanting = {
  title: 'Как посадить малину',
  guideHref: '/zhurnal/posadka-maliny/',
  steps: [
    'Выберите хорошо освещённый возвышенный участок с рыхлой почвой.',
    'Перед посадкой осмотрите саженец: побеги должны быть целыми, корни — развитыми, без надрывов и наростов.',
    'После посадки уплотните землю и полейте. При необходимости подвяжите побеги, чтобы саженец не раскачивался.'
  ]
};

const strawberryPlanting = {
  title: 'Как посадить клубнику',
  guideHref: '/zhurnal/posadka-klubniki/',
  steps: [
    'Подберите для грядки ровное место без застоя воды, защищённое от сильного ветра.',
    'Разместите растения на подготовленной гряде с промежутками, нужными для выбранной схемы посадки.',
    'После пересадки хорошо полейте грядку. Если растения увядают, временно притените их.'
  ]
};

const raspberryPlantingSource = {
  label: 'Россельхозцентр · как правильно посадить малину',
  url: 'https://rosselhoscenter.ru/ob-uchrezhdenii/filialy/severo-kavkazskiy/respublika-severnaya-osetiya-alaniya/malina/'
};

const strawberryPlantingSources = [
  {
    label: 'Россельхозцентр · выбор места для клубники',
    url: 'https://rosselhoscenter.ru/ob-uchrezhdenii/filialy/severo-zapadnyy/novgorodskaya-oblast/sazhaem-zemlyaniku-sadovuyu-klubniku/'
  },
  {
    label: 'Россельхозцентр · осенняя посадка клубники',
    url: 'https://rosselhoscenter.ru/ob-uchrezhdenii/filialy/sibirskiy/omskaya-oblast/osennyaya-posadka-sadovoy-zemlyaniki/'
  }
];

const vniispkRaspberry = {
  label: 'ВНИИСПК · описание ремонтантных сортов малины',
  url: 'https://vniispk.ru/pages/activities/science-activities/conference-2008/publ-2008-13'
};

const vniispkStrawberry = {
  label: 'ВНИИСПК · биоресурсная коллекция клубники',
  url: 'https://vniispk.ru/docs/bpk/2022-03/16-strawberry.pdf'
};

const raspberryBuyerChecklist = [
  'Сверьте точное название сорта и количество саженцев в предложении магазина.',
  'Проверьте формат посадочного материала и условия доставки до оформления заказа.'
];

const strawberryBuyerChecklist = [
  'Сверьте точное название сорта и количество растений в предложении магазина.',
  'Проверьте формат рассады и сроки доставки до оформления заказа.'
];

const curatedShopProducts = [
  {
    id: '67762', slug: 'gusar-sazhenec', cultivarSlug: 'gusar', expectedName: 'Гусар', crop: 'raspberry',
    headline: 'Гусар — летняя малина среднего срока',
    lead: 'ФНЦ Садоводства относит «Гусар» к летним сортам среднего срока созревания. Посмотрите сведения о сорте в каталоге и проверьте детали саженца у продавца.',
    article: {
      title: 'Гусар: летняя малина для открытого грунта',
      paragraphs: [
        '«Гусар» плодоносит как летняя малина: ягоды формируются на побегах прошлого года. ФНЦ Садоводства относит сорт к среднему сроку созревания. Это вариант для тех, кто хочет собирать малину летом и готов сохранять молодые побеги для урожая следующего сезона.',
        'В Госреестре 2024 года для «Гусара» указаны регионы допуска 2, 3, 4, 6 и 7. Для посадки выберите освещённое место без застоя воды. Перед заказом посмотрите, сколько растений входит в предложение и в каком виде продавец отправляет корни.'
      ]
    },
    planting: raspberryPlanting,
    buyerChecklist: raspberryBuyerChecklist,
    sources: [
      { label: 'ФНЦ Садоводства · Гусар', url: 'https://vstisp.org/vstisp/index.php/11-icetheme/sample-news/1448-gusar' },
      raspberryPlantingSource
    ]
  },
  {
    id: '71131', slug: 'gerakl-sazhenec', cultivarSlug: 'gerakl', expectedName: 'Геракл', crop: 'raspberry',
    headline: 'Геракл — ремонтантная малина с крупными ягодами',
    lead: 'ВНИИСПК описывает «Геракл» как ремонтантный крупноплодный сорт с пряморослыми побегами. Перед заказом сравните условия продажи с тем, как вы планируете выращивать малину.',
    article: {
      title: 'Геракл: урожай на побегах текущего года',
      paragraphs: [
        '«Геракл» относится к ремонтантной малине. Его можно выращивать ради урожая на побегах текущего года: весной отрастают новые стебли, а затем на них созревают ягоды. ВНИИСПК отмечает крупные плоды и пряморослые побеги сорта.',
        'При выборе места подумайте о продолжительности тёплого сезона в вашем городе: осеннему урожаю нужно время для созревания. На странице сорта можно сравнить имеющиеся данные по регионам. У продавца уточните количество саженцев и состояние корней перед отправкой.'
      ]
    },
    planting: raspberryPlanting,
    buyerChecklist: raspberryBuyerChecklist,
    sources: [vniispkRaspberry, raspberryPlantingSource]
  },
  {
    id: '71157', slug: 'rubinovoe-ozherele-sazhenec', cultivarSlug: 'rubinovoe-ozherele', expectedName: 'Рубиновое ожерелье', crop: 'raspberry',
    headline: 'Рубиновое ожерелье — малина на побегах текущего года',
    lead: 'ВНИИСПК относит «Рубиновое ожерелье» к ремонтантным сортам с преимущественным плодоношением на однолетних побегах. В описании сорта отмечены крупные ягоды рубинового цвета.',
    article: {
      title: 'Рубиновое ожерелье: ремонтантный сорт для осеннего сбора',
      paragraphs: [
        'У «Рубинового ожерелья» основной урожай формируется на побегах текущего года. ВНИИСПК описывает сорт как ремонтантный и отмечает крупные ягоды рубиновой окраски. Такой цикл помогает заранее продумать обрезку: побеги, давшие урожай, больше не нужны для следующего осеннего сбора.',
        'Для этого сорта особенно важна длина сезона на вашем участке. Сравните сроки плодоношения с местным опытом садоводов и выберите солнечное место для посадки. При заказе проверьте название сорта и формат саженца в карточке продавца.'
      ]
    },
    planting: raspberryPlanting,
    buyerChecklist: raspberryBuyerChecklist,
    sources: [vniispkRaspberry, raspberryPlantingSource]
  },
  {
    id: '71544', slug: 'zheltyy-gigant-sazhenec', cultivarSlug: 'zheltyy-gigant', expectedName: 'Жёлтый гигант', crop: 'raspberry',
    headline: 'Жёлтый гигант — жёлтая крупноплодная малина',
    lead: 'ФНЦ Садоводства называет «Жёлтый гигант» жёлтоплодным крупноплодным сортом. Оцените место для посадки и уточните характеристики конкретного саженца у продавца.',
    article: {
      title: 'Жёлтый гигант: крупная ягода другого цвета',
      paragraphs: [
        'Название здесь описывает заметные признаки сорта. ФНЦ Садоводства относит «Жёлтый гигант» к жёлтоплодной крупноплодной малине. Если на участке уже растут красноплодные сорта, его удобно рассматривать как отдельный вариант для сравнения вкуса и сроков сбора на своей грядке.',
        'Малине нужен светлый участок с почвой, в которой не задерживается вода. Оставьте место для ухода и сбора ягод, а перед покупкой сверьте название сорта и количество растений в предложении. На странице сорта собраны источники и отзывы садоводов.'
      ]
    },
    planting: raspberryPlanting,
    buyerChecklist: raspberryBuyerChecklist,
    sources: [
      { label: 'ФНЦ Садоводства · семинар по сортам малины', url: 'https://vstisp.org/vstisp/index.php/2-uncategorized/492-seminar-lektorij-po-maline' },
      raspberryPlantingSource
    ]
  },
  {
    id: '68612', slug: 'aziya-sazhenec', cultivarSlug: 'aziya', expectedName: 'Азия', crop: 'strawberry',
    headline: 'Азия — клубника с крупными плотными ягодами',
    lead: 'В биоресурсной коллекции ВНИИСПК «Азия» отмечена как крупноплодный сорт с плотными ягодами. При выборе предложения проверьте формат рассады и количество растений.',
    article: {
      title: 'Азия: крупные плотные ягоды и место для грядки',
      paragraphs: [
        'В биоресурсной коллекции ВНИИСПК «Азия» описана как клубника с крупными плотными ягодами. Эти признаки полезны при сравнении сортов, но выбор рассады начинается с грядки: растениям нужно место без застоя воды и с доступом для ухода.',
        'Продумайте схему посадки до заказа, чтобы понимать нужное число растений. В предложении продавца проверьте, какой именно формат рассады вам отправят. После пересадки хорошо полейте грядку и наблюдайте за состоянием листьев в первые дни.'
      ]
    },
    planting: strawberryPlanting,
    buyerChecklist: strawberryBuyerChecklist,
    sources: [vniispkStrawberry, ...strawberryPlantingSources]
  },
  {
    id: '68587', slug: 'kleri-sazhenec', cultivarSlug: 'kleri', expectedName: 'Клери', crop: 'strawberry',
    headline: 'Клери — ранняя клубника с крупными ягодами',
    lead: 'В биоресурсной коллекции ВНИИСПК «Клери» указана как ранний крупноплодный сорт. До покупки сравните условия предложения и подготовьте место для посадки.',
    article: {
      title: 'Клери: ранняя клубника для начала сезона',
      paragraphs: [
        '«Клери» входит в число ранних крупноплодных сортов, представленных в биоресурсной коллекции ВНИИСПК. Его стоит сравнить с другими ранними сортами, если хочется начать сбор клубники раньше. Фактический срок созревания будет зависеть от погоды и условий участка.',
        'Под рассаду подготовьте ровную грядку без застоя воды. Между растениями оставьте расстояние по выбранной схеме посадки: так будет удобнее поливать, осматривать кусты и собирать ягоды. Перед заказом сверьте количество растений, формат рассады и условия доставки.'
      ]
    },
    planting: strawberryPlanting,
    buyerChecklist: strawberryBuyerChecklist,
    sources: [vniispkStrawberry, ...strawberryPlantingSources]
  }
];

const catalog = JSON.parse(readFileSync(new URL('./shop-catalog.json', import.meta.url), 'utf8'));
// A copied seller description can describe a different cultivar. Suppress its
// cultivar details when the same substantial opening appears on distinct cards.
const merchantDescriptionOwners = new Map();
for (const product of catalog) {
  const opening = String(product.description ?? '').trim().slice(0, 350);
  if (opening.length < 300) continue;
  const owners = merchantDescriptionOwners.get(opening) || new Set();
  owners.add(product.canonicalSlug || product.slug);
  merchantDescriptionOwners.set(opening, owners);
}
const curatedById = new Map(curatedShopProducts.map(product => [product.id, product]));
const normalizeCultivarName = name => name.normalize('NFKC').toLocaleLowerCase('ru')
  .replaceAll('ё', 'е').replace(/\s+/gu, ' ').trim();
const verifiedByName = new Map(varieties.map(variety => [
  `${variety.cropKey}\u0000${normalizeCultivarName(variety.name)}`, variety
]));
// The catalog itself calls this cultivar «Вима Кимберли» in its source name.
const verifiedAliases = new Map([['strawberry\u0000вима кимберли', 'kimberli']]);

export function matchShopCultivar(product) {
  const name = normalizeCultivarName(product.name);
  let cultivarName;
  let qualifier;
  if (product.crop === 'raspberry' && product.categoryId.startsWith('Плодовые/Малина/')) {
    const match = name.match(/^малина (?:(бесшипая|крупноплодная|ремонтантная) )?(.+)$/u);
    qualifier = match?.[1];
    cultivarName = match?.[2];
  } else if (product.crop === 'strawberry' && product.categoryId.startsWith('Саженцы земляники/')) {
    cultivarName = name.match(/^земляника садовая (.+)$/u)?.[1];
  }
  if (!cultivarName) return null;
  // Only the feed's explicit single-plant notation is removed. Other words remain
  // part of the name, so sets, hybrids and embellished names cannot match.
  cultivarName = cultivarName.replace(/\s+1\s*шт\.?(?:\s*р9)?$/u, '');
  const key = `${product.crop}\u0000${cultivarName}`;
  const variety = verifiedByName.get(key);
  // A seller's remontant label must agree with the verified cultivar card.
  if (qualifier === 'ремонтантная' && variety?.type !== 'Плодоношение на побегах текущего года') return null;
  return variety?.slug || verifiedAliases.get(key) || null;
}

const verifiedBySlug = new Map(varieties.map(variety => [variety.slug, variety]));
const cultivarSources = slug => {
  const variety = verifiedBySlug.get(slug);
  if (!variety) return [];
  return [
    { label: variety.sourceLabel, url: variety.source },
    ...(variety.secondarySource ? [{ label: variety.secondarySourceLabel, url: variety.secondarySource }] : [])
  ];
};

export const shopProducts = catalog.map(product => {
  const cultivarSlug = matchShopCultivar(product) || product.cultivarSlug;
  return {
    ...product,
    merchantDescriptionShared: (merchantDescriptionOwners.get(String(product.description ?? '').trim().slice(0, 350))?.size || 0) > 1,
    cultivarSlug,
    planting: product.crop === 'raspberry' ? raspberryPlanting : strawberryPlanting,
    buyerChecklist: product.crop === 'raspberry' ? raspberryBuyerChecklist : strawberryBuyerChecklist,
    sources: [
      ...(product.crop === 'raspberry' ? [raspberryPlantingSource] : strawberryPlantingSources),
      ...cultivarSources(cultivarSlug)
    ],
    ...(curatedById.get(product.id) || {})
  };
});
