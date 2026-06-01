// ═══════════════════════════════════════════════════════
//  ★ 네이버 클라우드 플랫폼 Client ID
// ═══════════════════════════════════════════════════════
const NAVER_CLIENT_ID = 'z7obv9rdd3';

const API = {
  staticMap:    'https://naveropenapi.apigw.ntruss.com/map-static/v2/raster',
  geocode:      'https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode',
  directions5:  'https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving',
  directions15: 'https://naveropenapi.apigw.ntruss.com/map-direction-15/v1/driving',
};

// ─── 데이터 ───────────────────────────────────────────
const CENTERS = [
  {id:'CTR001',name:'지역아동센터 LH행복꿈터에스라',addr:'경기 화성시 만세구 향남읍 상신하길로356번길 15 관리동 2층',phone:'031-8059-1116',slots:2,type:'지역아동센터',lat:37.0768,lng:126.9742},
  {id:'CTR002',name:'지역아동센터 온사랑',addr:'경기 화성시 만세구 향남읍 행정중앙1로 39 408동 104호',phone:'031-8050-8731',slots:1,type:'지역아동센터',lat:37.0783,lng:126.9768},
  {id:'CTR003',name:'다함께 돌봄센터 서봉마을',addr:'경기 화성시 만세구 향남읍 상신하길로273번길 57 주민공동생활시설',phone:'0507-1348-7379',slots:2,type:'다함께돌봄센터',lat:37.0755,lng:126.9728},
  {id:'CTR004',name:'다함께 돌봄센터 향남',addr:'경기도 화성시 만세구 향남읍 상신하길로 35 LH18단지 내 관리사무소',phone:'031-8058-0272',slots:0,type:'다함께돌봄센터',lat:37.0745,lng:126.9715},
  {id:'CTR005',name:'다함께 돌봄센터 향남2',addr:'경기도 화성시 만세구 향남읍 상신하길로273번길 17',phone:'031-354-7847',slots:0,type:'다함께돌봄센터',lat:37.0760,lng:126.9710},
  {id:'CTR006',name:'두근두근 작은 도서관',addr:'경기도 화성시 만세구 향남읍 발안로 113',phone:'031-352-1843',slots:0,type:'작은도서관',lat:37.0795,lng:126.9780},
  {id:'CTR007',name:'꿈나무 작은 도서관',addr:'경기도 화성시 향남읍 발안남로 66 관리동건물',phone:'031-366-0827',slots:0,type:'작은도서관',lat:37.0810,lng:126.9792},
];

// ─── 기관별 로그인 코드 & 비밀번호 ──────────────────────
// ※ 각 기관 관리자에게 개별 안내하세요
const CODES = {
  'CTR001': { pw: 'care@001', name: '지역아동센터 LH행복꿈터에스라' },
  'CTR002': { pw: 'care@002', name: '지역아동센터 온사랑' },
  'CTR003': { pw: 'dham@003', name: '다함께 돌봄센터 서봉마을' },
  'CTR004': { pw: 'dham@004', name: '다함께 돌봄센터 향남' },
  'CTR005': { pw: 'dham@005', name: '다함께 돌봄센터 향남2' },
  'CTR006': { pw: 'book@006', name: '두근두근 작은 도서관' },
  'CTR007': { pw: 'book@007', name: '꿈나무 작은 도서관' },
};

const STATE = {
  slots:{}, posts:{}, profiles:{},
  loggedIn:null, selectedFile:null,
  zoom:14, filter:'all',
  centerLat:37.0775, centerLng:126.9748,
  currentCenter:null,
};
CENTERS.forEach(c => { STATE.slots[c.id] = c.slots; });

// ─── 유틸 ───────────────────────────────────────────
function getSlots(id) { return STATE.slots[id] ?? 0; }
function getPosts(id) { return STATE.posts[id] || []; }

function typeMC(t) {
  if (t==='지역아동센터') return 'care';
  if (t==='다함께돌봄센터') return '';
  return 'lib';
}
function typeIcon(t) {
  if (t==='지역아동센터') return '🏡';
  if (t==='다함께돌봄센터') return '🧒';
  return '📚';
}
function typeBC(t) {
  if (t==='지역아동센터') return 'badge-care';
  if (t==='다함께돌봄센터') return 'badge-dh';
  return 'badge-lib';
}

