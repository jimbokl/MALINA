// Editorial copy for feed offers. Names, images, prices, links and stock come
// from the live feed; these IDs only connect offers to existing cultivar pages.
// Growing advice and cultivar traits below are backed by the linked Russian sources.
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

export const shopProducts = [
  {
    id: '67762', slug: 'gusar-sazhenec', cultivarSlug: 'gusar', expectedName: 'Гусар', crop: 'raspberry',
    headline: 'Гусар — летняя малина среднего срока',
    lead: 'ФНЦ Садоводства относит «Гусар» к летним сортам среднего срока созревания. Посмотрите сведения о сорте в каталоге и проверьте детали саженца у продавца.',
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
    planting: raspberryPlanting,
    buyerChecklist: raspberryBuyerChecklist,
    sources: [vniispkRaspberry, raspberryPlantingSource]
  },
  {
    id: '71157', slug: 'rubinovoe-ozherele-sazhenec', cultivarSlug: 'rubinovoe-ozherele', expectedName: 'Рубиновое ожерелье', crop: 'raspberry',
    headline: 'Рубиновое ожерелье — малина на побегах текущего года',
    lead: 'ВНИИСПК относит «Рубиновое ожерелье» к ремонтантным сортам с преимущественным плодоношением на однолетних побегах. В описании сорта отмечены крупные ягоды рубинового цвета.',
    planting: raspberryPlanting,
    buyerChecklist: raspberryBuyerChecklist,
    sources: [vniispkRaspberry, raspberryPlantingSource]
  },
  {
    id: '71544', slug: 'zheltyy-gigant-sazhenec', cultivarSlug: 'zheltyy-gigant', expectedName: 'Жёлтый гигант', crop: 'raspberry',
    headline: 'Жёлтый гигант — жёлтая крупноплодная малина',
    lead: 'ФНЦ Садоводства называет «Жёлтый гигант» жёлтоплодным крупноплодным сортом. Оцените место для посадки и уточните характеристики конкретного саженца у продавца.',
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
    planting: strawberryPlanting,
    buyerChecklist: strawberryBuyerChecklist,
    sources: [vniispkStrawberry, ...strawberryPlantingSources]
  },
  {
    id: '68587', slug: 'kleri-sazhenec', cultivarSlug: 'kleri', expectedName: 'Клери', crop: 'strawberry',
    headline: 'Клери — ранняя клубника с крупными ягодами',
    lead: 'В биоресурсной коллекции ВНИИСПК «Клери» указана как ранний крупноплодный сорт. До покупки сравните условия предложения и подготовьте место для посадки.',
    planting: strawberryPlanting,
    buyerChecklist: strawberryBuyerChecklist,
    sources: [vniispkStrawberry, ...strawberryPlantingSources]
  }
];
