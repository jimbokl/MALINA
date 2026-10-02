(() => {
  const link = document.querySelector('[data-shop-redirect]');
  if (!link) return;
  const target = new URL(link.href, location.origin);
  if (target.origin !== location.origin) return;
  const params = new URLSearchParams(location.search);
  for (const key of ['city', 'region', 'crop']) {
    const values = params.getAll(key);
    if (values.length === 1 && values[0].trim()) target.searchParams.set(key, values[0]);
  }
  target.hash = location.hash;
  link.href = target.href;
  location.replace(target.href);
})();
