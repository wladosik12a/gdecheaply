"""Create a public storefront snapshot from the local API and database."""
import json
import hashlib
import subprocess
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public' / 'data'
OUT.mkdir(parents=True, exist_ok=True)

def sql(query):
    p = subprocess.run(['docker', 'exec', 'gdecheaply-agent-db-1', 'psql', '-U', 'agent', '-d', 'agent', '-t', '-A', '-c', query], check=True, capture_output=True)
    return json.loads(p.stdout.decode('utf-8'))

def save(name, data):
    (OUT / name).write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')

items, offset = [], 0
while offset is not None:
    with urllib.request.urlopen(f'http://127.0.0.1:8000/api/public/browse-products?limit=100&offset={offset}', timeout=60) as response:
        page = json.load(response)
    items.extend(page['items'])
    offset = page['next_offset']

missing = set()
downloaded = {}
for item in items:
    path = item.get('image_url') or ''
    if path.startswith('/api/public/images/'):
        name = path.rsplit('/', 1)[-1]
        if (ROOT / 'public' / 'product-images' / name).is_file():
            item['image_url'] = 'product-images/' + name
        else:
            missing.add(name)
            item['image_url'] = None
    elif path.startswith('https://www.maria-ra.ru/'):
        if path not in downloaded:
            try:
                req = urllib.request.Request(path, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req, timeout=15) as response:
                    content_type = response.headers.get_content_type()
                    data = response.read(5_000_001)
                ext = {'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp'}.get(content_type)
                if not ext or len(data) > 5_000_000:
                    raise ValueError('unsupported image')
                name = 'external-' + hashlib.sha256(path.encode()).hexdigest() + ext
                (ROOT / 'public' / 'product-images' / name).write_bytes(data)
                downloaded[path] = 'product-images/' + name
            except Exception:
                downloaded[path] = None
        item['image_url'] = downloaded[path]
save('products.json', items)

# Explicit public fields only: source payloads and operational logs are not published.
raw = sql("""SELECT json_build_object(
 'inventory', (SELECT coalesce(json_agg(x),'[]') FROM (SELECT id,raw_name,category_id,source_url,method,review_status,observed_at FROM inventory_entries ORDER BY id) x),
 'offers', (SELECT coalesce(json_agg(x),'[]') FROM (SELECT id,master_product_id,store_name,product_url,raw_title,price,currency,image_url,updated_at,match_status,source_method,review_status,observed_at,regular_price,discount_price,price_conditions,price_unit FROM store_offers ORDER BY id) x),
 'masters', (SELECT coalesce(json_agg(x),'[]') FROM (SELECT id,canonical_name,brand,weight_or_volume,category,main_image_url FROM master_products ORDER BY id) x))""")
for record in raw['offers'] + raw['masters']:
    for field in ('image_url', 'main_image_url'):
        path = record.get(field) or ''
        if path.startswith('/api/public/images/'):
            name = path.rsplit('/', 1)[-1]
            record[field] = 'product-images/' + name if (ROOT / 'public' / 'product-images' / name).is_file() else None
save('source-records.json', raw)
stores = sql("""SELECT coalesce(json_agg(x),'[]') FROM (SELECT l.id,s.code,s.name,l.address,ST_Y(l.location::geometry) lat,ST_X(l.location::geometry) lng,l.source_url,l.verified_at,l.source_description FROM store_locations l JOIN catalog_stores s ON s.id=l.store_id ORDER BY l.id) x""")
stores = [s for s in stores if not (s['code'] == 'pyaterochka' and s['id'] == 25)]  # Previously removed at the user's request.
save('database-stores.json', stores)

groups = {}
for offer in raw['offers']:
    if offer['master_product_id'] is None or offer['match_status'] not in ('matched', 'unmatched') or offer['review_status'] == 'rejected':
        continue
    groups.setdefault(str(offer['master_product_id']), []).append({
        'id': offer['id'], 'store': offer['store_name'], 'name': offer['raw_title'],
        'price': str(offer['regular_price'] if offer['regular_price'] is not None else offer['price']) if offer['regular_price'] is not None or offer['price'] is not None else None,
        'currency': offer['currency'], 'observed_at': offer['observed_at'],
        'source_method': offer['source_method'], 'source_status': 'Требует проверки' if offer['review_status'] != 'approved' else 'Данные источника',
        'source_url': offer['product_url'] if offer['product_url'].startswith('https://') else None,
    })
by_id = {str(o['id']): groups.get(str(o['master_product_id']), []) for o in raw['offers'] if o['match_status'] in ('matched', 'unmatched') and o['review_status'] != 'rejected'}
for group in groups.values():
    group.sort(key=lambda x: (x['price'] is None, float(x['price'] or 0), x['store'], x['id']))
lookup = {(o['product_url'], o['raw_title']): o for o in raw['offers'] if str(o['id']) in by_id}
inventory_links = {i['id']: by_id[str(lookup[(i['source_url'], i['raw_name'])]['id'])] for i in raw['inventory'] if i['review_status'] != 'rejected' and (i['source_url'], i['raw_name']) in lookup}
save('master-offers.json', {'offers': by_id, 'inventory': inventory_links})
print(f"visible={len(items)} inventory={len(raw['inventory'])} offers={len(raw['offers'])} masters={len(raw['masters'])} stores={len(stores)} missing_images={len(missing)} external_images={sum(bool(x.get('image_url','').startswith('https://')) for x in items if x.get('image_url'))}")
