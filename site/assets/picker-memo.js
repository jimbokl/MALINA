const form = document.querySelector('#picker-form');
const results = document.querySelector('#picker-output');
const memo = document.querySelector('#picker-memo');

if (form && results && memo) {
  let selection = null;
  let opener = null;

  const addFact = (label, value) => {
    const row = document.createElement('div');
    const term = document.createElement('dt');
    const detail = document.createElement('dd');
    term.textContent = label;
    detail.textContent = value;
    row.append(term, detail);
    memo.querySelector('#picker-memo-facts').append(row);
  };

  const addLink = (label, href) => {
    const link = document.createElement('a');
    link.textContent = label;
    link.href = href;
    memo.querySelector('#picker-memo-sources').append(link);
  };

  results.addEventListener('picker:results', () => {
    const data = new FormData(form);
    selection = {
      region: String(data.get('region') || '').trim(),
      light: String(data.get('light') || ''),
      shelter: String(data.get('shelter') || ''),
      drainage: String(data.get('drainage') || '')
    };
    memo.hidden = true;
    document.body.classList.remove('picker-memo-ready');
  });

  results.addEventListener('click', event => {
    const button = event.target.closest('.picker-memo-open');
    if (!button || !selection) return;
    const card = button.closest('.variety-card');
    if (!card || card.hidden) return;
    opener = button;
    const name = card.querySelector('h3 a').textContent.trim();
    const crop = card.dataset.crop;
    const sourceHref = card.querySelector('.picker-match a').href;
    const cultivarHref = card.querySelector('h3 a').href;
    const facts = memo.querySelector('#picker-memo-facts');
    const steps = memo.querySelector('#picker-memo-steps');
    const sources = memo.querySelector('#picker-memo-sources');
    facts.replaceChildren();
    steps.replaceChildren();
    sources.replaceChildren();

    memo.querySelector('#picker-memo-title').textContent = `Сорт «${name}»: памятка после подбора`;
    memo.querySelector('#picker-memo-lead').textContent = `Регион: ${selection.region}. Проверьте условия участка и данные о сорте перед посадкой.`;
    addFact('Культура', crop === 'raspberry' ? 'Малина' : 'Клубника');
    addFact('Тип плодоношения', card.dataset.fruitingLabel);
    addFact('Срок по описанию сорта', card.dataset.periodLabel);
    addFact('Место по описанию сорта', card.dataset.placeLabel);

    const items = [
      'Сверьте название сорта и его свойства с первоисточником. Перед покупкой запросите происхождение и состояние конкретной партии саженцев.',
      selection.light === 'unknown'
        ? 'Проверьте освещённость места перед выбором сорта.'
        : selection.light === 'shade'
          ? 'Вы отметили заметную тень. Сопоставьте её с описанием места выращивания сорта.'
          : 'Вы отметили солнечное место. Сверьте его с описанием сорта и наблюдением на своём участке.',
      selection.drainage === 'wet'
        ? 'После дождя вода долго стоит: сначала разберитесь с отводом воды.'
        : 'Посмотрите, задерживается ли вода после дождя.'
    ];
    if (crop === 'raspberry') {
      if (card.dataset.fruiting === 'summer') items.push('Для летней малины после сбора вырезают отплодоносившие побеги у земли, сохраняя молодые побеги для следующего сезона. Подтвердите тип сорта до обрезки.');
      else if (card.dataset.fruiting === 'remontant') items.push('Для ремонтантной малины схема обрезки зависит от цели: один поздний урожай или два. Сначала выберите схему и проверьте местные условия.');
      else items.push('Перед обрезкой уточните тип плодоношения сорта по первоисточнику. Без него нельзя выбрать схему.');
      items.push('При посадке найдите прежнюю отметку грунта на побеге и прикройте верхние корни. Для микроплантов нужна инструкция к партии.');
    } else {
      items.push('При посадке основание сердечка оставляют у поверхности, а корни закрывают грунтом. Для микроплантов после In Vitro нужна инструкция к партии.');
    }
    if (selection.shelter !== 'unknown') items.push('Сверьте план зимнего укрытия с особенностями сорта и участка.');
    for (const item of items) {
      const li = document.createElement('li');
      li.textContent = item;
      steps.append(li);
    }

    addLink('Актуальная карточка сорта', cultivarHref);
    if (!/(^|\.)rhs\.org\.uk$/i.test(new URL(sourceHref).hostname)) addLink('Первоисточник описания сорта', sourceHref);
    addLink('Рекомендации Россельхозцентра по культуре', crop === 'raspberry'
      ? 'https://rosselhoscenter.ru/ob-uchrezhdenii/filialy/tsentralnyy-okrug/tulskaya-oblast/obrezka-maliny-osenyu/'
      : 'https://rosselhoscenter.ru/ob-uchrezhdenii/filialy/sibirskiy/omskaya-oblast/osennyaya-posadka-sadovoy-zemlyaniki/');
    addLink('Повторить подбор на сайте', new URL(location.pathname, location.origin).href);
    const madeAt = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'long' }).format(new Date());
    memo.querySelector('#picker-memo-date').textContent = `Памятка создана ${madeAt}. Описание сорта проверено ${card.dataset.reviewedAt}.`;
    memo.hidden = false;
    document.body.classList.add('picker-memo-ready');
    memo.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    memo.focus({ preventScroll: true });
  });

  memo.querySelector('#picker-memo-close').addEventListener('click', () => {
    memo.hidden = true;
    document.body.classList.remove('picker-memo-ready');
    opener?.focus();
  });
  memo.querySelector('#picker-memo-print').addEventListener('click', () => window.print());
}
