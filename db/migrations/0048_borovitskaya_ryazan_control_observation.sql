-- D-03/D-06: one place-bound control yield from a Ryazan strawberry field trial.
-- The experiment tested a growth regulator, not regional cultivar suitability;
-- do not create a regional recommendation from this observation.
INSERT INTO sources
    (source_key, kind, title, author_or_org, url, reference, accessed_on,
     rights_note, review_status, reviewed_by, reviewed_at)
VALUES
    ('ryazan-borovitskaya-energy-m-trial-2013-2016', 'document',
     'Эффективность применения регулятора роста при выращивании земляники садовой в открытом грунте',
     'Ф. А. Мусаев, О. А. Захарова, А. В. Кобелева · Рязанский ГАТУ',
     'https://vestnik.vsau.ru/wp-content/uploads/2017/05/27-33.pdf',
     'Вестник Воронежского государственного аграрного университета. 2017. № 1 (52). С. 27–33. DOI: 10.17238/issn2071-2243.2017.1.27; с. 28–30, материалы и методы; с. 30, таблица 1, строка «Боровицкая – контроль», первый год вегетации',
     '2026-09-27',
     'Использованы отдельное численное значение и краткое описание методики с прямой ссылкой; текст и таблица публикации не воспроизводятся.',
     'verified', 'codex-source-review', '2026-09-27 15:28:00');

INSERT INTO trait_observations
    (cultivar_id, trait_code, value_number, unit, context_text, region_id,
     source_id, observed_on, review_status, reviewed_by, reviewed_at)
SELECT c.id, 'yield', 1.2, 'кг/м²',
       'В мелкоделяночном опыте ОПХ «Полково» контрольная «Боровицкая» без обработки препаратом «Энергия-М» дала 1,2 ± 0,02 кг/м² за первый год вегетации растений. Это значение одной группы опыта, а не прогноз урожая для Рязанской области; конкретный календарный год этой строки не указан.',
       r.id, s.id, NULL, 'verified', 'codex-source-review', '2026-09-27 15:28:00'
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
       'Урожайность контрольных растений клубники «Боровицкая» в первый год вегетации',
       'Живые растения',
       'Открытый грунт; трёхфакторный мелкоделяночный полевой опыт; необработанная контрольная группа',
       'ОПХ «Полково», Рязанский район, Рязанская область',
       '2013', '2016',
       '{"treatment":"без обработки Энергией-М","vegetation_year":1}',
       'Опыт 2013–2016 годов с четырёхкратной повторностью; в таблице 1 приведено среднее для 20 растений. Плотность посадки — 6 растений/м², применяли полив дождеванием; почва дерново-подзолистая супесчаная.',
       20,
       'Таблица разделяет первый и второй годы вегетации, но не связывает строку с отдельным календарным годом; источник не проверяет перенос результата на иные участки.',
       'PDF, с. 28–29, «Материалы и методы»; с. 30, таблица 1, строка «Боровицкая – контроль», первый год вегетации, колонка «Урожайность, кг/м²»',
       'Наблюдение относится к необработанной контрольной группе этого опыта в Рязанском районе.',
       'Исследование оценивало обработку регулятором роста, а не региональную пригодность сорта. Результат одной площадки и группы не обосновывает региональное правило подбора или ожидаемую урожайность другого сада.',
       'verified', 'codex-source-review', '2026-09-27 15:28:00'
FROM trait_observations o
JOIN cultivars c ON c.id = o.cultivar_id AND c.slug = 'borovitskaya'
JOIN sources s ON s.id = o.source_id
              AND s.source_key = 'ryazan-borovitskaya-energy-m-trial-2013-2016'
WHERE o.trait_code = 'yield' AND o.value_number = 1.2
  AND o.unit = 'кг/м²' AND o.region_id = (SELECT id FROM regions WHERE code = 'ryazan-oblast');
