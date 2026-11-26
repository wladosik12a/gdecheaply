/* ================= Telegram ================= */
/* ================= Отладка: добавьте ?debug=1 к адресу приложения — ошибки покажутся красной плашкой ================= */
(function () {
  if (!/[?&]debug=1/.test(location.search)) return;
  function show(m) {
    var d = document.getElementById('dbg');
    if (!d) { d = document.createElement('div'); d.id = 'dbg'; d.style.cssText = 'position:fixed;left:8px;right:8px;top:8px;z-index:99;background:#b3261e;color:#fff;font:12px/1.4 monospace;padding:10px;border-radius:10px;white-space:pre-wrap;max-height:40vh;overflow:auto'; document.body.appendChild(d); }
    d.textContent += m + '\n';
  }
  window.addEventListener('error', function (e) { show('Ошибка: ' + e.message + ' (' + String(e.filename || '').split('/').pop() + ':' + e.lineno + ')'); });
  window.addEventListener('unhandledrejection', function (e) { show('Promise: ' + (e.reason && e.reason.message || e.reason)); });
})();

const tg = window.Telegram && window.Telegram.WebApp;
const tgUser = tg && tg.initDataUnsafe && tg.initDataUnsafe.user;
if (tg) { try { tg.ready(); tg.expand(); if (tg.initData) document.body.classList.add('in-tg'); } catch(e){} }

/* ================= Утилиты ================= */
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const NB = ' ';
const rub = n => Math.round(n).toLocaleString('ru-RU').replace(/[  ]/g, NB) + NB + '₽';
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const plural = (n, a, b, c) => { n = Math.abs(n) % 100; const k = n % 10; if (n > 10 && n < 20) return c; if (k > 1 && k < 5) return b; if (k === 1) return a; return c; };
const goods = n => n + ' ' + plural(n, 'товар', 'товара', 'товаров');
const norm = s => String(s).toLowerCase().replace(/ё/g, 'е');
const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch(e) { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} };
const PLUS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const PERSON = '<svg viewBox="0 0 24 24" width="58%" height="58%" fill="currentColor"><circle cx="12" cy="8" r="4.2"/><path d="M3.5 21c.6-4.6 4.2-7 8.5-7s7.9 2.4 8.5 7z"/></svg>';

/* ================= Данные ================= */
const TIME_COST = 1.5; // «цена времени»: сколько ₽ стоит одна минута дороги. Меняется в одном месте.
const STORES = [
  {id:'fix', n:'Fix Price', c:'#1e6fd9', l:'F'},
  {id:'mar', n:'Мария-Ра', c:'#2e9b4a', l:'М'},
  {id:'pya', n:'Пятёрочка', c:'#e53935', l:'5'},
  {id:'mag', n:'Магнит', c:'#b3121f', l:'М'},
  {id:'chi', n:'Чижик', c:'#e9a21b', l:'Ч'}
];
/* Логотипы магазинов: ссылка на картинку или data:image/png;base64,... Используются и в приложении, и на карте. Если картинка не загрузилась, показывается цветной значок с буквой. */
const STORE_PNG = {
  fix: 'https://avatars.mds.yandex.net/i?id=4decabb239d7c8bc33ec6e81aed969ec24cfe04f-5683440-images-thumbs&n=13',
  mar: 'https://avatars.mds.yandex.net/i?id=8daed0165f120c5a55e399a3166613c4ac59a5be-5016868-images-thumbs&n=13',
  pya: 'https://avatars.mds.yandex.net/i?id=5fa191218fe7ede97a5f81056d610714c1b62bd9-12724437-images-thumbs&n=13',
  mag: 'https://avatars.mds.yandex.net/i?id=44c58d4dbda89c57059d593f0cfeae62085690fd-4881188-images-thumbs&n=13',
  chi: 'https://avatars.mds.yandex.net/i?id=d3c6a653d62f27ed2781ebcd8034c281d12768c1-5679824-images-thumbs&n=13'
};
const SM = Object.fromEntries(STORES.map(s => [s.id, s]));
function mkErr(img, id) {   // логотип на карте не загрузился — цветной кружок с буквой
  const d = img.parentNode; if (!d) return; d.style.background = SM[id].c; d.style.color = '#fff'; img.replaceWith(document.createTextNode(SM[id].l));
}
function sbErr(img, id) {   // картинка не загрузилась — показываем цветной значок с буквой
  const sp = document.createElement('span'); sp.className = img.className; sp.style.background = SM[id].c; sp.textContent = SM[id].l; img.replaceWith(sp);
}
const sb = (id, sz = '') => `<img class="sb ${sz}" src="${STORE_PNG[id]}" alt="${SM[id].n}" draggable="false" referrerpolicy="no-referrer" onerror="sbErr(this,'${id}')">`;

const LOCS = [
  {n:'ул. Партизан', lat:55.0302, lng:82.9204, m:{fix:6, pya:8, mag:10, mar:12, chi:14}},
  {n:'ул. Кирова, 63/2', lat:55.0415, lng:82.9347, m:{fix:9, pya:5, mag:7, mar:11, chi:13}},
  {n:'Красный проспект, 25', lat:55.0262, lng:82.9234, m:{fix:7, pya:6, mag:12, mar:8, chi:10}},
  {n:'ул. Ленина, 12', lat:55.0386, lng:82.9174, m:{fix:11, pya:9, mag:6, mar:5, chi:12}}
];

