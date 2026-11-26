import Cart from './Cart.jsx';
import DishConveyor from './components/ui/DishConveyor.jsx';
import AddressInput from './AddressInput.jsx';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
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

const screens = { cart: [Cart, 'cartBody'], profile: [Profile, 'profileBody'], editprofile: [EditProfile, 'editBody'], settings: [Settings, 'settingsBody'], about: [About, 'aboutBody'], location: [Location, 'locBody'], menu: [Menu, 'menuBody'], stores: [Stores, 'storesBody'], history: [History, 'historyBody'], search: [Search, 'searchBody'], results: [Results, 'res'] };
const roots = new Map();
let editVersion = 0;
window.renderReactScreen = (name, props) => {
  const [Component, id] = screens[name];
  if (!roots.has(id)) roots.set(id, createRoot(document.getElementById(id)));
  flushSync(() => roots.get(id).render(<Component key={name === 'editprofile' ? ++editVersion : name} {...props} />));
};

// Временный мост: старые экраны работают до их переноса на React.
const script = document.createElement('script');
script.src = `${import.meta.env.BASE_URL}legacy.js`;
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
 return <><label className="search" style={{marginTop:4}}>🔎<input id="q" placeholder="Найти продукт" autoComplete="off" /></label><div className="hrow chipsrow" style={{marginBottom:0}}>{['Молоко','Бородинский хлеб','Coca-Cola','Сыр','Яйца','Гречка','Шоколад'].map(t=><button key={t} className="chip" data-chip={t}>{t}</button>)}</div><button className="big" data-go="catalog" style={{width:'100%',flex:'none',marginTop:10}}><em>🗂️</em>Каталог и сортировка<b>›</b></button><div id="res" /></>;
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
function Results({query, products, message}) {
 if (!products.length) return <div className="hint" style={{marginTop:20}}>{message || 'Нет загруженных предложений'}</div>;
 return <><p className="hint">{message}</p>{products.map(p => <div key={p.id} className="line"><ProductPhoto url={p.image_url} name={p.name}/><div className="inf"><div className="nm">{p.name}</div><div className="meta">{p.store} · Дата наблюдения: {p.observed_at.slice(0,10)}</div></div><div className="pr">{p.price === null ? 'Цена неизвестна' : `${p.price} ${p.currency}`}</div></div>)}</>;
}
