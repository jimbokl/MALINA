export function relatedShopProducts(product, publicProducts, offerFor, limit = 3) {
  const currentIndex = publicProducts.findIndex(item => item.slug === product.slug);
  const length = publicProducts.length;
  return publicProducts
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.slug !== product.slug && item.crop === product.crop)
    .sort((left, right) => {
      const score = ({ item }) =>
        (offerFor(item) ? 4 : 0) + (product.categoryId && item.categoryId === product.categoryId ? 2 : 0);
      const difference = score(right) - score(left);
      if (difference) return difference;
      const leftDistance = (left.index - currentIndex + length) % length;
      const rightDistance = (right.index - currentIndex + length) % length;
      return leftDistance - rightDistance;
    })
    .slice(0, limit)
    .map(({ item }) => item);
}

const comparisonFields = [
  ['fruitColor', new Set(['red', 'yellow']), true],
  ['fruiting', new Set(['summer', 'remontant']), true],
  ['harvestTiming', new Set(['early', 'middle', 'late', 'autumn', 'repeat']), false]
];

function publishedVariety(product, varietyFor) {
  const variety = varietyFor(product);
  return product.cultivarSlug && variety?.slug === product.cultivarSlug && variety.cropKey === product.crop ? variety : null;
}

function similarityScore(current, candidate) {
  let matches = 0;
  for (const [field, knownValues, excludesConflict] of comparisonFields) {
    if (!knownValues.has(current[field]) || !knownValues.has(candidate[field])) continue;
    if (current[field] === candidate[field]) matches += 1;
    else if (excludesConflict) return 0;
  }
  return matches;
}

function uniqueCultivars(products, limit) {
  const seen = new Set();
  return products.filter(item => {
    if (seen.has(item.cultivarSlug)) return false;
    seen.add(item.cultivarSlug);
    return true;
  }).slice(0, limit);
}

// varietyFor returns the published cultivar record, not a flag or product claims.
export function outOfStockNextProducts(product, publicProducts, offerFor, varietyFor, limit = 3) {
  const available = publicProducts
    .filter(item => item.slug !== product.slug && item.crop === product.crop)
    .map(item => ({ item, offer: offerFor(item) }))
    .filter(({ offer }) => offer);
  if (product.cultivarSlug) {
    const otherSeller = ({ item, offer }) => (offer.source || item.source) !== product.source;
    const sameCultivar = available.filter(({ item }) => item.cultivarSlug === product.cultivarSlug)
      .sort((left, right) => Number(otherSeller(right)) - Number(otherSeller(left)));
    if (sameCultivar.length) {
      return { kind: 'same_cultivar', products: uniqueCultivars(sameCultivar.map(({ item }) => item), limit) };
    }
  }
  const current = publishedVariety(product, varietyFor);
  if (!current) return { kind: 'picker', products: [] };
  const similar = available
    .map(({ item }) => {
      const candidate = item.cultivarSlug && publishedVariety(item, varietyFor);
      return { item, score: candidate ? similarityScore(current, candidate) : 0 };
    })
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score);
  const products = uniqueCultivars(similar.map(({ item }) => item), limit);
  return { kind: products.length ? 'other_cultivars' : 'picker', products };
}