// p: цены по магазинам (нет ключа = в этом магазине товара нет)
const P = [
 {id:1, n:'Молоко 2,5% 1 л', s:'Молоко', e:'🥛', k:'Молочные продукты', d:'Пастеризованное молоко, жирность 2,5%.', p:{pya:89, mag:92, mar:95, chi:91}, r:4.7, rc:312},
 {id:2, n:'Хлеб Бородинский 300 г', s:'Хлеб', e:'🍞', k:'Хлеб и выпечка', d:'Ржано-пшеничный хлеб с кориандром.', p:{fix:64, pya:48, mag:45, mar:42, chi:44}, r:4.6, rc:208},
 {id:3, n:'Яйца С1 10 шт', s:'Яйца', e:'🥚', k:'Яйца', d:'Куриные яйца первой категории.', p:{fix:119, pya:99, mag:89, mar:94, chi:92}, r:4.5, rc:154},
 {id:4, n:'Сыр Российский 45% 200 г', s:'Сыр', e:'🧀', k:'Молочные продукты', d:'Полутвёрдый сыр, жирность 45%.', p:{fix:159, pya:139, mag:149, mar:142, chi:145}, r:4.6, rc:97},
 {id:5, n:'Шоколад Milka 90 г', s:'Шоколад', e:'🍫', k:'Сладости', d:'Молочный шоколад.', p:{fix:79, pya:99, mag:95, mar:98, chi:92}, r:4.8, rc:421},
 {id:6, n:'Батончик шоколадный 50 г', s:'Батончик', e:'🥜', k:'Сладости', d:'Батончик с арахисом и карамелью.', p:{fix:79, pya:89, mag:94, mar:97, chi:85}, r:4.7, rc:530},
 {id:7, n:'Coca-Cola 0,5 л', s:'Напиток', e:'🥤', k:'Напитки', d:'Газированный напиток.', p:{fix:79, pya:69, mag:74, mar:79, chi:72}, r:4.6, rc:388},
 {id:8, n:'Чипсы Lay\'s 140 г', s:'Чипсы', e:'🍟', k:'Снеки', d:'Картофельные чипсы со вкусом сметаны и лука.', p:{fix:95, pya:99, mag:89, mar:105, chi:92}, r:4.4, rc:270},
 {id:9, n:'Йогурт питьевой 290 г', s:'Йогурт', e:'🍼', k:'Молочные продукты', d:'Питьевой йогурт, 2,5%.', p:{pya:49, mag:54, mar:52, chi:50}, r:4.5, rc:76},
 {id:10, n:'Куриное филе 800 г', s:'Курица', e:'🍗', k:'Мясо', d:'Охлаждённое филе куриной грудки.', p:{pya:389, mag:399, mar:379, chi:405}, r:4.5, rc:142},
 {id:11, n:'Помидоры 400 г', s:'Помидоры', e:'🍅', k:'Овощи и фрукты', d:'Томаты свежие, лоток 400 г.', p:{fix:59, pya:69, mag:65, mar:62, chi:60}, r:4.3, rc:88},
 {id:12, n:'Огурцы 500 г', s:'Огурцы', e:'🥒', k:'Овощи и фрукты', d:'Огурцы гладкие, лоток 500 г.', p:{fix:49, pya:59, mag:55, mar:52, chi:54}, r:4.4, rc:64},
 {id:13, n:'Бананы 1 кг', s:'Бананы', e:'🍌', k:'Овощи и фрукты', d:'Бананы спелые, цена за килограмм.', p:{fix:109, pya:99, mag:105, mar:119, chi:102}, r:4.6, rc:119},
 {id:14, n:'Макароны 450 г', s:'Макароны', e:'🍝', k:'Крупы и макароны', d:'Макароны из твёрдых сортов пшеницы.', p:{fix:69, pya:59, mag:62, mar:65, chi:58}, r:4.7, rc:175},
 {id:15, n:'Масло подсолнечное 0,9 л', s:'Масло', e:'🌻', k:'Бакалея', d:'Рафинированное дезодорированное масло.', p:{fix:129, pya:119, mag:125, mar:122, chi:115}, r:4.6, rc:93},
 {id:16, n:'Овсяные хлопья 500 г', s:'Овсянка', e:'🥣', k:'Крупы и макароны', d:'Хлопья овсяные, варка 10 минут.', p:{fix:84, pya:79, mag:82, mar:88, chi:76}, r:4.7, rc:110},
 {id:17, n:'Картофель 1 кг', s:'Картофель', e:'🥔', k:'Овощи и фрукты', d:'Картофель мытый, цена за килограмм.', p:{fix:54, pya:59, mag:57, mar:49, chi:52}, r:4.2, rc:58},
 {id:18, n:'Лук репчатый 1 кг', s:'Лук', e:'🧅', k:'Овощи и фрукты', d:'Лук репчатый, цена за килограмм.', p:{fix:39, pya:45, mag:42, mar:37, chi:40}, r:4.3, rc:41},
 {id:19, n:'Сметана 20% 300 г', s:'Сметана', e:'🍶', k:'Молочные продукты', d:'Сметана, жирность 20%.', p:{pya:79, mag:84, mar:76, chi:78}, r:4.6, rc:102},
 {id:20, n:'Печенье овсяное 300 г', s:'Печенье', e:'🍪', k:'Сладости', d:'Овсяное печенье к чаю.', p:{fix:69, pya:79, mag:75, mar:82, chi:72}, r:4.5, rc:67},
 {id:21, n:'Яблоки 1 кг', s:'Яблоки', e:'🍎', k:'Овощи и фрукты', d:'Яблоки сезонные, цена за килограмм.', p:{fix:119, pya:129, mag:125, mar:115, chi:118}, r:4.5, rc:84},
 {id:22, n:'Сок яблочный 1 л', s:'Сок', e:'🧃', k:'Напитки', d:'Яблочный сок прямого отжима.', p:{fix:99, pya:109, mag:105, mar:112, chi:95}, r:4.4, rc:59},
 {id:23, n:'Творог 5% 200 г', s:'Творог', e:'🥣', k:'Молочные продукты', d:'Мягкий зернистый творог, подойдёт для завтрака и выпечки.', p:{pya:83,mag:92,mar:88,chi:80}, r:4.8, rc:225},
 {id:24, n:'Кефир 1% 900 мл', s:'Кефир', e:'🥛', k:'Молочные продукты', d:'Классический кефир на живых заквасках.', p:{pya:75,mag:84,mar:76,chi:73}, r:4.2, rc:203},
 {id:25, n:'Масло сливочное 82,5% 180 г', s:'Масло слив.', e:'🧈', k:'Молочные продукты', d:'Сладко-сливочное масло для бутербродов и готовки.', p:{pya:242,mag:264,mar:266,chi:258}, r:4.5, rc:53},
 {id:26, n:'Сосиски молочные 450 г', s:'Сосиски', e:'🌭', k:'Мясо', d:'Нежные сосиски, готовятся за 5 минут.', p:{pya:242,mag:227,mar:239,chi:216}, r:4.4, rc:29},
 {id:27, n:'Колбаса Докторская 400 г', s:'Колбаса', e:'🥓', k:'Мясо', d:'Варёная колбаса классического вкуса.', p:{pya:289,mag:305,mar:295,chi:300}, r:4.8, rc:385},
 {id:28, n:'Фарш говяжий 500 г', s:'Фарш', e:'🥩', k:'Мясо', d:'Охлаждённый говяжий фарш для котлет и пасты.', p:{pya:366,mag:375,mar:351,chi:337}, r:4.5, rc:343},
 {id:29, n:'Свинина шея 1 кг', s:'Свинина', e:'🥩', k:'Мясо', d:'Сочная шейная часть — для шашлыка и запекания.', p:{pya:557,mag:608,mar:580}, r:4.2, rc:240},
 {id:30, n:'Филе горбуши 400 г', s:'Горбуша', e:'🐟', k:'Рыба', d:'Охлаждённое филе горбуши без костей.', p:{pya:419,mag:423,mar:411,chi:381}, r:4.6, rc:192},
 {id:31, n:'Креветки очищенные 500 г', s:'Креветки', e:'🍤', k:'Рыба', d:'Варёно-мороженые креветки, готовы к употреблению.', p:{pya:451,mag:457,mar:474,chi:435}, r:4.6, rc:330},
 {id:32, n:'Рис длиннозёрный 900 г', s:'Рис', e:'🍚', k:'Крупы и макароны', d:'Рассыпчатый рис для гарниров и плова.', p:{fix:98,pya:103,mag:105,mar:101,chi:92}, r:4.4, rc:367},
 {id:33, n:'Гречка ядрица 800 г', s:'Гречка', e:'🌾', k:'Крупы и макароны', d:'Отборная гречневая крупа, варка 15–20 минут.', p:{fix:103,pya:104,mag:109,mar:116}, r:4.4, rc:236},
 {id:34, n:'Сахар-песок 1 кг', s:'Сахар', e:'🍬', k:'Бакалея', d:'Белый сахар-песок.', p:{fix:76,pya:77,mag:83,chi:75}, r:4.5, rc:251},
 {id:35, n:'Соль поваренная 1 кг', s:'Соль', e:'🧂', k:'Бакалея', d:'Пищевая соль помола №1.', p:{fix:22,pya:26,mag:27,mar:26,chi:23}, r:4.4, rc:89},
 {id:36, n:'Чай чёрный 100 пакетиков', s:'Чай', e:'🍵', k:'Напитки', d:'Классический чёрный чай в пакетиках.', p:{fix:219,pya:235,mag:245,mar:246,chi:223}, r:4.3, rc:342},
 {id:37, n:'Кофе растворимый 190 г', s:'Кофе', e:'☕', k:'Напитки', d:'Сублимированный кофе с насыщенным ароматом.', p:{fix:427,pya:467,mag:491,mar:477}, r:4.3, rc:292},
 {id:38, n:'Вода питьевая 1,5 л', s:'Вода', e:'💧', k:'Напитки', d:'Чистая негазированная питьевая вода.', p:{fix:37,pya:41,mag:42,mar:38,chi:40}, r:4.5, rc:72},
 {id:39, n:'Лимонад Дюшес 1,5 л', s:'Лимонад', e:'🥤', k:'Напитки', d:'Газированный лимонад со вкусом груши.', p:{fix:73,pya:76,mag:79,mar:78,chi:76}, r:4.2, rc:227},
 {id:40, n:'Сок апельсиновый 1 л', s:'Сок апельс.', e:'🧃', k:'Напитки', d:'Апельсиновый сок без сахара.', p:{fix:107,mag:113,mar:109,chi:112}, r:4.7, rc:234},
 {id:41, n:'Морковь 1 кг', s:'Морковь', e:'🥕', k:'Овощи и фрукты', d:'Сладкая сочная морковь, цена за килограмм.', p:{fix:43,pya:46,mag:47,mar:45,chi:42}, r:4.3, rc:417},
 {id:42, n:'Капуста белокочанная 1 кг', s:'Капуста', e:'🥬', k:'Овощи и фрукты', d:'Плотный кочан для салатов, борща и тушения.', p:{fix:35,pya:36,mag:36,mar:36,chi:33}, r:4.7, rc:382},
 {id:43, n:'Перец сладкий 500 г', s:'Перец', e:'🫑', k:'Овощи и фрукты', d:'Хрустящий болгарский перец.', p:{fix:119,pya:116,mag:129,mar:128,chi:120}, r:4.5, rc:320},
 {id:44, n:'Лимоны 500 г', s:'Лимоны', e:'🍋', k:'Овощи и фрукты', d:'Ароматные лимоны для чая и выпечки.', p:{fix:93,pya:95,mag:107,mar:106,chi:97}, r:4.3, rc:39},
 {id:45, n:'Апельсины 1 кг', s:'Апельсины', e:'🍊', k:'Овощи и фрукты', d:'Сладкие сочные апельсины.', p:{fix:136,pya:141,mag:146,mar:141}, r:4.6, rc:245},
 {id:46, n:'Виноград 500 г', s:'Виноград', e:'🍇', k:'Овощи и фрукты', d:'Сладкий виноград без косточек.', p:{fix:156,pya:170,mag:179,chi:174}, r:4.3, rc:288},
 {id:47, n:'Груши 1 кг', s:'Груши', e:'🍐', k:'Овощи и фрукты', d:'Спелые ароматные груши.', p:{fix:144,pya:155,mag:158,mar:153}, r:4.5, rc:132},
 {id:48, n:'Авокадо 1 шт', s:'Авокадо', e:'🥑', k:'Овощи и фрукты', d:'Спелое авокадо для салатов и тостов.', p:{fix:115,pya:118,mag:119,mar:121,chi:120}, r:4.3, rc:250},
 {id:49, n:'Чеснок 100 г', s:'Чеснок', e:'🧄', k:'Овощи и фрукты', d:'Свежий чеснок с острым вкусом.', p:{fix:37,pya:38,mag:41,mar:39,chi:40}, r:4.5, rc:137},
 {id:50, n:'Батон нарезной 400 г', s:'Батон', e:'🍞', k:'Хлеб и выпечка', d:'Нарезной пшеничный батон.', p:{pya:50,mag:52,mar:51,chi:49}, r:4.5, rc:36},
 {id:51, n:'Булочка с изюмом 100 г', s:'Булочка', e:'🥯', k:'Хлеб и выпечка', d:'Мягкая сдобная булочка с изюмом.', p:{fix:36,pya:37,mag:41,chi:36}, r:4.7, rc:229},
 {id:52, n:'Круассан 65 г', s:'Круассан', e:'🥐', k:'Хлеб и выпечка', d:'Слоёный круассан со сливочным вкусом.', p:{fix:53,pya:60,mag:62,mar:60,chi:58}, r:4.8, rc:31},
 {id:53, n:'Лаваш тонкий 200 г', s:'Лаваш', e:'🫓', k:'Хлеб и выпечка', d:'Тонкий армянский лаваш для ролов и шаурмы.', p:{fix:48,pya:49,mag:51,mar:49,chi:48}, r:4.4, rc:276},
 {id:54, n:'Мороженое пломбир 100 г', s:'Мороженое', e:'🍦', k:'Сладости', d:'Классический пломбир в вафельном стаканчике.', p:{fix:97,pya:100,mag:107,mar:95,chi:97}, r:4.7, rc:388},
 {id:55, n:'Шоколад тёмный 85% 90 г', s:'Шоколад тёмный', e:'🍫', k:'Сладости', d:'Горький шоколад с насыщенным вкусом какао.', p:{fix:121,pya:122,mag:138,mar:130,chi:134}, r:4.8, rc:90},
 {id:56, n:'Вафли с шоколадом 200 г', s:'Вафли', e:'🧇', k:'Сладости', d:'Хрустящие вафли с шоколадной начинкой.', p:{fix:76,pya:78,mag:83,mar:76}, r:4.6, rc:281},
 {id:57, n:'Мёд цветочный 250 г', s:'Мёд', e:'🍯', k:'Сладости', d:'Натуральный цветочный мёд.', p:{fix:246,pya:246,mag:254,mar:259,chi:253}, r:4.5, rc:73},
 {id:58, n:'Орехи грецкие 150 г', s:'Грецкие орехи', e:'🌰', k:'Снеки', d:'Очищенные грецкие орехи, полезный перекус.', p:{fix:185,pya:208,mag:202,mar:206,chi:188}, r:4.3, rc:333},
 {id:59, n:'Сухарики ржаные 100 г', s:'Сухарики', e:'🥨', k:'Снеки', d:'Хрустящие ржаные сухарики со вкусом бекона.', p:{fix:46,pya:51,mag:52,mar:51,chi:45}, r:4.2, rc:253},
 {id:60, n:'Пельмени классические 800 г', s:'Пельмени', e:'🥟', k:'Заморозка', d:'Пельмени со свининой и говядиной.', p:{pya:329,mag:342,chi:322}, r:4.2, rc:331},
 {id:61, n:'Пицца ветчина-сыр 350 г', s:'Пицца', e:'🍕', k:'Заморозка', d:'Замороженная пицца, готова за 12 минут в духовке.', p:{pya:236,mar:242,chi:255}, r:4.3, rc:48},
 {id:62, n:'Майонез Провансаль 400 г', s:'Майонез', e:'🥫', k:'Соусы и консервы', d:'Классический майонез 67%.', p:{fix:92,mag:105,mar:100,chi:95}, r:4.4, rc:55},
 {id:63, n:'Кетчуп томатный 300 г', s:'Кетчуп', e:'🍅', k:'Соусы и консервы', d:'Томатный кетчуп к мясу и пасте.', p:{fix:83,pya:85,mag:91,chi:89}, r:4.7, rc:265},
 {id:64, n:'Горошек зелёный 400 г', s:'Горошек', e:'🫛', k:'Соусы и консервы', d:'Консервированный зелёный горошек.', p:{pya:72,mag:76,mar:71,chi:66}, r:4.6, rc:77}
];
const NUT = {1:[52, 2.8, 2.5, 4.7, "1 л", "5 суток"],2:[208, 6.9, 1.3, 40, "300 г", "5 суток"],3:[157, 12.7, 11.5, 0.7, "10 шт", "25 суток"],4:[360, 23, 29, 0.3, "200 г", "60 суток"],5:[530, 6.3, 30, 57, "90 г", "9 мес"],6:[480, 9, 22, 60, "50 г", "9 мес"],7:[42, 0, 0, 10.6, "0,5 л", "12 мес"],8:[520, 6.5, 30, 52, "140 г", "6 мес"],9:[70, 3, 2.5, 9, "290 г", "21 сутки"],10:[113, 23.6, 1.9, 0.4, "800 г", "5 суток"],11:[20, 0.6, 0.2, 4.2, "400 г", "7 суток"],12:[15, 0.8, 0.1, 2.8, "500 г", "7 суток"],13:[96, 1.5, 0.2, 21, "1 кг", "5 суток"],14:[344, 11, 1.5, 70, "450 г", "24 мес"],15:[899, 0, 99.9, 0, "0,9 л", "12 мес"],16:[352, 12, 6.2, 62, "500 г", "12 мес"],17:[77, 2, 0.4, 16, "1 кг", "30 суток"],18:[41, 1.4, 0, 8.2, "1 кг", "60 суток"],19:[206, 2.8, 20, 3.2, "300 г", "21 сутки"],20:[437, 6.5, 16, 68, "300 г", "4 мес"],21:[47, 0.4, 0.4, 9.8, "1 кг", "30 суток"],22:[46, 0.5, 0.1, 11, "1 л", "12 мес"],23:[121, 17, 5, 1.8, "200 г", "10 суток"],24:[40, 3, 1, 4, "900 мл", "10 суток"],25:[748, 0.5, 82.5, 0.8, "180 г", "35 суток"],26:[266, 11, 24, 1.6, "450 г", "20 суток"],27:[257, 12.8, 22.2, 1.5, "400 г", "20 суток"],28:[254, 17, 20, 0, "500 г", "3 суток"],29:[267, 16, 22, 0, "1 кг", "4 суток"],30:[147, 21, 7, 0, "400 г", "5 суток"],31:[87, 19, 1.2, 0.2, "500 г", "12 мес"],32:[344, 7, 0.6, 76, "900 г", "24 мес"],33:[313, 12.6, 3.3, 62, "800 г", "18 мес"],34:[399, 0, 0, 99.8, "1 кг", "без ограничений"],35:[0, 0, 0, 0, "1 кг", "без ограничений"],36:[1, 0, 0, 0.3, "200 г", "24 мес"],37:[94, 13, 3, 12, "190 г", "24 мес"],38:[0, 0, 0, 0, "1,5 л", "12 мес"],39:[40, 0, 0, 10, "1,5 л", "12 мес"],40:[45, 0.7, 0.1, 10.4, "1 л", "12 мес"],41:[32, 1.3, 0.1, 6.9, "1 кг", "30 суток"],42:[28, 1.8, 0.1, 4.7, "1 кг", "60 суток"],43:[27, 1.3, 0.3, 5.3, "500 г", "10 суток"],44:[34, 0.9, 0.1, 3, "500 г", "21 сутки"],45:[43, 0.9, 0.2, 8.1, "1 кг", "21 сутки"],46:[65, 0.6, 0.2, 16, "500 г", "7 суток"],47:[42, 0.4, 0.3, 10.9, "1 кг", "14 суток"],48:[160, 2, 14.7, 1.8, "1 шт", "7 суток"],49:[143, 6.5, 0.5, 29.9, "100 г", "60 суток"],50:[262, 7.5, 2.9, 51, "400 г", "4 суток"],51:[290, 7, 6, 52, "100 г", "5 суток"],52:[406, 8, 21, 46, "65 г", "10 суток"],53:[236, 7.9, 1, 49.6, "200 г", "30 суток"],54:[227, 3.3, 15, 20.8, "100 г", "12 мес"],55:[570, 10, 41, 25, "90 г", "12 мес"],56:[517, 3.4, 25, 67, "200 г", "6 мес"],57:[329, 0.8, 0, 80, "250 г", "24 мес"],58:[654, 15.2, 65.2, 7, "150 г", "9 мес"],59:[400, 12, 13, 60, "100 г", "6 мес"],60:[235, 11, 10, 25, "800 г", "12 мес"],61:[230, 9, 9, 28, "350 г", "12 мес"],62:[627, 0.5, 67, 2.6, "400 г", "6 мес"],63:[90, 1.4, 0.1, 20, "300 г", "12 мес"],64:[55, 3.6, 0.1, 9, "400 г", "36 мес"]}; // ккал, белки, жиры, углеводы на 100 г/мл, вес, срок хранения
const ART = {1:["carton", "#4a90d9", "🥛"],5:["bar", "#7e57c2", "🍫"],6:["bar", "#c0702a", "🥜"],7:["bottle", "#c62828", "🥤"],8:["bag", "#f9a825", "🥔"],9:["bottle", "#f48fb1", "🍓"],10:["tray", "#ef9a9a", "🍗"],14:["bag", "#ffcc80", "🍝"],15:["bottle", "#f9a825", "🌻"],16:["box", "#bcaaa4", "🥣"],19:["jar", "#eceff1", "🥛"],20:["box", "#a1887f", "🍪"],22:["carton", "#8bc34a", "🍎"],23:["jar", "#eceff1", "🥣"],24:["carton", "#90caf9", "🥛"],25:["box", "#ffd54f", "🧈"],26:["tray", "#ef9a9a", "🌭"],27:["tray", "#e57373", "🥓"],28:["tray", "#e57373", "🥩"],29:["tray", "#f48fb1", "🥩"],30:["tray", "#ff8a65", "🐟"],31:["bag", "#ef9a9a", "🍤"],32:["bag", "#e0e0e0", "🍚"],33:["bag", "#8d6e63", "🌾"],34:["bag", "#eeeeee", "🍬"],35:["bag", "#b0bec5", "🧂"],36:["box", "#2e7d32", "🍵"],37:["jar", "#4e342e", "☕"],38:["bottle", "#4fc3f7", "💧"],39:["bottle", "#9ccc65", "🍐"],40:["carton", "#ffb74d", "🍊"],55:["bar", "#4e342e", "🍫"],56:["box", "#ff8a65", "🧇"],57:["jar", "#ffb300", "🍯"],58:["bag", "#a1887f", "🌰"],59:["bag", "#8d6e63", "🥨"],60:["bag", "#78909c", "🥟"],61:["box", "#ef5350", "🍕"],62:["jar", "#fff59d", "🥫"],63:["bottle", "#e53935", "🍅"],64:["can", "#7cb342", "🫛"]}; // тип упаковки, цвет, значок

