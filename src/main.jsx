import Cart from './Cart.jsx';
import './static-catalog.js';
import { InteractiveHoverButton } from './components/ui/interactive-hover-button';
import DishConveyor from './components/ui/DishConveyor.jsx';
import AddressInput from './AddressInput.jsx';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import './ui.css';
import './legacy.css';

function Avatar({ html }) {
  return <div className="avatar" dangerouslySetInnerHTML={{ __html: html }} />;
}

function Themes({ html }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

function Profile({ name, tag, avatar, themes }) {
  return <>
    <div className="card pcard"><Avatar html={avatar} /><div><small>Привет,</small><strong>{name}</strong><small>{tag}</small></div></div>
    <div className="card list" style={{ marginTop: 14 }}>
      <button className="rowb" data-go="editprofile"><em>✏️</em>Редактировать профиль<b>›</b></button>
      <button className="rowb" data-go="settings"><em>⚙️</em>Настройки<b>›</b></button>
      <button className="rowb" data-go="about"><em>ℹ️</em>О приложении<b>›</b></button>
    </div>
    <Themes html={themes} /><Footer />
  </>;
}

function Footer() { return <div className="foot">Создано командой<br />Где дешевле ♡</div>; }

function EditProfile({ name, avatar }) {
  return <>
    <div style={{ display: 'grid', placeItems: 'center', margin: '10px 0 18px' }}><div style={{ width: 96, height: 96 }} className="avatar" dangerouslySetInnerHTML={{ __html: avatar }} /></div>
    <div className="lbl">ИМЯ</div><input className="inp" id="nameInp" maxLength={30} defaultValue={name} placeholder="Как к вам обращаться" />
    <div className="hint">Имя и фото подтягиваются из Telegram автоматически. Здесь можно указать другое имя для приложения.</div>
    <div className="bar"><button className="btn" data-act="saveName">Сохранить</button></div>
  </>;
}

function Settings({ themes }) { return <><Themes html={themes} /><div className="hint" style={{ marginTop: 14 }}>Других настроек пока нет — они появятся в следующих версиях.</div></>; }
function About() {
  return <><div className="card" style={{ padding: 22, marginTop: 6, textAlign: 'center' }}>
    <div style={{ fontSize: 54 }}>🛒</div><h2 style={{ margin: '8px 0' }}>Где дешевле</h2>
    <p className="hint" style={{ fontSize: 16 }}>Сравниваем цены на продукты в магазинах рядом с вами и подсказываем, где выгоднее купить: учитываем и цену, и расстояние.</p>
    <p className="hint">Версия 1.0 · Mini App для Telegram</p><button className="btn sec2" data-act="onb" style={{ marginTop: 12 }}>Как это работает</button>
  </div><Footer /></>;
}

const screens = { cart: [Cart, 'cartBody'], profile: [Profile, 'profileBody'], editprofile: [EditProfile, 'editBody'], settings: [Settings, 'settingsBody'], about: [About, 'aboutBody'], location: [Location, 'locBody'], menu: [Menu, 'menuBody'], stores: [Stores, 'storesBody'], history: [History, 'historyBody'], search: [Search, 'searchBody'], results: [Results, 'res'], storeProducts: [StoreProducts, 'storeReal'], storeProduct: [StoreProduct, 'storeProductBody'] };
createRoot(document.getElementById('homeFindStore')).render(<InteractiveHoverButton text="Найти магазин" data-go="findstore" />);

const roots = new Map();
let editVersion = 0;
window.renderReactScreen = (name, props) => {
  const [Component, id] = screens[name];
  const container = document.getElementById(id);
  if (!roots.has(id) || roots.get(id).container !== container) roots.set(id, {container, root:createRoot(container)});
  flushSync(() => roots.get(id).root.render(<Component key={name === 'editprofile' ? ++editVersion : name === 'storeProducts' ? name + (props.resetKey || '') : name} {...props} />));
};

// Временный мост: старые экраны работают до их переноса на React.
const script = document.createElement('script');
script.src = `${import.meta.env.BASE_URL}legacy.js?v=static-20261127`;
document.body.appendChild(script);


function Location({ locations, selected }) {
  return <>
    <button className="btn sec2" data-act="autoLoc">📍 Определить автоматически</button>
    {locations.length >= 2 && <><div className="lbl">НЕДАВНИЕ АДРЕСА</div><div className="card list">{locations.map((location, index) => <button key={index} className="rowb" data-loc={index}><em>📍</em>{location.n}<i className={'dot ' + (location.n === selected ? 'on' : '')} /></button>)}</div></>}
    <div className="lbl">ДРУГОЙ АДРЕС</div><AddressInput />
    <div style={{height:12}} /><button className="btn" data-act="addLoc">Добавить и выбрать</button>
    <div className="hint">Поиск введённого адреса выполняется в Новосибирске. Магазины и время в пути считаются от выбранной точки.</div>
  </>;
}
function Menu({dishes,selected}) {return <><DishConveyor dishes={dishes} selected={selected}/><div className="bar" style={{position:'static'}}><button className="btn" disabled={!selected.length} data-act="buildMenu">Составить список продуктов</button></div></>;}
function Stores({stores}) {
 return <div className="grid2">{stores.map(s => <button key={s.id} className="card" data-go="store" data-arg={s.id} style={{padding:'22px 10px',display:'flex',flexDirection:'column',alignItems:'center',gap:12,fontSize:17,fontWeight:600,textAlign:'center'}}><img className="sb l" src={s.logo} alt={s.n} draggable="false" referrerPolicy="no-referrer" onError={e=>{e.currentTarget.style.display='none';e.currentTarget.nextSibling.style.display='grid'}}/><span className="sb l" style={{display:'none',background:s.c,placeItems:'center',color:'#fff'}}>{s.l}</span>{s.n}<span style={{fontSize:13,color:'var(--mut)',fontWeight:500}}>📍 {s.min} мин</span></button>)}</div>;
}

function History({orders}) {
 if (!orders.length) return <div className="empty"><em>🕓</em>Пока нет покупок.<br />Они появятся здесь после оформления корзины.</div>;
 return <>{orders.map((o,i) => <button key={i} className={'card oc ' + (i === 0 ? 'first' : '')} data-go="order" data-arg={i}><div className="h"><span>{o.date}</span><span>{o.sum}</span></div><div className="st">{o.count}<br />{o.stores}</div><div className="thumbs">{o.pictures.map((pic,index)=><i key={index} dangerouslySetInnerHTML={{__html:pic}} />)}{o.remaining > 0 && <i className="more">+{o.remaining}</i>}</div></button>)}</>;
}

function Search() {
 return <><label className="search" style={{marginTop:4}}>🔎<input id="q" placeholder="Найти продукт" autoComplete="off" /></label><section className="popular-searches" aria-labelledby="popular-search-title"><h2 id="popular-search-title">Часто ищут</h2><div className="popular-search-chips">{['Хлеб','Сыр','Вода','Мороженое','Молоко'].map(t=><button key={t} className="chip" data-chip={t}>{t}</button>)}</div></section><div id="res" /></>;
}
function ProductPhoto({url, name}) {
 const [failed, setFailed] = React.useState(false);
 const [loaded, setLoaded] = React.useState(false);
 React.useEffect(() => { setFailed(false); setLoaded(false); }, [url]);
 React.useEffect(() => {
   if (!url || loaded || failed) return;
   const timer = setTimeout(() => setFailed(true), 8000);
   return () => clearTimeout(timer);
 }, [url, loaded, failed]);
 return <div className="th">{url && !failed ? <img src={url} alt={name} referrerPolicy="no-referrer" style={{width:'100%',height:'100%',objectFit:'contain'}} onLoad={()=>setLoaded(true)} onError={()=>setFailed(true)}/> : <span style={{fontSize:12,textAlign:'center'}}>Нет фото</span>}</div>;
}
const resultStores = [
 {name:'Пятёрочка', match:/^(?:www\.)?5ka\.ru$|пят[её]рочка/i, logo:'https://avatars.mds.yandex.net/i?id=5fa191218fe7ede97a5f81056d610714c1b62bd9-12724437-images-thumbs&n=13', color:'#e53935', initial:'5'},
 {name:'Магнит', match:/^(?:www\.)?magnit\.ru$|магнит/i, logo:'https://avatars.mds.yandex.net/i?id=44c58d4dbda89c57059d593f0cfeae62085690fd-4881188-images-thumbs&n=13', color:'#b3121f', initial:'М'},
 {name:'Мария-Ра', match:/maria-ra\.ru|мария[-\s]?ра/i, logo:'https://avatars.mds.yandex.net/i?id=8daed0165f120c5a55e399a3166613c4ac59a5be-5016868-images-thumbs&n=13', color:'#2e9b4a', initial:'М'},
 {name:'Ярче!', match:/ярче|xn--80akiai2b0bl4e/i, color:'#228b42', initial:'Я'},
];
function resultStore(value) {
 const raw = value || 'Источник';
 return resultStores.find(store => store.match.test(raw)) || {name:raw, color:'#34675a', initial:raw[0].toUpperCase()};
}
function StoreIcon({store}) {
 const [failed, setFailed] = React.useState(false);
 return <span className="result-store-logo" style={{background:store.color}}>{store.logo && !failed ? <img src={store.logo} alt="" referrerPolicy="no-referrer" onError={()=>setFailed(true)}/> : store.initial}</span>;
}
function sourceMethodLabel(method) {
 const labels = {'PDF каталога':'Парсинг провёл ИИ', 'фото ценника':'Источник: фото ценника', 'сайт магазина':'Источник: сайт магазина', 'existing_inventory':'Источник: каталог'};
 return labels[method] || '';
}
function SearchResultsByStore({products, onSelect}) {
 const groups = new Map();
 for (const product of products) {
   const store = resultStore(product.store);
   if (!groups.has(store.name)) groups.set(store.name, {store, items:[]});
   groups.get(store.name).items.push(product);
 }
 return <div className="result-store-groups">{[...groups.values()].map(({store,items})=><section className="result-store" key={store.name}>
   <div className="result-store-heading"><StoreIcon store={store}/><h2>{store.name}</h2></div>
   <div className="result-store-products" aria-label={`Товары: ${store.name}`} tabIndex="0">{items.map(p=><article className="result-product" key={p.id} role="button" tabIndex={0} onClick={()=>onSelect(p)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(p)}}}>
     <ProductPhoto url={p.image_url} name={p.name}/>
     <div className="result-product-price">{p.price == null ? 'Цена неизвестна' : `${p.price} ${p.currency || 'RUB'}`}</div>
     <div className="result-product-name">{p.name}</div>
     <div className="result-product-meta">{p.observed_at ? `Дата: ${p.observed_at.slice(0,10)}` : 'Дата не указана'}{p.source_status ? ` · ${p.source_status}` : ''}{sourceMethodLabel(p.source_method) && <><br/>{sourceMethodLabel(p.source_method)}</>}</div>
   </article>)}</div>
 </section>)}</div>;
}
function Results({query, products, message, hasMore}) {
 const [selected, setSelected] = React.useState(null);
 const [sort, setSort] = React.useState('default');
 const [category, setCategory] = React.useState('');
 const categories = ['Крупы и макароны','Молочные продукты','Яйца','Мясо','Рыба','Овощи и фрукты','Хлеб и выпечка','Бакалея','Соусы и консервы','Сладости','Снеки','Напитки','Заморозка','Другое'];
 const categoryControl = !query.trim() && <label className="hint" style={{display:'flex',alignItems:'center',gap:8,margin:'12px 0'}}>Раздел <select aria-label="Раздел товаров" value={category} onChange={e=>{setCategory(e.target.value);window.setBrowseCategory?.(e.target.value)}} style={{color:'var(--txt)',background:'var(--card)',border:'1px solid var(--line)',borderRadius:10,padding:8}}><option value="">Все</option>{categories.map(c=><option key={c} value={c}>{c}</option>)}</select></label>;
 const [master, setMaster] = React.useState(null);
 React.useEffect(()=>{
  setMaster(null);
  const id = selected?.id || '';
  if (!id) return;
  let active = true;
  window.staticCatalog.offers(id).then(data=>{if(active) setMaster(data)}).catch(()=>{});
  return ()=>{active = false};
 },[selected]);
 const sortControl = <label className="hint" style={{display:'flex',alignItems:'center',gap:8,margin:'12px 0'}}>Сортировка <select aria-label="Сортировка товаров" value={sort} onChange={e=>{setSort(e.target.value);if(!query.trim()) window.setBrowseSort?.(e.target.value)}} style={{color:'var(--txt)',background:'var(--card)',border:'1px solid var(--line)',borderRadius:10,padding:8}}><option value="default">По умолчанию</option><option value="name_asc">Название А–Я</option><option value="name_desc">Название Я–А</option><option value="price_asc">Сначала дешевле</option><option value="price_desc">Сначала дороже</option></select></label>;
 if (!products.length) return <>{categoryControl}<div className="hint" style={{marginTop:20}}>{message || 'Нет загруженных предложений'}</div></>;
 if (selected) return <><button className="chip" onClick={()=>setSelected(null)}>‹ Назад к результатам</button><div className="hero product-detail-hero" style={{marginTop:16}}><ProductPhoto url={selected.image_url} name={selected.name}/></div><h2 style={{marginTop:16}}>{selected.name}</h2><p className="hint">{selected.store}{sourceMethodLabel(selected.source_method) && <><br/>{sourceMethodLabel(selected.source_method)}</>}</p>{master?.offers?.length > 1 && <><div className="lbl">ЦЕНЫ В МАГАЗИНАХ</div>{master.offers.map(offer=><div className="card" key={offer.id} style={{padding:14,marginBottom:8}}><strong>{offer.store}</strong><span style={{float:'right'}}>{offer.price == null ? 'Цена неизвестна' : offer.price+' '+offer.currency}</span><div className="hint">{offer.observed_at ? 'Дата: '+offer.observed_at.slice(0,10) : 'Дата не указана'} · {offer.source_status}</div>{offer.source_url && <a href={offer.source_url} target="_blank" rel="noreferrer">Источник</a>}</div>)}</>}<div className="lbl">О ТОВАРЕ</div><p>{selected.price == null ? 'Цена неизвестна' : selected.price+' '+(selected.currency || 'RUB')}</p>{selected.observed_at && <p className="hint">Дата наблюдения: {selected.observed_at.slice(0,10)}</p>}{/молоко простоквашино пастеризованное 2[.,]5% 930\s*мл/i.test(selected.name) && <><p>Состав: молоко нормализованное.</p><div className="lbl">ПИЩЕВАЯ ЦЕННОСТЬ · НА 100 Г</div><p>54 ккал · белки 3 г · жиры 2,5 г · углеводы 4,7 г</p><p>Срок годности: 16 дней</p><a href="https://magnit.ru/product/1899800733-moloko_prostokvashino_pasterizovannoe_2_5_930ml" target="_blank" rel="noreferrer">Страница товара в Магните</a></>}</>;
 if (query.trim()) {
  const sorted = [...products];
  if (sort !== 'default') sorted.sort((a,b)=>{
   if (sort.startsWith('name')) return (sort === 'name_asc' ? 1 : -1)*a.name.localeCompare(b.name,'ru');
   if (a.price == null) return b.price == null ? 0 : 1;
   if (b.price == null) return -1;
   return (sort === 'price_asc' ? 1 : -1)*(Number(a.price)-Number(b.price));
  });
  return <>{sortControl}<p className="hint">{message}</p><SearchResultsByStore products={sorted} onSelect={setSelected}/></>;
 }
 return <>{categoryControl}{sortControl}<p className="hint">{message}</p>{products.map(p => <div key={p.id} className="line" role="button" tabIndex={0} onClick={()=>setSelected(p)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelected(p)}}}><ProductPhoto url={p.image_url} name={p.name}/><div className="inf"><div className="nm">{p.name}</div><div className="meta">{p.store} · {p.observed_at ? `Дата наблюдения: ${p.observed_at.slice(0,10)}` : 'Дата не указана'}{p.source_status ? ` · ${p.source_status}` : ''}{sourceMethodLabel(p.source_method) && <><br/>{sourceMethodLabel(p.source_method)}</>}</div></div><div className="pr">{p.price === null ? 'Цена неизвестна' : `${p.price} ${p.currency}`}</div></div>)}{hasMore && <button type="button" className="chip" onClick={() => window.loadMoreBrowse?.()}>Показать ещё</button>}</>;
}

