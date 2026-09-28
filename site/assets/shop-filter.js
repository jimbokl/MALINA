(() => {
  for (const image of document.querySelectorAll('img[data-shop-fallback]')) {
    image.addEventListener('error', () => {
      const fallback = image.dataset.shopFallback;
      if (!fallback) return;
      image.removeAttribute('data-shop-fallback');
      image.src = fallback;
      image.alt = 'Иллюстрация культуры';
    }, { once: true });
  }
  const query = document.querySelector('[data-shop-query]');
  const stock = document.querySelector('[data-shop-stock]');
  const count = document.querySelector('[data-shop-count]');
  const cards = [...document.querySelectorAll('[data-shop-card]')];
  const sections = [...document.querySelectorAll('[data-shop-section]')];
  if (!query || !stock || !count) return;

  const update = () => {
    const term = query.value.trim().toLocaleLowerCase('ru');
    let visible = 0;
    for (const card of cards) {
      const show = (!term || card.dataset.search.includes(term))
        && (stock.value === 'all' || card.dataset.stock === stock.value);
      card.hidden = !show;
      if (show) visible += 1;
    }
    for (const section of sections) {
      section.hidden = !section.querySelector('[data-shop-card]:not([hidden])');
    }
    count.textContent = visible ? 'Показано ' + visible + ' товаров' : 'Ничего не найдено. Попробуйте другое название.';
  };
  query.addEventListener('input', update);
  stock.addEventListener('change', update);
})();
