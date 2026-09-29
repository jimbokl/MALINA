// Transactional copy for feed-only products. A feed name and category identify
// an offer; neither is evidence for cultivar traits or regional suitability.
import { extractShopFeedFacts } from './shop-feed-facts.mjs';

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
  const pattern = /(?:^|[^\p{L}\d])((?:фриго|frigo|ОКС|ЗКС|Р\s?9|P\s?9|кассет[\p{L}]*|контейнер[\p{L}]*|горш[\p{L}]*|\d+\s*(?:шт\.?|штук)))(?=$|[^\p{L}\d])/giu;
  return [...name.matchAll(pattern)].map(match => clean(match[1], 40).replace(/\.$/u, '')).slice(0, 3);
}

function sellerAge(description) {
  return String(description ?? '').match(/Возраст саженца\s*(\d{1,2})\s*(год|года|лет)/iu);
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
    case 'set': return `${label} — набор рассады клубники. Мы бы начали с состава: какие растения и сколько штук вы получите?`;
    case 'alpine': return `${label} находится в группе альпийской земляники. Сравнивайте его с растениями этой же группы, а не с крупноплодной клубникой.`;
    case 'early': return `${label} стоит в подборке ранней клубники. Если хотите ягоды пораньше, сравните это предложение с другими сортами этой группы.`;
    case 'mid': return `${label} стоит в подборке клубники среднего срока. Мы бы сравнили её с ранними и поздними вариантами, чтобы спланировать сезон сбора.`;
    case 'late': return `${label} стоит в подборке поздней клубники. Она может дополнить ранние посадки, если вы хотите продлить сезон сбора.`;
    case 'remontant': return product.crop === 'raspberry'
      ? `${label} — в разделе ремонтантной малины. Мы бы заранее разобрались, когда её обрезать и на каких побегах ждать ягоды.`
      : `${label} — в разделе ремонтантной клубники. Сравните уход с другими вариантами, прежде чем выбрать место для грядки.`;
    case 'ordinary': return `${label} — в разделе малины. Перед посадкой уточните, как ухаживать за побегами и какое место ей нужно.`;
    default: return `${label} — предложение из раздела ${cropTerms(product).section}. Мы бы сначала проверили точное название и состав заказа.`;
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
    if (members.length) return `В набор входят ${quotedList(members)}. Перед посадкой подпишите растения по этикеткам, чтобы потом не перепутать сорта.`;
    return 'Посмотрите состав набора и число растений каждого сорта. Перед посадкой подпишите их по этикеткам.';
  }
  const age = sellerAge(product.description);
  if (age) return `Продавец указывает возраст саженца: ${age[1]} ${age[2]}. Когда он приедет, проверьте этикетку и состояние растения.`;
  const notations = offerNotations(clean(product.name || product.expectedName));
  if (notations.length) return `В предложении указано ${quotedList(notations)}. Перед заказом уточните, что означают эти пометки и что именно приедет.`;
  const descriptor = clean(product.name || product.expectedName).match(/(?:^|\s)(бесшипая|штамбовая|крупноплодная|земклуника)(?=\s|$)/iu)?.[1];
  if (descriptor) return `Продавец называет растение «${descriptor}». Мы бы уточнили, что именно он отправит и в каком виде.`;
  const terms = cropTerms(product);
  return `Проверьте формат ${terms.material}, число ${terms.unit} и доставку. Так проще сравнить предложения с похожими названиями.`;
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

function sellerObservation(product) {
  // The merchant's repeated planting template would make pages identical.
  // Keep only concrete descriptions of the berries, bush or ripening group.
  const facts = extractShopFeedFacts(product)
    .filter(fact => ['fruit', 'bush', 'ripening'].includes(fact.kind))
    .sort((left, right) => ['fruit', 'bush', 'ripening'].indexOf(left.kind) - ['fruit', 'bush', 'ripening'].indexOf(right.kind))
    .slice(0, 2);
  const intros = {
    fruit: 'О ягодах продавец пишет',
    bush: 'Куст в описании продавца',
    ripening: 'О сроках созревания продавец пишет'
  };
  return facts.map(fact => `${intros[fact.kind]}: «${fact.text.replace(/[.!?]+$/u, '')}».`).join(' ');
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
  const observation = sellerObservation(product);
  return {
    title: product.duplicateName && id ? `${name} — товар № ${id}` : name,
    paragraphs: [categoryIntro(name, product, kind), sellerDetail(product, kind), ...(observation ? [observation] : []), categoryTip(kind, product) + duplicateNote]
  };
}

export function buildShopLead(product) {
  const name = displayName(product);
  if (!name) throw new Error('Shop lead requires a product name');
  const kind = categoryKind(product);
  const terms = cropTerms(product);
  if (kind === 'set') {
    const count = name.match(/\b(\d+)\s*саженц[а-я]*/iu)?.[1];
    const unit = count && Number(count) % 10 >= 2 && Number(count) % 10 <= 4 && (Number(count) % 100 < 12 || Number(count) % 100 > 14) ? 'саженца' : 'саженцев';
    return count ? `«${name}»: ${count} ${unit} клубники; состав — в описании товара.` : `«${name}»: состав — в описании товара.`;
  }
  const age = sellerAge(product.description);
  const notations = offerNotations(clean(product.name || product.expectedName));
  if (age && notations.length) return `«${name}»: саженец возрастом ${age[1]} ${age[2]}; пометки продавца — ${notations.join(', ')}.`;
  if (age) return `«${name}»: саженец возрастом ${age[1]} ${age[2]}. Расскажем, что проверить перед заказом.`;
  if (notations.length) return `«${name}»: в предложении указано ${notations.join(', ')}. Посмотрите, что входит в заказ.`;
  const group = {
    alpine: 'Альпийская земляника',
    early: 'Ранняя клубника',
    mid: 'Клубника среднего срока',
    late: 'Поздняя клубника',
    remontant: product.crop === 'raspberry' ? 'Ремонтантная малина' : 'Ремонтантная клубника',
    ordinary: 'Обыкновенная малина'
  }[kind];
  return group ? `«${name}» — ${group.toLocaleLowerCase('ru')}. Посмотрите состав предложения и советы по посадке.` : `«${name}» — предложение из раздела ${terms.section}. Поможем разобраться с посадкой и заказом.`;
}
