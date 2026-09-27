-- D-03/D-06: second vegetation-year control yield from the same Ryazan trial
-- as 0048. This is a place-bound observation, not a regional selection rule.
UPDATE sources
SET reference = 'Вестник Воронежского государственного аграрного университета. 2017. № 1 (52). С. 27–33. DOI: 10.17238/issn2071-2243.2017.1.27; с. 28–30, материалы и методы; с. 30, таблица 1, строка «Боровицкая – контроль», первый и второй годы вегетации'
WHERE source_key = 'ryazan-borovitskaya-energy-m-trial-2013-2016';

INSERT INTO trait_observations
    (cultivar_id, trait_code, value_number, unit, context_text, region_id,
     source_id, observed_on, review_status, reviewed_by, reviewed_at)
SELECT c.id, 'yield', 1.0, 'кг/м²',
       'ОПХ «Полково», Рязанская область: контрольная «Боровицкая» без обработки препаратом «Энергия-М» дала 1,0 ± 0,01 кг/м² во второй год вегетации. Опыт проводили в 2013–2016 годах.',
       r.id, s.id, NULL, 'verified', 'codex-source-review', '2026-09-27 16:06:00'
FROM cultivars c
JOIN regions r ON r.code = 'ryazan-oblast'
JOIN sources s ON s.source_key = 'ryazan-borovitskaya-energy-m-trial-2013-2016'
              AND s.review_status = 'verified'
WHERE c.slug = 'borovitskaya' AND c.editorial_status = 'published';

INSERT INTO evidence_passports
    (observation_id, evidence_kind, subject_description, material_type,
     setting_text, place_text, period_from, period_to, conditions_json,
     method_text, sample_size, uncertainty_text, source_locator,
     applicability_note, limitations_note, review_status, reviewed_by, reviewed_at)
SELECT o.id, 'published_study',
       'Урожайность контрольных растений клубники «Боровицкая» во второй год вегетации',
       'Живые растения',
       'Открытый грунт; трёхфакторный мелкоделяночный полевой опыт; необработанная контрольная группа',
       'ОПХ «Полково», Рязанский район, Рязанская область',
       '2013', '2016', '{"treatment":"без обработки Энергией-М","vegetation_year":2}',
       'Опыт 2013–2016 годов с четырёхкратной повторностью; таблица 1 приводит среднее для 20 растений. Плотность посадки — 6 растений/м², полив дождеванием; почва дерново-подзолистая супесчаная.',
       20,
       'Таблица не связывает второй год вегетации с отдельным календарным годом; перенос результата на иные участки не проверен.',
       'PDF, с. 28–29, «Материалы и методы»; с. 30, таблица 1, строка «Боровицкая – контроль», второй год вегетации, колонка «Урожайность, кг/м²»',
       'Измерение относится к необработанной контрольной группе во второй год вегетации на участке ОПХ «Полково».',
       'Исследование проверяло регулятор роста на одной площадке; значение не задаёт ожидаемую урожайность другого сада и не обосновывает региональное правило подбора.',
       'verified', 'codex-source-review', '2026-09-27 16:06:00'
FROM trait_observations o
JOIN cultivars c ON c.id = o.cultivar_id AND c.slug = 'borovitskaya'
JOIN sources s ON s.id = o.source_id
              AND s.source_key = 'ryazan-borovitskaya-energy-m-trial-2013-2016'
WHERE o.trait_code = 'yield' AND o.value_number = 1.0
  AND o.unit = 'кг/м²' AND o.region_id = (SELECT id FROM regions WHERE code = 'ryazan-oblast');
