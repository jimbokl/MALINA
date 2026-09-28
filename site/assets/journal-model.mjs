export const JOURNAL_STORAGE_KEY = 'malina.growerJournal.v1';
export const JOURNAL_SCHEMA_VERSION = 1;
export const MAX_JOURNAL_RECORDS = 500;

export function journalCalendarCrop(search, records = []) {
  const params = new URLSearchParams(search);
  const entry = records.find(record => record.id === params.get('entry'));
  const crop = entry?.crop ?? params.get('crop');
  return crop === 'raspberry' || crop === 'strawberry' ? crop : '';
}

const fields = {
  cultivar: 100,
  region: 100,
  sourceMaterial: 120,
  predecessor: 120,
  conditions: 1000,
  wintering: 1000,
  notes: 2000
};
const settings = new Set(['unknown', 'open', 'tunnel', 'greenhouse', 'container', 'other']);
const harvestMethods = new Set(['weighed', 'estimated', 'unknown']);

function text(value, name, maximum, required = false) {
  if (value != null && typeof value !== 'string') throw new Error(`Неверное поле: ${name}`);
  const result = (value ?? '').trim();
  if ((required && result.length < 2) || result.length > maximum) throw new Error(`Проверьте поле: ${name}`);
  return result;
}

function number(value, name, { integer = false, maximum = 10000000 } = {}) {
  if (value === '' || value == null) return null;
  const normalized = typeof value === 'string' ? value.trim().replace(',', '.') : value;
  if (normalized === '') return null;
  if (typeof normalized !== 'string' && typeof normalized !== 'number') throw new Error(`Неверное число: ${name}`);
  if (typeof normalized === 'string' && !/^\d+(?:\.\d+)?$/.test(normalized)) throw new Error(`Неверное число: ${name}`);
  const result = Number(normalized);
  if (!Number.isFinite(result) || result < 0 || result > maximum || (integer && !Number.isInteger(result))) throw new Error(`Неверное число: ${name}`);
  return result;
}

function date(value, name) {
  if (value == null || value === '') return '';
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`Неверная дата: ${name}`);
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) throw new Error(`Неверная дата: ${name}`);
  return value;
}

function timestamp(value, name) {
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value)) || new Date(value).toISOString() !== value) throw new Error(`Неверная дата записи: ${name}`);
  return value;
}

export function validateJournalRecord(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Неверный формат записи');
  const id = text(raw.id, 'id', 80, true);
  if (!/^[a-zA-Z0-9_-]{8,80}$/.test(id)) throw new Error('Неверный идентификатор записи');
  const crop = raw.crop;
  if (crop !== 'raspberry' && crop !== 'strawberry') throw new Error('Выберите культуру');
  const season = number(raw.season, 'сезон', { integer: true, maximum: 2100 });
  if (season == null || season < 1900) throw new Error('Укажите сезон с 1900 по 2100 год');
  const setting = raw.setting;
  if (!settings.has(setting)) throw new Error('Выберите способ выращивания');
  const harvestMethod = raw.harvestMethod ?? 'unknown';
  if (!harvestMethods.has(harvestMethod)) throw new Error('Укажите способ учёта урожая');
  const record = {
    id,
    parentId: raw.parentId ? text(raw.parentId, 'исходная запись', 80) : '',
    crop,
    cultivar: text(raw.cultivar, 'сорт', fields.cultivar, true),
    region: text(raw.region, 'город или регион', fields.region, true),
    season,
    setting,
    plantingDate: date(raw.plantingDate, 'посадка'),
    plantCount: number(raw.plantCount, 'число растений', { integer: true, maximum: 1000000 }),
    sourceMaterial: text(raw.sourceMaterial, 'посадочный материал', fields.sourceMaterial),
    predecessor: text(raw.predecessor, 'предшественник', fields.predecessor),
    conditions: text(raw.conditions, 'условия участка', fields.conditions),
    winterDate: date(raw.winterDate, 'зимовка'),
    winterLoss: number(raw.winterLoss, 'потери после зимы', { integer: true, maximum: 1000000 }),
    wintering: text(raw.wintering, 'наблюдение после зимы', fields.wintering),
    harvestDate: date(raw.harvestDate, 'сбор'),
    harvestKg: number(raw.harvestKg, 'урожай в килограммах'),
    harvestMethod,
    notes: text(raw.notes, 'заметки', fields.notes),
    createdAt: timestamp(raw.createdAt, 'создание'),
    updatedAt: timestamp(raw.updatedAt, 'изменение')
  };
  if (record.winterLoss != null && !record.winterDate) throw new Error('Укажите дату оценки потерь после зимы');
  if (record.wintering && !record.winterDate) throw new Error('Укажите дату наблюдения после зимы');
  if (record.plantCount != null && record.winterLoss != null && record.winterLoss > record.plantCount) throw new Error('Потери не могут превышать число растений');
  if (record.harvestKg != null && !record.harvestDate) throw new Error('Укажите дату учёта урожая');
  if (record.harvestKg != null && record.harvestMethod === 'unknown') throw new Error('Укажите, взвешен или оценён урожай');
  if (record.parentId && !/^[a-zA-Z0-9_-]{8,80}$/.test(record.parentId)) throw new Error('Неверная ссылка на исходную запись');
  return record;
}