function showToast(m) {
  const t = document.getElementById('toast');
  t.textContent = m;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2700);
}

// ─── 탭 ─────────────────────────────────────────────
function showTab(tab) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('page-' + tab).classList.add('active');
  document.getElementById('tab-' + tab).classList.add('active');
}

// ═══════════════════════════════════════════════════════
//  STATIC MAP API
// ═══════════════════════════════════════════════════════
function buildMapUrl(lat, lng, zoom, w, h) {
  if (NAVER_CLIENT_ID === 'YOUR_NAVER_CLIENT_ID') return '';
  const colorMap = { '지역아동센터':'26A69A', '다함께돌봄센터':'4CAF50', '작은도서관':'FFD600' };
  let url = API.staticMap
    + '?center=' + lng + ',' + lat
    + '&level=' + zoom
    + '&w=' + w + '&h=' + h
    + '&scale=2&lang=ko';
  const visible = CENTERS.filter(c => STATE.filter === 'all' || c.type === STATE.filter);
  visible.forEach(c => {
    url += '&markers=type:d|size:mid|pos:' + c.lng + '%20' + c.lat + '|color:' + colorMap[c.type];
  });
  url += '&X-NCP-APIGW-API-KEY-ID=' + NAVER_CLIENT_ID;
  return url;
}

function buildMiniMapUrl(lat, lng) {
  if (NAVER_CLIENT_ID === 'YOUR_NAVER_CLIENT_ID') return '';
  return API.staticMap
    + '?center=' + lng + ',' + lat
    + '&level=17&w=270&h=120&scale=2&lang=ko'
    + '&markers=type:d|size:mid|pos:' + lng + '%20' + lat + '|color:FF5722'
    + '&X-NCP-APIGW-API-KEY-ID=' + NAVER_CLIENT_ID;
}

function loadStaticMap(lat, lng) {
  const area = document.getElementById('map-area');
  const img  = document.getElementById('static-map-img');
  const w = area.clientWidth || 800;
  const h = area.clientHeight || 600;
  const clat = lat || STATE.centerLat;
  const clng = lng || STATE.centerLng;
  if (NAVER_CLIENT_ID === 'YOUR_NAVER_CLIENT_ID') { showMapFallback(); return; }
  document.getElementById('map-loading').style.display = 'flex';
  img.style.opacity = '0';
  img.src = buildMapUrl(clat, clng, STATE.zoom, w, h);
}

function onMapLoaded() {
  document.getElementById('map-loading').style.display = 'none';
  document.getElementById('static-map-img').style.opacity = '1';
  renderMarkerOverlay();
}

function onMapError() { showMapFallback(); }

function showMapFallback() {
  document.getElementById('map-loading').style.display = 'none';
  const area = document.getElementById('map-area');
  document.getElementById('static-map-img').style.display = 'none';
  if (!document.getElementById('svg-fb')) {
    const wrap = document.createElement('div');
    wrap.id = 'svg-fb';
    wrap.style.cssText = 'position:absolute;inset:0;overflow:hidden;';
    wrap.innerHTML = `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#e8f5e9"/>
      <defs><pattern id="g" width="44" height="44" patternUnits="userSpaceOnUse"><path d="M44 0L0 0 0 44" fill="none" stroke="#C8E6C9" stroke-width=".8"/></pattern></defs>
      <rect width="100%" height="100%" fill="url(#g)" opacity=".7"/>
      <line x1="15%" y1="5%" x2="85%" y2="95%" stroke="#A5D6A7" stroke-width="22" opacity=".55"/>
      <line x1="0" y1="40%" x2="100%" y2="58%" stroke="#A5D6A7" stroke-width="16" opacity=".5"/>
      <line x1="25%" y1="0" x2="75%" y2="100%" stroke="#C8E6C9" stroke-width="10" opacity=".4"/>
      <line x1="15%" y1="5%" x2="85%" y2="95%" stroke="white" stroke-width="3" stroke-dasharray="14,9" opacity=".9"/>
      <line x1="0" y1="40%" x2="100%" y2="58%" stroke="white" stroke-width="2" stroke-dasharray="10,7" opacity=".9"/>
      <text x="50%" y="52%" text-anchor="middle" fill="#81C784" font-size="16" font-family="'Gaegu',cursive" font-weight="700" opacity=".6">🌿 향남읍 🌿</text>
      <rect x="50%" y="5" width="320" height="44" rx="12" fill="white" fill-opacity=".92" transform="translate(-160,0)"/>
      <text x="50%" y="22" text-anchor="middle" fill="#388E3C" font-size="12" font-family="'Noto Sans KR',sans-serif" font-weight="700">🗺️ Naver Static Map API 연동 대기중</text>
      <text x="50%" y="38" text-anchor="middle" fill="#6B7C6B" font-size="10" font-family="'Noto Sans KR',sans-serif">NAVER_CLIENT_ID를 app.js에 입력하면 실제 지도가 표시됩니다</text>
    </svg>`;
    area.insertBefore(wrap, area.firstChild);
  }
  renderMarkerOverlay();
}

