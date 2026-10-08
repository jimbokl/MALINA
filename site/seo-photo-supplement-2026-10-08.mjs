// Verified cultivar photographs found on breeder, research-institute and patent pages.
// `url` is a direct image when the source exposes one; otherwise it is the page
// containing the cultivar-specific, visibly described patent figure.
export const seoPhotoSupplement = {
  'siriya': {
    url: 'https://www.meiosis.co.uk/fruit_types/syria/',
    publisher: 'Meiosis Ltd · Syria (NF 137)',
    title: 'Syria (NF 137): Fruit Quality photograph',
    checkedIso: '2026-10-08',
    scope: 'The Syria NF 137 cultivar page links the Fruit Quality photograph SY-F3.jpg; New Fruits s.a.s. is named as breeder. The source photograph remains on the publisher site.',
    imageUrl: 'https://www.meiosis.co.uk/wp-content/uploads/2017/03/SY-F3.jpg'
  },
  'pshehiba': {
    url: 'https://www.brzezna.pl/malina-rubus-idaeus-przehyba/',
    publisher: 'SZD Brzezna · Przehyba',
    title: 'MALINA (Rubus idaeus) – Przehyba',
    checkedIso: '2026-10-08',
    scope: 'The breeder page identifies the photograph as Dojrzałe owoce malin odmiany Przehyba (ripe fruits of cultivar Przehyba). Checked indexed page text; a direct fetch returned 502 Bad Gateway.',
    verificationMethod: 'publisher_page_search_index_with_cultivar_photo_caption',
    directFetchStatus: '502 Bad Gateway'
  },
  'maravilla': {
    url: 'https://patents.google.com/patent/USPP14804P2/en',
    publisher: 'Driscoll’s · US Plant Patent USPP14804P2',
    title: 'Raspberry plant named Driscoll Maravilla',
    checkedIso: '2026-10-08',
    scope: 'Patent page identifies Driscoll Maravilla and describes photographs: Fig. 1 flowering/fruiting primocane, Fig. 2 leaves, Fig. 3 shoots.'
  },
  'raspberry-lagorai-plus': {
    url: 'https://patents.google.com/patent/US20130318664P1/en',
    publisher: 'United States Patent and Trademark Office · US20130318664P1',
    title: 'Raspberry plant — Lagorai Plus cultivar',
    checkedIso: '2026-10-08',
    scope: 'The patent explicitly identifies Lagorai Plus and describes photographs of ripe fruit (Fig. 1), fruit distribution on plants (Fig. 2), and ripe/immature fruit and leaves (Fig. 3).'
  },
  'raspberry-adelita': {
    url: 'https://patents.google.com/patent/US20120311748P1/en',
    publisher: 'United States Patent and Trademark Office · US20120311748P1',
    title: 'Raspberry plant named Adelita',
    checkedIso: '2026-10-08',
    scope: 'Patent identifies the new variety as Adelita (selection 07.09R.50); Figs. 1–2 show plants with red conical fruit, and later figures compare Adelita fruit with Heritage.'
  },
  'raspberry-georgia': {
    url: 'https://patents.google.com/patent/USPP19430P3/en',
    publisher: 'United States Patent and Trademark Office · USPP19430P3',
    title: 'Raspberry plant named Georgia',
    checkedIso: '2026-10-08',
    scope: 'The patent names Georgia and describes a field photograph at midseason fruiting (Fig. 1), fruiting truss and fruit shape (Figs. 8 and 10), and a labeled comparison with Glen Ample (Fig. 9).'
  },
  'raspberry-jaclyn': {
    url: 'https://patents.google.com/patent/USPP15647P2/en',
    publisher: 'United States Patent and Trademark Office · USPP15647P2',
    title: 'Raspberry plant named Jaclyn',
    checkedIso: '2026-10-08',
    scope: 'The patent names Jaclyn and describes photos of its primocane, leaves, flowers and fruit; Fig. 6 is a fruiting cluster and Figs. 8–10 show primocane fruit.'
  },
  'raspberry-joan-j': {
    url: 'https://patents.google.com/patent/USPP18954P3/en',
    publisher: 'Medway Fruits · US Plant Patent USPP18954P3',
    title: 'Raspberry plant named Joan J',
    checkedIso: '2026-10-08',
    scope: 'The patent identifies Joan J and describes its color photograph, taken at Maidstone on 19 August 1998: an upright plant with fruit at different maturity stages.'
  },
  'strawberry-fronteras': {
    url: 'https://patentimages.storage.googleapis.com/62/7d/6a/89f614181750cf/USPP026709-20160510-D00001.png',
    publisher: 'University of California · US Plant Patent USPP26709P3',
    title: 'Strawberry plant named Fronteras',
    checkedIso: '2026-10-08',
    scope: 'The UC patent identifies Fronteras and links its three color figures: a fruiting field plant, a typical leaf, and representative mid-season fruit.'
  },
  'albion': {
    url: 'https://strawberry.ucdavis.edu/sites/g/files/dgvnsk11856/files/media/images/Albion.jpg',
    publisher: 'University of California, Davis · Strawberry Breeding & Research Program',
    title: 'Albion strawberry',
    checkedIso: '2026-10-08',
    scope: 'Direct image linked from the UC Davis Albion release page, where it is explicitly labeled “Image: Albion strawberry”.'
  },
  'cabrillo': {
    url: 'https://active.inspection.gc.ca/english/plaveg/pbrpov/cropreport/str/app00010197e.shtml',
    publisher: 'Canadian Food Inspection Agency · Plant Breeders’ Rights description',
    title: 'Cabrillo strawberry cultivar and reference-variety photographs',
    checkedIso: '2026-10-08',
    scope: 'The government cultivar page labels comparison photographs: Cabrillo at left, with Albion, San Andreas and Portola in the same panels. Use only as a labeled comparison, not as an isolated Cabrillo portrait.'
  },
  'san-andreas': {
    url: 'https://active.inspection.gc.ca/english/plaveg/pbrpov/cropreport/str/app00010197e.shtml',
    publisher: 'Canadian Food Inspection Agency · Plant Breeders’ Rights description',
    title: 'San Andreas in a labeled Cabrillo comparison panel',
    checkedIso: '2026-10-08',
    scope: 'The government page labels comparative images with San Andreas in the center-right position in one panel and bottom-left in another, alongside Cabrillo, Albion and Portola.'
  },
  'murano': {
    url: 'https://civ.it/wp-content/uploads/2025/02/murano-still-life.png',
    publisher: 'Consorzio Italiano Vivaisti (CIV)',
    title: 'Murano strawberry · still life',
    checkedIso: '2026-10-08',
    scope: 'Direct still-life image linked from CIV’s cultivar page headed MURANO; the same page describes Murano fruit.'
  },
  'strawberry-vivara': {
    url: 'https://civ.it/wp-content/uploads/2025/01/vivara-still-life.png',
    publisher: 'Consorzio Italiano Vivaisti (CIV)',
    title: 'VIVARApbr strawberry · still life',
    checkedIso: '2026-10-08',
    scope: 'Direct still-life image linked from CIV’s page headed VIVARApbr, which identifies the cultivar and describes its fruit.'
  },
  'aniya': {
    url: 'https://civ.it/wp-content/uploads/2025/01/ania-still-life.png',
    publisher: 'Consorzio Italiano Vivaisti (CIV)',
    title: 'ANIA CIVRH612pbr strawberry · still life',
    checkedIso: '2026-10-08',
    scope: 'Direct still-life image linked from CIV’s page headed ANIA CIVRH612pbr; identity matches the Ania cultivar, not similarly named cultivars.'
  },
  'aprika': {
    url: 'https://civ.it/wp-content/uploads/2025/02/aprica-still-life.png',
    publisher: 'Consorzio Italiano Vivaisti (CIV)',
    title: 'APRICA strawberry · still life',
    checkedIso: '2026-10-08',
    scope: 'Direct still-life image linked from CIV’s page headed APRICApbr; the image filename and cultivar page identify Aprica.'
  },
  'strawberry-sibilla': {
    url: 'https://civ.it/wp-content/uploads/2025/02/sibilla-still-life.png',
    publisher: 'Consorzio Italiano Vivaisti (CIV)',
    title: 'SIBILLA strawberry · still life',
    checkedIso: '2026-10-08',
    scope: 'Direct still-life image linked from CIV’s SIBILLApbr cultivar page.'
  },
  'strawberry-giusy': {
    url: 'https://civ.it/wp-content/uploads/2025/01/giusy-still-life.png',
    publisher: 'Consorzio Italiano Vivaisti (CIV)',
    title: 'GIUSY CIVH413 strawberry · still life',
    checkedIso: '2026-10-08',
    scope: 'Direct still-life image linked from CIV’s GIUSY CIVH413 cultivar page.'
  },
  'strawberry-sonsation': {
    url: 'https://flevoberry.nl/wp-content/uploads/2026/09/Sonsation-duo-2400_1600-1024x683-1.jpg',
    publisher: 'Flevo Berry · Sonsation variety page',
    title: 'Sonsation strawberry',
    checkedIso: '2026-10-08',
    scope: 'Direct image in the gallery on Flevo Berry’s page headed Sonsation; the breeder page names the variety and identifies its breeding program.'
  },
  'raspberry-magnat': {
    url: 'https://niwabrzezna.pl/wp-content/uploads/2023/09/IMG_0844.jpg',
    publisher: 'NIWA Hodowla Roślin Jagodowych',
    title: 'Magnat raspberry cultivar',
    checkedIso: '2026-10-08',
    scope: 'Image linked from NIWA’s cultivar page headed “Magnat (NR 1616002)”; that page contains the cultivar-specific description and image gallery.'
  }
};
