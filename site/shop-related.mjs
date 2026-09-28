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