// ─── 마커 오버레이 ────────────────────────────────────
function latLngToPixel(lat, lng, w, h, cLat, cLng, zoom) {
  const scale = Math.pow(2, zoom), ts = 256;
  function mx(lo) { return (lo + 180) / 360 * ts * scale; }
  function my(la) { const s = Math.sin(la * Math.PI / 180); return (.5 - Math.log((1+s)/(1-s)) / (4*Math.PI)) * ts * scale; }
  return { x: w/2 + (mx(lng) - mx(cLng)), y: h/2 + (my(lat) - my(cLat)) };
}

function renderMarkerOverlay() {
  const layer = document.getElementById('marker-layer');
  const area  = document.getElementById('map-area');
  const w = area.clientWidth, h = area.clientHeight;
  const visible = CENTERS.filter(c => STATE.filter === 'all' || c.type === STATE.filter);
  layer.innerHTML = visible.map(c => {
    const ri = CENTERS.indexOf(c);
    const p  = latLngToPixel(c.lat, c.lng, w, h, STATE.centerLat, STATE.centerLng, STATE.zoom);
    const mc = typeMC(c.type);
    const isAct = STATE.currentCenter && STATE.currentCenter.id === c.id;
    const short = c.name.length > 12 ? c.name.substring(0, 11) + '…' : c.name;
    return `<div class="map-marker${isAct?' active':''}" style="left:${p.x}px;top:${p.y}px;" onclick="selectCenter(${ri})">
      <div class="marker-bubble ${mc}">${typeIcon(c.type)} ${short}</div>
      <div class="marker-tail ${mc}"></div>
    </div>`;
  }).join('');
}

function changeZoom(d) {
  STATE.zoom = Math.max(10, Math.min(18, STATE.zoom + d));
  if (STATE.currentCenter) loadStaticMap(STATE.currentCenter.lat, STATE.currentCenter.lng);
  else loadStaticMap();
}
function resetMap() {
  STATE.zoom = 14; STATE.currentCenter = null; closeDetail();
  STATE.centerLat = 37.0775; STATE.centerLng = 126.9748;
  loadStaticMap();
}

// ─── 기관 선택 ───────────────────────────────────────
function selectCenter(idx) {
  const c = CENTERS[idx];
  STATE.currentCenter = c; STATE.centerLat = c.lat; STATE.centerLng = c.lng; STATE.zoom = 16;
  document.querySelectorAll('.center-card').forEach(el => el.classList.toggle('selected', el.dataset.idx == idx));
  loadStaticMap(c.lat, c.lng);
  const slots = getSlots(c.id);
  document.getElementById('dp-name').textContent = c.name;
  document.getElementById('dp-badge').textContent = c.type;
  document.getElementById('dp-addr').textContent  = c.addr;
  document.getElementById('dp-phone').textContent = c.phone;
  const box = document.getElementById('dp-slot-box');
  document.getElementById('dp-slot-num').textContent    = slots;
  document.getElementById('dp-slot-status').textContent = slots > 0 ? '신청 가능' : '자리 없음';
  box.className = 'slot-box ' + (slots > 0 ? 'avail' : 'full');
  const mu = buildMiniMapUrl(c.lat, c.lng);
  const mi = document.getElementById('dp-minimap-img');
  if (mu) { mi.src = mu; mi.style.display = 'block'; } else { mi.style.display = 'none'; }
  const promos = getPosts(c.id);
  document.getElementById('dp-promos').innerHTML = promos.length === 0
    ? '<div class="promo-empty">아직 등록된 공지가 없어요 🌱</div>'
    : promos.slice(0,3).map(p => `<div class="promo-item">
        <div class="promo-item-title">${p.type} ${p.title}</div>
        <div class="promo-item-meta">${p.date}</div>
        <div class="promo-item-desc">${p.content.substring(0,55)}${p.content.length>55?'…':''}</div>
      </div>`).join('');
  document.getElementById('detail-panel').classList.add('open');
}

