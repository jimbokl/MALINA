-- Color claims from the Russian originator's description and breeding research.
-- The images remain generic AI illustrations, not cultivar photographs.
INSERT INTO sources
    (source_key, kind, title, author_or_org, url, accessed_on, rights_note,
     review_status, reviewed_by, reviewed_at)
VALUES
    ('fnc-atlant-color', 'website', 'Атлант', 'ФНЦ Садоводства',
     'https://vstisp.org/vstisp/index.php/11-icetheme/sample-news/1450-atlant', '2026-09-26',
     'Использованы только тип плодоношения и окраска; изображение не копируется.',
     'verified', 'codex-source-review', '2026-09-26 21:00:00'),
    ('vniispk-remontant-2008-color', 'website', 'Новые ремонтантные сорта малины с надёжной экологической адаптацией',
     'И. В. Казаков, С. Н. Евдокименко · ВНИИСПК',
     'https://vniispk.ru/pages/activities/science-activities/conference-2008/publ-2008-13', '2026-09-26',
     'Использованы только названия, окраска и тип; дана прямая ссылка на публикацию.',
     'verified', 'codex-source-review', '2026-09-26 21:00:00');

INSERT INTO trait_observations
    (cultivar_id, trait_code, value_text, context_text, source_id,
     review_status, reviewed_by, reviewed_at)
SELECT c.id, 'fruit_color', 'Красная',
       'Окраска ягоды из описания ФНЦ или исследования ВНИИСПК.', s.id,
       'verified', 'codex-source-review', '2026-09-26 21:00:00'
FROM cultivars c
JOIN sources s ON s.source_key = CASE c.slug
    WHEN 'atlant' THEN 'fnc-atlant-color'
    WHEN 'gerakl' THEN 'vniispk-remontant-2008-color'
END
WHERE c.slug IN ('atlant', 'gerakl');

INSERT INTO trait_observations
    (cultivar_id, trait_code, value_text, context_text, source_id,
     review_status, reviewed_by, reviewed_at)
SELECT c.id, 'fruit_color', 'Жёлтая',
       'Сорт описан селекционерами как желтоплодный с золотисто-абрикосовой окраской ягод.', s.id,
       'verified', 'codex-source-review', '2026-09-26 21:00:00'
FROM cultivars c
JOIN sources s ON s.source_key = 'vniispk-remontant-2008-color'
WHERE c.slug = 'abrikosovaya';
