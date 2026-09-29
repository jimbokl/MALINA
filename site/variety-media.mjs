// Explicit cultivar + crop mapping: raspberry Polka and strawberry Polka are different records.
// Illustration provenance: docs/SOURCES.md. Photo provenance: docs/VARIETY_PHOTOS.md.
// A photo is used only when its own source identifies the cultivar and permits publication.
export const varietyPhotoSources = Object.freeze({
  'cambridge-favourite': Object.freeze({
    file: 'variety-photo-cambridge-favourite.webp',
    sourcePage: 'https://biosel.elpub.ru/jour/article/download/143/139#page=4',
    originalUrl: 'https://biosel.elpub.ru/jour/article/download/143/139',
    originalSha256: '44bdf81cdea9a17ce16ddd789ddb273e40c1b929734aedd1a6c4253080bd30c5',
    sourcePanelSha256: '4377692db859c8887968246c70dc6dde64556a65c02addf2314e2c9a7ebd7bb4',
    sha256: 'd8f0dfbeb5f699df5b7792e7e1221ad570987c03bd196b2fd0a59a053bfdb40d',
    author: 'И. Э. Храбров и соавторы',
    license: 'CC BY 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/3.0/',
    identityEvidence: 'Подпись к рисунку 1 научной статьи Храброва и соавторов прямо определяет панель Б как сорт Cambridge Favourite; на панели видны здоровые красные ягоды.',
    width: 855,
    height: 480,
    captionChange: 'панель Б, кадрировано',
    transformation: 'Из страницы 4 PDF (рисунок 1) выделена панель Б с ягодами Cambridge Favourite, отрендерена в 300 dpi и кадрирована до 855 × 480 без увеличения.'
  }),
  slavutich: Object.freeze({
    file: 'variety-photo-slavutich.webp',
    sourcePage: 'https://jbiochemtech.com/storage/models/article/bMUh1GtjLrbMv0U5GbVt14NkkfQ2frw7KZS6iVW7Iv1VKS7RXJ6GRMwbz9KS/garden-strawberry-varieties-of-the-all-russian-horticultural-institute-for-breeding-agrotechnology.pdf#page=4',
    originalUrl: 'https://jbiochemtech.com/storage/models/article/bMUh1GtjLrbMv0U5GbVt14NkkfQ2frw7KZS6iVW7Iv1VKS7RXJ6GRMwbz9KS/garden-strawberry-varieties-of-the-all-russian-horticultural-institute-for-breeding-agrotechnology.pdf',
    originalSha256: '6b5585cd4373f9727005093e4f87279ad3237f4075a9c9b0476441bfd81962ac',
    sourcePanelSha256: '01d26938a6d2c1c2650389163169933df3c6ab9acd2c59b65cfbff5de8372ab1',
    sha256: '19c03f718b4e76ea653ab7ba002412ce4844cd1a107e93ce57cdb983b1540f7b',
    author: 'Ivan Kulikov et al.',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    identityEvidence: 'Подпись Figure 3 в статье Garden Strawberry Varieties of the All-Russian Horticultural Institute прямо называет сорт Slavutich; под ягодами в кадре видна этикетка «Славутич».',
    width: 600,
    height: 466,
    captionChange: 'рисунок 3, перекодировано',
    transformation: 'Встроенный JPEG рисунка 3 извлечён из PDF без кадрирования и увеличения, перекодирован в WebP.'
  }),
  vityaz: Object.freeze({
    file: 'variety-photo-vityaz.webp',
    sourcePage: 'https://jbiochemtech.com/storage/models/article/bMUh1GtjLrbMv0U5GbVt14NkkfQ2frw7KZS6iVW7Iv1VKS7RXJ6GRMwbz9KS/garden-strawberry-varieties-of-the-all-russian-horticultural-institute-for-breeding-agrotechnology.pdf#page=4',
    originalUrl: 'https://jbiochemtech.com/storage/models/article/bMUh1GtjLrbMv0U5GbVt14NkkfQ2frw7KZS6iVW7Iv1VKS7RXJ6GRMwbz9KS/garden-strawberry-varieties-of-the-all-russian-horticultural-institute-for-breeding-agrotechnology.pdf',
    originalSha256: '6b5585cd4373f9727005093e4f87279ad3237f4075a9c9b0476441bfd81962ac',
    sourcePanelSha256: 'f34934217d4a047ce8ac54949ef87f8f9ec2bb6893863490db5675a1ce75131c',
    sha256: 'e504a8b334ee51c5f80a9049a699f2024516010f086d1fa1da4dc0cc0e45a3f9',
    author: 'Ivan Kulikov et al.',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    identityEvidence: 'Подпись Figure 4 в статье Garden Strawberry Varieties of the All-Russian Horticultural Institute прямо называет сорт Vityaz.',
    width: 605,
    height: 465,
    captionChange: 'рисунок 4, перекодировано',
    transformation: 'Встроенный JPEG рисунка 4 извлечён из PDF без кадрирования и увеличения, перекодирован в WebP.'
  }),
  tsaritsa: Object.freeze({
    file: 'variety-photo-tsaritsa.webp',
    sourcePage: 'https://jbiochemtech.com/storage/models/article/bMUh1GtjLrbMv0U5GbVt14NkkfQ2frw7KZS6iVW7Iv1VKS7RXJ6GRMwbz9KS/garden-strawberry-varieties-of-the-all-russian-horticultural-institute-for-breeding-agrotechnology.pdf#page=4',
    originalUrl: 'https://jbiochemtech.com/storage/models/article/bMUh1GtjLrbMv0U5GbVt14NkkfQ2frw7KZS6iVW7Iv1VKS7RXJ6GRMwbz9KS/garden-strawberry-varieties-of-the-all-russian-horticultural-institute-for-breeding-agrotechnology.pdf',
    originalSha256: '6b5585cd4373f9727005093e4f87279ad3237f4075a9c9b0476441bfd81962ac',
    sourcePanelSha256: 'a9ee9a9f6c7640db3ac561358a31d10247807260dfded2bacb7f386d1748f87c',
    sha256: '81b9b81b3522801c11ecbfe9ae7e0bf8f0718b7b6b0a5d224d727349f22ca681',
    author: 'Ivan Kulikov et al.',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    identityEvidence: 'Подпись Figure 5 в статье Garden Strawberry Varieties of the All-Russian Horticultural Institute прямо называет сорт Tsaritsa; на фото есть этикетка «Царица».',
    width: 582,
    height: 421,
    captionChange: 'рисунок 5, перекодировано',
    transformation: 'Встроенный JPEG рисунка 5 извлечён из PDF без кадрирования и увеличения, перекодирован в WebP.'
  }),
  alfa: Object.freeze({
    file: 'variety-photo-alfa.webp',
    sourcePage: 'https://jbiochemtech.com/storage/models/article/bMUh1GtjLrbMv0U5GbVt14NkkfQ2frw7KZS6iVW7Iv1VKS7RXJ6GRMwbz9KS/garden-strawberry-varieties-of-the-all-russian-horticultural-institute-for-breeding-agrotechnology.pdf#page=5',
    originalUrl: 'https://jbiochemtech.com/storage/models/article/bMUh1GtjLrbMv0U5GbVt14NkkfQ2frw7KZS6iVW7Iv1VKS7RXJ6GRMwbz9KS/garden-strawberry-varieties-of-the-all-russian-horticultural-institute-for-breeding-agrotechnology.pdf',
    originalSha256: '6b5585cd4373f9727005093e4f87279ad3237f4075a9c9b0476441bfd81962ac',
    sourcePanelSha256: '90a226bf3d90fd5252e85e83b6c2d0161661500609610cf4c489dd47035445be',
    sha256: 'aca1d52fdc13c58da0f398e473f48e49b7e4400031b6dbe0ac2aedc20ca64c2a',
    author: 'Ivan Kulikov et al.',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    identityEvidence: 'Подпись Figure 6 в статье Garden Strawberry Varieties of the All-Russian Horticultural Institute прямо называет сорт Al’fa; на фото есть этикетка «Альфа».',
    width: 601,
    height: 442,
    captionChange: 'рисунок 6, перекодировано',
    transformation: 'Встроенный JPEG рисунка 6 извлечён из PDF без кадрирования и увеличения, перекодирован в WebP.'
  }),
  bereginya: Object.freeze({
    file: 'variety-photo-bereginya.webp',
    sourcePage: 'https://jbiochemtech.com/storage/models/article/bMUh1GtjLrbMv0U5GbVt14NkkfQ2frw7KZS6iVW7Iv1VKS7RXJ6GRMwbz9KS/garden-strawberry-varieties-of-the-all-russian-horticultural-institute-for-breeding-agrotechnology.pdf#page=5',
    originalUrl: 'https://jbiochemtech.com/storage/models/article/bMUh1GtjLrbMv0U5GbVt14NkkfQ2frw7KZS6iVW7Iv1VKS7RXJ6GRMwbz9KS/garden-strawberry-varieties-of-the-all-russian-horticultural-institute-for-breeding-agrotechnology.pdf',
    originalSha256: '6b5585cd4373f9727005093e4f87279ad3237f4075a9c9b0476441bfd81962ac',
    sourcePanelSha256: 'a22cc8b030a95da95afce666ac2ad247733ad50953ec2d5c88cd3d64ba3e85da',
    sha256: 'c4c4ab8c19c0e39c5c30071846aaf5492b6811f4dc6cdc20909f015d9d7d249a',
    author: 'Ivan Kulikov et al.',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    identityEvidence: 'Подпись Figure 7 в статье Garden Strawberry Varieties of the All-Russian Horticultural Institute прямо называет сорт Bereginya; на фото есть этикетка «Берегиня».',
    width: 615,
    height: 439,
    captionChange: 'рисунок 7, перекодировано',
    transformation: 'Встроенный JPEG рисунка 7 извлечён из PDF без кадрирования и увеличения, перекодирован в WebP.'
  }),
  albion: Object.freeze({
    file: 'variety-photo-albion.webp',
    sourcePage: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8909511/#foods-11-00640-f001',
    originalUrl: 'https://mdpi-res.com/d_attachment/foods/foods-11-00640/article_deploy/foods-11-00640.pdf',
    originalSha256: '7dcfb0cf2ff4d5ce03c862a2512e1197b14fa1b26ed3ce65ccd1a61cdc4ee1d9',
    sourcePanelSha256: '575f1c5e90c557a1528bfa82a61c3e8af47a2a1262f396fbce3f9bedff631dcc',
    sha256: '663dff033705e15fbfc7476180f2fd843d230dd49074773a43ff82f213c77dcf',
    author: 'Anica Bebek Markovinović et al.',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    identityEvidence: 'В статье Chemometric Valorization of Strawberry cv. Albion рисунок 1 прямо подписывает обе панели как ягоды Albion; панель B показывает ягоды при полной спелости.',
    width: 765,
    height: 630,
    captionChange: 'панель B, кадрировано',
    transformation: 'Из встроенного изображения рисунка 1 размером 1740 × 746 выделена панель B, кадрирована до 765 × 630 и сохранена в WebP без увеличения.'
  }),
  aziya: Object.freeze({
    file: 'variety-photo-aziya.webp',
    sourcePage: 'https://horticulturejournal.usamv.ro/pdf/2024/issue_1/Art2.pdf#page=3',
    originalUrl: 'https://horticulturejournal.usamv.ro/pdf/2024/issue_1/Art2.pdf',
    originalSha256: '7ca510cf83af8ac8328cde0bc146207471e084e081a78ae68914a0775d3f0c2d',
    sourcePanelSha256: '9a1095eaeafda2a1d2e7b9c883330bd0e7e3ecff4c9be647266d8b9f37b31301',
    sha256: 'fc41b145f9ddcac7894699da957a09bab3d87b8aacac90b08c2d257246f3d66b',
    author: 'Stefka Atanassova et al.',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    identityEvidence: 'В статье Non-Destructive Assessment of Strawberry Fruit Quality на странице 3 подпись рисунка 1 прямо обозначает Asia как панель b; использовано только встроенное фото этой панели.',
    width: 440,
    height: 352,
    captionChange: 'панель b рисунка 1',
    transformation: 'Панель b размером 440 × 352 вырезана из рендера страницы PDF с управлением цветом и сохранена в WebP. Встроенный JPEG панели имеет 221 × 221 и иной цвет при прямом декодировании; рендер воспроизводит опубликованный вид.'
  }),
  alba: Object.freeze({
    file: 'variety-photo-alba.webp',
    sourcePage: 'https://horticulturejournal.usamv.ro/pdf/2024/issue_1/Art2.pdf#page=3',
    originalUrl: 'https://horticulturejournal.usamv.ro/pdf/2024/issue_1/Art2.pdf',
    originalSha256: '7ca510cf83af8ac8328cde0bc146207471e084e081a78ae68914a0775d3f0c2d',
    sourcePanelSha256: 'ef3da185580c8244171297e97a14820fa80d7b7e774330d0b3ba91377641d442',
    sha256: '132cffa4e9e9ebd76cbbdd65f2fc033c6caa09f3713f6f027978520bdbf2cf02',
    author: 'Stefka Atanassova et al.',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    identityEvidence: 'В статье Non-Destructive Assessment of Strawberry Fruit Quality на странице 3 подпись рисунка 1 прямо обозначает Alba как панель a; использовано только встроенное фото этой панели.',
    width: 373,
    height: 277,
    captionChange: 'панель a рисунка 1',
    transformation: 'Из PDF извлечена встроенная фотография панели a размером 373 × 277; исправлена инверсия каналов CMYK при декодировании, сохранено в WebP без увеличения и кадрирования.'
  }),
  atlant: Object.freeze({
    file: 'variety-photo-atlant.webp',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:%D0%9C%D0%B0%D0%BB%D0%B8%D0%BD%D0%B0_%D0%B0%D1%82%D0%BB%D0%B0%D0%BD%D1%82.jpg',
    originalUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/1e/%D0%9C%D0%B0%D0%BB%D0%B8%D0%BD%D0%B0_%D0%B0%D1%82%D0%BB%D0%B0%D0%BD%D1%82.jpg',
    originalSha256: '6a1a6685f8eb7ef8e613531f5f0a0487e5c3d79ba8abd147c4039292f7d5e2d4',
    sha256: 'e9f591a4791f88626ebc3404f0b04bbbc41bf9248b54e23621f8ecd954286e6f',
    author: 'Алексей РТ',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    identityEvidence: 'Автор подписал собственный снимок «Ремонтантная малина сорт Атлант»; на фотографии видны красные спелые ягоды.',
    transformation: 'Исходник 1920 × 1080 кадрирован до 1440 × 960 и уменьшен до 960 × 640 в WebP; производное изображение CC BY-SA 4.0.'
  }),
  polka: Object.freeze({
    file: 'variety-photo-polka.webp',
    sourcePage: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10673471/#metabolites-13-01124-f001',
    originalUrl: 'https://cdn.ncbi.nlm.nih.gov/pmc/blobs/f2db/10673471/7f279dae7004/metabolites-13-01124-g001.jpg',
    originalSha256: 'ac4ce141ebd209a999259c063096f55f2d6e7d39e938ad4ad64442492750b9fc',
    sha256: '1694db3cc6f154316213e357a85a11f3c400241eac40748c6e46ce97a2f0f590',
    author: 'Mirosława Chwil et al.',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    identityEvidence: 'Авторы исследовали ягоды трёх сортов из коммерческой посадки и прямо подписали панель C рисунка 1 как Polka.',
    width: 668,
    height: 526,
    captionChange: 'панель C, кадрировано',
    transformation: 'Из рисунка 1 (676 × 907) выделена панель C с ягодами сорта Polka; кадрировано до 668 × 526 и перекодировано в WebP без масштабирования. Оригинал и производное изображение CC BY 4.0.'
  }),
  polana: Object.freeze({
    file: 'variety-photo-polana.webp',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Polana-malina.jpg',
    originalUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c3/Polana-malina.jpg',
    originalSha256: 'c45db4d29d513305042997e509739aa2170f0ffd297e65f617529a45a2208d2e',
    sha256: 'd3f2087a088bbec1a071da9d858e365f56c16197e0e92e90bbc612a457f5494a',
    author: 'Djomla85',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    identityEvidence: 'Автор подписал собственную фотографию «Polana-plod»; исходный снимок содержит надпись «Малина Polana».',
    width: 300,
    height: 240,
    captionChange: 'перекодировано без кадрирования',
    transformation: 'Оригинал 300 × 240 перекодирован в WebP без масштабирования и кадрирования; надпись уже была на исходном снимке. Производное изображение CC BY-SA 4.0.'
  }),
  heritage: Object.freeze({
    file: 'variety-photo-heritage.webp',
    sourcePage: 'https://www.flickr.com/photos/graibeard/3220923545/',
    originalUrl: 'https://live.staticflickr.com/3128/3220923545_c22ae77719_b.jpg',
    originalSha256: '1f7f1c10ebd4468660575d3574776c9c5edb9f9158f409d930153fb9fa8e9de9',
    sha256: 'ac5018572bc7d40af90714bb2bbab5021ce51b8bffa81e35e1eafadea3e620a9',
    author: 'graibeard',
    license: 'CC BY-SA 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
    identityEvidence: 'Заголовок и описание авторского снимка на Flickr прямо называют Raspberry Heritage — Rubus idaeus; JSON-LD страницы содержит авторство и лицензию CC BY-SA 2.0.',
    width: 705,
    height: 470,
    captionChange: 'кадрировано',
    transformation: 'Оригинал 705 × 1024 кадрирован по вертикали до 705 × 470 вокруг спелой и незрелой ягод, перекодирован в WebP без увеличения; производное изображение CC BY-SA 2.0.'
  }),
  honey: Object.freeze({
    file: 'variety-photo-honey.webp',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Fragaria_ananassa_Honeoye_2023-05-31_6638.jpg',
    originalUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/07/Fragaria_ananassa_Honeoye_2023-05-31_6638.jpg',
    originalSha256: 'a2b04e816200342a45add09d7a9d7cdd3b7aa7c5f3efa50b43ce576bf3b5b7c2',
    sha256: '7ac503d09c5f00d9db2ca91da6e09b6b6adc9d2521c8cc6bbe1cd9aa0209f8c1',
    author: 'Salicyna',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    identityEvidence: 'Автор прямо указал в описании «Fragaria × ananassa Honeoye», фотография сорта в Щецине 31 мая 2023 года.',
    photoDetail: 'незрелые ягоды',
    transformation: 'Уменьшено до 960 × 640, кадрировано по центру, сохранено в WebP; производное изображение CC BY-SA 4.0.'
  }),
  'zenga-zengana': Object.freeze({
    file: 'variety-photo-zenga-zengana.webp',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Fragaria_ananassa_Senga_Sengana_2023-06-12_7456.jpg',
    originalUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c9/Fragaria_ananassa_Senga_Sengana_2023-06-12_7456.jpg',
    originalSha256: 'db7e34f8e76dc2c6945eba683899b409b5e63950d24878b5f702fbfb47485862',
    sha256: 'de357d337308fb57cbd163db007ffba3e2a066f7d0f6f7d5d6ff71037bb1126f',
    author: 'Salicyna',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    identityEvidence: 'Автор прямо указал в описании «Fragaria × ananassa Senga Sengana», собственный снимок сорта в Щецине 12 июня 2023 года.',
    transformation: 'Уменьшено до 960 × 640, кадрировано по центру, сохранено в WebP; производное изображение CC BY-SA 4.0.'
  }),
  kleri: Object.freeze({
    file: 'variety-photo-kleri.webp',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Clery_Gartenerdbeere.JPG',
    originalUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/5f/Clery_Gartenerdbeere.JPG',
    originalSha256: 'd1a7010dc07f7e20fdf0fc407040f5da4ccb52c700e5a13d1cd8f07398b95c72',
    sha256: '50c624748618e2cc83febd2a7f80a29ca0ca6577352189ba407d2df83372ee9d',
    author: '4028mdk09',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
    identityEvidence: 'Автор прямо указал в описании: «Gartenerdbeere Clery (Fragaria x ananassa)», съёмка в Гейдельберге 9 мая 2010 года.',
    transformation: 'Уменьшено до 960 × 640, кадрировано по центру, сохранено в WebP; производное изображение CC BY-SA 3.0.'
  }),
  murano: Object.freeze({
    file: 'variety-photo-murano.webp',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:Fraises_Murano_en_Dordogne.jpg',
    originalUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Fraises_Murano_en_Dordogne.jpg',
    originalSha256: '4250025909bceb78f6a7023d2caf8c191db355112bfb6e466ac603cc2e534ea3',
    sha256: 'a4d94097c4528796113ad3c9fcea20976ca1fefbed5468f4a1507c359489c628',
    author: 'Renhour48',
    license: 'CC0 1.0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    identityEvidence: 'Авторское описание «Fraises Murano en Dordogne» и табличка MURANO в кадре.',
    transformation: 'Уменьшено до 960 × 640, кадрировано по центру, сохранено в WebP.'
  }),
  elsanta: Object.freeze({
    file: 'variety-photo-elsanta.webp',
    sourcePage: 'https://commons.wikimedia.org/wiki/File:FraisesElsantaCLJWeber_(23307386409).jpg',
    originalUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/2b/FraisesElsantaCLJWeber_%2823307386409%29.jpg',
    originalSha256: '47333ca59b3681aaf121bda5ff53d218e2351c7ac5174cd119fdff51fd85c94a',
    sha256: '6e77a8b320779befc39b39e40107ec5095abcc76e4a63bb4e19992fdfd18874a',
    author: 'INRA DIST / Jean Weber',
    license: 'CC BY 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/2.0/',
    identityEvidence: 'Название сорта Elsanta в имени исходного файла INRA; перенос с Flickr проверен FlickreviewR.',
    transformation: 'Уменьшено до 960 × 640, кадрировано по центру, сохранено в WebP.'
  })
});

