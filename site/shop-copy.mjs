// Transactional copy for feed-only products. A feed name and category identify
// an offer; neither is evidence for cultivar traits or regional suitability.

function clean(value, limit = 250) {
  return String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, limit);
}

function displayName(product) {
  return clean(product.name || product.expectedName).replace(/^Земляника садовая\s+/iu, 'Клубника ');
}

function cropTerms(product) {
  if (product.crop === 'raspberry') {
    return {
      section: 'саженцев малины',
      unit: 'саженцев',
      material: 'саженца',
      atArrival: 'Сверьте название и число саженцев с заказом, осмотрите упаковку перед посадкой.'
    };
  }
  if (product.crop === 'strawberry') {
    return {
      section: 'рассады клубники',
      unit: 'растений',
      material: 'рассады',
      atArrival: 'Сверьте название и число растений с заказом, осмотрите упаковку перед посадкой.'
    };
  }
  throw new Error('Shop article requires raspberry or strawberry crop');
}

function offerNotations(name) {
  const pattern = /(?:^|[\s,(])((?:фриго|frigo|ОКС|ЗКС|Р\s?9|P\s?9|кассет[\p{L}]*|контейнер[\p{L}]*|горш[\p{L}]*|\d+\s*(?:шт\.?|штук)))(?=$|[\s,).])/giu;
  return [...name.matchAll(pattern)].map(match => clean(match[1], 40)).slice(0, 3);
}

function quotedList(values) {
  if (values.length === 1) return `«${values[0]}»`;
  return `${values.slice(0, -1).map(value => `«${value}»`).join(', ')} и «${values.at(-1)}»`;
}

function categoryKind(product) {
  const category = clean(product.categoryId ?? product.category, 180).toLowerCase();
  if (category.includes('наборы земляники')) return 'set';
  if (category.includes('земляника альпийская')) return 'alpine';
  if (category.includes('ранние сорта')) return 'early';
  if (category.includes('средние сорта')) return 'mid';
  if (category.includes('поздние сорта')) return 'late';
  if (category.includes('ремонтант')) return 'remontant';
  if (category.includes('обыкновенная')) return 'ordinary';
  return 'other';
}

function categoryIntro(name, product, kind) {
  const label = `«${name}»`;
  switch (kind) {
    case 'set': return `${label} — набор из раздела рассады клубники. Здесь важно сверять не только название набора, но и его состав: отдельные растения могут различаться.`;
    case 'alpine': return `${label} продавец относит к альпийской землянике. Сравнивайте эту позицию с товарами той же группы: в каталоге она выделена отдельно от садовой клубники.`;
    case 'early': return `${label} находится у продавца среди ранних сортов клубники. При выборе учитывайте группу созревания, а конкретные сроки уточняйте для своего участка.`;
    case 'mid': return `${label} продавец поместил в раздел средних сортов клубники. Такая пометка помогает сравнивать товары одной группы по срокам созревания.`;
    case 'late': return `${label} указан у продавца среди поздних сортов клубники. Если дополняете уже выбранные посадки, сравните сроки с ранними и средними сортами.`;
    case 'remontant': return product.crop === 'raspberry'
      ? `${label} находится в разделе ремонтантной малины. При выборе саженца этой группы заранее уточните у продавца схему ухода и обрезки.`
      : `${label} продавец относит к ремонтантной клубнике. При планировании грядки сравните условия ухода с ранними, средними и поздними предложениями.`;
    case 'ordinary': return `${label} находится в разделе обыкновенной малины. Перед посадкой уточните у продавца схему ухода за побегами и требования к месту.`;
    default: return `${label} — товар из раздела ${cropTerms(product).section}. Сверьте точное название с предложением продавца, прежде чем планировать посадку.`;
  }
}

function bundleMembers(description) {
  const source = String(description ?? '');
  const section = source.match(/Состав набора:\s*([^]*?)(?=\n\s*\n|$)/iu)?.[1];
  if (!section) return [];
  const lines = section.split(/\r?\n/u).map(line => line.trim()).filter(Boolean);
  const members = lines.map(line => {
    if (!/^(?:земляника|клубника)(?:\s|$)/iu.test(line) || !/\d+\s*шт|[рp]\s?9/iu.test(line)) return null;
    return clean(line.split(/\s+(?=\d+\s*шт|[рp]\s?9)/iu)[0], 90);
  });
  return members.length >= 2 && members.every(Boolean) ? members.slice(0, 5) : [];
}

