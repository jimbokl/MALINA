(() => {
  const loadSellerPhoto = image => {
    const url = image.dataset.shopRemote;
    if (!url) return;
    delete image.dataset.shopRemote;
    const remote = new Image();
    const timeout = setTimeout(() => { remote.onload = null; remote.onerror = null; }, 5000);
    remote.onload = () => {
      clearTimeout(timeout);
      image.src = url;
      image.alt = image.dataset.shopRemoteAlt || image.alt;
      const caption = image.closest('figure')?.querySelector('figcaption');
      if (caption) caption.textContent = 'Фото товара из каталога продавца.';
    };
    remote.onerror = () => clearTimeout(timeout);
    remote.src = url;
  };
  const remoteImages = document.querySelectorAll('img[data-shop-remote]');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        loadSellerPhoto(entry.target);
      }
    }, { rootMargin: '250px' });
    remoteImages.forEach(image => observer.observe(image));
  } else {
    remoteImages.forEach(loadSellerPhoto);
  }
  for (const image of document.querySelectorAll('img[data-shop-fallback]')) {
    image.addEventListener('error', () => {
      const fallback = image.dataset.shopFallback;
      if (!fallback) return;
      image.removeAttribute('data-shop-fallback');
      image.src = fallback;
      image.alt = 'Иллюстрация культуры';
      const caption = image.closest('figure')?.querySelector('figcaption');
      if (caption) caption.textContent = 'Иллюстрация культуры.';
    }, { once: true });
  }
  const query = document.querySelector('[data-shop-query]');
  const stock = document.querySelector('[data-shop-stock]');
  const count = document.querySelector('[data-shop-count]');
  const seller = document.querySelector('[data-shop-seller]');
  const reset = document.querySelector('[data-shop-reset]');
  const cards = [...document.querySelectorAll('[data-shop-card]')];
  const sections = [...document.querySelectorAll('[data-shop-section]')];
  if (!query || !stock || !count) return;

  const noun = number => {
    const lastTwo = number % 100;
    if (lastTwo >= 11 && lastTwo <= 14) return 'товаров';
    const last = number % 10;
    return last === 1 ? 'товар' : last >= 2 && last <= 4 ? 'товара' : 'товаров';
  };

  const update = () => {
    const term = query.value.trim().toLocaleLowerCase('ru').replaceAll('ё', 'е');
    const sellerCounts = {};
    for (const card of cards) for (const id of (card.dataset.sellers || '').split(' ').filter(Boolean)) sellerCounts[id] = (sellerCounts[id] || 0) + 1;
    if (seller) {
      for (const option of seller.options) {
        option.dataset.label ||= option.textContent;
        option.textContent = option.value === 'all' ? option.dataset.label : `${option.dataset.label} (${sellerCounts[option.value] || 0})`;
        option.disabled = option.value !== 'all' && !sellerCounts[option.value];
      }
      if (seller.value !== 'all' && !sellerCounts[seller.value]) seller.value = 'all';
    }
    const stockCounts = { all: cards.length, in_stock: 0, out_of_stock: 0, unknown: 0 };
    for (const card of cards) stockCounts[card.dataset.stock] += 1;
    const stockLabels = { all: 'Все товары', in_stock: 'Есть в наличии', out_of_stock: 'Нет в наличии', unknown: 'Наличие уточняется' };
    for (const option of stock.options) {
      option.textContent = `${stockLabels[option.value]} (${stockCounts[option.value]})`;
      option.disabled = option.value !== 'all' && stockCounts[option.value] === 0;
    }
    let visible = 0;
    for (const card of cards) {
      const show = (!term || card.dataset.search.includes(term))
        && (stock.value === 'all' || card.dataset.stock === stock.value)
        && (!seller || seller.value === 'all' || (card.dataset.sellers || '').split(' ').includes(seller.value));
      card.hidden = !show;
      if (show) visible += 1;
    }
    for (const section of sections) {
      const sectionCount = section.querySelectorAll('[data-shop-card]:not([hidden])').length;
      section.hidden = sectionCount === 0;
      const label = section.querySelector('[data-shop-section-count]');
      if (label) label.textContent = sectionCount;
    }
    const filtered = Boolean(term) || stock.value !== 'all' || Boolean(seller && seller.value !== 'all');
    if (reset) reset.hidden = !filtered;
    count.textContent = filtered
      ? `Показано ${visible} ${noun(visible)} из ${cards.length}${visible ? '' : '. Попробуйте другой запрос или фильтр.'}`
      : `Показано ${visible} ${noun(visible)}`;
  };
  query.addEventListener('input', update);
  stock.addEventListener('change', update);
  seller?.addEventListener('change', update);
  reset?.addEventListener('click', () => {
    query.value = '';
    stock.value = 'all';
    if (seller) seller.value = 'all';
    update();
    query.focus();
  });
  for (const link of document.querySelectorAll('.shop-hero-links a[href^="#"]')) {
    link.addEventListener('click', () => {
      const section = document.querySelector(link.getAttribute('href'));
      if (!section?.hidden) return;
      query.value = '';
      stock.value = 'all';
      if (seller) seller.value = 'all';
      update();
    });
  }
  update();
  window.addEventListener('pageshow', update);
})();
