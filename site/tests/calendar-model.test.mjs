import test from 'node:test';
import assert from 'node:assert/strict';
import { makeCalendar, calendarSources, calendarPhases } from '../assets/calendar-model.mjs';

test('летняя малина после урожая сохраняет молодые побеги', () => {
  const plan = makeCalendar({ crop: 'raspberry', type: 'summer', phase: 'after' });
  assert.match(plan.current.action, /молодые сохраните/);
  assert.equal(plan.current.source, 'raspberry');
  assert.equal(plan.next.id, 'dormant');
});

test('ремонтантная малина не получает преждевременную и неверную схему обрезки', () => {
  const after = makeCalendar({ crop: 'raspberry', type: 'primocane', scheme: 'single', phase: 'after' });
  const dormant = makeCalendar({ crop: 'raspberry', type: 'primocane', scheme: 'single', phase: 'dormant' });
  const double = makeCalendar({ crop: 'raspberry', type: 'primocane', scheme: 'double', phase: 'dormant' });
  assert.match(after.current.action, /период покоя/);
  assert.match(dormant.current.action, /обрежьте/);
  assert.doesNotMatch(double.current.action, /обрежьте.*все/);
  assert.match(double.current.action, /сохраните побеги/);
});

test('неизвестный тип не назначает сплошную обрезку', () => {
  for (const crop of ['raspberry', 'strawberry']) {
    const plan = makeCalendar({ crop, type: 'unknown', phase: 'after' });
    assert.match(plan.uncertainty, /не подтверждён/);
    assert.match(plan.current.action, /не срезайте все|Не назначайте сплошную/);
  }
});

test('послесборовый уход различает однократную и нейтральнодневную клубнику', () => {
  const once = makeCalendar({ crop: 'strawberry', type: 'june', phase: 'after' });
  const continuous = makeCalendar({ crop: 'strawberry', type: 'day-neutral', phase: 'after' });
  assert.match(once.current.caveat, /не срезайте листья автоматически/);
  assert.match(continuous.current.action, /не применяйте сплошную обрезку/);
});

test('заморозок во время цветения меняет шаг только при прогнозе', () => {
  const yes = makeCalendar({ crop: 'strawberry', type: 'june', phase: 'flowers', frostForecast: true });
  const no = makeCalendar({ crop: 'strawberry', type: 'june', phase: 'flowers', frostForecast: false });
  assert.match(yes.current.action, /укройте/);
  assert.match(no.current.action, /только при реальной угрозе/);
});

test('каждая фаза имеет источник и последовательность', () => {
  for (const crop of ['raspberry', 'strawberry']) for (const phase of calendarPhases) {
    const plan = makeCalendar({ crop, phase: phase.id });
    assert.ok(calendarSources[plan.current.source]?.url.startsWith('https://'));
    assert.equal(plan.sequence.filter(entry => entry.state === 'current').length, 1);
  }
  assert.throws(() => makeCalendar({ crop: 'other', phase: 'after' }), RangeError);
  assert.throws(() => makeCalendar({ crop: 'raspberry', type: 'june', phase: 'after' }), RangeError);
});