// These cultivar-identified photographs accompany the illustration in the detail page.
// They are not used as the cover image when the source shows a specimen or a disease symptom.
export const varietySupplementalPhotoSources = Object.freeze({
  festivalnaya: Object.freeze({
    file: 'variety-photo-festivalnaya-anthracnose.webp',
    sourcePage: 'https://biosel.elpub.ru/jour/article/download/143/139#page=4',
    originalUrl: 'https://biosel.elpub.ru/jour/article/download/143/139',
    originalSha256: '44bdf81cdea9a17ce16ddd789ddb273e40c1b929734aedd1a6c4253080bd30c5',
    sourcePanelSha256: 'cb10bebcaf1d9602a52425820f7e6f4116f9b321f92983eda3f602f4279ec994',
    sha256: '55865007c5529128150a4882f452bb705865c4c08166ac691f5e0911f6a6808c',
    author: 'И. Э. Храбров и соавторы',
    license: 'CC BY 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/3.0/',
    identityEvidence: 'Рисунок 1 статьи ВИР прямо называет панель В сортом «Фестивальная»; это ягоды с выраженным антракнозом, а не типичный здоровый плод сорта.',
    width: 800,
    height: 450,
    photoDetail: 'ягоды, поражённые антракнозом',
    captionChange: 'панель В рисунка 1, кадрировано',
    transformation: 'Из PDF извлечено встроенное изображение 1600 × 900; выделена подписанная панель В 800 × 450 и перекодирована в WebP без увеличения.'
  }),
  darenka: Object.freeze({
    file: 'variety-photo-darenka.webp',
    sourcePage: 'https://www.agronauka-sv.ru/jour/article/view/1761',
    originalUrl: 'https://www.agronauka-sv.ru/jour/article/download/1761/816',
    originalSha256: '1c2a2c8433f20863bb2174b4843e1c3b204775d234857ecc839087681dedffe4',
    sourcePanelSha256: '6d5aabb1a6f176e2ca53d811f566cc56ec86ac5882bcca1e8aa0fc5bfd35a1fa',
    sha256: '665cf570606af97b24fd8502959ac8bd490310565863ab9c82138410886d6f73',
    author: 'Е. Ю. Невоструева и Л. В. Багмет',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    identityEvidence: 'Рисунок 5 статьи «Номенклатурные стандарты сортов земляники» прямо подписан как сорт Дарёнка; на гербарном листе есть фотографии цветка и ягод этого растения.',
    width: 640,
    height: 404,
    photoDetail: 'фрагмент гербарного образца с ягодами',
    captionChange: 'рисунок 5, кадрировано',
    transformation: 'Из PDF извлечён встроенный JPEG рисунка 5 (640 × 954); выделена нижняя область 640 × 404 со снимком ягод, цветка и сортовой этикеткой, перекодирована в WebP без увеличения.'
  })
});

