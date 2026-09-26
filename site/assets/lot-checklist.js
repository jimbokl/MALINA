const root = document.querySelector('#lot-checklist');
if (root) {
  const kind = root.querySelector('[name="planting-stock"]');
  const conditional = [...root.querySelectorAll('[data-stock-kind]')];
  const checks = [...root.querySelectorAll('input[type="checkbox"]')];
  const status = root.querySelector('#checklist-status');
  const update = () => {
    for (const section of conditional) section.hidden = section.dataset.stockKind !== kind.value;
    const activeChecks = checks.filter(item => {
      const section = item.closest('[data-stock-kind]');
      return !section || !section.hidden;
    });
    const checked = activeChecks.filter(item => item.checked).length;
    status.textContent = `Отмечено ${checked} из ${activeChecks.length} пунктов. Это список документов для запроса, а не оценка качества партии.`;
  };
  kind.addEventListener('change', update);
  for (const checkbox of checks) checkbox.addEventListener('change', update);
  update();
}
