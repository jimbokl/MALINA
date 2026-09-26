-- Appendix 4 of the 2024 State Register maps administrative regions to
-- admission regions. This is an official admission, not a local trial.
INSERT INTO sources
    (source_key, kind, title, author_or_org, url, reference, accessed_on,
     rights_note, review_status, reviewed_by, reviewed_at)
VALUES
    ('gsk-register-2024-region-map', 'document',
     'Регионы допуска в Государственном реестре, 2024', 'Госсорткомиссия',
     'https://gossortrf.ru/upload/iblock/00a/clri6obhudueqx6t1f6awcrsp6vm6psk.pdf',
     'Приложение 4, PDF с. 604: субъекты РФ по регионам допуска', '2026-09-26',
     'Использованы только перечень субъектов и библиографическая ссылка.',
     'verified', 'codex-source-review', '2026-09-26 12:00:00');

INSERT INTO regions(code, name_ru) VALUES
    ('bryansk-oblast', 'Брянская область'),
    ('vladimir-oblast', 'Владимирская область'),
    ('ivanovo-oblast', 'Ивановская область'),
    ('kaluga-oblast', 'Калужская область'),
    ('kirov-oblast', 'Кировская область'),
    ('kostroma-oblast', 'Костромская область'),
    ('krasnodar-krai', 'Краснодарский край'),
    ('nizhny-novgorod-oblast', 'Нижегородская область'),
    ('novgorod-oblast', 'Новгородская область'),
    ('penza-oblast', 'Пензенская область'),
    ('perm-krai', 'Пермский край'),
    ('pskov-oblast', 'Псковская область'),
    ('rostov-oblast', 'Ростовская область'),
    ('ryazan-oblast', 'Рязанская область'),
    ('samara-oblast', 'Самарская область'),
    ('smolensk-oblast', 'Смоленская область'),
    ('stavropol-krai', 'Ставропольский край'),
    ('sverdlovsk-oblast', 'Свердловская область'),
    ('tatarstan', 'Республика Татарстан'),
    ('tver-oblast', 'Тверская область'),
    ('udmurtia', 'Удмуртская Республика'),
    ('chuvashia', 'Чувашская Республика'),
    ('yaroslavl-oblast', 'Ярославская область')
ON CONFLICT(code) DO NOTHING;

WITH mapped(code, admission_region_number, admission_region_name) AS (VALUES
    ('kaliningrad-oblast', 2, 'Северо-Западный'),
    ('kostroma-oblast', 2, 'Северо-Западный'),
    ('novgorod-oblast', 2, 'Северо-Западный'),
    ('pskov-oblast', 2, 'Северо-Западный'),
    ('tver-oblast', 2, 'Северо-Западный'),
    ('yaroslavl-oblast', 2, 'Северо-Западный'),
    ('bryansk-oblast', 3, 'Центральный'),
    ('vladimir-oblast', 3, 'Центральный'),
    ('ivanovo-oblast', 3, 'Центральный'),
    ('kaluga-oblast', 3, 'Центральный'),
    ('ryazan-oblast', 3, 'Центральный'),
    ('smolensk-oblast', 3, 'Центральный'),
    ('kirov-oblast', 4, 'Волго-Вятский'),
    ('nizhny-novgorod-oblast', 4, 'Волго-Вятский'),
    ('perm-krai', 4, 'Волго-Вятский'),
    ('sverdlovsk-oblast', 4, 'Волго-Вятский'),
    ('udmurtia', 4, 'Волго-Вятский'),
    ('chuvashia', 4, 'Волго-Вятский'),
    ('krasnodar-krai', 6, 'Северо-Кавказский'),
    ('rostov-oblast', 6, 'Северо-Кавказский'),
    ('stavropol-krai', 6, 'Северо-Кавказский'),
    ('penza-oblast', 7, 'Средневолжский'),
    ('tatarstan', 7, 'Средневолжский'),
    ('samara-oblast', 7, 'Средневолжский')
)
INSERT INTO admission_region_map
    (region_id, admission_region_number, admission_region_name, source_id,
     reviewed_by, reviewed_at)
SELECT r.id, mapped.admission_region_number, mapped.admission_region_name,
       s.id, 'codex-source-review', '2026-09-26 12:00:00'
FROM mapped
JOIN regions r ON r.code = mapped.code
JOIN sources s ON s.source_key = 'gsk-register-2024-region-map';

-- The GUSAR row itself lists 2, 3, 4, 6, 7 (PDF p. 418).
INSERT INTO official_admissions
    (cultivar_id, admission_region_number, registry_entry_code, admitted_year,
     edition_as_of, source_locator, source_id, review_status, reviewed_by,
     reviewed_at, source_pdf_page)
SELECT c.id, zones.admission_region_number, '9902171', 1999, '2024-05-31',
       'Малина (Rubus idaeus L.), печатная с. 419, строка 9902171 ГУСАР',
       s.id, 'verified', 'codex-source-review', '2026-09-26 12:00:00', 418
FROM (SELECT 2 AS admission_region_number UNION ALL SELECT 4 UNION ALL SELECT 6 UNION ALL SELECT 7) zones
JOIN cultivars c ON c.slug = 'gusar'
JOIN sources s ON s.source_key = 'gsk-register-2024';
