"""Import reviewed Magnit snapshot and linked Yarché pictures into the local storefront."""
import collections
import concurrent.futures
import hashlib
import json
import shutil
import time
import urllib.request
from pathlib import Path

FRONT = Path(__file__).resolve().parents[1]
BACK = FRONT.parent / 'gdecheaply-agent'
PRODUCTS = FRONT / 'public/data/products.json'
IMAGES = FRONT / 'public/product-images'
norm = lambda s: ' '.join((s or '').casefold().replace('ё', 'е').split())
products = json.loads(PRODUCTS.read_text(encoding='utf-8'))
incoming = json.loads((BACK / 'magnit_parsed.json').read_text(encoding='utf-8'))
source = json.loads((BACK / 'Общий_ассортимент/Общий_ассортимент.json').read_text(encoding='utf-8'))

def save():
    PRODUCTS.write_text(json.dumps(products, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')

# The source's exact title and unique picture mapping are used, never fuzzy matches.
yarche = collections.defaultdict(set)
for row in source['stores'].get('Ярче!', []):
    image = row.get('image') or {}
    if image.get('path'):
        yarche[norm(row['name'])].add(image['path'])
yarche_count = 0
for item in products:
    paths = yarche.get(norm(item.get('name')), set())
    if item.get('store') != 'Ярче!' or item.get('image_url') or len(paths) != 1:
        continue
    src = (BACK / 'Общий_ассортимент' / next(iter(paths))).resolve()
    folder = (BACK / 'Общий_ассортимент/data/yarche_pdf_images').resolve()
    if src.parent != folder or not src.is_file():
        continue
    target = IMAGES / ('yarche-' + src.name)
    shutil.copyfile(src, target)
    item['image_url'] = 'product-images/' + target.name
    yarche_count += 1
save()

name_index = collections.defaultdict(list)
for item in products:
    if item.get('store') in ('magnit.ru', 'Магнит'):
        name_index[norm(item.get('name'))].append(item)
eligible = [row for row in incoming if row.get('product_url') and row.get('image_url')]

def download(row):
    url = row['image_url']
    if not url.startswith('https://images-foodtech.magnit.ru/'):
        return row, None
    name = 'magnit-' + hashlib.sha256(url.encode()).hexdigest() + '.webp'
    dest = IMAGES / name
    if dest.is_file() and dest.stat().st_size > 100:
        return row, 'product-images/' + name
    for attempt in range(2):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=12) as r:
                content, data = r.headers.get_content_type(), r.read(5_000_001)
            if content not in ('image/webp', 'image/jpeg', 'image/png') or not 100 < len(data) <= 5_000_000:
                return row, None
            dest.write_bytes(data)
            return row, 'product-images/' + name
        except Exception:
            if not attempt: time.sleep(1)
    return row, None

added = updated = failed = ambiguous = 0
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    for row, image in pool.map(download, eligible):
        candidates = name_index.get(norm(row['name']), [])
        if len(candidates) > 1:
            ambiguous += 1
            continue
        if not image:
            failed += 1
        if candidates:
            item = candidates[0]
            if image and not item.get('image_url'):
                item['image_url'] = image
            if row.get('weight_volume') and row.get('price') is not None:
                item['price'] = str(row['price'])
                item['observed_at'] = row.get('parsed_at')
                item['source_method'] = 'сайт магазина'
            updated += 1
            continue
        item = {'id': 'magnit-snapshot-' + hashlib.sha256(row['product_url'].encode()).hexdigest()[:24],
                'name': row['name'], 'store': 'magnit.ru',
                'price': str(row['price']) if row.get('price') is not None and row.get('weight_volume') else None,
                'currency': 'RUB', 'image_url': image, 'observed_at': row.get('parsed_at'),
                'source_status': 'Данные источника', 'source_method': 'сайт магазина',
                'category': 'Мясо' if row['category'] == 'Птица, мясо' else 'Напитки',
                'source_url': row['product_url']}
        products.append(item)
        name_index[norm(item['name'])].append(item)
        added += 1
save()
print(f'yarche_images={yarche_count} magnit_eligible={len(eligible)} added={added} matched={updated} ambiguous={ambiguous} image_failures={failed} skipped_no_url={sum(not r.get("product_url") for r in incoming)}')