/* ================= Картинки товаров =================
   Если у товара есть поле img (например img:'photos/12.jpg'), показывается фото.
   Иначе рисуется упаковка (SVG) по таблице ART, а свежие продукты показываются крупным значком. */
function shade(hex, pct) {
  const n = parseInt(hex.slice(1), 16), f = pct / 100;
  const ch = v => Math.max(0, Math.min(255, Math.round(v + (f < 0 ? v : 255 - v) * f)));
  return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(ch).map(v => v.toString(16).padStart(2, '0')).join('');
}
function pic(p) {
  if (p.img) return `<img class="art photo" src="${esc(p.img)}" alt="${esc(p.s)}" loading="lazy">`;
  const a = ART[p.id]; if (!a) return p.e;
  const [t, c, e] = a, d = shade(c, -22), l = shade(c, 30);
  const em = (y, fs) => `<text x="50" y="${y}" font-size="${fs}" text-anchor="middle" dominant-baseline="central">${e}</text>`;
  const sh = '<ellipse cx="50" cy="94" rx="30" ry="4" fill="#000" opacity=".22"/>';
  const shine = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${w / 2}" fill="#fff" opacity=".28"/>`;
  let g = '';
  if (t === 'bag') g = `<rect x="20" y="12" width="60" height="78" rx="8" fill="${c}"/><rect x="20" y="12" width="60" height="8" rx="4" fill="${d}"/><rect x="20" y="82" width="60" height="8" rx="4" fill="${d}"/><circle cx="50" cy="52" r="22" fill="#fff" opacity=".93"/>${em(53, 26)}${shine(26, 26, 5, 50)}`;
  else if (t === 'bottle') g = `<rect x="42" y="5" width="16" height="9" rx="2.5" fill="${d}"/><rect x="44" y="13" width="12" height="13" fill="${l}"/><rect x="29" y="24" width="42" height="70" rx="15" fill="${c}"/><rect x="29" y="47" width="42" height="30" fill="#fff" opacity=".93"/>${em(62, 24)}${shine(34, 30, 5, 58)}`;
  else if (t === 'carton') g = `<rect x="26" y="34" width="48" height="58" rx="3" fill="${c}"/><polygon points="26,34 50,13 74,34" fill="${d}"/><rect x="44" y="8" width="12" height="7" rx="1.5" fill="${d}"/><circle cx="50" cy="63" r="19" fill="#fff" opacity=".93"/>${em(64, 24)}${shine(31, 40, 4, 46)}`;
  else if (t === 'jar') g = `<rect x="29" y="9" width="42" height="14" rx="4" fill="#546e7a"/><rect x="23" y="22" width="54" height="70" rx="13" fill="${c}" stroke="#fff" stroke-opacity=".6" stroke-width="2"/><rect x="23" y="46" width="54" height="30" fill="#fff" opacity=".93"/>${em(61, 24)}${shine(29, 28, 5, 56)}`;
  else if (t === 'can') g = `<rect x="26" y="20" width="48" height="72" rx="3" fill="${c}"/><ellipse cx="50" cy="20" rx="24" ry="6" fill="#cfd8dc"/><ellipse cx="50" cy="92" rx="24" ry="5" fill="${d}"/><rect x="26" y="44" width="48" height="30" fill="#fff" opacity=".93"/>${em(60, 24)}${shine(31, 28, 4, 58)}`;
  else if (t === 'box') g = `<rect x="18" y="16" width="56" height="76" rx="4" fill="${c}"/><polygon points="74,16 86,24 86,84 74,92" fill="${d}"/><circle cx="46" cy="54" r="20" fill="#fff" opacity=".93"/>${em(55, 26)}${shine(23, 22, 4, 64)}`;
  else if (t === 'bar') g = `<g transform="rotate(-14 50 50)"><rect x="8" y="30" width="84" height="40" rx="7" fill="${c}"/><rect x="8" y="30" width="8" height="40" rx="4" fill="${d}"/><rect x="84" y="30" width="8" height="40" rx="4" fill="${d}"/><rect x="24" y="38" width="52" height="24" rx="8" fill="#fff" opacity=".93"/><text x="50" y="51" font-size="20" text-anchor="middle" dominant-baseline="central">${e}</text><rect x="14" y="34" width="72" height="5" rx="2.5" fill="#fff" opacity=".25"/></g>`;
  else if (t === 'tray') g = `<rect x="8" y="40" width="84" height="46" rx="9" fill="#f4f6f7" stroke="#cfd8dc" stroke-width="2"/><rect x="8" y="72" width="84" height="14" rx="7" fill="${c}"/>${em(54, 40)}<rect x="14" y="44" width="40" height="5" rx="2.5" fill="#fff" opacity=".7"/>`;
  return `<svg class="art" viewBox="0 0 100 100" role="img" aria-label="${esc(p.s)}">${sh}${g}</svg>`;
}
const SNACKS = [6, 7, 8, 9, 5, 20, 22, 52, 54, 55, 56, 58, 59, 40];
const DISHES = [
  {id:1, n:'Омлет с сыром', e:'🍳', t:'15 мин · 320 ккал', i:[[3,1],[1,1],[4,1]]},
  {id:2, n:'Овсянка с бананом', e:'🥣', t:'10 мин · 280 ккал', i:[[16,1],[1,1],[13,1]]},
  {id:3, n:'Паста с сыром', e:'🍝', t:'20 мин · 450 ккал', i:[[14,1],[4,1],[19,1]]},
  {id:4, n:'Курица с картофелем', e:'🍗', t:'45 мин · 520 ккал', i:[[10,1],[17,1],[18,1],[15,1]]},
  {id:5, n:'Овощной салат', e:'🥗', t:'10 мин · 150 ккал', i:[[11,2],[12,2],[19,1]]},
  {id:6, n:'Бутерброды с сыром', e:'🥪', t:'5 мин · 300 ккал', i:[[2,1],[4,1],[11,1]]}
];
const MONTHS = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
const DEMO_ORDERS_UNUSED = [
  ['19 сентября, 19:30', [[1,2],[2,1],[3,1],[4,1],[10,1],[11,3],[12,2],[8,1],[7,1],[5,1]]],
  ['10 сентября, 14:15', [[13,1],[19,1],[10,1],[11,2],[9,1],[3,1],[2,1]]],
  ['1 сентября, 21:05', [[2,1],[1,1],[10,1],[8,1],[21,2],[17,2],[18,1],[14,1],[15,1],[3,1],[4,1],[16,1],[5,1],[22,1],[20,1]]],
  ['25 августа, 18:20', [[7,1],[8,1],[12,1],[6,1],[9,1]]],
  ['14 августа, 12:40', [[1,1],[3,1],[4,1],[10,1],[2,1],[5,1],[16,1],[13,1],[19,1]]],
  ['2 августа, 16:10', [[2,1],[13,1],[9,1],[12,1],[17,1],[18,1]]]
];

