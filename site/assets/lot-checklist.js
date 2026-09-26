const root = document.querySelector('#lot-checklist');
if (root) {
  const kind = root.querySelector('[name="planting-stock"]');
  const conditional = [...root.querySelectorAll('[data-stock-kind]')];
  const checks = [...root.querySelectorAll('input[type="checkbox"]')];
  const status = root.querySelector('#checklist-status');
  const request = root.querySelector('#lot-request-text');
  const copy = root.querySelector('#lot-copy');
  const copyStatus = root.querySelector('#lot-copy-status');
  const stockLabels = {
    frigo: 'земляника садовая Frigo',
    tissue: 'растения после In Vitro',
    other: 'другой посадочный материал',
  };
  const update = () => {
    for (const section of conditional) section.hidden = section.dataset.stockKind !== kind.value;
    const activeChecks = checks.filter(item => {
      const section = item.closest('[data-stock-kind]');
      return !section || !section.hidden;
    });
    const checked = activeChecks.filter(item => item.checked).length;
    status.textContent = `Отмечено ${checked} из ${activeChecks.length} пунктов. Это список документов для запроса, а не оценка качества партии.`;
    const missing = activeChecks.filter(item => !item.checked);
    request.value = missing.length
      ? `Здравствуйте! Рассматриваю посадочный материал (${stockLabels[kind.value]}). Пожалуйста, уточните и приложите подтверждение по следующим пунктам для конкретной партии:\n\n${missing.map(item => `• ${item.closest('label').querySelector('span').textContent}`).join('\n')}\n\nСпасибо!`
      : '';
    copy.disabled = missing.length === 0;
    copyStatus.textContent = missing.length ? '' : 'Все пункты отмечены. Сверьте документы с конкретной партией: отметки не подтверждают качество растений.';
  };
  copy.addEventListener('click', async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Буфер обмена недоступен');
      await navigator.clipboard.writeText(request.value);
      copyStatus.textContent = 'Вопросы скопированы. Проверьте текст перед отправкой продавцу.';
    } catch {
      request.focus();
      request.select();
      copyStatus.textContent = 'Текст выделен. Скопируйте его вручную и проверьте перед отправкой.';
    }
  });
  kind.addEventListener('change', update);
  for (const checkbox of checks) checkbox.addEventListener('change', update);
  update();
}