function sellerDetail(product, kind) {
  if (kind === 'set') {
    const members = bundleMembers(product.description);
    if (members.length) return `В описании продавца перечислены ${quotedList(members)}. Перед посадкой подпишите растения по этикеткам, чтобы сохранить состав набора.`;
    return 'На странице продавца проверьте состав набора и количество растений каждого наименования. Перед посадкой подпишите их по этикеткам.';
  }
  const age = String(product.description ?? '').match(/Возраст саженца\s*(\d{1,2})\s*(год|года|лет)/iu);
  if (age) return `В описании продавца указан возраст саженца — ${age[1]} ${age[2]}. При получении сверьте этикетку и состояние посадочного материала с заказом.`;
  const notations = offerNotations(clean(product.name || product.expectedName));
  if (notations.length) return `В названии предложения указано ${quotedList(notations)}. Сверьте эти обозначения с комплектацией и форматом посадочного материала в магазине.`;
  const descriptor = clean(product.name || product.expectedName).match(/(?:^|\s)(бесшипая|штамбовая|крупноплодная|земклуника)(?=\s|$)/iu)?.[1];
  if (descriptor) return `В названии продавец отдельно отмечает «${descriptor}». Уточните в магазине характеристики именно этого саженца и формат отправки.`;
  const terms = cropTerms(product);
  return `Уточните на странице продавца формат ${terms.material}, количество ${terms.unit} и условия отправки. Эти сведения помогут сравнить предложения с похожими названиями.`;
}

function categoryTip(kind, product) {
  switch (kind) {
    case 'set': return 'Получив набор, проверьте число растений и каждую бирку по списку из заказа. Если планируете несколько грядок, распределите растения до посадки.';
    case 'alpine': return 'Перед посадкой отметьте эту позицию на схеме грядки отдельно от садовой клубники. Так будет проще сравнить растения после укоренения.';
    case 'early': return 'Пометьте раннюю группу на схеме посадок. Позже это поможет сравнивать сроки сбора на вашем участке, не полагаясь только на календарь из описания.';
    case 'mid': return 'Запишите место посадки и сохраните название на бирке. Сроки созревания удобно сравнивать по своим наблюдениям, когда растения начнут плодоносить.';
    case 'late': return 'Отметьте позднюю группу на плане грядки: в следующем сезоне будет проще сопоставить фактические сроки сбора с другими сортами.';
    case 'remontant': return product.crop === 'raspberry'
      ? 'Сохраните название сорта и рекомендации по обрезке из заказа. Уход за побегами лучше планировать по проверенной инструкции для выбранного растения.'
      : 'Сохраните название на бирке и отметьте место посадки. Так будет проще наблюдать за плодоношением и уточнять уход именно за купленным растением.';
    case 'ordinary': return 'После получения подпишите саженец и запишите место посадки. Это поможет не перепутать растения при дальнейшем уходе за малинником.';
    default: return 'При получении проверьте название и число растений, осмотрите упаковку и сохраните бирку для дальнейшего ухода.';
  }
}

/**
 * Build short buyer guidance for a feed-only offer. Only explicit commercial
 * details are extracted from the seller's description, never cultivar claims.
 * Existing editor-reviewed articles take precedence at the call site.
 */
export function buildShopArticle(product) {
  const name = displayName(product);
  if (!name) throw new Error('Shop article requires a product name');
  cropTerms(product);
  const kind = categoryKind(product);
  const id = clean(product.id, 50);
  const duplicateNote = product.duplicateName && id
    ? ` Это позиция продавца № ${id}; при совпадении названий сверяйте номер предложения.`
    : '';
  return {
    title: product.duplicateName && id ? `${name} — товар № ${id}` : name,
    paragraphs: [categoryIntro(name, product, kind), sellerDetail(product, kind), categoryTip(kind, product) + duplicateNote]
  };
}

export function buildShopLead(product) {
  const name = displayName(product);
  if (!name) throw new Error('Shop lead requires a product name');
  const kind = categoryKind(product);
  const terms = cropTerms(product);
  if (kind === 'set') return `«${name}»: проверьте состав набора и количество растений в предложении продавца.`;
  return `«${name}» — товар из раздела ${terms.section}. Сверьте формат и наличие у продавца.`;
}
