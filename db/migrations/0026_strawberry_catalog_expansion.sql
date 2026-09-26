-- Only directly stated cultivar traits are recorded. Foreign descriptions do
-- not imply suitability or harvest dates for Russian cities.
INSERT INTO sources
    (source_key, kind, title, author_or_org, url, accessed_on, rights_note,
     review_status, reviewed_by, reviewed_at)
VALUES
    ('fnc-strawberry-tsaritsa', 'website', 'Царица', 'ФНЦ Садоводства',
     'https://vstisp.org/vstisp/index.php/11-icetheme/sample-news/1442-tsaritsa', '2026-09-26',
     'Краткий пересказ признаков; фотографии источника не используются.', 'verified', 'codex-source-review', '2026-09-26 21:30:00'),
    ('fnc-strawberry-bereginya', 'website', 'Берегиня', 'ФНЦ Садоводства',
     'https://vstisp.org/vstisp/index.php/component/content/article/11-icetheme/sample-news/1446-bereginya', '2026-09-26',
     'Краткий пересказ признаков; фотографии источника не используются.', 'verified', 'codex-source-review', '2026-09-26 21:30:00'),
    ('civ-strawberry-clery', 'website', 'Clery', 'CIV',
     'https://civ.it/en/strawberries/clery/', '2026-09-26',
     'Краткий пересказ признаков; фотографии источника не используются.', 'verified', 'codex-source-review', '2026-09-26 21:30:00'),
    ('civ-strawberry-aprica', 'website', 'Aprica', 'CIV',
     'https://civ.it/en/strawberries/apricapbr/', '2026-09-26',
     'Краткий пересказ признаков; фотографии источника не используются.', 'verified', 'codex-source-review', '2026-09-26 21:30:00'),
    ('civ-strawberry-joly', 'website', 'Joly', 'CIV',
     'https://civ.it/en/strawberries/jolypbr/', '2026-09-26',
     'Краткий пересказ признаков; фотографии источника не используются.', 'verified', 'codex-source-review', '2026-09-26 21:30:00'),
    ('geoplant-strawberry-syria', 'website', 'Syria NF137', 'Geoplant Vivai',
     'https://geoplantvivai.com/en/syria-strawberry-plant/', '2026-09-26',
     'Краткий пересказ признаков; фотографии источника не используются.', 'verified', 'codex-source-review', '2026-09-26 21:30:00'),
    ('geoplant-strawberry-malga', 'website', 'Malga SG134', 'Geoplant Vivai',
     'https://geoplantvivai.com/en/malga-strawberry-plant/', '2026-09-26',
     'Краткий пересказ признаков; фотографии источника не используются.', 'verified', 'codex-source-review', '2026-09-26 21:30:00'),
    ('civ-strawberry-ania', 'website', 'Ania CIVRH612', 'CIV',
     'https://civ.it/en/strawberries/ania-civrh612pbr/', '2026-09-26',
     'Краткий пересказ признаков; фотографии источника не используются.', 'verified', 'codex-source-review', '2026-09-26 21:30:00');

CREATE TEMP TABLE strawberry_catalog_seed (
    slug TEXT PRIMARY KEY, name_ru TEXT NOT NULL, source_key TEXT NOT NULL,
    maturity TEXT NOT NULL, fruiting TEXT NOT NULL
) STRICT;

INSERT INTO strawberry_catalog_seed VALUES
    ('tsaritsa', 'Царица', 'fnc-strawberry-tsaritsa', 'Средний срок', ''),
    ('bereginya', 'Берегиня', 'fnc-strawberry-bereginya', 'Поздний срок', ''),
    ('kleri', 'Клери', 'civ-strawberry-clery', 'Ранний срок', 'Однократное плодоношение'),
    ('aprika', 'Априка', 'civ-strawberry-aprica', '', 'Однократное плодоношение'),
    ('dzholi', 'Джоли', 'civ-strawberry-joly', '', 'Однократное плодоношение'),
    ('siriya', 'Сирия', 'geoplant-strawberry-syria', 'Средний срок', ''),
    ('malga', 'Мальга', 'geoplant-strawberry-malga', '', 'Повторное плодоношение'),
    ('aniya', 'Ания', 'civ-strawberry-ania', '', 'Повторное плодоношение');

INSERT INTO cultivars
    (crop_id, slug, canonical_name, scientific_name, identity_source_id,
     editorial_status, reviewed_by, reviewed_at, published_at)
SELECT (SELECT id FROM crops WHERE slug='strawberry'), d.slug, d.name_ru,
       'Fragaria × ananassa', s.id, 'published', 'codex-source-review',
       '2026-09-26 21:30:00', '2026-09-26 21:30:00'
FROM strawberry_catalog_seed d JOIN sources s ON s.source_key=d.source_key;

INSERT INTO trait_observations
    (cultivar_id, trait_code, value_text, context_text, source_id,
     review_status, reviewed_by, reviewed_at)
SELECT c.id, 'maturity_period', d.maturity,
       'Срок указан в условиях источника; календарная дата для регионов России не установлена.',
       s.id, 'verified', 'codex-source-review', '2026-09-26 21:30:00'
FROM strawberry_catalog_seed d
JOIN cultivars c ON c.slug=d.slug JOIN sources s ON s.source_key=d.source_key
WHERE d.maturity!='';

INSERT INTO trait_observations
    (cultivar_id, trait_code, value_text, context_text, source_id,
     review_status, reviewed_by, reviewed_at)
SELECT c.id, 'fruiting_cycle', d.fruiting,
       'Тип плодоношения прямо указан в описании оригинатора или питомника.',
       s.id, 'verified', 'codex-source-review', '2026-09-26 21:30:00'
FROM strawberry_catalog_seed d
JOIN cultivars c ON c.slug=d.slug JOIN sources s ON s.source_key=d.source_key
WHERE d.fruiting!='';

DROP TABLE strawberry_catalog_seed;