export function makeJournalRecord(raw, { id, now = new Date().toISOString(), previous = null } = {}) {
  return validateJournalRecord({
    ...raw,
    id: previous?.id ?? id,
    parentId: previous?.parentId ?? raw.parentId ?? '',
    createdAt: previous?.createdAt ?? now,
    updatedAt: now
  });
}

export function validateJournalFile(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || raw.schemaVersion !== JOURNAL_SCHEMA_VERSION || !Array.isArray(raw.records)) throw new Error('Неподдерживаемый формат файла журнала');
  if (raw.records.length > MAX_JOURNAL_RECORDS) throw new Error('В файле слишком много записей');
  const records = raw.records.map(validateJournalRecord);
  if (new Set(records.map(record => record.id)).size !== records.length) throw new Error('В файле повторяются идентификаторы записей');
  return { schemaVersion: JOURNAL_SCHEMA_VERSION, records };
}

export function parseJournalFile(value) {
  if (typeof value !== 'string' || value.length > 2_000_000) throw new Error('Файл журнала слишком велик');
  let parsed;
  try { parsed = JSON.parse(value); } catch { throw new Error('Не удалось прочитать JSON-файл'); }
  return validateJournalFile(parsed);
}

export function serializeJournalFile(records) {
  return JSON.stringify(validateJournalFile({ schemaVersion: JOURNAL_SCHEMA_VERSION, records }), null, 2) + '\n';
}

export function mergeJournalRecords(existing, incoming) {
  const old = validateJournalFile({ schemaVersion: JOURNAL_SCHEMA_VERSION, records: existing }).records;
  const added = validateJournalFile({ schemaVersion: JOURNAL_SCHEMA_VERSION, records: incoming }).records;
  const ids = new Set(old.map(record => record.id));
  const unique = added.filter(record => !ids.has(record.id));
  if (old.length + unique.length > MAX_JOURNAL_RECORDS) throw new Error('В журнале может быть не более 500 записей');
  return { records: [...old, ...unique], added: unique.length, skipped: added.length - unique.length };
}

// Calendar entries come only from dates that the grower actually recorded.
export function journalCalendarEvents(records, crop) {
  if (crop !== 'raspberry' && crop !== 'strawberry') throw new Error('Выберите культуру');
  const valid = validateJournalFile({ schemaVersion: JOURNAL_SCHEMA_VERSION, records }).records;
  return valid.filter(record => record.crop === crop).flatMap(record => [
    ...(record.plantingDate ? [{ id: record.id, kind: 'planting', date: record.plantingDate, cultivar: record.cultivar, region: record.region }] : []),
    ...(record.harvestDate ? [{ id: record.id, kind: 'harvest', date: record.harvestDate, cultivar: record.cultivar, region: record.region, harvestKg: record.harvestKg, harvestMethod: record.harvestMethod }] : [])
  ]).sort((a, b) => b.date.localeCompare(a.date) || a.cultivar.localeCompare(b.cultivar, 'ru') || a.kind.localeCompare(b.kind));
}
