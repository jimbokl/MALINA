-- Classification facts only. Neither these sources nor the website entries
-- imply a regional recommendation, nursery stock, or expected yield in Russia.
INSERT INTO sources
    (source_key, kind, title, author_or_org, url, accessed_on, rights_note,
     review_status, reviewed_by, reviewed_at)
VALUES
    ('fnc-raspberry-breeding', 'website', 'Генетика и селекция: ремонтантная малина', 'ФНЦ Садоводства',
     'https://vstisp.org/vstisp/index.php/nauchnaya-deyatelnost/genetika-i-selektsiya', '2026-09-26',
     'Использованы только названия и тип плодоношения; изображение не копируется.', 'verified', 'codex-source-review', '2026-09-26 18:00:00'),
    ('fnc-raspberry-yellow', 'website', 'Жёлтоплодные сорта малины', 'ФНЦ Садоводства',
     'https://vstisp.org/vstisp/index.php/2-icetheme/sample-news/uncategorized/1542-ivan-kupala-i-salyut-dva-novykh-konkurentosposobnykh-sorta-maliny', '2026-09-26',
     'Использованы только названия и окраска ягоды; медицинские утверждения не перенесены.', 'verified', 'codex-source-review', '2026-09-26 18:00:00'),
    ('fnc-raspberry-nursery-2022', 'website', 'Каталог питомника: малина, осень 2022', 'ФНЦ Садоводства',
     'https://vstisp.org/vstisp/index.php/component/content/article/11-icetheme/sample-news/1460-oks-vesna-2022', '2026-09-26',
     'Использованы только названия, окраска и тип; исторические цены не перенесены.', 'verified', 'codex-source-review', '2026-09-26 18:00:00'),
    ('rhs-yellow-antwerp', 'website', 'Rubus idaeus Yellow Antwerp', 'Royal Horticultural Society',
     'https://www.rhs.org.uk/plants/131912/rubus-idaeus-yellow-antwerp-f/details', '2026-09-26',
     'Только краткий пересказ; британская оценка зимостойкости не перенесена.', 'verified', 'codex-source-review', '2026-09-26 18:00:00'),
    ('rhs-all-gold', 'website', 'Rubus idaeus All Gold', 'Royal Horticultural Society',
     'https://www.rhs.org.uk/plants/226554/rubus-idaeus-all-gold-f/details', '2026-09-26',
     'Только краткий пересказ; британская оценка зимостойкости не перенесена.', 'verified', 'codex-source-review', '2026-09-26 18:00:00'),
    ('umn-raspberry-types', 'website', 'Raspberry types and varieties', 'University of Minnesota Extension',
     'https://extension.umn.edu/agriculture/specialty-crops/commercial-fruit-production/raspberry-farming/raspberry-types-and-varieties', '2026-09-26',
     'Только названия, цвета и группы; применимость для России не заявляется.', 'verified', 'codex-source-review', '2026-09-26 18:00:00');

CREATE TEMP TABLE raspberry_atlas_seed (
    slug TEXT PRIMARY KEY, name_ru TEXT NOT NULL, source_key TEXT NOT NULL,
    fruit_color TEXT NOT NULL, fruiting TEXT NOT NULL
) STRICT;

