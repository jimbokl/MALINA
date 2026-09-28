// Extract small, attributable claims from the merchant's structured description.
// These are seller statements, not independently verified cultivar properties.

const HEADINGS = [
  ['Срок созревания/потребления(срок хранения)', 'ripening'],
  ['Срок созревания, потребления (срок хранения)', 'ripening'],
  ['Периодичность плодоношения', null],
  ['Условия выращивания', 'planting'],
  ['Возраст саженца', null],
  ['Срок созревания', 'ripening'],
  ['Плоды (ягоды)', 'fruit'],
  ['Плоды(ягоды)', 'fruit'],
  ['Дерево (куст)', 'bush'],
  ['Дерево(куст)', 'bush'],
  ['Самоплодность', null],
  ['Зимостойкость', null],
  ['Урожайность', null],
  ['Плодоношение', 'ripening'],
  ['Применение', null]
].sort((a, b) => b[0].length - a[0].length);

const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const HEADING_RE = new RegExp(HEADINGS.map(([heading]) => escapeRegex(heading)).join('|'), 'giu');
const KIND_BY_HEADING = new Map(HEADINGS.map(([heading, kind]) => [heading.toLowerCase(), kind]));

// These topics need a different evidence standard; a feed claim alone is not enough.
const UNSUITABLE = /урожа|продуктив|зимостой|мороз|холодостой|засухоустойчив|жаростой|регион|област|подмосков|сибир|климат|лечеб|целеб|иммунитет|витамин|болезн|заболеван|устойчив|дожд|погод|кажд[а-яё]+ ветк|с одного куста|с куста|насчитыва/iu;
const PLANTING_BOILERPLATE = /Для посадки лучше всего подходят солнечные участки,?\s*но растение также переносит легкое затенение|Лучше всего растет на легких и средних по механическому составу почвах с кислотностью|Почва должна быть легкой, питательной с (?:высоким )?уровнем кислотности|Предпочитает солнечные места, хорошо проветриваемые, почвы суглинистые или супесчаные/iu;
const COPIED_TRAIT_BOILERPLATE = /Куст мощный, хорошо облиственный, цветоносы на уровне листьев, толстые|Ягода темноокрашенная, ширококоническая, с блестящей плотной кожицей|Куст клубники мощный/iu;
const DANGLING = /(?:\b(?:в|на|до|от|с|по|для|при|и|а|но|как|или|около|примерно|высоту|массой|весом)\b|[,;:—–-])\s*[.!?]?$/iu;

function splitSections(description) {
  const headings = [...description.matchAll(HEADING_RE)].filter(match => {
    if (match.index === 0) return true;
    const before = description.slice(0, match.index);
    // The feed glues labels to preceding text. A label preceded by an ordinary
    // space inside a sentence ("ранний срок созревания") is prose, not a field.
    return !/\s$/u.test(before) || /[.!?]\s*$/u.test(before);
  });
  return headings.map((match, index) => ({
    kind: KIND_BY_HEADING.get(match[0].toLowerCase()),
    body: description.slice(match.index + match[0].length, headings[index + 1]?.index ?? description.length)
  }));
}

function sentences(body) {
  // Most feed sections lack line breaks. A full stop followed by an uppercase
  // letter is a reliable boundary without splitting decimal quantities.
  return body.replace(/([.!?])(?=\s*[А-ЯЁA-Z])/gu, '$1\u0000').split('\u0000')
    .map(part => part.trim()).filter(Boolean);
}

function eligible(kind, sentence, productName) {
  const text = sentence.replace(/\s+/gu, ' ').trim();
  const words = text.match(/[\p{L}\d]+/gu) ?? [];
  if (text.length < 15 || text.length > 175 || words.length < 2 || words.length > 30) return false;
  if (/[<>\uFFFD\u0000-\u001f]/u.test(text) || UNSUITABLE.test(text) || COPIED_TRAIT_BOILERPLATE.test(text) || DANGLING.test(text)) return false;
  if (!/[.!?]$/u.test(text)) return false;
  if (/[.!?]\s+[а-яё]/u.test(text)) return false;
  // A copied description sometimes names a different cultivar. The initial
  // capitalized word starts a sentence; later proper names must occur in this
  // offer's name or the whole claim is omitted.
  const properNames = [...text.matchAll(/[А-ЯЁ][а-яё]+|\b[A-Z][a-z]+\b/gu)]
    .filter(match => match.index > 0).map(match => match[0].toLocaleLowerCase('ru'));
  const offerWords = new Set((productName.match(/[\p{L}\d]+/gu) ?? [])
    .map(word => word.toLocaleLowerCase('ru')));
  if (properNames.some(name => !offerWords.has(name))) return false;

  if (kind === 'ripening') {
    if (/(?:сорта|сортов)\s/iu.test(text)) return false;
    return /срок|созрев|плодонос|плодонош/iu.test(text)
      && /ранн|средн(?:его|ий|ие|яя)|поздн|ремонтант|май|июнь|июль|август|сентябрь/iu.test(text);
  }
  if (kind === 'fruit') {
    if (/куст|побег|срок созрев|среднепоздн|раннеспел|позднеспел|ремонтант/iu.test(text)) return false;
    return /ягод|плод|мякот|вкус/iu.test(text)
      && /красн|алый|рубинов|черн|т[её]мн|бел[а-я]*|желт|сладк|кисл|аромат|форм|конус|округл|овальн|цилиндр|вес|масс|\d+\s*(?:г|грамм)(?![а-яё])|крупн|мелк|плотн|сочн|блестящ|глянц|матов/iu.test(text);
  }
  if (kind === 'bush') {
    return /куст|побег|растени|листь|цветонос/iu.test(text)
      && (/компакт|раскидист|прямостоя|прямыми|среднерос|высокорос|низкорос|мощн|шиповат|бесшип|шипы|шипами|облиствен/iu.test(text)
        || /\d+(?:[,.]\d+)?\s*(?:м|см)\b/iu.test(text));
  }
  if (kind === 'planting') {
    if (PLANTING_BOILERPLATE.test(text)) return false;
    return /почв|грунт|участ|мест|посадк/iu.test(text)
      && /солнеч|затен|суглин|черноз[её]м|кислот|\bpH\b|\bрН\b|л[её]гк[а-я]* почв/iu.test(text);
  }
  return false;
}

function displayText(kind, source) {
  let text = source.replace(/\s+/gu, ' ');
  // Calendar dates in the feed have no growing region attached. Keep the
  // seller's ripening group without turning that date into a site-wide claim.
  if (kind === 'ripening') text = text.replace(/\s*\([^)]*\)(?=[.!?]$)/u, '');
  return text;
}

/**
 * Return up to three directly quoted, short seller claims in editorial priority.
 * `source` is an exact substring of `product.description`; consumers should label
 * each `text` as a merchant description, never as a verified observation.
 */
export function extractShopFeedFacts(product) {
  if (product?.merchantDescriptionShared) return [];
  const description = typeof product?.description === 'string' ? product.description : '';
  if (!description) return [];
  const productName = String(product.name ?? product.expectedName ?? '');
  const found = new Map();
  for (const section of splitSections(description)) {
    if (!section.kind || found.has(section.kind)) continue;
    for (const source of sentences(section.body)) {
      if (!eligible(section.kind, source, productName)) continue;
      found.set(section.kind, {
        kind: section.kind,
        text: displayText(section.kind, source),
        source,
        attribution: 'merchant_description'
      });
      break;
    }
  }
  return ['ripening', 'fruit', 'bush', 'planting']
    .filter(kind => found.has(kind)).slice(0, 3).map(kind => found.get(kind));
}