/* ================= Состояние ================= */
const S = {
  loc: load('gd_loc', 0),
  extra: load('gd_extra', []),
  cart: load('gd_cart', []),
  theme: load('gd_theme', 'dark'),
  name: load('gd_name', null),
  orders: load('gd_orders2', null),
  dishes: []
};
/* Защита от «битых» сохранённых данных (старые версии приложения хранили корзину иначе) */
if (!Array.isArray(S.extra)) S.extra = [];
S.extra = S.extra.filter(l => l && typeof l.n === 'string' && l.m && typeof l.m === 'object');
if (typeof S.loc !== 'number') S.loc = 0;
const allLocs = () => LOCS.concat(S.extra);
if (!allLocs()[S.loc]) S.loc = 0;
const persist = () => { save('gd_loc', S.loc); save('gd_extra', S.extra); save('gd_cart', S.cart); save('gd_theme', S.theme); save('gd_name', S.name); save('gd_orders2', S.orders); };

/* ================= Логика «цена + расстояние» ================= */
function offers(pid, loc = S.loc) {
  const p = P[pid - 1], m = allLocs()[loc].m, mn = id => (m[id] != null ? m[id] : 10);
  return STORES.filter(s => p.p[s.id] != null)
    .map(s => ({s, price: p.p[s.id], min: mn(s.id), score: p.p[s.id] + mn(s.id) * TIME_COST}))
    .sort((a, b) => a.score - b.score);
}
const best = (pid, loc) => offers(pid, loc)[0];
const minutes = sid => { const v = allLocs()[S.loc].m[sid]; return v != null ? v : 10; };
const price = (pid, sid) => P[pid - 1].p[sid];

if (!Array.isArray(S.orders) || S.orders.some(o => !o || !Array.isArray(o.items))) S.orders = null;
if (!Array.isArray(S.cart)) S.cart = [];
S.cart = S.cart.filter(c => c && P[c.pid - 1] && c.qty > 0).map(c => ({pid: c.pid, qty: Math.floor(c.qty), store: (SM[c.store] && P[c.pid - 1].p[c.store] != null) ? c.store : best(c.pid).s.id}));
if (!S.orders) S.orders = [];

/* ================= Корзина ================= */
const cartCount = () => S.cart.length;
const cartSum = () => S.cart.reduce((s, c) => s + price(c.pid, c.store) * c.qty, 0);
function refreshBadges() { const n = cartCount(); $$('.cnt').forEach(el => el.textContent = n || ''); }
function add(pid, store, n = 1, silent) {
  const it = S.cart.find(c => c.pid === pid);
  if (it) { it.qty += n; if (store) it.store = store; }
  else S.cart.push({pid, qty: n, store: store || best(pid).s.id});
  persist(); refreshBadges();
  $$('.cartbar .cnt').forEach(el => { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); });
  try { tg && tg.HapticFeedback && tg.HapticFeedback.impactOccurred('light'); } catch (e) {}
  if (!silent) { const inCart = $('#cart').classList.contains('on'); toast(inCart ? 'Добавлено в корзину' : '✓ Добавлено · Открыть корзину ›', !inCart); }
}

/* «+» : добавление в корзину. Обработчик прямо на кнопке (надёжно в WebView Telegram) + защита от двойного срабатывания */
function plusTap(btn, ev) {
  if (ev) { ev.stopPropagation(); ev.preventDefault(); ev._handled = true; }
  const now = Date.now(); if (btn._t && now - btn._t < 350) return false; btn._t = now;
  try { add(+btn.dataset.add, btn.dataset.store); flashPlus(btn); flyToCart(btn); if ($('#cart').classList.contains('on')) R.cart(); }
  catch (err) { toast('Ошибка: ' + (err && err.message || err)); }
  return false;
}

/* Эффект «товар летит в корзину» (только transform/opacity, страница не перерисовывается) */
function flyToCart(btn) {
  try {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !btn.animate) return;
    const to = document.querySelector('.screen.on .cartbar') || document.querySelector('.screen.on .top [data-go=cart]'); if (!to) return;
    const a = btn.getBoundingClientRect(), b = to.getBoundingClientRect();
    const dot = document.createElement('div'); dot.className = 'fly'; dot.textContent = '+'; document.body.appendChild(dot);
    const x0 = a.left + a.width / 2 - 17, y0 = a.top + a.height / 2 - 17, x1 = b.left + b.width / 2 - 17, y1 = b.top + b.height / 2 - 17;
    const an = dot.animate([{transform: `translate(${x0}px,${y0}px) scale(1)`, opacity: 1}, {transform: `translate(${(x0 + x1) / 2}px,${Math.min(y0, y1) - 60}px) scale(1.1)`, opacity: 1, offset: .45}, {transform: `translate(${x1}px,${y1}px) scale(.3)`, opacity: .2}], {duration: 650, easing: 'cubic-bezier(.4,0,.2,1)'});
    an.onfinish = () => dot.remove();
  } catch (e) {}
}
function flashPlus(b) {
  if (!b || !b.classList || !b.classList.contains('plus')) return;
  b.classList.add('done'); b.innerHTML = CHECK;
  setTimeout(() => { if (b.isConnected) { b.classList.remove('done'); b.innerHTML = PLUS; } }, 1000);
}
let toastT;
function toast(t, tap) { const el = $('#toast'); el.textContent = t; el.classList.toggle('click', !!tap); el.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 1700); }

/* ================= Шаблоны ================= */
function snackCard(pid) {
  const p = P[pid - 1], o = best(pid);
  return `<div class="pc" data-go="product" data-arg="${pid}">
    <div class="pimg">${pic(p)}</div>
    <div class="pn">${p.s}</div><div class="pp">${rub(o.price)}</div>
    <div class="ps">${sb(o.s.id)} ${o.s.n}</div>
    <div class="pf"><span>📍 ${o.min} мин</span><button type="button" class="plus" onclick="return plusTap(this,event)" data-add="${pid}" data-store="${o.s.id}" aria-label="В корзину">${PLUS}</button></div></div>`;
}
function gridCard(pid, sid) {
  const p = P[pid - 1], o = sid ? {s: SM[sid], price: price(pid, sid), min: minutes(sid)} : best(pid);
  return `<div class="pc" data-go="product" data-arg="${pid}" ${sid ? `data-sel="${sid}"` : ''}>
    <div class="pimg">${pic(p)}</div>
    <div class="pn" style="font-size:15px">${p.n}</div><div class="pp">${rub(o.price)}</div>
    <div class="ps">${sb(o.s.id)} ${o.s.n}</div>
    <div class="pf"><span>📍 ${o.min} мин</span><button type="button" class="plus" onclick="return plusTap(this,event)" data-add="${pid}" data-store="${o.s.id}" aria-label="В корзину">${PLUS}</button></div></div>`;
}
const userName = () => S.name || (tgUser && tgUser.first_name) || 'Гость';
const userTag = () => tgUser && tgUser.username ? '@' + tgUser.username : '';
function avatarHTML() { return tgUser && tgUser.photo_url ? `<img src="${esc(tgUser.photo_url)}" alt="">` : PERSON; }
const THEMES = [
  {id: 'dark', n: 'Тёмная', tone: 'dark', hdr: '#051F20', sw: 'linear-gradient(135deg,#235347,#051F20)'},
  {id: 'light', n: 'Светлая', tone: 'light', hdr: '#EEF9F0', sw: 'linear-gradient(135deg,#F4FBF5,#BFE0CA)'}
];
function themeBlock() {
  return `<div class="lbl">ТЕМА</div><div class="card list">` + THEMES.map(t =>
    `<button class="rowb" data-set-theme="${t.id}"><i class="swatch" style="background:${t.sw}"></i>${t.n}<i class="dot ${S.theme === t.id ? 'on' : ''}"></i></button>`).join('') + `</div>`;
}
const orderSum = o => o.items.reduce((s, [pid, q, st]) => s + price(pid, st) * q, 0);
const orderStores = o => [...new Set(o.items.map(i => SM[i[2]].n))].join(', ');


