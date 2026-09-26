-- State Register 2024, strawberry row 5801427. Admission is not a local trial.
-- Appendix 4 maps the listed federal subjects to admission regions.
INSERT INTO regions(code, name_ru) VALUES
    ('arkhangelsk-oblast', 'Архангельская область'),
    ('murmansk-oblast', 'Мурманская область'),
    ('karelia', 'Республика Карелия'),
    ('belgorod-oblast', 'Белгородская область'),
    ('voronezh-oblast', 'Воронежская область'),
    ('lipetsk-oblast', 'Липецкая область'),
    ('oryol-oblast', 'Орловская область'),
    ('astrakhan-oblast', 'Астраханская область'),
    ('volgograd-oblast', 'Волгоградская область'),
    ('saratov-oblast', 'Саратовская область'),
    ('orenburg-oblast', 'Оренбургская область'),
    ('bashkortostan', 'Республика Башкортостан'),
    ('chelyabinsk-oblast', 'Челябинская область'),
    ('altai-krai', 'Алтайский край'),
    ('novosibirsk-oblast', 'Новосибирская область'),
    ('omsk-oblast', 'Омская область'),
    ('tomsk-oblast', 'Томская область'),
    ('tyumen-oblast', 'Тюменская область'),
    ('zabaykalsky-krai', 'Забайкальский край'),
    ('irkutsk-oblast', 'Иркутская область'),
    ('krasnoyarsk-krai', 'Красноярский край'),
    ('buryatia', 'Республика Бурятия'),
    ('sakha', 'Республика Саха (Якутия)'),
    ('amur-oblast', 'Амурская область'),
    ('primorsky-krai', 'Приморский край'),
    ('khabarovsk-krai', 'Хабаровский край')
ON CONFLICT(code) DO NOTHING;

WITH mapped(code, admission_region_number, admission_region_name) AS (VALUES
    ('arkhangelsk-oblast', 1, 'Северный'),
    ('murmansk-oblast', 1, 'Северный'),
    ('karelia', 1, 'Северный'),
    ('belgorod-oblast', 5, 'Центрально-Чернозёмный'),
    ('voronezh-oblast', 5, 'Центрально-Чернозёмный'),
    ('lipetsk-oblast', 5, 'Центрально-Чернозёмный'),
    ('oryol-oblast', 5, 'Центрально-Чернозёмный'),
    ('astrakhan-oblast', 8, 'Нижневолжский'),
    ('volgograd-oblast', 8, 'Нижневолжский'),
    ('saratov-oblast', 8, 'Нижневолжский'),
    ('orenburg-oblast', 9, 'Уральский'),
    ('bashkortostan', 9, 'Уральский'),
    ('chelyabinsk-oblast', 9, 'Уральский'),
    ('altai-krai', 10, 'Западно-Сибирский'),
    ('novosibirsk-oblast', 10, 'Западно-Сибирский'),
    ('omsk-oblast', 10, 'Западно-Сибирский'),
    ('tomsk-oblast', 10, 'Западно-Сибирский'),
    ('tyumen-oblast', 10, 'Западно-Сибирский'),
    ('zabaykalsky-krai', 11, 'Восточно-Сибирский'),
    ('irkutsk-oblast', 11, 'Восточно-Сибирский'),
    ('krasnoyarsk-krai', 11, 'Восточно-Сибирский'),
    ('buryatia', 11, 'Восточно-Сибирский'),
    ('sakha', 11, 'Восточно-Сибирский'),
    ('amur-oblast', 12, 'Дальневосточный'),
    ('primorsky-krai', 12, 'Дальневосточный'),
    ('khabarovsk-krai', 12, 'Дальневосточный')
)
INSERT INTO admission_region_map
    (region_id, admission_region_number, admission_region_name, source_id,
     reviewed_by, reviewed_at)
SELECT r.id, mapped.admission_region_number, mapped.admission_region_name,
       s.id, 'codex-source-review', '2026-09-26 12:00:00'
FROM mapped
JOIN regions r ON r.code = mapped.code
JOIN sources s ON s.source_key = 'gsk-register-2024-region-map';

INSERT INTO cultivars
    (crop_id, slug, canonical_name, scientific_name, identity_source_id,
     editorial_status, reviewed_by, reviewed_at, published_at)
VALUES
    ((SELECT id FROM crops WHERE slug='strawberry'), 'festivalnaya',
     'Фестивальная', 'Fragaria L.',
     (SELECT id FROM sources WHERE source_key='gsk-register-2024'),
     'published', 'codex-source-review', '2026-09-26 12:00:00',
     '2026-09-26 12:00:00');

INSERT INTO official_admissions
    (cultivar_id, admission_region_number, registry_entry_code, admitted_year,
     edition_as_of, source_locator, source_id, review_status, reviewed_by,
     reviewed_at, source_pdf_page)
SELECT c.id, zones.admission_region_number, '5801427', 1965, '2024-05-31',
       'Земляника (Fragaria L.), PDF с. 415, строка 5801427 ФЕСТИВАЛЬНАЯ',
       s.id, 'verified', 'codex-source-review', '2026-09-26 12:00:00', 415
FROM (SELECT 1 AS admission_region_number UNION ALL SELECT 2 UNION ALL SELECT 3
      UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6
      UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9
      UNION ALL SELECT 10 UNION ALL SELECT 11) zones
JOIN cultivars c ON c.slug = 'festivalnaya'
JOIN sources s ON s.source_key = 'gsk-register-2024';
