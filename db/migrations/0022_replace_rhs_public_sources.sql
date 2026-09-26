-- Keep every cultivar and observation. Replace six public source links with
-- reviewed, cultivar-specific sources; historical migration files stay immutable.
UPDATE sources SET
  title = 'Raspberry variety description · Polka',
  author_or_org = 'Ontario Ministry of Agriculture',
  url = 'https://www.ontario.ca/page/raspberry-variety-description'
WHERE source_key = 'rhs-polka';

UPDATE sources SET
  title = 'Joan J · variety description',
  author_or_org = 'Canadian Food Inspection Agency',
  url = 'https://active.inspection.gc.ca/english/plaveg/pbrpov/cropreport/ra/app00006387e.shtml'
WHERE source_key = 'rhs-joan-j';

UPDATE sources SET
  title = 'Cambridge Favourite · nursery variety description',
  author_or_org = 'R.W. Walpole',
  url = 'https://rwwalpole.co.uk/plants/cambridge-favourite-strawberry/'
WHERE source_key = 'rhs-cambridge-favourite';

UPDATE sources SET
  title = 'Elan F1 · breeder description',
  author_or_org = 'ABZ Seeds',
  url = 'https://abzseeds.abzstrawberry.nl/en/assortment/elan-f1'
WHERE source_key = 'rhs-elan';

UPDATE sources SET
  title = 'Yellow Antwerp · nursery description',
  author_or_org = 'Chris Bowers & Sons',
  url = 'https://www.chrisbowers.co.uk/product/yellow-antwerp-raspberry-canes/'
WHERE source_key = 'rhs-yellow-antwerp';

UPDATE sources SET
  title = 'All Gold · nursery description',
  author_or_org = 'Provender Nurseries',
  url = 'https://www.provendernurseries.co.uk/product/raspberry-all-gold-b1'
WHERE source_key = 'rhs-all-gold';

UPDATE trait_observations
SET context_text = 'Описание плодоношения в карточке сорта.'
WHERE context_text LIKE '%RHS%';

UPDATE evidence_passports
SET subject_description = CASE
      WHEN observation_id = (SELECT o.id FROM trait_observations o JOIN cultivars c ON c.id = o.cultivar_id WHERE c.slug = 'polka' AND o.trait_code = 'fruiting_cycle') THEN 'Сорт Polka в справочнике Министерства сельского хозяйства Онтарио'
      ELSE 'Сорт Elan в описании оригинатора ABZ Seeds'
    END,
    setting_text = 'Описание сорта в первоисточнике',
    source_locator = 'Описание сорта',
    applicability_note = 'Признак сорта указан в первоисточнике'
WHERE subject_description LIKE '%RHS%';

-- Source identifiers are exported with the public catalogue. Rename them
-- after resolving the existing source IDs so old internal IDs do not leak.
UPDATE sources SET source_key = 'ontario-polka' WHERE source_key = 'rhs-polka';
UPDATE sources SET source_key = 'cfia-joan-j' WHERE source_key = 'rhs-joan-j';
UPDATE sources SET source_key = 'walpole-cambridge-favourite' WHERE source_key = 'rhs-cambridge-favourite';
UPDATE sources SET source_key = 'abz-elan' WHERE source_key = 'rhs-elan';
UPDATE sources SET source_key = 'bowers-yellow-antwerp' WHERE source_key = 'rhs-yellow-antwerp';
UPDATE sources SET source_key = 'provender-all-gold' WHERE source_key = 'rhs-all-gold';
