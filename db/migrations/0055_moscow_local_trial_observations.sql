-- D-04/W-03: preserve measurements from named Moscow Oblast studies.
-- This migration adds observations only, never recommendation rules.

-- The 2008 primary publication explicitly names Moscow Oblast in its title.
-- The exact site remains unknown in the existing passports; harvest years are
-- available for these two table rows, unlike the narrative Borovitskaya value.
UPDATE trait_observations
SET region_id = (SELECT id FROM regions WHERE code = 'moscow-oblast'),
    reviewed_by = 'codex-source-review', reviewed_at = '2026-10-05 10:00:00'
WHERE cultivar_id IN (SELECT id FROM cultivars WHERE slug IN ('rusich', 'zenga-zengana'))
  AND source_id = (SELECT id FROM sources WHERE source_key = 'vniispk-strawberry-moscow-comparison-2006-2007')
  AND trait_code = 'yield' AND observed_on = '2006–2007';

INSERT INTO trait_observations
    (cultivar_id, trait_code, value_number, unit, context_text, region_id,
     source_id, observed_on, review_status, reviewed_by, reviewed_at)
SELECT c.id, 'berry_weight_g', 3.7, 'г',
       'Средняя масса ягоды «Золотых куполов» в Волоколамском районе: 3,8 г в 2023 году, 3,6 г в 2024 году; средняя за два года — 3,7 г.',
       r.id, s.id, '2023–2024', 'verified', 'codex-source-review', '2026-10-05 10:00:00'
FROM cultivars c JOIN regions r ON r.code = 'moscow-oblast'
JOIN sources s ON s.source_key = 'mgau-volokolamsk-raspberry-comparison-2023-2024'
WHERE c.slug = 'zolotye-kupola' AND c.editorial_status = 'published';

INSERT INTO evidence_passports
    (observation_id, evidence_kind, subject_description, material_type,
     setting_text, place_text, period_from, period_to, conditions_json,
     method_text, uncertainty_text, source_locator, applicability_note,
     limitations_note, review_status, reviewed_by, reviewed_at)
SELECT o.id, 'published_study', 'Средняя масса ягоды ремонтантной малины «Золотые купола»',
       'Живые растения', 'КФХ; сравнительное исследование ремонтантных сортов',
       'КФХ «АгроЭкоИнвест», Волоколамский район, Московская область', '2023', '2024',
       '{"comparison_control":"Бабье лето","values_by_year_g":{"2023":3.8,"2024":3.6}}',
       'Использована средняя масса из таблицы 2. НСР05: 0,8 г в 2023 году, 0,6 г в 2024 году, 0,7 г для среднего за два года.',
       'Размер делянок, число повторностей и агротехника не приведены.',
       'PDF, с. 3, таблица 2 «Масса ягод малины», строка «Золотые купола», столбец «Среднее»',
       'Измеренная средняя масса в указанном хозяйстве за два сезона.',
       'Не устанавливает массу ягод или урожай на другом участке.',
       'verified', 'codex-source-review', '2026-10-05 10:00:00'
FROM trait_observations o JOIN cultivars c ON c.id = o.cultivar_id
JOIN sources s ON s.id = o.source_id
WHERE c.slug = 'zolotye-kupola' AND o.trait_code = 'berry_weight_g'
  AND s.source_key = 'mgau-volokolamsk-raspberry-comparison-2023-2024';

INSERT INTO sources
    (source_key, kind, title, author_or_org, url, reference, accessed_on,
     rights_note, review_status, reviewed_by, reviewed_at)
VALUES
    ('kubansad-moscow-strawberry-fertigation-2010-2012', 'document',
     'Роль генотипа и условий среды в формировании урожая земляники садовой при капельном орошении и фертигации в Нечерноземной зоне РФ',
     'Л. В. Помякшева · ВСТИСП', 'https://journalkubansad.ru/pdf/18/01/04.pdf',
     'Плодоводство и виноградарство Юга России. 2018. №49(01), с.47–55; методика с.50–51, таблица 1 с.52',
     '2026-10-05', 'Использованы отдельные фактические значения и краткий пересказ методики с прямой ссылкой.',
     'verified', 'codex-source-review', '2026-10-05 10:00:00'),
    ('kgau-kleri-kolomna-fruit-quality-2022-2023', 'document',
     'Сравнение промышленных сортов земляники садовой Fragaria × Ananassa в условиях Московской области',
     'О. В. Ладыженская, М. В. Симахин, В. А. Крючкова, В. Г. Донских', 'https://www.kgau.ru/university/nasha-pressa/vestnik/2024_7/content/07.pdf',
     'Вестник КрасГАУ. 2024. №7(208), с.57–63. DOI 10.36718/1819-4036-2024-7-57-63; таблица 1 с.60 (PDF с.4)',
     '2026-10-05', 'Использовано отдельное значение массы с кратким пересказом условий и ссылкой на первичную публикацию.',
     'verified', 'codex-source-review', '2026-10-05 10:00:00');