/* ================= Пищевая ценность ================= */
function nutHTML(pid) {
  const n = NUT[pid], p = P[pid - 1]; if (!n) return '';
  const unit = /л$/.test(n[4]) ? 'мл' : 'г';
  const t = (v, lab, max, cls) => `<div class="nt ${cls}"><b>${String(v).replace('.', ',')}</b><small>${lab}</small><i style="--w:${Math.min(100, Math.round(v / max * 100))}%"></i></div>`;
  return `<div class="lbl">О ТОВАРЕ</div>
    <div class="facts"><div><small>Вес / объём</small><b>${esc(n[4])}</b></div><div><small>Срок хранения</small><b>${esc(n[5])}</b></div><div><small>Категория</small><b>${esc(p.k)}</b></div></div>
    <div class="lbl">ПИЩЕВАЯ ЦЕННОСТЬ · НА 100 ${unit.toUpperCase()}</div>
    <div class="nut">${t(n[0], 'ккал', 600, 'k')}${t(n[1], 'белки, г', 30, 'b')}${t(n[2], 'жиры, г', 40, 'f')}${t(n[3], 'углеводы, г', 80, 'u')}</div>
    <div class="hint">Значения ориентировочные; точные данные — на упаковке.</div>`;
}

/* ================= Экраны ================= */
const R = {
  home() {
    $$('.locname').forEach(e => e.textContent = allLocs()[S.loc].n);
    $('#homeAvatar').innerHTML = avatarHTML();
    $('#homeStores').innerHTML = STORES.map(s => `<button class="stc" data-go="store" data-arg="${s.id}">${sb(s.id, 'l')}${s.n}</button>`).join('') + '<button class="stc arrow" data-go="stores">→</button>';
    $('#homeSnacks').innerHTML = SNACKS.map(snackCard).join('');
  },
  profile() { window.renderReactScreen('profile', {name: userName(), tag: userTag(), avatar: avatarHTML(), themes: themeBlock()}); },
  editprofile() { window.renderReactScreen('editprofile', {name: userName(), avatar: avatarHTML()}); },
  settings() { window.renderReactScreen('settings', {themes: themeBlock()}); },
  about() { window.renderReactScreen('about', {}); },
  location() { const recent = load('gd_recent_addresses', []); window.renderReactScreen('location', {locations: Array.isArray(recent) ? recent : [], selected: allLocs()[S.loc].n}); },
  search() { window.renderReactScreen('search', {}); document.getElementById('q').value = ''; renderResults(''); setTimeout(() => $('#q')?.focus(), 80); },
  history() { window.renderReactScreen('history', {orders: S.orders.map(o => ({date:o.d, count:goods(o.items.length), stores:orderStores(o), sum:rub(orderSum(o)), pictures:o.items.slice(0,4).map(([pid]) => pic(P[pid-1])), remaining:Math.max(0,o.items.length-4)}))}); },
  order(i) {
    const o = S.orders[i]; if (!o) return back();
    $('#orderTitle').innerHTML = `Покупка<small>${o.d}</small>`;
    $('#orderBody').innerHTML = `
      <div class="card sum"><div class="ic">🛒</div><div class="t"><b>${goods(o.items.length)}</b>${orderStores(o)}</div><div class="v">${rub(orderSum(o))}</div></div>
      <div class="lbl" style="font-size:17px;color:var(--txt);letter-spacing:0">Список товаров</div>
      ${o.items.map(([pid, q, st]) => `<div class="line" data-go="product" data-arg="${pid}" style="cursor:pointer">
        <div class="th">${pic(P[pid - 1])}</div><div class="inf"><div class="nm">${P[pid - 1].n}</div><div class="meta">${sb(st)} ${SM[st].n}</div></div>
        <div class="pr" style="align-self:center"><small>×${q}</small>${rub(price(pid, st) * q)}</div></div>`).join('')}
      <div class="card sum" style="margin-top:6px"><div class="ic">₽</div><div class="t"><b style="font-size:19px">Итого</b></div><div class="v">${rub(orderSum(o))}</div></div>
      <div class="bar"><button class="btn" data-act="repeat" data-arg="${i}">🛒 Добавить в корзину снова</button></div>`;
  },
  menu() { window.renderReactScreen('menu', {dishes: DISHES.map(d => ({...d, ingredients:d.i.map(([pid,qty])=>({id:pid,qty,name:P[pid-1].n,emoji:P[pid-1].e,store:best(pid).s.n,price:rub(best(pid).price*qty)}))})), selected: S.dishes.slice()}); },
  menulist() {
    const map = {};
    S.dishes.forEach(id => DISHES.find(d => d.id === id).i.forEach(([pid, q]) => map[pid] = (map[pid] || 0) + q));
    const items = Object.entries(map).map(([pid, q]) => ({pid: +pid, q, o: best(+pid)}));
    const total = items.reduce((s, x) => s + x.o.price * x.q, 0);
    $('#menulistBody').innerHTML = `
      <div class="hint" style="margin:2px 4px 12px;font-size:15px">${S.dishes.map(id => DISHES.find(d => d.id === id).e + ' ' + DISHES.find(d => d.id === id).n).join(' · ')}</div>
      ${items.map(x => `<div class="line" data-go="product" data-arg="${x.pid}" style="cursor:pointer"><div class="th">${pic(P[x.pid - 1])}</div><div class="inf"><div class="nm">${P[x.pid - 1].n}</div><div class="meta">${sb(x.o.s.id)} ${x.o.s.n} · 📍 ${x.o.min} мин</div></div><div class="pr" style="align-self:center"><small>×${x.q}</small>${rub(x.o.price * x.q)}</div></div>`).join('')}
      <div class="card sum"><div class="ic">₽</div><div class="t"><b style="font-size:19px">Итого</b>по лучшим ценам</div><div class="v">${rub(total)}</div></div>
      <div class="bar"><button class="btn" data-act="addMenu">🛒 Добавить всё в корзину</button></div>`;
  },
  stores() { window.renderReactScreen('stores', {stores: STORES.map(s => ({...s, logo: STORE_PNG[s.id], min: minutes(s.id)}))}); },
  store(sid) {
    $('#storeTitle').textContent = SM[sid].n;
    $('#storeBody').innerHTML = `
      <div class="card" style="display:flex;align-items:center;gap:14px;padding:14px">${sb(sid, 'm')}<div style="font-size:17px;font-weight:600;flex:1">${SM[sid].n}<div class="hint" style="margin:2px 0 0">📍 ${minutes(sid)} мин от вас</div></div></div>
      <label class="search" style="margin-top:12px;height:50px">🔎<input id="sq" placeholder="Найти в магазине" autocomplete="off" data-sid="${sid}"></label>
      <div class="hrow chipsrow" id="scats" style="margin-top:6px"></div>
      <div class="grid2" id="sgrid" style="margin-top:10px"></div>`;
    STORECAT = ''; renderStoreGrid(sid, '');
  },
  snacks() { $('#snacksBody').innerHTML = `<div class="grid2">${SNACKS.map(pid => gridCard(pid)).join('')}</div>`; },
  product(a) {
    const o = typeof a === 'object' && a ? a : {pid: +a};
    const pid = o.pid, p = P[pid - 1], off = offers(pid), it = S.cart.find(c => c.pid === pid);
    arg.productSel = o.sel || (it ? it.store : off[0].s.id);
    if (!off.find(x => x.s.id === arg.productSel)) arg.productSel = off[0].s.id;
    $('#prodTitle').textContent = p.s;
    const sel = arg.productSel, so = off.find(x => x.s.id === sel);
    const lowest = Math.min(...off.map(x => x.price));
    let label;
    if (!it) label = `🛒 Добавить в корзину · ${rub(so.price)}`;
    else if (it.store === sel) label = `🛒 В корзине ×${it.qty} · ещё одну`;
    else label = `Перенести в ${SM[sel].n} · ${rub(so.price)}`;
    $('#productBody').innerHTML = `
      <div class="hero"><span class="bob">${pic(p)}</span></div>
      <h2 style="margin:16px 2px 4px;font-size:23px">${p.n}</h2>
      <div class="hint" style="margin:0 2px 4px">${esc(p.k)}</div>
      <div class="hint" style="margin:0 2px;font-size:15px">${p.d}</div>
      ${nutHTML(pid)}
      <div class="lbl">СРАВНЕНИЕ ЦЕН</div>
      ${off.map((x, i) => `<button class="cmp ${x.s.id === sel ? 'sel' : ''}" data-sel-store="${x.s.id}">${sb(x.s.id, 'm')}<div class="n">${x.s.n}${i === 0 ? '<span class="tag">выгоднее всего</span>' : ''}<small>📍 ${x.min} мин${x.price > lowest ? ' · на ' + rub(x.price - lowest) + ' дороже минимума' : ''}</small></div><div class="p">${rub(x.price)}</div></button>`).join('')}
      <div class="hint">Лучший вариант считаем по цене и расстоянию: ${TIME_COST} ₽ за каждую минуту в пути.</div>
      <div class="bar"><button class="btn" data-act="productBtn" data-arg="${pid}">${label}</button></div>`;
  },
  cart() {
    const byStore = {}; S.cart.forEach(c => byStore[c.store] = (byStore[c.store] || 0) + price(c.pid, c.store) * c.qty);
    const saved = S.cart.reduce((a,c) => a + (Math.max(...Object.values(P[c.pid-1].p)) - price(c.pid,c.store)) * c.qty, 0);
    const n = Object.keys(byStore).length;
    window.renderReactScreen('cart', {location:allLocs()[S.loc].n,total:rub(cartSum()),saved:saved>0?rub(saved):null,count:goods(S.cart.length),storeCount:n+' '+plural(n,'магазине','магазинах','магазинах'),stores:Object.entries(byStore).map(([id,v])=>({id,name:SM[id].n,logo:STORE_PNG[id],total:rub(v)})),items:S.cart.map(c=>({pid:c.pid,qty:c.qty,storeId:c.store,store:SM[c.store].n,logo:STORE_PNG[c.store],minutes:minutes(c.store),name:P[c.pid-1].n,image:pic(P[c.pid-1]),price:rub(price(c.pid,c.store)),total:rub(price(c.pid,c.store)*c.qty)}))});
  }
};