export const varietyMedia = Object.freeze({
  gusar: { file: 'variety-gusar.webp', crop: 'raspberry', fruitColor: 'red' },
  atlant: { file: 'variety-photo-atlant.webp', crop: 'raspberry', fruitColor: 'red', kind: 'photo' },
  gerakl: { file: 'variety-gerakl.webp', crop: 'raspberry', fruitColor: 'red' },
  meteor: { file: 'variety-meteor.webp', crop: 'raspberry', fruitColor: 'red' },
  peresvet: { file: 'variety-peresvet.webp', crop: 'raspberry', fruitColor: 'red' },
  polana: { file: 'variety-photo-polana.webp', crop: 'raspberry', fruitColor: 'red', kind: 'photo' },
  polka: { file: 'variety-photo-polka.webp', crop: 'raspberry', fruitColor: 'red', kind: 'photo' },
  heritage: { file: 'variety-photo-heritage.webp', crop: 'raspberry', fruitColor: 'red', kind: 'photo' },
  'joan-j': { file: 'variety-joan-j.webp', crop: 'raspberry', fruitColor: 'red' },
  pshehiba: { file: 'variety-pshehiba.webp', crop: 'raspberry' },
  karamelka: { file: 'variety-karamelka.webp', crop: 'raspberry' },
  samohval: { file: 'variety-samohval.webp', crop: 'raspberry' },
  patritsiya: { file: 'variety-patritsiya.webp', crop: 'raspberry' },
  tarusa: { file: 'variety-tarusa.webp', crop: 'raspberry', fruitColor: 'red' },
  lyachka: { file: 'variety-lyachka.webp', crop: 'raspberry', fruitColor: 'red' },
  maroseyka: { file: 'variety-maroseyka.webp', crop: 'raspberry', fruitColor: 'red' },
  brilliantovaya: { file: 'variety-brilliantovaya.webp', crop: 'raspberry', fruitColor: 'red' },
  pohvalinka: { file: 'variety-pohvalinka.webp', crop: 'raspberry', fruitColor: 'red' },
  salyut: { file: 'variety-salyut.webp', crop: 'raspberry', fruitColor: 'red' },
  'yubileinaya-kulikova': { file: 'variety-yubileinaya-kulikova.webp', crop: 'raspberry', fruitColor: 'red' },
  arisha: { file: 'variety-arisha.webp', crop: 'raspberry', fruitColor: 'red' },
  aziya: { file: 'variety-photo-aziya.webp', crop: 'strawberry', kind: 'photo' },
  festivalnaya: { file: 'variety-festivalnaya.webp', crop: 'strawberry' },
  murano: { file: 'variety-photo-murano.webp', crop: 'strawberry', kind: 'photo' },
  alba: { file: 'variety-photo-alba.webp', crop: 'strawberry', kind: 'photo' },
  'cambridge-favourite': { file: 'variety-photo-cambridge-favourite.webp', crop: 'strawberry', kind: 'photo' },
  elan: { file: 'variety-elan.webp', crop: 'strawberry' },
  tsaritsa: { file: 'variety-photo-tsaritsa.webp', crop: 'strawberry', kind: 'photo' },
  bereginya: { file: 'variety-photo-bereginya.webp', crop: 'strawberry', kind: 'photo' },
  kleri: { file: 'variety-photo-kleri.webp', crop: 'strawberry', kind: 'photo' },
  aprika: { file: 'variety-aprika.webp', crop: 'strawberry' },
  dzholi: { file: 'variety-dzholi.webp', crop: 'strawberry' },
  siriya: { file: 'variety-siriya.webp', crop: 'strawberry' },
  malga: { file: 'variety-malga.webp', crop: 'strawberry' },
  aniya: { file: 'variety-aniya.webp', crop: 'strawberry' },
  malvina: { file: 'variety-malvina.webp', crop: 'strawberry' },
  albion: { file: 'variety-photo-albion.webp', crop: 'strawberry', kind: 'photo' },
  honey: { file: 'variety-photo-honey.webp', crop: 'strawberry', kind: 'photo' },
  kimberli: { file: 'variety-kimberli.webp', crop: 'strawberry' },
  cabrillo: { file: 'variety-cabrillo.webp', crop: 'strawberry' },
  brilla: { file: 'variety-brilla.webp', crop: 'strawberry' },
  magnus: { file: 'variety-magnus.webp', crop: 'strawberry' },
  rumba: { file: 'variety-rumba.webp', crop: 'strawberry' },
  elsanta: { file: 'variety-photo-elsanta.webp', crop: 'strawberry', kind: 'photo' },
  borovitskaya: { file: 'variety-borovitskaya.webp', crop: 'strawberry' },
  'nashe-podmoskove': { file: 'variety-nashe-podmoskovye.webp', crop: 'strawberry' },
  darenka: { file: 'variety-darenka.webp', crop: 'strawberry' },
  'zenga-zengana': { file: 'variety-photo-zenga-zengana.webp', crop: 'strawberry', kind: 'photo' },
  'desnyanka-kokinskaya': { file: 'variety-desnyanka-kokinskaya.webp', crop: 'strawberry' },
  vityaz: { file: 'variety-photo-vityaz.webp', crop: 'strawberry', kind: 'photo' },
  slavutich: { file: 'variety-photo-slavutich.webp', crop: 'strawberry', kind: 'photo' },
  rusich: { file: 'variety-rusich.webp', crop: 'strawberry' },
  alfa: { file: 'variety-photo-alfa.webp', crop: 'strawberry', kind: 'photo' },
  solovushka: { file: 'variety-solovushka.webp', crop: 'strawberry' }
});