INSERT INTO raspberry_atlas_seed VALUES
    ('zhuravlik', 'Журавлик', 'fnc-raspberry-nursery-2022', 'Красная', 'Ремонтантная'),
    ('beglyanka', 'Беглянка', 'fnc-raspberry-nursery-2022', 'Жёлтая', ''),
    ('meteor', 'Метеор', 'fnc-raspberry-nursery-2022', 'Красная', ''),
    ('solnyshko', 'Солнышко', 'fnc-raspberry-nursery-2022', 'Красная', ''),
    ('peresvet', 'Пересвет', 'fnc-raspberry-nursery-2022', 'Красная', ''),
    ('atlant', 'Атлант', 'fnc-raspberry-breeding', '', 'Ремонтантная'),
    ('abrikosovaya', 'Абрикосовая', 'fnc-raspberry-breeding', '', 'Ремонтантная'),
    ('bryanskoe-divo', 'Брянское диво', 'fnc-raspberry-breeding', '', 'Ремонтантная'),
    ('gerakl', 'Геракл', 'fnc-raspberry-breeding', '', 'Ремонтантная'),
    ('evraziya', 'Евразия', 'fnc-raspberry-breeding', '', 'Ремонтантная'),
    ('zhar-ptitsa', 'Жар-птица', 'fnc-raspberry-breeding', '', 'Ремонтантная'),
    ('oranzhevoe-chudo', 'Оранжевое чудо', 'fnc-raspberry-breeding', 'Жёлтая', 'Ремонтантная'),
    ('pingvin', 'Пингвин', 'fnc-raspberry-breeding', '', 'Ремонтантная'),
    ('rubinovoe-ozherele', 'Рубиновое ожерелье', 'fnc-raspberry-breeding', '', 'Ремонтантная'),
    ('zolotaya-osen', 'Золотая осень', 'fnc-raspberry-yellow', 'Жёлтая', ''),
    ('zolotye-kupola', 'Золотые купола', 'fnc-raspberry-yellow', 'Жёлтая', ''),
    ('yellow-antwerp', 'Йеллоу Антверп', 'rhs-yellow-antwerp', 'Жёлтая', 'Летняя'),
    ('all-gold', 'Олл Голд', 'rhs-all-gold', 'Жёлтая', 'Ремонтантная'),
    ('polana', 'Полана', 'umn-raspberry-types', 'Красная', 'Ремонтантная'),
    ('caroline', 'Кэролайн', 'umn-raspberry-types', 'Красная', 'Ремонтантная'),
    ('heritage', 'Херитейдж', 'umn-raspberry-types', 'Красная', 'Ремонтантная'),
    ('anne', 'Энн', 'umn-raspberry-types', 'Жёлтая', 'Ремонтантная'),
    ('double-gold', 'Дабл Голд', 'umn-raspberry-types', 'Жёлтая', 'Ремонтантная'),
    ('prelude', 'Прелюд', 'umn-raspberry-types', 'Красная', 'Летняя'),
    ('nova', 'Нова', 'umn-raspberry-types', 'Красная', 'Летняя'),
    ('encore', 'Энкор', 'umn-raspberry-types', 'Красная', 'Летняя');

INSERT INTO cultivars
    (crop_id, slug, canonical_name, scientific_name, identity_source_id,
     editorial_status, reviewed_by, reviewed_at, published_at)
SELECT (SELECT id FROM crops WHERE slug='raspberry'), d.slug, d.name_ru, 'Rubus idaeus L.',
       s.id, 'published', 'codex-source-review', '2026-09-26 18:00:00', '2026-09-26 18:00:00'
FROM raspberry_atlas_seed d JOIN sources s ON s.source_key=d.source_key;

INSERT INTO trait_definitions(code, label_ru, value_kind)
VALUES ('fruit_color', 'Окраска ягод', 'text');

INSERT INTO trait_observations
    (cultivar_id, trait_code, value_text, context_text, source_id,
     review_status, reviewed_by, reviewed_at)
SELECT c.id, 'fruit_color', d.fruit_color,
       'Окраска из первоисточника; не свидетельствует о местной пригодности.',
       CASE WHEN d.slug='oranzhevoe-chudo' THEN (SELECT id FROM sources WHERE source_key='fnc-raspberry-yellow') ELSE s.id END,
       'verified', 'codex-source-review', '2026-09-26 18:00:00'
FROM raspberry_atlas_seed d
JOIN cultivars c ON c.slug=d.slug
JOIN sources s ON s.source_key=d.source_key
WHERE d.fruit_color!='';

INSERT INTO trait_observations
    (cultivar_id, trait_code, value_text, context_text, source_id,
     review_status, reviewed_by, reviewed_at)
SELECT c.id, 'fruiting_cycle', d.fruiting,
       'Группа плодоношения из первоисточника; сроки для регионов России не переносились.', s.id,
       'verified', 'codex-source-review', '2026-09-26 18:00:00'
FROM raspberry_atlas_seed d
JOIN cultivars c ON c.slug=d.slug
JOIN sources s ON s.source_key=d.source_key
WHERE d.fruiting!='';

DROP TABLE raspberry_atlas_seed;
