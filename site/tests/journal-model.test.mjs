import test from 'node:test';
import assert from 'node:assert/strict';
import {
  journalCalendarCrop,
  journalCalendarEvents,
  makeJournalRecord,
  mergeJournalRecords,
  parseJournalFile,
  serializeJournalFile,
  validateJournalRecord
} from '../assets/journal-model.mjs';

const base = {
  crop: 'strawberry',
  cultivar: 'Соловушка',
  region: 'Брянская область',
  season: '2026',
  setting: 'open',
  plantingDate: '2026-04-18',
  plantCount: '20',
  conditions: 'Солнечная грядка, капельный полив',
  winterDate: '2026-03-31',
  winterLoss: '2',
  wintering: 'Два куста не вышли после зимы',
  harvestDate: '2026-06-30',
  harvestKg: '3,5',
  harvestMethod: 'weighed',
  notes: 'Сбор взвешивали после каждой волны'
};

test('журнал сохраняет дату, единицы и способ учёта без расчётных выводов', () => {
  const record = makeJournalRecord(base, { id: 'journal_0001', now: '2026-09-27T00:00:00.000Z' });
  assert.equal(record.harvestKg, 3.5);
  assert.equal(record.plantCount, 20);
  assert.equal(record.harvestMethod, 'weighed');
  assert.equal(record.region, 'Брянская область');
  const updated = makeJournalRecord({ ...base, notes: 'Добавили мульчу' }, { previous: record, now: '2026-09-28T00:00:00.000Z' });
  assert.equal(updated.id, record.id);
  assert.equal(updated.createdAt, record.createdAt);
  assert.equal(updated.updatedAt, '2026-09-28T00:00:00.000Z');
});

test('календарь показывает только записанные даты выбранной культуры и сортирует их', () => {
  const strawberry = makeJournalRecord(base, { id: 'journal_dates_strawberry', now: '2026-09-27T00:00:00.000Z' });
  const raspberry = makeJournalRecord({ crop: 'raspberry', cultivar: 'Гусар', region: 'Тула', season: '2026', setting: 'open', plantingDate: '2026-05-02', harvestDate: '2026-07-21' }, { id: 'journal_dates_raspberry', now: '2026-09-27T00:00:00.000Z' });
  const withoutDates = makeJournalRecord({ crop: 'raspberry', cultivar: 'Полька', region: 'Калининград', season: '2026', setting: 'open' }, { id: 'journal_dates_empty', now: '2026-09-27T00:00:00.000Z' });
  const raspberryEvents = journalCalendarEvents([strawberry, raspberry, withoutDates], 'raspberry');
  assert.deepEqual(raspberryEvents.map(event => [event.kind, event.date, event.cultivar]), [
    ['harvest', '2026-07-21', 'Гусар'],
    ['planting', '2026-05-02', 'Гусар']
  ]);
  assert.deepEqual(journalCalendarEvents([strawberry, raspberry, withoutDates], 'strawberry').map(event => event.date), ['2026-06-30', '2026-04-18']);
  assert.equal(journalCalendarEvents([strawberry, raspberry, withoutDates], 'strawberry')[0].harvestKg, 3.5);
  const reloaded = parseJournalFile(serializeJournalFile([strawberry, raspberry, withoutDates])).records;
  assert.deepEqual(journalCalendarEvents(reloaded, 'raspberry'), raspberryEvents);
  assert.throws(() => journalCalendarEvents([strawberry], 'blueberry'), /культуру/);
});

test('переход журнал — календарь и ссылка на запись сохраняют нужную культуру', () => {
  const strawberry = makeJournalRecord(base, { id: 'journal_route_strawberry', now: '2026-09-27T00:00:00.000Z' });
  assert.equal(journalCalendarCrop('?crop=strawberry'), 'strawberry');
  assert.equal(journalCalendarCrop('?crop=raspberry'), 'raspberry');
  assert.equal(journalCalendarCrop(`?entry=${strawberry.id}`, [strawberry]), 'strawberry');
  assert.equal(journalCalendarCrop(`?crop=raspberry&entry=${strawberry.id}`, [strawberry]), 'strawberry');
  assert.equal(journalCalendarCrop('?crop=blueberry'), '');
});

test('незавершённый сезон можно сохранить и дополнить позже', () => {
  const record = makeJournalRecord({ crop: 'raspberry', cultivar: 'Гусар', region: 'Тула', season: '2026', setting: 'unknown' }, { id: 'journal_0002', now: '2026-09-27T00:00:00.000Z' });
  assert.equal(record.setting, 'unknown');
  assert.equal(record.harvestKg, null);
  assert.equal(record.winterDate, '');
  assert.equal(record.notes, '');
});

test('несогласованные даты и измерения не попадают в журнал', () => {
  const create = values => makeJournalRecord({ ...base, ...values }, { id: 'journal_0003', now: '2026-09-27T00:00:00.000Z' });
  assert.throws(() => create({ harvestDate: '2026-02-30' }), /Неверная дата/);
  assert.throws(() => create({ harvestDate: '', harvestKg: '3,5' }), /дату учёта/);
  assert.throws(() => create({ winterDate: '', winterLoss: '2' }), /дату оценки/);
  assert.throws(() => create({ winterLoss: '21' }), /Потери/);
  assert.throws(() => create({ harvestMethod: 'unknown' }), /взвешен или оценён/);
  assert.throws(() => create({ harvestKg: 'Infinity' }), /Неверное число/);
});

test('экспорт и импорт валидируют схему и не переносят лишние поля', () => {
  const record = makeJournalRecord(base, { id: 'journal_0004', now: '2026-09-27T00:00:00.000Z' });
  const json = serializeJournalFile([{ ...record, email: 'ignore@example.org' }]);
  const restored = parseJournalFile(json);
  assert.equal(restored.schemaVersion, 1);
  assert.deepEqual(restored.records, [record]);
  assert.equal('email' in restored.records[0], false);
  assert.throws(() => parseJournalFile('{broken'), /JSON/);
  assert.throws(() => parseJournalFile('{"schemaVersion":2,"records":[]}'), /формат/);
  assert.throws(() => validateJournalRecord({ ...record, harvestDate: '2026-06-31' }), /дата/);
});

test('повторный импорт пропускает те же записи и сохраняет новые', () => {
  const first = makeJournalRecord(base, { id: 'journal_0005', now: '2026-09-27T00:00:00.000Z' });
  const second = makeJournalRecord({ ...base, season: '2027', harvestDate: '', harvestKg: '', harvestMethod: 'unknown' }, { id: 'journal_0006', now: '2026-09-27T00:00:00.000Z' });
  const merged = mergeJournalRecords([first], [first, second]);
  assert.equal(merged.added, 1);
  assert.equal(merged.skipped, 1);
  assert.deepEqual(merged.records.map(record => record.id), ['journal_0005', 'journal_0006']);
});