let searchRequest = 0;
const publicApiBase = window.GDECHEAPLY_API_BASE || '';
const publicApiHeaders = /(?:\.tuna\.am|\.tuna\.free)$/.test(new URL(publicApiBase || location.origin).hostname) ? {'tuna-skip-browser-warning':'true'} : {};
async function renderResults(q) {
  const request = ++searchRequest;
  if (q.trim().length < 2) { window.renderReactScreen('results', {query:q, products:[], message:'Введите не менее двух символов'}); return; }
  window.renderReactScreen('results', {query:q, products:[], message:'Ищем в базе…'});
  try {
    if (!publicApiBase && !['localhost','127.0.0.1'].includes(location.hostname)) throw new Error('Сервер не подключён');
    const params = new URLSearchParams({q});
    const [response, unifiedResponse] = await Promise.all([fetch(publicApiBase + '/api/public/products?' + params, {headers:publicApiHeaders,signal:AbortSignal.timeout(12000)}), fetch(publicApiBase + '/api/public/unified-products?' + params, {headers:publicApiHeaders,signal:AbortSignal.timeout(12000)})]);
    if (!response.ok || !unifiedResponse.ok) throw new Error('API недоступен');
    const [data, unified] = await Promise.all([response.json(), unifiedResponse.json()]);
    const covered = new Set(unified.items.flatMap(item => (item.covered_entry_ids || []).map(id => 'inventory-' + id)));
    const products = [...unified.items, ...data.items.filter(item => !covered.has(item.id))].map(item => ({...item, image_url:item.image_url && item.image_url.startsWith('/api/public/') ? publicApiBase + item.image_url : item.image_url}));
    if (request === searchRequest) window.renderReactScreen('results', {query:q, products, message:products.length ? 'Цены по источникам; наличие и цена по адресу магазина не подтверждены.' : 'Предложения не найдены или ещё не загружены в базу.'});
  } catch (error) {
    if (request === searchRequest) window.renderReactScreen('results', {query:q, products:[], message:'Сервер товаров временно недоступен. Попробуйте повторить поиск позже.'});
  }
}
function renderStoreGrid(sid, q) {
  const toks = norm(q).split(/\s+/).filter(Boolean);
  const base = P.filter(p => p.p[sid] != null);
  const cats = CATS.filter(c => base.some(p => p.k === c[0]));
  if (STORECAT && !cats.some(c => c[0] === STORECAT)) STORECAT = '';
  const sc = $('#scats'); if (sc) sc.innerHTML = `<button class="chip ${STORECAT ? '' : 'on'}" data-scat="">Все</button>` + cats.map(([k, e]) => `<button class="chip ${STORECAT === k ? 'on' : ''}" data-scat="${esc(k)}">${e} ${k}</button>`).join('') + '<span style="flex:none;width:8px"></span>' + SORTS.filter(x => x[0] !== 'best').map(([id, n]) => `<button class="chip ${CATSORT === id ? 'on' : ''}" data-ssort="${id}">${n}</button>`).join('');
  const list = sortList(base.filter(p => (!STORECAT || p.k === STORECAT) && toks.every(t => norm(p.n + ' ' + p.k).includes(t))), CATSORT, sid);
  $('#sgrid').innerHTML = list.length ? list.map(p => gridCard(p.id, sid)).join('') : '<div class="empty" style="grid-column:1/-1"><em>🤷</em>Ничего не нашли</div>';
}

/* ================= Карта: «Найти магазин» ================= */
// Адрес вашего сервера (см. docs/02-BACKEND.md). Пусто = показываем демо-магазины.
const API_URL = window.GDECHEAPLY_API_BASE || '';
const CITY = {lat: 55.0302, lng: 82.9204};   // центр Новосибирска
const WALK_KMH = 5;                           // скорость пешехода для «минут пешком»
const MAP = {map: null, layer: null, user: null, center: CITY, stores: [], chain: 'all', sel: null, token: 0};

const toRad = d => d * Math.PI / 180;
function distM(a, b) {                        // расстояние между точками, метры (формула гаверсинусов)
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}
const walkMin = m => Math.max(1, Math.round(m / (WALK_KMH * 1000 / 60)));
const kmText = m => m < 950 ? Math.round(m / 10) * 10 + NB + 'м' : (m / 1000).toFixed(1).replace('.', ',') + NB + 'км';
const leafletOK = () => typeof L !== 'undefined' && !!L.map;
function mapCenter() { const l = allLocs()[S.loc]; return {lat: l.lat || CITY.lat, lng: l.lng || CITY.lng}; }
function offsetPoint(c, meters, bearingDeg) {
  const b = toRad(bearingDeg);
  return {lat: c.lat + meters * Math.cos(b) / 111320, lng: c.lng + meters * Math.sin(b) / (111320 * Math.cos(toRad(c.lat)))};
}

// Настоящие магазины Новосибирска (адреса и координаты взяты с карточек 2ГИС, проверьте перед публикацией).
// Чтобы показывать магазины со всего города, поднимите сервер (docs/02-BACKEND.md) и впишите API_URL.
const REAL_STORES = [
  {id:'r1', chain:'mar', address:'ул. Громова, 22/2', lat:54.932938, lng:82.907499},
  {id:'r2', chain:'mar', address:'ул. Тюленина, 14/1', lat:55.109352, lng:82.944646},
  {id:'r3', chain:'mar', address:'пр. Карла Маркса, 37/2', lat:54.989144, lng:82.904925},
  {id:'r4', chain:'mar', address:'ул. Большая, 608', lat:55.028319, lng:82.809248},
  {id:'r5', chain:'pya', address:'Красный проспект, 218/2', lat:55.066442, lng:82.91135},
  {id:'r6', chain:'pya', address:'ул. Фрунзе, 88', lat:55.037701, lng:82.934687},
  {id:'r7', chain:'mag', address:'ул. Пролетарская, 50', lat:55.024829, lng:82.955925},
  {id:'r8', chain:'mag', address:'ул. Челюскинцев, 14/1', lat:55.038093, lng:82.90254},
  {id:'r9', chain:'mag', address:'ул. Учительская, 46', lat:55.083668, lng:82.962908},
  {id:'r10', chain:'fix', address:'ул. Ленинградская, 71/1', lat:55.01637, lng:82.951355},
  {id:'r11', chain:'fix', address:'ул. Объединения, 35/3', lat:55.099183, lng:82.971231},
  {id:'r12', chain:'fix', address:'ул. Станиславского, 40/1', lat:54.968942, lng:82.872558},
  {id:'r13', chain:'chi', address:'Красный проспект, 218/2', lat:55.066809, lng:82.9115},
  {id:'r14', chain:'chi', address:'ул. Плахотного, 2а', lat:54.986228, lng:82.861207},
  {id:'r15', chain:'chi', address:'ул. Объединения, 94', lat:55.097733, lng:82.968274},
  {id:'r16', chain:'chi', address:'ул. Есенина, 12/4', lat:55.046794, lng:82.986022}
];
function realStores() { return REAL_STORES.map(s => ({...s, name: SM[s.chain].n})); }

// Демо-магазины вокруг точки (больше не используются, оставлены для справки). Настоящие приходят с вашего сервера (fetchStores).
const STREETS = ['ул. Ленина', 'Красный пр.', 'ул. Кирова', 'ул. Фрунзе', 'ул. Советская', 'ул. Орджоникидзе', 'ул. Депутатская', 'Вокзальная магистраль', 'ул. Сибирская'];
function demoStores(c) {
  const out = [], mins = allLocs()[S.loc].m;
  STORES.forEach((s, si) => {
    const base = mins[s.id] * WALK_KMH * 1000 / 60;      // метры, чтобы ближайший совпадал с «минутами» в ценах
    [1, 1.9, 3.1].forEach((k, j) => {
      const p = offsetPoint(c, base * k, (si * 72 + j * 131 + 20) % 360);
      out.push({id: s.id + '-' + (j + 1), chain: s.id, name: s.n, address: STREETS[(si * 3 + j) % STREETS.length] + ', ' + (10 + (si * 17 + j * 29) % 90), lat: p.lat, lng: p.lng});
    });
  });
  return out;
}

// Все магазины сетей в городе: пока телефон в интернете, берём их из OpenStreetMap (Overpass API), результат хранится сутки.
// Если интернета нет или сервис недоступен, показываем встроенный список REAL_STORES.
const OSM_CHAINS = [['pya', /пят[её]рочка/i], ['mag', /магнит/i], ['mar', /мария[-\s]?ра/i], ['fix', /fix[\s-]?price|фикс[\s-]?прайс/i], ['chi', /чижик/i]];
async function fetchOSM(c) {
  const key = 'gd_osm', la = c.lat.toFixed(2), lo = c.lng.toFixed(2), cached = load(key, null);
  if (cached && cached.la === la && cached.lo === lo && Date.now() - cached.t < 864e5 && Array.isArray(cached.list)) return cached.list;
  const q = `[out:json][timeout:20];nwr["shop"]["name"~"Пят[её]рочка|Магнит|Мария-?Ра|Fix ?Price|Фикс ?Прайс|Чижик",i](around:5000,${c.lat},${c.lng});out center 150;`;
  const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 9000);
  try {
    const r = await fetch('https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(q), {signal: ctl.signal});
    if (!r.ok) return null;
    const j = await r.json(), out = [];
    (j.elements || []).forEach(e => {
      const t = e.tags || {}, nm = String(t.name || ''), lat = e.lat != null ? e.lat : e.center && e.center.lat, lng = e.lon != null ? e.lon : e.center && e.center.lon;
      if (/косметик/i.test(nm) || !isFinite(lat) || !isFinite(lng)) return;
      const ch = OSM_CHAINS.find(x => x[1].test(nm)); if (!ch) return;
      const addr = [t['addr:street'], t['addr:housenumber']].filter(Boolean).join(', ');
      out.push({id: 'osm-' + e.type + '-' + e.id, chain: ch[0], name: SM[ch[0]].n, address: addr || 'адрес уточняется', lat, lng});
    });
    if (out.length) save(key, {la, lo, t: Date.now(), list: out});
    return out.length ? out : null;
  } catch (err) { return null; } finally { clearTimeout(tm); }
}
async function allStores(c) {
  const base = realStores(), live = await fetchOSM(c);
  if (!live) return base;
  const extra = base.filter(b => !live.some(l => l.chain === b.chain && distM(b, l) < 60));
  return live.concat(extra);
}
// Ответ сервера — это ЧУЖИЕ данные: ничего не вставляем в HTML без esc() и приводим числа через Number().
async function fetchStores(c) {
  try {
    const params = new URLSearchParams({lat: c.lat, lon: c.lng, radius_m: 5000});
    const response = await fetch(`${API_URL}/api/public/stores/nearby?${params}`, {headers:publicApiHeaders});
    if (!response.ok) throw new Error('API unavailable');
    const data = await response.json();
    if (!Array.isArray(data.items)) throw new Error('Invalid response');
    const chains = {pyaterochka: 'pya', magnit: 'mag'};
    const fromDb = data.items.filter(s => chains[s.store_code] && Number.isFinite(Number(s.lat)) && Number.isFinite(Number(s.lng)))
      .map(s => ({id: 'db-' + s.id, chain: chains[s.store_code], name: s.store, address: s.address, lat: s.lat, lng: s.lng}));
    const other = (await allStores(c)).filter(s => !['pya', 'mag'].includes(s.chain));
    return fromDb.concat(other);
  } catch (e) {
    toast('Сервер недоступен — показаны доступные адреса');
    return allStores(c);
  }
}

