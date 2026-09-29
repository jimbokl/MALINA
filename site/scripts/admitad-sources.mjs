export const admitadSources = {
  agrosemfond: {
    id: 'agrosemfond', prefix: '', seller: 'Агросемфонд',
    affiliateHost: 'rzekl.com', merchantHost: 'agrosemfond.ru', imageHost: 'agrosemfond.ru',
    crop: category => category.startsWith('Плодовые/Малина/') ? 'raspberry'
      : category.startsWith('Саженцы земляники/') ? 'strawberry' : null
  },
  garshinka: {
    id: 'garshinka', prefix: 'g-', seller: 'Гаршинка',
    affiliateHost: 'codeaven.com', merchantHost: 'www.garshinka.ru', imageHost: 'img.garshinka.ru',
    crop: (category, name) => {
      if (/^Земклуника(?:\s|$)/iu.test(name)) return null;
      if (category === 'Плодовые растения/Малина' && !/^(?:Малина-клен|Малина нектарная)/iu.test(name)) return 'raspberry';
      return category === 'Плодовые растения/Клубника и земляника' ? 'strawberry' : null;
    }
  }
};

export function sourceFor(product) {
  return admitadSources[product.source || 'agrosemfond'];
}

export function sourceProductId(source, id) {
  return `${source.prefix}${id}`;
}
