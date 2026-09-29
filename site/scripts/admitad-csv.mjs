const productColumns = ['available', 'categoryId', 'currencyId', 'id', 'name', 'picture', 'price', 'url'];

export function parseCsv(input, requiredColumns = productColumns) {
  const text = input.replace(/^\uFEFF/, '');
  const records = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"';
        index++;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"' && field === '') {
      quoted = true;
    } else if (char === ';') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field.replace(/\r$/, ''));
      if (row.some(value => value !== '')) records.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (quoted) throw new Error('Unclosed CSV quote');
  if (field || row.length) {
    row.push(field.replace(/\r$/, ''));
    records.push(row);
  }
  const [headers, ...values] = records;
  if (!headers || requiredColumns.some(column => !headers.includes(column))) {
    throw new Error('Admitad CSV columns are missing');
  }
  if (new Set(headers).size !== headers.length) throw new Error('Duplicate CSV columns');
  return values.map((cells, index) => {
    if (cells.length !== headers.length) throw new Error(`Malformed CSV row ${index + 2}`);
    return Object.fromEntries(headers.map((header, position) => [header, cells[position]]));
  });
}
