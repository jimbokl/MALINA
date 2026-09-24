(() => {
  const root = document.getElementById('reviews-root');
  if (!root) return;

  const list = document.getElementById('reviews-list');
  const filterLabel = document.getElementById('reviews-filter');
  const form = document.getElementById('review-form');
  const status = document.getElementById('review-status');
  const api = root.dataset.reviewApi;
  const enabled = root.dataset.reviewsEnabled === 'true' && Boolean(api);
  const sort = new URLSearchParams(location.search).get('sort')?.trim().slice(0, 100) || '';
  const source = enabled
    ? api + (sort ? '?cultivar=' + encodeURIComponent(sort) : '')
    : (document.documentElement.dataset.siteBase || '') + '/data/reviews.json';
  const expanded = new Set();

  if (sort) {
    filterLabel.hidden = false;
    filterLabel.textContent = 'Сорт: ' + sort;
    form.elements.cultivar_name.value = sort;
  }

  function setMessage(message) {
    list.replaceChildren();
    const p = document.createElement('p');
    p.className = 'reviews-empty';
    p.textContent = message;
    list.append(p);
  }

  function makeField(labelText, name, tag = 'input') {
    const label = document.createElement('label');
    label.textContent = labelText;
    const control = document.createElement(tag);
    control.name = name;
    control.required = true;
    control.maxLength = name === 'body' ? 2000 : name === 'region' ? 100 : 80;
    if (tag === 'textarea') {
      control.minLength = 20;
      control.rows = 4;
      control.placeholder = 'Добавьте вопрос, аргумент или собственный опыт';
    } else {
      control.autocomplete = name === 'display_name' ? 'nickname' : 'off';
    }
    label.append(control);
    return label;
  }

  async function submitReview(payload, feedback, sendingForm) {
    const submit = sendingForm.querySelector('button[type="submit"]');
    submit.disabled = true;
    feedback.textContent = 'Проверяем сообщение…';
    try {
      const response = await fetch(api, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Не удалось отправить сообщение.');
      feedback.textContent = data.status === 'published'
        ? 'Спасибо! Сообщение опубликовано.'
        : data.status === 'pending_human_review'
          ? 'Спасибо! Сообщение передано на дополнительную проверку.'
          : 'Спасибо! Сообщение получено.';
      sendingForm.reset();
      if (sendingForm === form && sort) form.elements.cultivar_name.value = sort;
      if (data.status === 'published') await loadReviews(payload.parent_id ?? null);
    } catch (error) {
      feedback.textContent = error instanceof Error ? error.message : 'Не удалось отправить сообщение.';
    } finally {
      submit.disabled = false;
    }
  }

  function makeReplyForm(review) {
    const reply = document.createElement('form');
    reply.className = 'review-reply-form';
    reply.id = 'review-reply-form-' + review.id;
    const title = document.createElement('h4');
    title.textContent = 'Ответить: ' + review.display_name;
    const fields = document.createElement('fieldset');
    fields.append(
      makeField('Имя или псевдоним', 'display_name'),
      makeField('Регион', 'region'),
      makeField('Ваш ответ', 'body', 'textarea')
    );
    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.className = 'btn btn-dark';
    submit.textContent = 'Отправить ответ';
    const note = document.createElement('p');
    note.className = 'reviews-smallprint';
    note.textContent = 'Имя, регион и ответ появятся на сайте после проверки JEV.';
    fields.append(submit, note);
    const feedback = document.createElement('p');
    feedback.className = 'review-status';
    feedback.role = 'status';
    feedback.setAttribute('aria-live', 'polite');
    reply.append(title, fields, feedback);
    reply.addEventListener('submit', async event => {
      event.preventDefault();
      if (!reply.reportValidity()) return;
      const values = new FormData(reply);
      await submitReview({
        parent_id: review.id,
        display_name: String(values.get('display_name') || '').trim(),
        region: String(values.get('region') || '').trim(),
        body: String(values.get('body') || '').trim()
      }, feedback, reply);
    });
    return reply;
  }

  function renderReview(review, children, depth = 0) {
    const article = document.createElement('article');
    article.className = review.parent_id == null ? 'review-card' : 'review-card review-card-reply';
    article.dataset.reviewId = String(review.id);
    const meta = document.createElement('div');
    meta.className = 'review-card-meta';
    const cultivar = document.createElement('span');
    cultivar.textContent = review.cultivar_name;
    meta.append(cultivar);
    const body = document.createElement('p');
    body.className = 'review-card-body';
    body.textContent = review.body;
    const footer = document.createElement('div');
    footer.className = 'review-card-footer';
    const author = document.createElement('strong');
    author.textContent = review.display_name;
    const identity = document.createElement('span');
    identity.className = 'review-identity';
    identity.append(author, document.createTextNode(' · ' + review.region));
    const date = document.createElement('time');
    const timestamp = Date.parse(review.published_at || review.created_at);
    if (Number.isFinite(timestamp)) {
      date.dateTime = new Date(timestamp).toISOString();
      date.textContent = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium' }).format(timestamp);
    }
    footer.append(identity, date);
    article.append(meta, body, footer);

    if (enabled && depth < 7) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'review-reply-button';
      button.textContent = 'Ответить';
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-controls', 'review-reply-form-' + review.id);
      button.addEventListener('click', () => {
        const existing = article.querySelector(':scope > .review-reply-form');
        if (existing) {
          existing.remove();
          button.setAttribute('aria-expanded', 'false');
          return;
        }
        article.insertBefore(makeReplyForm(review), article.querySelector(':scope > .review-thread'));
        button.setAttribute('aria-expanded', 'true');
        article.querySelector(':scope > .review-reply-form input')?.focus();
      });
      article.append(button);
    }

    const replies = children.get(review.id) || [];
    if (replies.length) {
      const thread = document.createElement('details');
      thread.className = 'review-thread';
      const summary = document.createElement('summary');
      summary.textContent = 'Ответы · ' + replies.length;
      const items = document.createElement('div');
      items.className = 'review-thread-items';
      const populate = () => {
        if (thread.open && !items.childElementCount) {
          for (const child of replies) items.append(renderReview(child, children, depth + 1));
        }
      };
      thread.addEventListener('toggle', () => {
        if (thread.open) expanded.add(review.id);
        else expanded.delete(review.id);
        populate();
      });
      thread.append(summary, items);
      thread.open = expanded.has(review.id);
      article.append(thread);
      populate();
    }
    return article;
  }

  async function loadReviews(revealId = null) {
    try {
      const response = await fetch(source, { headers: { Accept: 'application/json' }, cache: 'no-store' });
      if (!response.ok) throw new Error('reviews unavailable');
      const data = await response.json();
      if (!Array.isArray(data.reviews)) throw new Error('invalid reviews response');
      const reviews = sort
        ? data.reviews.filter(review => review.cultivar_name?.toLocaleLowerCase('ru-RU') === sort.toLocaleLowerCase('ru-RU'))
        : data.reviews;
      const byId = new Map(reviews.map(review => [review.id, review]));
      if (revealId != null) {
        let current = byId.get(revealId);
        const seen = new Set();
        while (current && !seen.has(current.id)) {
          seen.add(current.id);
          expanded.add(current.id);
          current = byId.get(current.parent_id);
        }
      }
      const children = new Map();
      for (const review of reviews) {
        const parent = review.parent_id;
        if (parent == null || !byId.has(parent)) continue;
        if (!children.has(parent)) children.set(parent, []);
        children.get(parent).push(review);
      }
      const roots = reviews.filter(review => review.parent_id == null);
      if (!roots.length) {
        setMessage(sort ? 'Для этого сорта пока нет опубликованных отзывов.' : enabled ? 'Пока нет опубликованных отзывов. Ваш может стать первым.' : 'Пока нет опубликованных отзывов.');
        return;
      }
      list.replaceChildren();
      for (const review of roots) list.append(renderReview(review, children));
    } catch {
      setMessage('Не удалось загрузить отзывы. Попробуйте позже.');
    }
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!enabled || !form.reportValidity()) return;
    const fields = new FormData(form);
    await submitReview({
      display_name: String(fields.get('display_name') || '').trim(),
      region: String(fields.get('region') || '').trim(),
      cultivar_name: String(fields.get('cultivar_name') || '').trim(),
      body: String(fields.get('body') || '').trim()
    }, status, form);
  });

  loadReviews();
})();
