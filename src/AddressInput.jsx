import React, {useEffect, useRef, useState} from 'react';
const cache = new Map();
export default function AddressInput() {
 const [value,setValue]=useState(''), [items,setItems]=useState([]), [status,setStatus]=useState(''), [selected,setSelected]=useState(null), [active,setActive]=useState(-1);
 const input=useRef(null);
 useEffect(()=>{
  setItems([]); setActive(-1); if(value.trim().length<3 || selected) {setStatus('');return;}
  let live=true; const controller=new AbortController(); let timeout;
  setStatus('Ищем варианты…');
  const timer=setTimeout(async()=>{
   try {
    let result=cache.get(value.trim());
    if(!result){
     timeout=setTimeout(()=>controller.abort(),8000);
     const params=new URLSearchParams({q:value.trim(),limit:'6',lat:'55.0302',lon:'82.9204'});
     const response=await fetch((import.meta.env.VITE_ADDRESS_API || 'https://photon.komoot.io/api/')+'?'+params,{signal:controller.signal});
     if(!response.ok)throw Error('network');
     const data=await response.json(); const seen=new Set();
     result=(data.features||[]).flatMap(f=>{const p=f.properties||{}, c=f.geometry?.coordinates; const street=p.street||p.name; if(!street||!c||!c.every(Number.isFinite))return [];const n=[p.city||p.town||p.village,street,p.housenumber && 'д. '+p.housenumber].filter(Boolean).join(', ');if(seen.has(n))return [];seen.add(n);return [{n,lat:c[1],lng:c[0],m:{},house:!!p.housenumber}];});
     if(cache.size>50)cache.clear();cache.set(value.trim(),result);
    }
    if(live){setItems(result);setStatus(result.length?'Возможно, вы имели в виду':'Адрес не найден. Уточните город, улицу и дом.');}
   }catch{if(live)setStatus('Подсказки временно недоступны. Можно ввести полный адрес вручную.');}finally{clearTimeout(timeout);}
  },650);
  return()=>{live=false;clearTimeout(timer);clearTimeout(timeout);controller.abort();};
 },[value,selected]);
 function choose(item){setValue(item.n);setSelected(item.house?item:null);setItems([]);setStatus(item.house?'Адрес выбран':'Укажите номер дома');input.current.focus();}
 return <><input ref={input} id="locInp" className="inp" maxLength={160} placeholder="Например, Кирова 218" value={value} autoComplete="off" role="combobox" aria-label="Адрес" aria-autocomplete="list" aria-expanded={items.length>0} aria-controls="address-options" aria-activedescendant={active>=0?'address-option-'+active:undefined} data-selected-address={selected?JSON.stringify(selected):''} onChange={e=>{setValue(e.target.value);setSelected(null);setItems([]);}} onKeyDown={e=>{if(e.key==='Escape'){setItems([]);setActive(-1);}if(items.length && (e.key==='ArrowDown'||e.key==='ArrowUp')){e.preventDefault();setActive(i=>e.key==='ArrowDown'?(i+1)%items.length:(i-1+items.length)%items.length);}if(e.key==='Enter'&&active>=0&&items[active]){e.preventDefault();choose(items[active]);}}}/>
 <div className="hint" role="status" aria-live="polite">{status}</div>
 <div id="address-options" role="listbox" aria-label="Варианты адреса" className={items.length?'card list':''}>{items.map((item,i)=><button type="button" role="option" aria-selected={active===i} id={'address-option-'+i} key={item.n} className="rowb" style={{textAlign:'left',background:active===i?'var(--card2)':undefined}} onClick={()=>choose(item)}><em>📍</em><span>{item.n}{!item.house&&<small style={{display:'block',color:'var(--mut)'}}>Уточните номер дома</small>}</span></button>)}</div>
 {items.length>0&&<div className="hint">Данные © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a></div>}
 </>;
}