const genericRaspberryMedia = Object.freeze({
  red: { file: 'raspberry-garden.webp', crop: 'raspberry', fruitColor: 'red', generic: true },
  yellow: { file: 'raspberry-yellow-garden.webp', crop: 'raspberry', fruitColor: 'yellow', generic: true }
});
const genericStrawberryMedia = Object.freeze({
  file: 'strawberry-garden.webp', crop: 'strawberry', generic: true
});

export function cultivarSupplementalImages(variety) {
  const source = varietySupplementalPhotoSources[variety.slug];
  if (!source) return [];
  const description = source.photoDetail ?? 'фото сорта';
  return [{
    src: `/assets/${source.file}`,
    width: source.width,
    height: source.height,
    alt: `${variety.name}: ${description}`,
    shortCaption: `Фото сорта: ${description}`,
    caption: `Фото сорта: ${description} · <a href="${source.sourcePage}" target="_blank" rel="noopener noreferrer">${source.author}</a> · <a href="${source.licenseUrl}" target="_blank" rel="noopener noreferrer">${source.license}</a> · ${source.captionChange}`,
    captionText: `Фото сорта: ${description} · ${source.author} · ${source.license} · ${source.captionChange}`,
    sourcePage: source.sourcePage,
    licenseUrl: source.licenseUrl
  }];
}

