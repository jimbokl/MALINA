(() => {
  const search = document.querySelector('#city-search');
  const cards = [...document.querySelectorAll('[data-city-card]')];
  const count = document.querySelector('#cities-count');
  const empty = document.querySelector('#cities-empty');
  if (!search || !count || !empty) return;

  const normalizeSearch = value => value.trim().toLocaleLowerCase('ru-RU').replace(/ё/g, 'е');
  const plural = new Intl.PluralRules('ru-RU');
  const cityWords = { one: 'город', few: 'города', many: 'городов', other: 'города' };
  const formatCount = value => `${value} ${cityWords[plural.select(value)]} в стартовом каталоге`;
  const filter = () => {
    const query = normalizeSearch(search.value);
    let visible = 0;
    for (const card of cards) {
      const show = normalizeSearch(card.dataset.search).includes(query);
      card.hidden = !show;
      if (show) visible++;
    }
    count.textContent = formatCount(visible);
    empty.hidden = visible !== 0;
  };
  search.addEventListener('input', filter);
})();
