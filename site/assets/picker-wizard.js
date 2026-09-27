const form = document.querySelector('#picker-form');
const editResultsButton = document.querySelector('#picker-edit-conditions');
const pickerOutput = document.querySelector('#picker-output');
const pickerResults = document.querySelector('#picker-results');
const showMoreButton = document.querySelector('#picker-show-more');

if (pickerOutput && pickerResults && showMoreButton) {
  const pageSize = 8;
  let shown = pageSize;

  const refreshPage = () => {
    const cards = [...pickerResults.querySelectorAll('.variety-card')]
      .filter(card => card.dataset.pickerVisible === 'true');
    const selectedLast = cards.findLastIndex(card => card.querySelector('.picker-compare-checkbox')?.checked);
    shown = Math.max(shown, selectedLast + 1);
    for (const [index, card] of cards.entries()) card.hidden = index >= shown;

    for (const heading of pickerResults.querySelectorAll('.picker-group-heading')) {
      let hasShownCard = false;
      for (let card = heading.nextElementSibling; card?.classList.contains('variety-card'); card = card.nextElementSibling) {
        if (!card.hidden) { hasShownCard = true; break; }
      }
      heading.hidden = !hasShownCard;
    }

    const remaining = Math.max(0, cards.length - shown);
    showMoreButton.hidden = remaining === 0;
    if (remaining) showMoreButton.textContent = `Показать ещё ${Math.min(pageSize, remaining)} из ${remaining}`;
  };

  pickerOutput.addEventListener('picker:results', () => {
    shown = pageSize;
    refreshPage();
  });
  pickerOutput.addEventListener('picker:order-change', refreshPage);
  showMoreButton.addEventListener('click', () => {
    const firstNew = [...pickerResults.querySelectorAll('.variety-card')]
      .find(card => card.dataset.pickerVisible === 'true' && card.hidden);
    shown += pageSize;
    refreshPage();
    pickerOutput.dispatchEvent(new Event('picker:page'));
    firstNew?.querySelector('h3 a')?.focus({ preventScroll: true });
    firstNew?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  });
}

if (form && editResultsButton) {
  editResultsButton.addEventListener('click', () => {
    const output = document.querySelector('#picker-output');
    const memo = document.querySelector('#picker-memo');
    if (output) output.hidden = true;
    if (memo) memo.hidden = true;
    form.scrollIntoView({
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      block: 'start'
    });
    form.querySelector('#picker-region')?.focus({ preventScroll: true });
  });
}