WITH facts(slug, min_yield, max_yield, context_text) AS (VALUES
    ('honey', 85.0, 162.2, 'Урожайность «Хонея» в Ленинском районе Московской области: 114,3 ц/га в 2010 году, 85,0 ц/га в 2011 году и 162,2 ц/га в 2012 году; значения усреднены по шести вариантам опыта.'),
    ('rusich', 55.6, 100.3, 'Урожайность «Русича» в том же опыте: 70,2 ц/га в 2010 году, 55,6 ц/га в 2011 году и 100,3 ц/га в 2012 году; значения усреднены по шести вариантам опыта.')
)
INSERT INTO trait_observations
    (cultivar_id, trait_code, value_number, value_max, unit, context_text,
     region_id, source_id, observed_on, review_status, reviewed_by, reviewed_at)
SELECT c.id, 'yield', f.min_yield, f.max_yield, 'ц/га', f.context_text,
       r.id, s.id, '2010–2012', 'verified', 'codex-source-review', '2026-10-05 10:00:00'
FROM facts f JOIN cultivars c ON c.slug = f.slug AND c.editorial_status = 'published'
JOIN regions r ON r.code = 'moscow-oblast'
JOIN sources s ON s.source_key = 'kubansad-moscow-strawberry-fertigation-2010-2012';

INSERT INTO evidence_passports
    (observation_id, evidence_kind, subject_description, material_type,
     setting_text, place_text, period_from, period_to, conditions_json,
     method_text, uncertainty_text, source_locator, applicability_note,
     limitations_note, review_status, reviewed_by, reviewed_at)
SELECT o.id, 'published_study', 'Фактическая урожайность клубники «' || c.canonical_name || '»',
       'Живые растения', 'Открытый грунт; капельное орошение; шесть вариантов питания и мульчирования',
       'Ленинский район, Московская область', '2010', '2012',
       '{"planting_year":2009,"plant_density_per_ha":80000,"rows_per_bed":4,"treatment_count":6,"soil":"Окультуренная дерново-подзолистая среднесуглинистая"}',
       'В таблице 1 приведены годовые значения, усреднённые по вариантам опыта. В наблюдении сохранены минимум и максимум трёх годовых значений; это не диапазон повторностей и не один режим питания.',
       'Число повторностей, площадь делянки, метод непосредственного учёта урожая и точный адрес внутри района не сообщены.',
       'PDF с.6 / печатная с.52, таблица 1, строка «' || c.canonical_name || '»; методика PDF с.4–5 / печатные с.50–51',
       'Результаты указанного опыта с поливом и разными вариантами питания за три сезона.',
       'Не является прогнозом урожая или результатом выращивания без полива и удобрений.',
       'verified', 'codex-source-review', '2026-10-05 10:00:00'
FROM trait_observations o JOIN cultivars c ON c.id = o.cultivar_id
JOIN sources s ON s.id = o.source_id
WHERE s.source_key = 'kubansad-moscow-strawberry-fertigation-2010-2012';

INSERT INTO trait_observations
    (cultivar_id, trait_code, value_number, unit, context_text, region_id,
     source_id, observed_on, review_status, reviewed_by, reviewed_at)
SELECT c.id, 'berry_weight_g', 18.0, 'г',
       'Средняя масса ягод «Клери» в хозяйстве «Коломенская ягода» за 2022–2023 годы — 18,0 г; в таблице указано 18,0 ± 3,3 г.',
       r.id, s.id, '2022–2023', 'verified', 'codex-source-review', '2026-10-05 10:00:00'
FROM cultivars c JOIN regions r ON r.code = 'moscow-oblast'
JOIN sources s ON s.source_key = 'kgau-kleri-kolomna-fruit-quality-2022-2023'
WHERE c.slug = 'kleri' AND c.editorial_status = 'published';

INSERT INTO evidence_passports
    (observation_id, evidence_kind, subject_description, material_type,
     setting_text, place_text, period_from, period_to, conditions_json,
     method_text, sample_size, uncertainty_text, source_locator,
     applicability_note, limitations_note, review_status, reviewed_by, reviewed_at)
SELECT o.id, 'published_study', 'Масса ягод клубники «Клери» в производственной посадке',
       'Свежие ягоды', 'Фермерское хозяйство; посадка 2022 года; капельный полив, агроткань',
       'Хозяйство «Коломенская ягода», село Мячково, Коломенский округ, Московская область',
       '2022', '2023', '{"planting_year":2022,"spacing_m":[2.0,0.3],"mulch_density_g_m2":120,"soil":"Серая лесная суглинистая"}',
       'Случайная выборка по 30 плодов; массу измеряли весами. Таблица 1 показывает среднее за два года.',
       30, 'Авторы приводят ±3,3 г, но не поясняют, означает ли знак стандартное отклонение или стандартную ошибку.',
       'PDF с.4 / печатная с.60, таблица 1, строка «Клери», столбец массы; место PDF с.3 / печатная с.59',
       'Измерение массы ягод в названном хозяйстве за 2022–2023 годы.',
       'Работа о качестве ягод не устанавливает урожайность, зимостойкость или устойчивость к болезням.',
       'verified', 'codex-source-review', '2026-10-05 10:00:00'
FROM trait_observations o JOIN cultivars c ON c.id = o.cultivar_id
JOIN sources s ON s.id = o.source_id
WHERE c.slug = 'kleri' AND o.trait_code = 'berry_weight_g'
  AND s.source_key = 'kgau-kleri-kolomna-fruit-quality-2022-2023';