function closeDetail() {
  document.getElementById('detail-panel').classList.remove('open');
  document.querySelectorAll('.center-card').forEach(el => el.classList.remove('selected'));
  STATE.currentCenter = null;
}
function callCenter() {
  if (!STATE.currentCenter) return;
  document.getElementById('call-modal-name').textContent  = STATE.currentCenter.name;
  document.getElementById('call-modal-phone').textContent = STATE.currentCenter.phone;
  document.getElementById('call-modal-tel').href = 'tel:' + STATE.currentCenter.phone.replace(/[^0-9]/g, '');
  document.getElementById('call-modal').classList.add('open');
}
function closeCallModal() {
  document.getElementById('call-modal').classList.remove('open');
}

// ─── 필터 ────────────────────────────────────────────
function setFilter(f, btn) {
  STATE.filter = f;
  document.querySelectorAll('.sidebar-filter .filter-btn').forEach(b => b.classList.remove('on'));
  btn.classList.add('on'); buildSidebar(); loadStaticMap();
  const n = f === 'all' ? CENTERS.length : CENTERS.filter(c => c.type === f).length;
  document.getElementById('count-badge').textContent = '(' + n + '개)';
}

// ═══════════════════════════════════════════════════════
//  GEOCODING + DIRECTIONS API
// ═══════════════════════════════════════════════════════
async function geocode(addr) {
  if (NAVER_CLIENT_ID === 'YOUR_NAVER_CLIENT_ID') return null;
  try {
    const res = await fetch(API.geocode + '?query=' + encodeURIComponent(addr),
      { headers: { 'X-NCP-APIGW-API-KEY-ID': NAVER_CLIENT_ID } });
    const d = await res.json();
    if (d.addresses && d.addresses.length > 0)
      return { lat: parseFloat(d.addresses[0].y), lng: parseFloat(d.addresses[0].x) };
  } catch(e) { console.warn('Geocode:', e); }
  return null;
}

async function directions(sLat, sLng, gLat, gLng, longDist) {
  if (NAVER_CLIENT_ID === 'YOUR_NAVER_CLIENT_ID') return null;
  const ep = longDist ? API.directions15 : API.directions5;
  try {
    const url = ep + '?start=' + sLng + ',' + sLat + '&goal=' + gLng + ',' + gLat + '&option=traoptimal';
    const res = await fetch(url, { headers: { 'X-NCP-APIGW-API-KEY-ID': NAVER_CLIENT_ID } });
    return await res.json();
  } catch(e) { console.warn('Directions:', e); return null; }
}

function openDirections() {
  if (!STATE.currentCenter) return;
  document.getElementById('dir-end').value = STATE.currentCenter.name + ' (' + STATE.currentCenter.addr + ')';
  document.getElementById('dir-start').value = '';
  document.getElementById('dir-map-wrap').style.display = 'none';
  document.getElementById('dir-result').style.display = 'none';
  document.getElementById('dir-modal').classList.add('open');
}
function closeDirections() { document.getElementById('dir-modal').classList.remove('open'); }

