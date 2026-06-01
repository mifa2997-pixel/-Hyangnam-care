// ═══════════════════════════════════════════════════════
//  ★ 카카오 지도 JavaScript 앱 키
// ═══════════════════════════════════════════════════════
const KAKAO_APP_KEY = '3f139e529041e40ffaecd1a21f29dc05';

let mainMap = null;
let mainOverlays = [];
let miniMap = null;
let miniOverlay = null;
let dirMap = null;
let dirMarkers = [];
let dirPolyline = null;

// ─── 데이터 ───────────────────────────────────────────
const CENTERS = [
  {id:'CTR001',name:'지역아동센터 LH행복꿈터에스라',addr:'경기 화성시 만세구 향남읍 상신하길로356번길 15 관리동 2층',phone:'031-8059-1116',slots:2,type:'지역아동센터',lat:37.120066,lng:126.913853},
  {id:'CTR002',name:'지역아동센터 온사랑',addr:'경기 화성시 만세구 향남읍 행정중앙1로 39 408동 104호',phone:'031-8050-8731',slots:1,type:'지역아동센터',lat:37.126262,lng:126.919774},
  {id:'CTR003',name:'다함께 돌봄센터 서봉마을',addr:'경기 화성시 만세구 향남읍 상신하길로273번길 57 주민공동생활시설',phone:'0507-1348-7379',slots:2,type:'다함께돌봄센터',lat:37.116999,lng:126.905238},
  {id:'CTR004',name:'다함께 돌봄센터 향남',addr:'경기도 화성시 만세구 향남읍 상신하길로 35 LH18단지 내 관리사무소',phone:'031-8058-0272',slots:0,type:'다함께돌봄센터',lat:37.097731,lng:126.896227},
  {id:'CTR005',name:'다함께 돌봄센터 향남2',addr:'경기도 화성시 만세구 향남읍 상신하길로273번길 17',phone:'031-354-7847',slots:0,type:'다함께돌봄센터',lat:37.112831,lng:126.907120},
  {id:'CTR006',name:'두근두근 작은 도서관',addr:'경기도 화성시 만세구 향남읍 발안로 113',phone:'031-352-1843',slots:0,type:'작은도서관',lat:37.131671,lng:126.923032},
  {id:'CTR007',name:'꿈나무 작은 도서관',addr:'경기도 화성시 향남읍 발안남로 66 관리동건물',phone:'031-366-0827',slots:0,type:'작은도서관',lat:37.129122,lng:126.902995},
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
  centerLat:37.119240, centerLng:126.909748,
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
//  KAKAO MAP API
// ═══════════════════════════════════════════════════════
function toKakaoLevel(zoom) {
  return Math.max(1, Math.min(14, Math.round(19 - zoom)));
}

function kakaoSdkUrl() {
  return 'https://dapi.kakao.com/v2/maps/sdk.js?appkey='
    + encodeURIComponent(KAKAO_APP_KEY) + '&autoload=false&libraries=services';
}

function loadKakaoSdk() {
  return new Promise((resolve, reject) => {
    if (location.protocol === 'file:') {
      reject(new Error('file-protocol'));
      return;
    }
    if (!KAKAO_APP_KEY || KAKAO_APP_KEY === 'YOUR_KAKAO_APP_KEY') {
      reject(new Error('Kakao app key missing'));
      return;
    }

    let settled = false;
    const fail = (msg) => {
      if (settled) return;
      settled = true;
      reject(new Error(msg));
    };
    const succeed = () => {
      if (settled) return;
      if (!window.kakao || !window.kakao.maps) {
        fail('Kakao SDK unavailable');
        return;
      }
      settled = true;
      kakao.maps.load(resolve);
    };

    const timeout = setTimeout(() => fail('Kakao SDK load failed'), 12000);

    const onReady = () => {
      clearTimeout(timeout);
      succeed();
    };
    const onFail = () => {
      clearTimeout(timeout);
      const el = document.querySelector('script[data-kakao-sdk]');
      if (el) el.dataset.kakaoFailed = '1';
      fail('Kakao SDK load failed');
    };

    if (window.kakao && window.kakao.maps) {
      clearTimeout(timeout);
      succeed();
      return;
    }

    const existing = document.querySelector('script[data-kakao-sdk]');
    if (existing) {
      if (existing.dataset.kakaoFailed === '1') {
        clearTimeout(timeout);
        fail('Kakao SDK load failed');
        return;
      }
      if (existing.readyState === 'complete' || existing.readyState === 'loaded') {
        if (window.kakao && window.kakao.maps) onReady();
        else onFail();
        return;
      }
      existing.addEventListener('load', onReady, { once: true });
      existing.addEventListener('error', onFail, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = kakaoSdkUrl();
    script.dataset.kakaoSdk = '1';
    script.onload = onReady;
    script.onerror = onFail;
    document.head.appendChild(script);
  });
}

function whenMapContainerReady() {
  return new Promise(resolve => {
    const tick = () => {
      const area = document.getElementById('map-area');
      if (area && area.clientWidth > 0 && area.clientHeight > 0) resolve();
      else requestAnimationFrame(tick);
    };
    tick();
  });
}

function mapLoadHint(err) {
  if (location.protocol === 'file:') {
    return 'HTML을 더블클릭(file://)으로 열면 지도 API가 차단됩니다. VS Code Live Server 등으로 http://127.0.0.1 주소로 실행해 주세요.';
  }
  const origin = location.origin || '(현재 주소)';
  const steps = [
    '① <a href="https://developers.kakao.com/console/app" target="_blank" rel="noopener">카카오 개발자 콘솔</a> → 앱 <b>향남지구 돌봄센터안내</b> → <b>제품 설정</b> → <b>지도</b>·<b>로컬</b>을 <b>ON</b> (OPEN_MAP_AND_LOCAL). 현재 이 서비스가 꺼져 있어 SDK가 403으로 거부됩니다.',
    '② <b>앱 키</b>의 <b>JavaScript 키</b>만 사용 (REST API 키 불가).',
    '③ <b>플랫폼 → Web</b> 도메인 등록: <b>' + origin + '</b>'
      + (origin.includes('vercel.app') ? '' : ' · 배포 시 <b>https://hyangnam-care.vercel.app</b> 도 추가'),
  ];
  if (err && err.message === 'Kakao SDK load failed') {
    steps.unshift('<b>진단:</b> 카카오 서버 응답 — <code>disabled OPEN_MAP_AND_LOCAL service</code>');
  }
  return steps.join('<br>');
}

function markerContent(c, isActive) {
  const mc = typeMC(c.type);
  const short = c.name.length > 12 ? c.name.substring(0, 11) + '…' : c.name;
  const el = document.createElement('div');
  el.className = 'map-marker' + (isActive ? ' active' : '');
  el.innerHTML = `<div class="marker-bubble ${mc}">${typeIcon(c.type)} ${short}</div>
    <div class="marker-tail ${mc}"></div>`;
  return el;
}

function initMainMap() {
  const container = document.getElementById('kakao-map');
  if (!container) throw new Error('Map container missing');
  const center = new kakao.maps.LatLng(STATE.centerLat, STATE.centerLng);
  mainMap = new kakao.maps.Map(container, {
    center,
    level: toKakaoLevel(STATE.zoom),
  });
  kakao.maps.event.addListener(mainMap, 'idle', () => {
    const c = mainMap.getCenter();
    STATE.centerLat = c.getLat();
    STATE.centerLng = c.getLng();
    STATE.zoom = Math.max(10, Math.min(18, 19 - mainMap.getLevel()));
  });
  renderMainMarkers();
  document.getElementById('map-loading').style.display = 'none';
  container.style.opacity = '1';
  requestAnimationFrame(() => mainMap.relayout());
}

function renderMainMarkers() {
  if (!mainMap) return;
  mainOverlays.forEach(o => o.setMap(null));
  mainOverlays = [];
  const visible = CENTERS.filter(c => STATE.filter === 'all' || c.type === STATE.filter);
  visible.forEach(c => {
    const idx = CENTERS.indexOf(c);
    const isActive = STATE.currentCenter && STATE.currentCenter.id === c.id;
    const content = markerContent(c, isActive);
    content.onclick = () => selectCenter(idx);
    const overlay = new kakao.maps.CustomOverlay({
      position: new kakao.maps.LatLng(c.lat, c.lng),
      content,
      yAnchor: 1,
      zIndex: isActive ? 10 : 3,
    });
    overlay.setMap(mainMap);
    mainOverlays.push(overlay);
  });
}

function panMainMap(lat, lng, zoom) {
  if (!mainMap) return;
  mainMap.setCenter(new kakao.maps.LatLng(lat, lng));
  if (zoom != null) mainMap.setLevel(toKakaoLevel(zoom));
}

function loadStaticMap(lat, lng) {
  if (!mainMap) return;
  const clat = lat ?? STATE.centerLat;
  const clng = lng ?? STATE.centerLng;
  panMainMap(clat, clng, STATE.zoom);
  renderMainMarkers();
}

function showMapFallback(err) {
  document.getElementById('map-loading').style.display = 'none';
  const area = document.getElementById('map-area');
  const mapEl = document.getElementById('kakao-map');
  if (mapEl) mapEl.style.display = 'none';
  const hint = mapLoadHint(err);
  let panel = document.getElementById('map-fallback-panel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'map-fallback-panel';
    panel.className = 'map-fallback-panel';
    area.appendChild(panel);
  }
  panel.innerHTML = `
    <div class="map-fallback-title">🗺️ 카카오 지도를 불러올 수 없습니다</div>
    <div class="map-fallback-hint">${hint}</div>
    ${location.protocol !== 'file:' ? `<p class="map-fallback-origin">등록할 Web 도메인: <code>${location.origin}</code></p>` : ''}
  `;
  if (err) console.warn('Kakao map init:', err);
}

function showMiniMap(lat, lng) {
  const container = document.getElementById('dp-minimap');
  if (!container || !window.kakao || !window.kakao.maps) return;
  const pos = new kakao.maps.LatLng(lat, lng);
  if (!miniMap) {
    miniMap = new kakao.maps.Map(container, { center: pos, level: 3, draggable: false, scrollwheel: false });
  } else {
    miniMap.setCenter(pos);
    miniMap.setLevel(3);
  }
  if (miniOverlay) miniOverlay.setMap(null);
  miniOverlay = new kakao.maps.Marker({ position: pos });
  miniOverlay.setMap(miniMap);
  setTimeout(() => miniMap.relayout(), 50);
}

function changeZoom(d) {
  STATE.zoom = Math.max(10, Math.min(18, STATE.zoom + d));
  if (!mainMap) return;
  mainMap.setLevel(toKakaoLevel(STATE.zoom));
  if (STATE.currentCenter) panMainMap(STATE.currentCenter.lat, STATE.currentCenter.lng);
}

function resetMap() {
  STATE.zoom = 14;
  STATE.currentCenter = null;
  closeDetail();
  STATE.centerLat = 37.119240;
  STATE.centerLng = 126.909748;
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
  showMiniMap(c.lat, c.lng);
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
  renderMainMarkers();
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
//  GEOCODING + 길찾기 (카카오)
// ═══════════════════════════════════════════════════════
function geocode(addr) {
  return new Promise(resolve => {
    if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) {
      resolve(null);
      return;
    }
    const geocoder = new kakao.maps.services.Geocoder();
    geocoder.addressSearch(addr, (result, status) => {
      if (status === kakao.maps.services.Status.OK && result[0]) {
        resolve({ lat: parseFloat(result[0].y), lng: parseFloat(result[0].x) });
      } else resolve(null);
    });
  });
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function kakaoRouteLink(startLabel, sLat, sLng, dest) {
  const from = encodeURIComponent(startLabel) + ',' + sLat + ',' + sLng;
  const to = encodeURIComponent(dest.name) + ',' + dest.lat + ',' + dest.lng;
  return 'https://map.kakao.com/link/from/' + from + '/to/' + to;
}

function clearDirMap() {
  dirMarkers.forEach(m => m.setMap(null));
  dirMarkers = [];
  if (dirPolyline) { dirPolyline.setMap(null); dirPolyline = null; }
}

function showRouteMap(sLat, sLng, dest) {
  const container = document.getElementById('dir-kakao-map');
  if (!container || !window.kakao || !window.kakao.maps) return;
  const start = new kakao.maps.LatLng(sLat, sLng);
  const end = new kakao.maps.LatLng(dest.lat, dest.lng);
  if (!dirMap) {
    dirMap = new kakao.maps.Map(container, { center: start, level: 5 });
  }
  clearDirMap();
  dirMarkers.push(new kakao.maps.Marker({ map: dirMap, position: start }));
  dirMarkers.push(new kakao.maps.Marker({ map: dirMap, position: end }));
  dirPolyline = new kakao.maps.Polyline({
    path: [start, end],
    strokeWeight: 4,
    strokeColor: '#4CAF50',
    strokeOpacity: 0.75,
    strokeStyle: 'shortdash',
  });
  dirPolyline.setMap(dirMap);
  const bounds = new kakao.maps.LatLngBounds();
  bounds.extend(start);
  bounds.extend(end);
  dirMap.setBounds(bounds, 40, 40, 40, 40);
  setTimeout(() => dirMap.relayout(), 80);
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

  if (!KAKAO_APP_KEY || KAKAO_APP_KEY === 'YOUR_KAKAO_APP_KEY') {
    re.innerHTML = `<div class="dir-result">
      <div style="font-weight:700;color:var(--primary-dark);margin-bottom:6px;">🗺️ API 키 설정 후 이용 가능해요</div>
      <div style="color:var(--text-muted);font-size:12px;line-height:1.7;">
        <b>출발:</b> ${startAddr}<br><b>목적지:</b> ${dest.name}
      </div></div>`;
    return;
  }

  const sc = await geocode(startAddr);
  if (!sc) { re.innerHTML = '<div class="dir-result" style="color:var(--red);">⚠️ 출발지 주소를 찾을 수 없습니다.</div>'; return; }

  const dist = haversineKm(sc.lat, sc.lng, dest.lat, dest.lng);
  const km = dist.toFixed(1);
  const min = Math.max(1, Math.ceil(dist / 40 * 60));
  const navUrl = kakaoRouteLink(startAddr, sc.lat, sc.lng, dest);

  showRouteMap(sc.lat, sc.lng, dest);
  mw.style.display = 'block';
  re.innerHTML = `<div class="dir-result">
    <div class="dir-stat">
      <div class="dir-stat-item">📏 직선 ${km} km</div>
      <div class="dir-stat-item">⏱️ 약 ${min}분 (예상)</div>
    </div>
    <div style="color:var(--text-muted);margin-bottom:10px;">${startAddr} → ${dest.name}</div>
    <a class="btn-kakao-nav" href="${navUrl}" target="_blank" rel="noopener noreferrer">🧭 카카오맵에서 길찾기</a>
    <div style="font-size:11px;color:var(--text-muted);margin-top:8px;">상세 경로·소요시간은 카카오맵에서 확인하세요.</div>
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
  if (mainMap) mainMap.relayout();
  if (miniMap) miniMap.relayout();
  if (dirMap) dirMap.relayout();
});

// ─── INIT ─────────────────────────────────────────────
buildSidebar();
buildList();
loadKakaoSdk()
  .then(() => whenMapContainerReady())
  .then(() => initMainMap())
  .catch(err => showMapFallback(err));