function StoreProducts({products = [], hasMore, onMore, loading, error}) {
 if (loading || error) return <p className="hint">{error || 'Загружаем товары магазина…'}</p>;
 if (!products.length) return <p className="hint">Товары по этому разделу пока не найдены.</p>;
 return <><div className="lbl">ТОВАРЫ ИЗ КАТАЛОГА</div><div className="grid2">{products.map(p=><button className="pc" key={p.id} onClick={()=>window.openStoreProduct(p)}><ProductPhoto url={p.image_url} name={p.name}/><div className="nm">{p.name}</div><strong>{p.price == null ? 'Цена неизвестна' : p.price + ' ' + (p.currency || 'RUB')}</strong><div className="hint">{p.observed_at ? p.observed_at.slice(0,10) : 'Дата не указана'}{p.source_status ? ' · '+p.source_status : ''}</div></button>)}</div>{hasMore && <button className="chip" style={{marginTop:12}} onClick={onMore}>Показать ещё</button>}</>;
}

function StoreProduct({product}) {
 return <><div className="hero product-detail-hero"><ProductPhoto url={product.image_url} name={product.name}/></div><h2 style={{marginTop:16}}>{product.name}</h2><p className="hint">{product.store} · {product.source_status || 'Данные источника'}</p><p>{product.price == null ? 'Цена неизвестна' : product.price + ' ' + (product.currency || 'RUB')}</p>{product.observed_at && <p className="hint">Дата наблюдения: {product.observed_at.slice(0,10)}</p>}</>;
}
