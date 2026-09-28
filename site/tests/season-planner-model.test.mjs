import test from 'node:test';
import assert from 'node:assert/strict';
import { calendarSources } from '../assets/calendar-model.mjs';
import { seasonMonths, seasonActivities, selectSeasonActivities } from '../assets/season-planner-model.mjs';

test('12 месяцев и каждая работа имеют полный контракт и существующий источник', () => {
  assert.deepEqual(seasonMonths.map(month => month.number), Array.from({ length: 12 }, (_, index) => index + 1));
  const ids = new Set();
  for (const activity of seasonActivities) {
    assert.ok(!ids.has(activity.id), `duplicate id ${activity.id}`);
    ids.add(activity.id);
    assert.ok(['raspberry', 'strawberry'].includes(activity.crop));
    assert.ok(['planting', 'pruning', 'harvest', 'care'].includes(activity.kind));
    assert.ok(activity.title && activity.window && activity.trigger && activity.action);
    assert.ok(calendarSources[activity.source]?.url.startsWith('https://'), `unknown source ${activity.source}`);
    assert.match(activity.href, /^\//);
    assert.ok(activity.months.length);
    assert.ok(activity.months.every(month => Number.isInteger(month) && month >= 1 && month <= 12));
  }
});

test('выбор месяца отвечает для обеих культур круглый год', () => {
  for (const month of seasonMonths) {
    const raspberry = selectSeasonActivities({ crop: 'raspberry', month: month.number });
    const strawberry = selectSeasonActivities({ crop: 'strawberry', month: month.number });
    assert.ok(raspberry.length > 0, `raspberry month ${month.number}`);
    assert.ok(strawberry.length > 0, `strawberry month ${month.number}`);
    assert.ok(raspberry.every(activity => activity.crop === 'raspberry'));
    assert.ok(strawberry.every(activity => activity.crop === 'strawberry'));
  }
});

test('фильтры по месяцу, культуре и задаче работают вместе', () => {
  const tasks = selectSeasonActivities({ crop: 'raspberry', kind: 'pruning', month: '8' });
  assert.ok(tasks.some(activity => activity.id === 'raspberry-prune-summer'));
  assert.ok(tasks.every(activity => activity.crop === 'raspberry' && activity.kind === 'pruning' && activity.months.includes(8)));
  assert.deepEqual(selectSeasonActivities({ crop: 'raspberry', kind: 'pruning', month: 8 }), tasks);
  assert.equal(selectSeasonActivities().length, seasonActivities.length);
});

test('обрезка не смешивает типы плодоношения', () => {
  const raspberry = selectSeasonActivities({ crop: 'raspberry', kind: 'pruning' });
  const summer = raspberry.find(activity => activity.id === 'raspberry-prune-summer');
  const primocane = raspberry.find(activity => activity.id === 'raspberry-prune-primocane-autumn');
  assert.equal(summer.type, 'summer');
  assert.match(summer.action, /Молодые сохраните/);
  assert.equal(primocane.type, 'primocane');
  assert.match(primocane.action, /одного позднего урожая/);
  assert.match(primocane.action, /двух урожаев/);

  const strawberry = selectSeasonActivities({ crop: 'strawberry', kind: 'pruning' });
  const once = strawberry.find(activity => activity.type === 'june');
  const continuous = strawberry.find(activity => activity.type === 'day-neutral');
  assert.match(once.trigger, /Плодоношение завершилось/);
  assert.match(continuous.trigger, /продолжается цветение/);
  assert.match(continuous.action, /не обрезайте всю листву/);
});

test('месяц служит навигацией, у посадки и сбора есть фактический триггер', () => {
  for (const activity of selectSeasonActivities({ kind: 'planting' })) {
    assert.match(activity.trigger, /почв|почк|замороз|укорен|холод/i);
  }
  for (const activity of selectSeasonActivities({ kind: 'harvest' })) {
    assert.match(activity.trigger, /созрел|спел/);
  }
});

test('неверные значения фильтра отвергаются', () => {
  assert.throws(() => selectSeasonActivities({ crop: 'blueberry' }), RangeError);
  assert.throws(() => selectSeasonActivities({ kind: 'spraying' }), RangeError);
  for (const month of [0, 13, 'abc', 2.5]) {
    assert.throws(() => selectSeasonActivities({ month }), RangeError);
  }
});
