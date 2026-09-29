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
    const sourceHref = card.querySelector('.catalog-facts a[href]')?.href;
    const cultivarHref = card.querySelector('h3 a').href;
    const facts = memo.querySelector('#picker-memo-facts');
    const steps = memo.querySelector('#picker-memo-steps');
    const sources = memo.querySelector('#picker-memo-sources');
    facts.replaceChildren();
    steps.replaceChildren();
    sources.replaceChildren();

    memo.querySelector('#picker-memo-title').textContent = `«${name}»: ваша памятка`;
    memo.querySelector('#picker-memo-lead').textContent = `Мы подобрали этот сорт для региона «${selection.region}». Перед посадкой посмотрите, подходит ли ему именно ваш участок.`;
    addFact('Культура', crop === 'raspberry' ? 'Малина' : 'Клубника');
    addFact('Тип плодоношения', card.dataset.fruitingLabel);
    addFact('Когда ждать ягоды', card.dataset.periodLabel);
    addFact('Где выращивать', card.dataset.placeLabel);

    const items = [
      'Перед покупкой уточните у продавца название сорта, состояние саженца и что именно входит в заказ.',
      selection.light === 'unknown'
        ? 'Посмотрите, сколько солнца бывает на месте посадки.'
        : selection.light === 'shade'
          ? 'Вы отметили тень. Посмотрите, хватит ли сорту света на этом месте.'
          : 'Вы отметили солнечное место. Посмотрите, не пересыхает ли там почва.',
      selection.drainage === 'wet'
        ? 'После дождя вода долго стоит: сначала разберитесь с отводом воды.'
        : 'Посмотрите, задерживается ли вода после дождя.'
    ];
    if (crop === 'raspberry') {
      if (card.dataset.fruiting === 'summer') items.push('У летней малины после сбора вырежьте отплодоносившие побеги у земли, а молодые оставьте на следующий год.');
      else if (card.dataset.fruiting === 'remontant') items.push('У ремонтантной малины сначала решите, нужен один поздний урожай или два: от этого зависит обрезка.');
      else items.push('Перед обрезкой узнайте, на каких побегах этот сорт даёт ягоды.');
      items.push('При посадке найдите прежнюю отметку грунта на побеге и прикройте верхние корни. Для микроплантов нужна инструкция к партии.');
    } else {
      items.push('При посадке основание сердечка оставляют у поверхности, а корни закрывают грунтом. Для микроплантов после In Vitro нужна инструкция к партии.');
    }
    if (selection.shelter !== 'unknown') items.push('Подумайте заранее, понадобится ли этому сорту укрытие на вашем участке.');
    for (const item of items) {
      const li = document.createElement('li');
      li.textContent = item;
      steps.append(li);
    }

    addLink('Актуальная карточка сорта', cultivarHref);
    if (sourceHref && !/(^|\.)rhs\.org\.uk$/i.test(new URL(sourceHref).hostname)) addLink('Первоисточник описания сорта', sourceHref);
    addLink('Рекомендации Россельхозцентра по культуре', crop === 'raspberry'
      ? 'https://rosselhoscenter.ru/ob-uchrezhdenii/filialy/tsentralnyy-okrug/tulskaya-oblast/obrezka-maliny-osenyu/'
      : 'https://rosselhoscenter.ru/ob-uchrezhdenii/filialy/sibirskiy/omskaya-oblast/osennyaya-posadka-sadovoy-zemlyaniki/');
    addLink('Повторить подбор на сайте', new URL(location.pathname, location.origin).href);
    const madeAt = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'long' }).format(new Date());
    memo.querySelector('#picker-memo-date').textContent = `Составили памятку ${madeAt}`;
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
