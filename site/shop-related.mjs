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

export function outOfStockNextProducts(product, publicProducts, offerFor, isVerifiedCultivar, limit = 3) {
  const available = publicProducts.filter(item =>
    item.slug !== product.slug && item.crop === product.crop && offerFor(item)
  );
  if (product.cultivarSlug) {
    const otherSeller = item => (offerFor(item)?.source || item.source) !== product.source;
    const sameCultivar = available.filter(item => item.cultivarSlug === product.cultivarSlug)
      .sort((left, right) => Number(otherSeller(right)) - Number(otherSeller(left)));
    if (sameCultivar.length) return { kind: 'same_cultivar', products: sameCultivar.slice(0, limit) };
  }
  const verified = available.filter(item =>
    item.cultivarSlug && item.cultivarSlug !== product.cultivarSlug && isVerifiedCultivar(item)
  );
  return { kind: verified.length ? 'other_cultivars' : 'picker', products: verified.slice(0, limit) };
}
