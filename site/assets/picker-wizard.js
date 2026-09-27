const form = document.querySelector('#picker-form');
const editResultsButton = document.querySelector('#picker-edit-conditions');

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