export function cultivarImage(variety) {
  const media = varietyMedia[variety.slug] ?? (variety.cropKey === 'raspberry'
    ? genericRaspberryMedia[variety.fruitColor === 'yellow' ? 'yellow' : 'red']
    : variety.cropKey === 'strawberry' ? genericStrawberryMedia : undefined);
  if (!media || media.crop !== variety.cropKey) {
    throw new Error(`Missing or mismatched cultivar illustration: ${variety.slug}`);
  }
  if (variety.cropKey === 'raspberry' && (variety.fruitColor === 'red' || variety.fruitColor === 'yellow') && media.fruitColor !== variety.fruitColor) {
    throw new Error(`Raspberry fruit color and illustration differ: ${variety.slug}`);
  }
  const subject = variety.cropKey === 'strawberry'
    ? 'клубники'
    : variety.fruitColor === 'yellow' ? 'жёлтой малины' : 'малины';
  if (media.kind === 'photo') {
    const source = varietyPhotoSources[variety.slug];
    if (!source || source.file !== media.file) throw new Error(`Missing photo provenance: ${variety.slug}`);
    const detail = source.photoDetail ? ` (${source.photoDetail})` : '';
    const change = source.captionChange ?? 'кадрировано';
    return {
      src: `/assets/${media.file}`,
      width: source.width ?? 960,
      height: source.height ?? 640,
      alt: `Фото ${subject} сорта «${variety.name}»${detail}`,
      shortCaption: `Фото сорта${detail}`,
      caption: `Фото сорта${detail} · <a href="${source.sourcePage}" target="_blank" rel="noopener noreferrer">${source.author}</a> · <a href="${source.licenseUrl}" target="_blank" rel="noopener noreferrer">${source.license}</a> · ${change}`,
      captionText: `Фото сорта${detail} · ${source.author} · ${source.license} · ${change}`,
      sourcePage: source.sourcePage,
      licenseUrl: source.licenseUrl
    };
  }
  return {
    src: `/assets/${media.file}`,
    width: 960,
    height: 640,
    alt: `Иллюстрация ${subject} для карточки «${variety.name}»`,
    caption: `Иллюстрация ${subject}`
  };
}
