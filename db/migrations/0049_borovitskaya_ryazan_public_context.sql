-- Keep the public observation factual and concise; methodology and scope remain
-- in the evidence passport created by 0048.
UPDATE trait_observations
SET context_text = 'ОПХ «Полково», Рязанская область: контрольная «Боровицкая» без обработки препаратом «Энергия-М» дала 1,2 ± 0,02 кг/м² в первый год вегетации. Опыт проводили в 2013–2016 годах.'
WHERE trait_code = 'yield'
  AND value_number = 1.2
  AND unit = 'кг/м²'
  AND cultivar_id = (SELECT id FROM cultivars WHERE slug = 'borovitskaya')
  AND source_id = (SELECT id FROM sources WHERE source_key = 'ryazan-borovitskaya-energy-m-trial-2013-2016');
