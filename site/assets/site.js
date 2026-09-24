const menuButton = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('#mobile-nav');
menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  mobileNav.hidden = !open;
});

const catalogForm = document.querySelector('#catalog-form');
if (catalogForm) {
  const cards = [...document.querySelectorAll('#catalog-results .variety-card')];
  const count = document.querySelector('#catalog-count');
  const empty = document.querySelector('#catalog-empty');
  const requestedFruiting = new URLSearchParams(location.search).get('fruiting');
  if (['remontant', 'summer'].includes(requestedFruiting)) catalogForm.elements.fruiting.value = requestedFruiting;
  const filter = () => {
    const data = new FormData(catalogForm);
    const crop = data.get('crop'); const setting = data.get('setting'); const fruiting = data.get('fruiting');
    const query = String(data.get('query') || '').trim().toLocaleLowerCase('ru');
    let visible = 0;
    for (const card of cards) {
      const show = (crop === 'all' || card.dataset.crop === crop) && (setting === 'all' || card.dataset.setting === setting) && (fruiting === 'all' || card.dataset.fruiting === fruiting) && card.dataset.name.includes(query);
      card.hidden = !show;
      if (show) visible++;
    }
    count.textContent = `${visible} ${visible === 1 ? 'сорт' : visible > 1 && visible < 5 ? 'сорта' : 'сортов'} для сравнения`;
    empty.hidden = visible !== 0;
  };
  catalogForm.addEventListener('input', filter);
  catalogForm.addEventListener('change', filter);
  filter();
}

const pickerForm = document.querySelector('#picker-form');
if (pickerForm) pickerForm.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(pickerForm);
  const region = String(data.get('region') || '').trim();
  if (!region) { pickerForm.querySelector('#picker-region').focus(); return; }
  const crop = data.get('crop'); const setting = data.get('setting'); const light = data.get('light'); const fruiting = data.get('fruiting');
  const output = document.querySelector('#picker-output');
  const cards = [...document.querySelectorAll('#picker-results .variety-card')];
  let visible = 0;
  for (const card of cards) {
    const show = light === 'sun' && (crop === 'all' || card.dataset.crop === crop) && (setting === 'all' || card.dataset.setting === setting) && (fruiting === 'all' || card.dataset.fruiting === fruiting);
    card.hidden = !show;
    if (show) visible++;
  }
  document.querySelector('#picker-title').textContent = visible ? `${visible} ${visible === 1 ? 'сорт для сравнения' : visible < 5 ? 'сорта для сравнения' : 'сортов для сравнения'}` : 'Пока нет надёжного совпадения';
  document.querySelector('#picker-region-status').textContent = `Регион: ${region}. Подтверждённых данных о пригодности этих сортов для вашего региона пока нет. Ниже — справочное сравнение по опубликованным признакам, не региональная рекомендация.`;
  document.querySelector('#picker-description').textContent = visible ? 'Это записи, у которых опубликованный источник описывает выбранные признаки. Пригодность для вашего региона и наличие посадочного материала нужно проверить отдельно.' : 'Первая подборка пока ограничена. Лучше оставить вопрос открытым, чем предложить сорт без подтверждённых данных.';
  document.querySelector('#picker-empty').hidden = visible !== 0;
  output.hidden = false;
  output.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  output.focus({ preventScroll: true });
});
