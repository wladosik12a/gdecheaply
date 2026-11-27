const base = import.meta.env.BASE_URL;
let productsPromise;
let offersPromise;
const read = path => fetch(`${base}data/${path}`).then(r => {
  if (!r.ok) throw new Error('Не удалось загрузить локальные данные');
  return r.json();
});
const products = () => productsPromise ||= read('products.json').then(items => items.map(item => ({
  ...item, has_local_photo: !!item.image_url && item.image_url.startsWith('product-images/'), image_url: item.image_url ? new URL(item.image_url, document.baseURI).href : null,
})));
const normalize = value => (value || '').toLocaleLowerCase('ru').replaceAll('ё', 'е').trim();
const wordBoundary = char => !char || !/[\p{L}\p{N}]/u.test(char);
function relevance(name, query) {
  const text = normalize(name), index = text.indexOf(query);
  if (text === query) return 0;
  if (index === 0 && wordBoundary(text[query.length])) return 1;
  if (index === 0) return 2;
  if (index >= 0 && wordBoundary(text[index - 1]) && wordBoundary(text[index + query.length])) return 3;
  if (index >= 0 && wordBoundary(text[index - 1])) return 4;
  return 5;
}

window.staticCatalog = {
  async search({q = '', category = '', store = '', sort = 'default', offset = 0, limit = 40} = {}) {
    const needle = normalize(q);
    const items = (await products()).filter(item =>
      (!needle || normalize(item.name).includes(needle)) &&
      (!category || category === item.category) &&
      (!store || normalize(item.store).includes(normalize(store)) || (store === 'Магнит' && item.store === 'magnit.ru') || (store === 'Пятёрочка' && item.store === '5ka.ru')));
    items.sort((a, b) => {
      if (sort === 'default') {
        if (needle) {
          const relevanceOrder = relevance(a.name, needle) - relevance(b.name, needle);
          if (relevanceOrder) return relevanceOrder;
        }
        const photoOrder = Number(b.has_local_photo) - Number(a.has_local_photo);
        if (photoOrder) return photoOrder;
      }
      const categoryOrder = Number(a.category === 'Другое') - Number(b.category === 'Другое');
      if (categoryOrder) return categoryOrder;
      if (sort === 'default') return 0;
      if (sort.startsWith('name')) return (sort === 'name_asc' ? 1 : -1) * a.name.localeCompare(b.name, 'ru');
      if (a.price == null) return b.price == null ? 0 : 1;
      if (b.price == null) return -1;
      return (sort === 'price_asc' ? 1 : -1) * (Number(a.price) - Number(b.price));
    });
    return {items: items.slice(offset, offset + limit), next_offset: offset + limit < items.length ? offset + limit : null};
  },
  async offers(id) {
    const all = await (offersPromise ||= read('master-offers.json'));
    const list = id.startsWith('source-offer-') ? all.offers[id.slice(13)] : id.startsWith('inventory-') ? all.inventory[id.slice(10)] : null;
    return list ? {offers: list} : null;
  },
};