async function findRoute() {
  const startAddr = document.getElementById('dir-start').value.trim();
  const dest = STATE.currentCenter;
  if (!startAddr || !dest) { showToast('⚠️ 출발지를 입력해 주세요'); return; }
  const re = document.getElementById('dir-result');
  const mw = document.getElementById('dir-map-wrap');
  re.innerHTML = '<div class="dir-loading">🌿 경로를 찾는 중이에요...</div>';
  re.style.display = 'block'; mw.style.display = 'none';

  if (NAVER_CLIENT_ID === 'YOUR_NAVER_CLIENT_ID') {
    re.innerHTML = `<div class="dir-result">
      <div style="font-weight:700;color:var(--primary-dark);margin-bottom:6px;">🗺️ API 키 설정 후 이용 가능해요</div>
      <div style="color:var(--text-muted);font-size:12px;line-height:1.7;">
        <b>출발:</b> ${startAddr}<br><b>목적지:</b> ${dest.name}
      </div></div>`;
    return;
  }

  const sc = await geocode(startAddr);
  if (!sc) { re.innerHTML = '<div class="dir-result" style="color:var(--red);">⚠️ 출발지 주소를 찾을 수 없습니다.</div>'; return; }

  const R = 6371;
  const dLat = (dest.lat - sc.lat) * Math.PI / 180;
  const dLng = (dest.lng - sc.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(sc.lat*Math.PI/180) * Math.cos(dest.lat*Math.PI/180) * Math.sin(dLng/2)**2;
  const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const longDist = dist > 15;

  const rd = await directions(sc.lat, sc.lng, dest.lat, dest.lng, longDist);
  if (!rd || rd.code !== 0) {
    re.innerHTML = '<div class="dir-result" style="color:var(--red);">⚠️ 경로를 찾을 수 없습니다.</div>'; return;
  }
  const route = rd.route?.traoptimal?.[0];
  if (!route) { re.innerHTML = '<div class="dir-result" style="color:var(--red);">⚠️ 경로 데이터가 없습니다.</div>'; return; }

  const km = (route.summary.distance / 1000).toFixed(1);
  const min = Math.ceil(route.summary.duration / 60000);
  const toll = route.summary.tollFare > 0 ? route.summary.tollFare.toLocaleString() + '원' : '없음';
  const fuel = route.summary.fuelPrice > 0 ? route.summary.fuelPrice.toLocaleString() + '원' : '';

  const path = route.path;
  const step = Math.max(1, Math.floor(path.length / 25));
  const sampled = path.filter((_, i) => i % step === 0);
  const pathStr = sampled.map(p => p[0] + ',' + p[1]).join('|');
  const midLat = (sc.lat + dest.lat) / 2, midLng = (sc.lng + dest.lng) / 2;
  const routeZoom = dist < 2 ? 15 : dist < 5 ? 14 : dist < 15 ? 13 : 11;

  const routeMapUrl = API.staticMap
    + '?center=' + midLng + ',' + midLat
    + '&level=' + routeZoom + '&w=440&h=220&scale=2&lang=ko'
    + '&path=color:0x4CAF50CC|width:4|' + pathStr
    + '&markers=type:d|size:mid|pos:' + sc.lng + '%20' + sc.lat + '|color:FFD600'
    + '&markers=type:d|size:mid|pos:' + dest.lng + '%20' + dest.lat + '|color:FF5722'
    + '&X-NCP-APIGW-API-KEY-ID=' + NAVER_CLIENT_ID;

  document.getElementById('dir-map-img').src = routeMapUrl;
  mw.style.display = 'block';
  re.innerHTML = `<div class="dir-result">
    <div class="dir-stat">
      <div class="dir-stat-item">🚗 ${km} km</div>
      <div class="dir-stat-item">⏱️ 약 ${min}분</div>
      <div class="dir-stat-item">💰 ${toll}</div>
      ${fuel ? '<div class="dir-stat-item">⛽ ' + fuel + '</div>' : ''}
    </div>
    <div style="color:var(--text-muted);">${startAddr} → ${dest.name}</div>
  </div>`;
}

// ═══════════════════════════════════════════════════════
//  UI BUILD
// ═══════════════════════════════════════════════════════
function buildSidebar() {
  const f = STATE.filter;
  const list = CENTERS.filter(c => f === 'all' || c.type === f);
  document.getElementById('sidebar-list').innerHTML = list.map(c => {
    const i = CENTERS.indexOf(c), slots = getSlots(c.id);
    return `<div class="center-card" data-idx="${i}" onclick="selectCenter(${i})">
      <div class="card-top">
        <div class="card-name">${typeIcon(c.type)} ${c.name}</div>
        <span class="badge ${typeBC(c.type)}">${c.type}</span>
      </div>
      <div class="card-addr">📍 ${c.addr}</div>
      <div class="card-slots">
        <span style="font-size:10px;color:var(--text-muted);">잔여 자리</span>
        <span class="slot-value ${slots>0?'slot-ok':'slot-none'}">${slots>0?slots+'자리 가능':'자리 없음'}</span>
      </div>
    </div>`;
  }).join('');
  document.getElementById('count-badge').textContent = '(' + list.length + '개)';
}

let LF = 'all';
function setListFilter(f, btn) {
  LF = f;
  document.querySelectorAll('.list-filter .filter-btn').forEach(b => b.classList.remove('on'));
  btn.classList.add('on'); buildList();
}
function buildList() {
  const IC = { '지역아동센터':'icon-care', '다함께돌봄센터':'icon-dh', '작은도서관':'icon-lib' };
  const list = CENTERS.filter(c => LF === 'all' || c.type === LF);
  document.getElementById('list-grid').innerHTML = list.map(c => {
    const slots = getSlots(c.id);
    const prof  = STATE.profiles[c.id];
    const thumb = prof && prof.imgData
      ? `<div class="list-card-thumb" style="background-image:url('${prof.imgData}')"></div>`
      : `<div class="list-card-thumb no-img">${typeIcon(c.type)}</div>`;
    return `<div class="list-card" onclick="openProfile('${c.id}')">
      ${thumb}
      <div class="list-card-content">
        <div class="list-card-top">
          <div class="list-card-icon ${IC[c.type]||'icon-dh'}">${typeIcon(c.type)}</div>
          <div>
            <div class="list-card-name">${c.name}</div>
            <span class="badge ${typeBC(c.type)}" style="margin-top:3px;display:inline-block;">${c.type}</span>
          </div>
        </div>
        <div class="list-card-addr">📍 ${c.addr}</div>
        <div class="list-card-footer">
          <span class="slot-chip ${slots>0?'slot-chip-ok':'slot-chip-none'}">${slots>0?'✅':'❌'} 잔여 ${slots}자리</span>
          <span class="list-card-hint">👆 눌러서 자세히 보기</span>
        </div>
      </div>
    </div>`;
  }).join('');
}

// ─── 기관 소개 팝업 ────────────────────────────────────
function openProfile(id) {
  const c    = CENTERS.find(x => x.id === id);
  const prof = STATE.profiles[id] || {};
  const slots = getSlots(id);

  document.getElementById('prof-name').textContent  = c.name;
  document.getElementById('prof-badge').textContent = c.type;
  document.getElementById('prof-addr').textContent  = c.addr;
  document.getElementById('prof-phone').textContent = c.phone;
  document.getElementById('prof-desc').textContent  =
    prof.desc || '아직 등록된 기관 소개가 없습니다. 기관 관리자가 소개를 등록하면 여기에 표시됩니다.';

  const slotEl = document.getElementById('prof-slot');
  slotEl.textContent  = slots > 0 ? '✅ 잔여 ' + slots + '자리' : '❌ 자리 없음';
  slotEl.className    = 'prof-slot-chip ' + (slots > 0 ? 'avail' : 'full');

  const imgWrap = document.getElementById('prof-img-wrap');
  if (prof.imgData) {
    imgWrap.innerHTML = `<img src="${prof.imgData}" alt="기관 사진" class="prof-img"/>`;
    imgWrap.style.display = 'block';
  } else {
    imgWrap.style.display = 'none';
  }

  // 전화 버튼
  document.getElementById('prof-call-btn').href =
    'tel:' + c.phone.replace(/[^0-9]/g, '');
  document.getElementById('prof-call-btn2').onclick = () => {
    closeProfile();
    STATE.currentCenter = c;
    callCenter();
  };

  document.getElementById('prof-modal').classList.add('open');
}
function closeProfile() {
  document.getElementById('prof-modal').classList.remove('open');
}

// ─── AUTH & ADMIN ─────────────────────────────────────
function doLogin() {
  const code = document.getElementById('login-code').value.trim().toUpperCase();
  const pw   = document.getElementById('login-pw').value;
  const err  = document.getElementById('login-err');
  if (!CODES[code] || CODES[code].pw !== pw) { err.style.display = 'block'; return; }
  err.style.display = 'none';
  STATE.loggedIn = code;
  const c = CENTERS.find(x => x.id === code);
  document.getElementById('admin-center-name').textContent = c ? c.name : code;
  document.getElementById('admin-center-code').textContent = '기관코드: ' + code + '  |  ' + (c ? c.type : '');
  document.getElementById('login-section').style.display = 'none';
  document.getElementById('admin-section').style.display = 'block';
  renderSlotPanel();
  renderAdminPosts();
  renderProfileAdmin();
  showToast('🌿 ' + (c ? c.name : code) + ' 로그인 성공!');
}

function doLogout() {
  STATE.loggedIn = null; STATE.selectedFile = null;
  document.getElementById('login-section').style.display = 'block';
  document.getElementById('admin-section').style.display = 'none';
  document.getElementById('login-code').value = '';
  document.getElementById('login-pw').value = '';
}

/* ── 잔여 자리 패널 렌더 ── */
function renderSlotPanel() {
  const id  = STATE.loggedIn;
  const cur = getSlots(id);
  document.getElementById('slot-display').textContent = cur;
  document.getElementById('slot-display').className   = 'slot-big-num ' + (cur > 0 ? 'avail' : 'full');
  document.getElementById('slot-status-text').textContent = cur > 0 ? '✅ 신청 가능' : '❌ 자리 없음';
  document.getElementById('slot-status-text').className   = 'slot-status-lbl ' + (cur > 0 ? 'avail' : 'full');
  document.getElementById('slot-input').value = cur;
}

/* ─ +/- 버튼 ─ */
function adjustSlot(delta) {
  const inp = document.getElementById('slot-input');
  const v = Math.max(0, Math.min(99, (parseInt(inp.value) || 0) + delta));
  inp.value = v;
  // 미리보기 갱신
  document.getElementById('slot-preview').textContent = v + '자리';
  document.getElementById('slot-preview').className = 'slot-preview ' + (v > 0 ? 'avail' : 'full');
}

/* ─ 직접 입력 시 미리보기 ─ */
function onSlotInput() {
  const v = Math.max(0, Math.min(99, parseInt(document.getElementById('slot-input').value) || 0));
  document.getElementById('slot-preview').textContent = v + '자리';
  document.getElementById('slot-preview').className = 'slot-preview ' + (v > 0 ? 'avail' : 'full');
}

/* ─ 저장 ─ */
function saveSlot() {
  if (!STATE.loggedIn) return;
  const val = Math.max(0, Math.min(99, parseInt(document.getElementById('slot-input').value) || 0));
  STATE.slots[STATE.loggedIn] = val;
  renderSlotPanel();
  buildSidebar();
  buildList();
  // 지도 상세 패널이 열려 있으면 즉시 반영
  if (STATE.currentCenter && STATE.currentCenter.id === STATE.loggedIn) {
    document.getElementById('dp-slot-num').textContent    = val;
    document.getElementById('dp-slot-status').textContent = val > 0 ? '신청 가능' : '자리 없음';
    document.getElementById('dp-slot-box').className = 'slot-box ' + (val > 0 ? 'avail' : 'full');
  }
  showToast('✅ 잔여 자리 ' + val + '자리로 저장했습니다');
}
function handleFile(input) {
  if (input.files[0]) {
    STATE.selectedFile = input.files[0].name;
    document.getElementById('file-label').textContent = '📎 ' + input.files[0].name;
  }
}
function submitPost() {
  if (!STATE.loggedIn) return;
  const title   = document.getElementById('post-title').value.trim();
  const type    = document.getElementById('post-type').value;
  const content = document.getElementById('post-content').value.trim();
  if (!title)   { showToast('⚠️ 제목을 입력해 주세요'); return; }
  if (!content) { showToast('⚠️ 내용을 입력해 주세요'); return; }
  const now = new Date();
  const ds = now.getFullYear() + '.' + String(now.getMonth()+1).padStart(2,'0') + '.' + String(now.getDate()).padStart(2,'0');
  if (!STATE.posts[STATE.loggedIn]) STATE.posts[STATE.loggedIn] = [];
  STATE.posts[STATE.loggedIn].unshift({ id: Date.now(), title, type, content, file: STATE.selectedFile, date: ds });
  document.getElementById('post-title').value = '';
  document.getElementById('post-content').value = '';
  document.getElementById('file-label').textContent = '클릭하여 파일 첨부';
  document.getElementById('file-input').value = '';
  STATE.selectedFile = null;
  renderAdminPosts(); showToast('✅ 공지가 등록되었습니다');
}
function deletePost(id) {
  if (!STATE.loggedIn) return;
  STATE.posts[STATE.loggedIn] = (STATE.posts[STATE.loggedIn]||[]).filter(p => p.id !== id);
  renderAdminPosts(); showToast('🗑️ 삭제되었습니다');
}
function renderAdminPosts() {
  const posts = getPosts(STATE.loggedIn);
  document.getElementById('admin-posts').innerHTML = posts.length === 0
    ? '<div class="no-posts">🌱 등록된 공지가 없습니다</div>'
    : posts.map(p => `<div class="post-item">
        <div class="post-item-icon">${p.type.split(' ')[0]}</div>
        <div class="post-item-body">
          <div class="post-item-title">${p.title}</div>
          <div class="post-item-meta">${p.type} · ${p.date}${p.file?' · 📎 '+p.file:''}</div>
          <div class="post-item-desc">${p.content}</div>
        </div>
        <button class="post-delete" onclick="deletePost(${p.id})">🗑️</button>
      </div>`).join('');
}

// ─── 기관 소개 저장/로드 ──────────────────────────────
function renderProfileAdmin() {
  const id   = STATE.loggedIn;
  const prof = STATE.profiles[id] || {};
  document.getElementById('prof-desc-input').value = prof.desc || '';
  const preview = document.getElementById('prof-img-preview');
  if (prof.imgData) {
    preview.innerHTML = `<img src="${prof.imgData}" alt="미리보기" style="max-width:100%;border-radius:10px;"/>`;
  } else {
    preview.innerHTML = '<span style="color:var(--text-muted);font-size:12px;">등록된 사진이 없습니다</span>';
  }
}

function handleProfileImg(input) {
  if (!input.files[0]) return;
  const reader = new FileReader();
  reader.onload = e => {
    if (!STATE.profiles[STATE.loggedIn]) STATE.profiles[STATE.loggedIn] = {};
    STATE.profiles[STATE.loggedIn]._pendingImg = e.target.result;
    document.getElementById('prof-img-preview').innerHTML =
      `<img src="${e.target.result}" alt="미리보기" style="max-width:100%;border-radius:10px;"/>`;
  };
  reader.readAsDataURL(input.files[0]);
}

function saveProfile() {
  const id   = STATE.loggedIn;
  const desc = document.getElementById('prof-desc-input').value.trim();
  if (!STATE.profiles[id]) STATE.profiles[id] = {};
  STATE.profiles[id].desc = desc;
  if (STATE.profiles[id]._pendingImg) {
    STATE.profiles[id].imgData = STATE.profiles[id]._pendingImg;
    delete STATE.profiles[id]._pendingImg;
  }
  buildList();
  showToast('✅ 기관 소개가 저장되었습니다');
}

function deleteProfileImg() {
  const id = STATE.loggedIn;
  if (STATE.profiles[id]) {
    delete STATE.profiles[id].imgData;
    delete STATE.profiles[id]._pendingImg;
  }
  document.getElementById('prof-img-input').value = '';
  renderProfileAdmin();
  buildList();
  showToast('🗑️ 사진이 삭제되었습니다');
}

window.addEventListener('resize', () => {
  if (document.getElementById('page-map').classList.contains('active')) renderMarkerOverlay();
});

// ─── INIT ─────────────────────────────────────────────
buildSidebar();
buildList();
loadStaticMap();