function initMap() {
  if (MAP.map || !leafletOK()) return;
  const c = MAP.user || mapCenter();
  MAP.map = L.map('mapview', {zoomControl: false}).setView([c.lat, c.lng], 15);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(MAP.map);
  MAP.layer = L.layerGroup().addTo(MAP.map);
}
const visibleStores = () => MAP.stores.filter(s => MAP.chain === 'all' || s.chain === MAP.chain).slice(0, 30);

async function loadStores(fit) {
  const c = MAP.user || mapCenter(), tk = ++MAP.token;
  const raw = await fetchStores(c);
  if (tk !== MAP.token) return;                          // пришёл более новый запрос — этот выбрасываем
  MAP.center = c;
  MAP.stores = raw.map(s => ({id: String(s.id), chain: String(s.chain), name: String(s.name || ''), address: String(s.address || ''), lat: Number(s.lat), lng: Number(s.lng)}))
    .filter(s => SM[s.chain] && isFinite(s.lat) && isFinite(s.lng))
    .map(s => ({...s, d: distM(c, s)})).sort((a, b) => a.d - b.d);
  drawAll(fit !== false);
}

function drawAll(fit) {
  const c = MAP.center, vis = visibleStores();
  $('#chainChips').innerHTML = [['all', 'Все']].concat(STORES.map(s => [s.id, s.n]))
    .map(([id, n]) => `<button class="chip ${MAP.chain === id ? 'on' : ''}" data-act="chain" data-arg="${id}">${n}</button>`).join('');
  $('#storesLbl').textContent = vis.length ? 'БЛИЖАЙШИЕ МАГАЗИНЫ · ' + vis.length : '';
  $('#storeList').innerHTML = vis.length ? vis.map(s => `
    <div class="srow ${s.id === MAP.sel ? 'sel' : ''}" id="sr-${esc(s.id)}" data-act="focusStore" data-arg="${esc(s.id)}">
      ${sb(s.chain, 'm')}
      <div class="si"><b>${esc(s.name)}</b><small>${esc(s.address)}</small><small>📍 ${kmText(s.d)} · ${walkMin(s.d)} мин пешком</small></div>
      <div class="sa"><button class="mini ok" data-act="pickStore" data-arg="${esc(s.id)}">Выбрать</button><button class="mini" data-act="route" data-arg="${esc(s.id)}">Маршрут</button></div>
    </div>`).join('') : '<div class="empty"><em>🤷</em>Магазинов рядом не нашли.<br>Попробуйте другой адрес.</div>';
  if (!MAP.map) return;
  MAP.layer.clearLayers();
  L.marker([c.lat, c.lng], {icon: L.divIcon({className: 'mkw', html: '<div class="me"></div>', iconSize: [18, 18], iconAnchor: [9, 9]}), interactive: false, keyboard: false}).addTo(MAP.layer);
  vis.forEach(s => {
    const icon = L.divIcon({className: 'mkw', html: `<div class="mk ${s.id === MAP.sel ? 'sel' : ''}" style="background:#fff"><img src="${STORE_PNG[s.chain]}" alt="" referrerpolicy="no-referrer" style="position:absolute;left:0;top:0;width:100%;height:100%;max-width:none;object-fit:contain;display:block;border-radius:50%;background:#fff" onerror="mkErr(this,'${s.chain}')"></div>`, iconSize: [36, 36], iconAnchor: [18, 18]});
    L.marker([s.lat, s.lng], {icon, title: s.name}).addTo(MAP.layer).on('click', () => selectStore(s.id, true));
  });
  if (fit) {
    const pts = [[c.lat, c.lng]].concat(vis.slice(0, 6).map(s => [s.lat, s.lng]));
    MAP.map.fitBounds(L.latLngBounds(pts), {padding: [40, 40], maxZoom: 16});
  }
}

function selectStore(id, fromMarker) {
  MAP.sel = id; drawAll(false);
  const s = MAP.stores.find(x => x.id === id);
  if (s && MAP.map) MAP.map.flyTo([s.lat, s.lng], Math.max(MAP.map.getZoom(), 16), {duration: .5});
  if (fromMarker) { const el = document.getElementById('sr-' + id); if (el) el.scrollIntoView({behavior: 'smooth', block: 'center'}); }
  else window.scrollTo({top: 0, behavior: 'smooth'});
}
function pickStore(id) {
  const s = MAP.stores.find(x => x.id === id); if (!s) return;
  toast('Выбран магазин: ' + s.name); go('store', s.chain);
}
function routeTo(id) {                                   // пешеходный маршрут во внешних Яндекс Картах
  const s = MAP.stores.find(x => x.id === id); if (!s) return;
  const url = `https://yandex.ru/maps/?rtext=~${s.lat},${s.lng}&rtt=pd`;
  if (tg && tg.openLink) { try { tg.openLink(url); return; } catch (e) {} }
  window.open(url, '_blank', 'noopener');
}

async function addAddress() {
  const input = document.getElementById('locInp'); const address = input.value.trim().replace(/\s+/g, ' ');
  if (input.dataset.selectedAddress) {
    try {
      const point = JSON.parse(input.dataset.selectedAddress);
      if (point.n !== address || !Number.isFinite(point.lat) || !Number.isFinite(point.lng)) throw Error('invalid');
      const stored = load('gd_recent_addresses', []), recent = Array.isArray(stored) ? stored : [];
      save('gd_recent_addresses', [point, ...recent.filter(x => x.n !== point.n)].slice(0,10));
      S.extra.push(point); S.loc = allLocs().length - 1; MAP.user = null; persist(); toast('Адрес добавлен'); back(); return;
    } catch { toast('Выберите адрес из списка заново'); return; }
  }
  const valid = /^(?:ул\.?|улица)\s+[^,\d][^,]*,\s*(?:д\.?\s*)?\d+[а-яa-z]?(?:\s*\/\s*\d+[а-яa-z]?)?(?:\s*,\s*(?:стр\.?|строение)\s*\d+[а-яa-z]?)?$/iu;
  if (!valid.test(address)) { toast('Пример: ул. Кирова, д. 63/1, стр. 2'); input.focus(); return; }
  const button = document.querySelector('[data-act="addLoc"]'); button.disabled = true; toast('Ищем адрес…');
  try {
    const query = new URLSearchParams({q:address + ', Новосибирск, Россия', format:'jsonv2', limit:'1', 'accept-language':'ru'});
    const response = await fetch('https://nominatim.openstreetmap.org/search?' + query);
    if (!response.ok) throw Error('network'); const matches = await response.json();
    if (!matches.length) { toast('Адрес не найден. Проверьте название и номер дома'); return; }
    const point = {n:address, lat:Number(matches[0].lat), lng:Number(matches[0].lon), m:{}};
    if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng)) throw Error('coordinates');
    const recent = load('gd_recent_addresses', []); save('gd_recent_addresses', [point, ...(Array.isArray(recent) ? recent : []).filter(x => x.n.toLowerCase() !== address.toLowerCase())].slice(0,10));
    S.extra.push(point); S.loc = allLocs().length - 1; MAP.user = null; persist(); toast('Адрес добавлен'); back();
  } catch(e) { toast('Не удалось проверить адрес. Проверьте подключение'); } finally { button.disabled = false; }
}

// Геолокация: в Telegram — через LocationManager (Bot API 8.0+), иначе — через браузер.
function locateMe(done) {
  const ok = p => { MAP.user = p; const point = {n:'Моё местоположение', lat:p.lat, lng:p.lng, m:{}}; S.extra.push(point); S.loc = allLocs().length - 1; persist(); R.home(); toast('Местоположение определено'); done && done(); };
  const fail = () => toast('Не удалось определить местоположение. Разрешите доступ или выберите адрес вручную');
  const viaBrowser = () => navigator.geolocation
    ? navigator.geolocation.getCurrentPosition(p => ok({lat: p.coords.latitude, lng: p.coords.longitude}), fail, {enableHighAccuracy: true, timeout: 10000, maximumAge: 60000})
    : fail();
  const currentTg = window.Telegram && window.Telegram.WebApp; const lm = currentTg && currentTg.LocationManager;
  if (lm && currentTg.isVersionAtLeast && currentTg.isVersionAtLeast('8.0')) {
    const ask = () => lm.getLocation(loc => {
      if (loc) ok({lat: loc.latitude, lng: loc.longitude});
      else { fail(); try { lm.openSettings(); } catch (e) {} }
    });
    try { lm.isInited ? ask() : lm.init(ask); } catch (e) { viaBrowser(); }
  } else viaBrowser();
}

R.findstore = function () {
  $('#mapfail').hidden = leafletOK();
  if (leafletOK()) { initMap(); setTimeout(() => MAP.map && MAP.map.invalidateSize(), 60); }
  loadStores(true);
};


/* ================= Каталог: категории и сортировка ================= */
const CATS = [['Крупы и макароны','🌾'],['Молочные продукты','🥛'],['Яйца','🥚'],['Мясо','🥩'],['Рыба','🐟'],['Овощи и фрукты','🥕'],['Хлеб и выпечка','🍞'],['Бакалея','🧂'],['Соусы и консервы','🥫'],['Сладости','🍫'],['Снеки','🥨'],['Напитки','🥤'],['Заморозка','🧊']];
const SORTS = [['best', 'Выгоднее всего'], ['cheap', 'Дешевле'], ['dear', 'Дороже'], ['abc', 'По алфавиту']];
let CATSORT = 'best', STORECAT = '';
const catCount = k => P.filter(p => p.k === k).length;
function sortList(list, mode, sid) {
  const pr = p => sid ? p.p[sid] : best(p.id).price;
  const a = list.slice();
  if (mode === 'cheap') a.sort((x, y) => pr(x) - pr(y));
  else if (mode === 'dear') a.sort((x, y) => pr(y) - pr(x));
  else if (mode === 'abc') a.sort((x, y) => x.n.localeCompare(y.n, 'ru'));
  else if (!sid) a.sort((x, y) => best(x.id).score - best(y.id).score);
  return a;
}
const sortChips = () => SORTS.map(([id, n]) => `<button class="chip ${CATSORT === id ? 'on' : ''}" data-sort="${id}">${n}</button>`).join('');
R.catalog = function () {
  $('#catalogBody').innerHTML = `<div class="grid2">` + CATS.filter(c => catCount(c[0])).map(([k, e]) => `<button class="card cat" data-go="category" data-arg="${esc(k)}"><span class="ce">${e}</span><b>${k}</b><small>${catCount(k)} ${plural(catCount(k), 'товар', 'товара', 'товаров')}</small></button>`).join('') + `</div>`;
};
R.category = function (k) {
  k = k || arg.category; if (!k) return back();
  $('#catTitle').textContent = k;
  const list = sortList(P.filter(p => p.k === k), CATSORT);
  $('#categoryBody').innerHTML = `<div class="hrow chipsrow" style="margin-top:0">${sortChips()}</div><div class="hint" style="margin:2px 4px 8px">${list.length} ${plural(list.length, 'товар', 'товара', 'товаров')} · цены в лучших магазинах рядом</div><div class="grid2">${list.map(p => gridCard(p.id)).join('')}</div>`;
};

