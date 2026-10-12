export const admitadSources = {
  agrosemfond: {
    id: 'agrosemfond', prefix: '', seller: 'Агросемфонд',
    affiliateHost: 'rzekl.com', merchantHost: 'agrosemfond.ru', imageHost: 'agrosemfond.ru', currencies: ['RUR'],
    crop: category => category.startsWith('Плодовые/Малина/') ? 'raspberry'
      : category.startsWith('Саженцы земляники/') ? 'strawberry' : null
  },
  garshinka: {
    id: 'garshinka', prefix: 'g-', seller: 'Гаршинка',
    affiliateHost: 'codeaven.com', merchantHost: 'www.garshinka.ru', imageHost: 'img.garshinka.ru', currencies: ['RUR'],
    crop: (category, name) => {
      if (/^Земклуника(?:\s|$)/iu.test(name)) return null;
      if (category === 'Плодовые растения/Малина' && !/^(?:Малина-клен|Малина нектарная)/iu.test(name)) return 'raspberry';
      return category === 'Плодовые растения/Клубника и земляника' ? 'strawberry' : null;
    }
  },
  onlinesemena: {
    id: 'onlinesemena', prefix: 'o-', seller: 'onlinesemena.ru',
    affiliateHost: 'dkfrh.com', merchantHost: 'onlinesemena.ru', imageHost: 'onlinesemena.ru', currencies: ['RUB'],
    crop: (category, name) => {
      if (/^(?:Земклуника|Малино-поляничный гибрид)(?:\s|$)/iu.test(name)) return null;
      if (/^Каталог\/Саженцы Питомник\/Плодовые деревья и кустарники\/Малина(?: ремонтантная)?(?:\/|$)/u.test(category)
          && /^Малина\s/iu.test(name)) return 'raspberry';
      return category.startsWith('Каталог/Саженцы клубники и земляники/')
        && /^(?:Земляника(?: садовая)?|Клубника)\s/iu.test(name) ? 'strawberry' : null;
    }
  }
};

export const admitadFeedEnv = {
  agrosemfond: 'ADMITAD_FEED_URL',
  garshinka: 'ADMITAD_FEED_URL_GARSHINKA',
  onlinesemena: 'ADMITAD_FEED_URL_ONLINESEMENA'
};

export function sourceFor(product) {
  return admitadSources[product.source || 'agrosemfond'];
}

export function sourceProductId(source, id) {
  return `${source.prefix}${id}`;
}