/* ================= Навигация ================= */
let stack = ['home'];
const arg = {};
function show(id) {
  $$('.screen').forEach(s => s.classList.toggle('on', s.id === id));
  if (R[id]) R[id](arg[id]);
  refreshBadges();
  window.scrollTo(0, 0);
  if (tg && tg.BackButton) { try { stack.length > 1 ? tg.BackButton.show() : tg.BackButton.hide(); } catch(e){} }
}
function go(id, a) { stack.push(id); arg[id] = a; show(id); }
function back() { if (stack.length > 1) { stack.pop(); show(stack[stack.length - 1]); } }
function goRoot(id) { stack = [id]; show(id); }
if (tg && tg.BackButton) { try { tg.BackButton.onClick(back); } catch(e){} }

function applyTheme() {
  const th = THEMES.find(t => t.id === S.theme) || THEMES[0];
  document.documentElement.dataset.theme = th.id; document.documentElement.dataset.tone = th.tone;
  const c = th.hdr;
  const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = c;
  if (tg) { try { tg.setHeaderColor(c); tg.setBackgroundColor(c); } catch(e){} }
}

/* ================= События ================= */
document.addEventListener('click', e => {
  if (e._handled) return;
  const t = e.target;
  if (t.closest('#toast.click.show')) { $('#toast').classList.remove('show'); go('cart'); return; }
  const ad = t.closest('[data-add]');
  if (ad) { e.stopPropagation(); add(+ad.dataset.add, ad.dataset.store); flashPlus(ad); if ($('#cart').classList.contains('on')) R.cart(); return; }
  const q = t.closest('[data-q]');
  if (q) {
    e.stopPropagation();
    const it = S.cart.find(c => c.pid === +q.dataset.id); if (!it) return;
    if (q.dataset.q === '+') it.qty++; else if (q.dataset.q === '-') it.qty--; else it.qty = 0;
    if (it.qty <= 0) S.cart = S.cart.filter(c => c !== it);
    persist(); refreshBadges(); R.cart(); return;
  }
  const th = t.closest('[data-set-theme]'); if (th) { S.theme = th.dataset.setTheme; persist(); applyTheme(); const on = stack[stack.length - 1]; R[on] && R[on](arg[on]); return; }
  const lc = t.closest('[data-loc]'); if (lc) { const recent = load('gd_recent_addresses', []), chosen = recent[+lc.dataset.loc]; if (!chosen) return; S.extra.push(chosen); S.loc = allLocs().length - 1; MAP.user = null; save('gd_recent_addresses', [chosen, ...recent.filter(x => x.n !== chosen.n)]); persist(); toast('Местоположение изменено'); back(); return; }
  const ds = t.closest('[data-dish]');
  if (ds) { const id = +ds.dataset.dish; const i = S.dishes.indexOf(id); if (i >= 0) S.dishes.splice(i, 1); else if (S.dishes.length < 3) S.dishes.push(id); else toast('В бесплатной версии — до 3 блюд'); R.menu(); return; }
  const ss = t.closest('[data-sel-store]'); if (ss) { const a = typeof arg.product === 'object' && arg.product ? arg.product : {pid: +arg.product}; arg.product = {pid: a.pid, sel: ss.dataset.selStore}; R.product(arg.product); return; }
  const so = t.closest('[data-sort]'); if (so) { CATSORT = so.dataset.sort; R.category(arg.category); return; }
  const ssi = t.closest('[data-ssort]'); if (ssi) { CATSORT = ssi.dataset.ssort; const q = $('#sq'); renderStoreGrid(arg.store, q ? q.value : ''); return; }
  const sct = t.closest('[data-scat]'); if (sct) { STORECAT = sct.dataset.scat; const q = $('#sq'); renderStoreGrid(arg.store, q ? q.value : ''); return; }
  const ch = t.closest('[data-chip]'); if (ch) { const i = $('#q'); i.value = ch.dataset.chip; renderResults(i.value); return; }
  if (t.closest('[data-back]')) { back(); return; }
  const ac = t.closest('[data-act]');
  if (ac) { act(ac.dataset.act, ac.dataset.arg); return; }
  const g = t.closest('[data-go]');
  if (g) {
    let a = g.dataset.arg;
    if (g.dataset.go === 'product') a = {pid: +a, sel: g.dataset.sel};
    else if (g.dataset.go === 'order') a = +a;
    go(g.dataset.go, a);
  }
});
document.addEventListener('input', e => {
  if (e.target.id === 'q') renderResults(e.target.value);
  else if (e.target.id === 'sq') renderStoreGrid(e.target.dataset.sid, e.target.value);
});

function act(name, a) {
  if (name === 'saveName') { const v = ($('#nameInp').value || '').trim(); S.name = v || null; persist(); toast('Сохранено'); back(); }
  else if (name === 'autoLoc') locateMe(() => go('findstore'));
  else if (name === 'myloc') locateMe(() => loadStores(true));
  else if (name === 'chain') { MAP.chain = a; MAP.sel = null; drawAll(true); }
  else if (name === 'focusStore') selectStore(a, false);
  else if (name === 'route') routeTo(a);
  else if (name === 'pickStore') pickStore(a);
  else if (name === 'addLoc') { addAddress(); }
  else if (name === 'repeat') { S.orders[+a].items.forEach(([pid, q]) => add(pid, null, q, true)); toast('Товары добавлены в корзину'); go('cart'); }
  else if (name === 'buildMenu') { if (S.dishes.length) go('menulist'); }
  else if (name === 'addMenu') {
    const map = {}; S.dishes.forEach(id => DISHES.find(d => d.id === id).i.forEach(([pid, q]) => map[pid] = (map[pid] || 0) + q));
    Object.entries(map).forEach(([pid, q]) => add(+pid, null, q, true)); toast('Продукты добавлены в корзину'); go('cart');
  }
  else if (name === 'onb') showOnboarding(true);
  else if (name === 'subscribe') toast('Подписка скоро появится 🙂');
  else if (name === 'productBtn') {
    const pid = +a, sel = arg.productSel, it = S.cart.find(c => c.pid === pid);
    if (it && it.store !== sel) { it.store = sel; persist(); toast('Магазин изменён'); }
    else add(pid, sel);
    R.product(arg.product && typeof arg.product === 'object' ? arg.product : {pid});
  }
  else if (name === 'clear') {
    if (!S.cart.length) return;
    const doIt = () => { S.cart = []; persist(); refreshBadges(); R.cart(); };
    if (tg && tg.showConfirm) tg.showConfirm('Очистить корзину?', ok => ok && doIt()); else if (confirm('Очистить корзину?')) doIt();
  }
  else if (name === 'brk') { const b = $('#brk'); b.style.display = b.style.display === 'none' ? 'block' : 'none'; }
  else if (name === 'order') {
    if (!S.cart.length) return;
    const d = new Date(), p2 = n => String(n).padStart(2, '0');
    S.orders.unshift({d: `${d.getDate()} ${MONTHS[d.getMonth()]}, ${p2(d.getHours())}:${p2(d.getMinutes())}`, items: S.cart.map(c => [c.pid, c.qty, c.store])});
    S.cart = []; persist(); refreshBadges(); goRoot('home'); go('history'); toast('Покупка сохранена в историю ✔');
  }
}


/* ================= Glow-up: свечение за пальцем, ползунок прокрутки ================= */
(function () {
  const SEL = '.stc,.pc,.big,.srow,.cmp,.dish,.oc,.findmini,.line,.locpill';
  document.addEventListener('pointerdown', e => {
    const el = e.target.closest && e.target.closest(SEL); if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', (e.clientX - r.left) + 'px'); el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    el.classList.add('glow', 'press');
    const off = () => { el.classList.remove('press'); };
    el.addEventListener('pointerup', off, {once: true}); el.addEventListener('pointercancel', off, {once: true}); el.addEventListener('pointerleave', off, {once: true});
  }, {passive: true});
  document.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    const el = e.target.closest && e.target.closest(SEL); if (!el) return;
    el.classList.add('glow');
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', (e.clientX - r.left) + 'px'); el.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, {passive: true});
  const bar = document.getElementById('sbar'); let hideT;
  function upd() {
    if (!bar) return;
    const de = document.documentElement, vh = window.innerHeight, h = Math.max(de.scrollHeight, document.body.scrollHeight);
    if (h <= vh + 4) { bar.classList.remove('on'); return; }
    const th = Math.max(36, vh * vh / h), top = (window.scrollY / (h - vh)) * (vh - th - 12) + 6;
    bar.style.height = th + 'px'; bar.style.transform = 'translateY(' + top + 'px)';
    bar.classList.add('on'); clearTimeout(hideT); hideT = setTimeout(() => bar.classList.remove('on'), 900);
  }
  window.addEventListener('scroll', upd, {passive: true}); window.addEventListener('resize', upd);
})();

/* ================= Знакомство (показывается один раз) ================= */
function showOnboarding(force) {
  if (!force && load('gd_onb', false)) return;
  const box = $('#onb'); if (!box) return;
  let i = 0; const sl = $$('.onbs'), dots = $$('.onbdots i'), next = $('#onbNext');
  const paint = () => { sl.forEach((e, k) => e.classList.toggle('on', k === i)); dots.forEach((e, k) => e.classList.toggle('on', k === i)); next.textContent = i === sl.length - 1 ? 'Начать' : 'Дальше'; $('#onbSkip').style.visibility = i === sl.length - 1 ? 'hidden' : 'visible'; };
  const close = () => { box.hidden = true; save('gd_onb', true); };
  next.onclick = () => { if (i < sl.length - 1) { i++; paint(); } else close(); };
  $('#onbSkip').onclick = close; paint(); box.hidden = false;
}
/* ================= Старт ================= */
applyTheme(); refreshBadges(); show('home');
setTimeout(() => { const s = $('#splash'); s.classList.add('hide'); setTimeout(() => { s.remove(); showOnboarding(); }, 500); }, 1300);
if ('serviceWorker' in navigator && location.protocol.startsWith('http') && location.hostname !== 'localhost') navigator.serviceWorker.register('sw.js').catch(() => {});



