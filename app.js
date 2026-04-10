// ── Landmarks ──────────────────────────────────────────────────────────────
const LANDMARKS = [
  // Iconic / Touristy
  { id: 'ggbridge_south',    name: 'Golden Gate Bridge (South)',      lat: 37.8077,  lng: -122.4752 },
  { id: 'alcatraz_pier',     name: 'Pier 33 — Alcatraz Ferry',        lat: 37.8076,  lng: -122.4133 },
  { id: 'fishermans_wharf',  name: "Fisherman's Wharf",               lat: 37.8080,  lng: -122.4177 },
  { id: 'lombard_st',        name: 'Lombard Street (Crooked Block)',   lat: 37.8021,  lng: -122.4187 },
  { id: 'coit_tower',        name: 'Coit Tower',                      lat: 37.8025,  lng: -122.4058 },
  // Downtown / Civic
  { id: 'city_hall',         name: 'SF City Hall',                    lat: 37.7793,  lng: -122.4193 },
  { id: 'union_square',      name: 'Union Square',                    lat: 37.7880,  lng: -122.4075 },
  { id: 'ferry_building',    name: 'Ferry Building',                  lat: 37.7956,  lng: -122.3935 },
  { id: 'salesforce_tower',  name: 'Salesforce Tower / Transbay',     lat: 37.7897,  lng: -122.3969 },
  { id: 'oracle_park',       name: 'Oracle Park (Giants Stadium)',     lat: 37.7786,  lng: -122.3893 },
  // Neighborhoods
  { id: 'castro',            name: 'Castro & Market',                 lat: 37.7609,  lng: -122.4350 },
  { id: 'mission_dolores',   name: 'Mission Dolores Park',            lat: 37.7596,  lng: -122.4269 },
  { id: 'haight_ashbury',    name: 'Haight-Ashbury Intersection',     lat: 37.7692,  lng: -122.4469 },
  { id: 'chinatown_gate',    name: 'Chinatown Dragon Gate',           lat: 37.7908,  lng: -122.4058 },
  { id: 'north_beach',       name: 'Washington Square (North Beach)', lat: 37.8003,  lng: -122.4107 },
  { id: 'japantown',         name: 'Japan Center',                    lat: 37.7853,  lng: -122.4305 },
  { id: 'potrero_hill',      name: 'Potrero Hill Summit',             lat: 37.7607,  lng: -122.4033 },
  { id: 'noe_valley',        name: 'Noe Valley (24th & Sanchez)',     lat: 37.7516,  lng: -122.4327 },
  // Parks / Nature
  { id: 'gg_park_deYoung',   name: 'de Young Museum (GG Park)',       lat: 37.7714,  lng: -122.4686 },
  { id: 'sutro_baths',       name: "Sutro Baths / Land's End",        lat: 37.7800,  lng: -122.5130 },
  { id: 'twin_peaks',        name: 'Twin Peaks Summit',               lat: 37.7519,  lng: -122.4477 },
  { id: 'bernal_heights',    name: 'Bernal Heights Park',             lat: 37.7433,  lng: -122.4155 },
  { id: 'ocean_beach_south', name: 'Ocean Beach (Sloat Blvd)',        lat: 37.7317,  lng: -122.5061 },
  { id: 'sf_zoo',            name: 'San Francisco Zoo',               lat: 37.7325,  lng: -122.5039 },
  // BART / Transit Hubs
  { id: 'civic_center_bart', name: 'Civic Center BART / UN Plaza',    lat: 37.7796,  lng: -122.4148 },
  { id: '24th_mission_bart', name: '24th St Mission BART',            lat: 37.7522,  lng: -122.4181 },
  { id: 'balboa_park_bart',  name: 'Balboa Park BART',                lat: 37.7218,  lng: -122.4476 },
  { id: 'embarcadero_bart',  name: 'Embarcadero BART',                lat: 37.7929,  lng: -122.3969 },
  { id: 'glen_park_bart',    name: 'Glen Park BART',                  lat: 37.7329,  lng: -122.4338 },
  { id: 'van_ness_muni',     name: 'Van Ness Muni Station',           lat: 37.7749,  lng: -122.4194 },
];

// ── State ───────────────────────────────────────────────────────────────────
const state = {
  mode: 'driving',
  apiKey: '',
  phase: 'idle',            // idle | drawing | loading | results
  originLandmark: null,
  destLandmark: null,
  userWaypoints: [],        // [[lat, lng], ...]
  userMarkers: [],          // Leaflet marker instances
  userPolyline: null,
  optimalPolyline: null,
  originMarker: null,
  destMarker: null,
};

// ── Map ─────────────────────────────────────────────────────────────────────
let map;

function initMap() {
  map = L.map('map', { zoomControl: true }).setView([37.7749, -122.4194], 13);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20,
  }).addTo(map);

  map.on('click', handleMapClick);
}

// ── Landmark Markers ────────────────────────────────────────────────────────
function createEndpointMarker(landmark, type) {
  const label = type === 'origin' ? 'A' : 'B';
  const cls   = type === 'origin' ? 'marker-pin-a' : 'marker-pin-b';
  const icon = L.divIcon({
    html: `<div class="marker-pin ${cls}">${label}</div>`,
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
  return L.marker([landmark.lat, landmark.lng], { icon, interactive: false });
}

function createWaypointMarker(latlng) {
  const icon = L.divIcon({
    html: '<div class="marker-dot"></div>',
    className: '',
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
  return L.marker(latlng, { icon, interactive: false });
}

// ── Challenge Setup ─────────────────────────────────────────────────────────
function pickChallenge() {
  const MIN_KM = 1.5;
  const MAX_KM = 10.0;
  let origin, dest;
  let attempts = 0;

  do {
    const idx1 = Math.floor(Math.random() * LANDMARKS.length);
    let idx2;
    do { idx2 = Math.floor(Math.random() * LANDMARKS.length); } while (idx2 === idx1);
    origin = LANDMARKS[idx1];
    dest   = LANDMARKS[idx2];
    const dist = turf.distance(
      turf.point([origin.lng, origin.lat]),
      turf.point([dest.lng, dest.lat]),
      { units: 'kilometers' }
    );
    if (dist >= MIN_KM && dist <= MAX_KM) return { origin, dest };
    attempts++;
  } while (attempts < 200);

  // Fallback — just pick any two distinct landmarks
  return { origin: LANDMARKS[0], dest: LANDMARKS[5] };
}

function clearMapObjects() {
  if (state.originMarker)   { state.originMarker.remove();   state.originMarker   = null; }
  if (state.destMarker)     { state.destMarker.remove();     state.destMarker     = null; }
  if (state.userPolyline)   { state.userPolyline.remove();   state.userPolyline   = null; }
  if (state.optimalPolyline){ state.optimalPolyline.remove();state.optimalPolyline= null; }
  state.userMarkers.forEach(m => m.remove());
  state.userMarkers = [];
  state.userWaypoints = [];
}

function startChallenge() {
  clearMapObjects();

  const { origin, dest } = pickChallenge();
  state.originLandmark = origin;
  state.destLandmark   = dest;

  state.originMarker = createEndpointMarker(origin, 'origin').addTo(map);
  state.destMarker   = createEndpointMarker(dest, 'dest').addTo(map);

  // Fit map to both markers
  const bounds = L.latLngBounds(
    [origin.lat, origin.lng],
    [dest.lat,   dest.lng]
  );
  map.fitBounds(bounds, { padding: [70, 70] });

  // Update UI
  document.getElementById('landmark-from-name').textContent = origin.name;
  document.getElementById('landmark-to-name').textContent   = dest.name;
  document.getElementById('challenge-info').classList.remove('hidden');

  const hintText = state.mode === 'driving'
    ? 'Click on the map to trace your driving route. Place at least 2 waypoints, then hit Submit.'
    : 'Click on the map to trace your transit route (bus lines, BART corridors). Then hit Submit.';
  document.getElementById('hint-text').textContent = hintText;

  updateWaypointCount();
  document.getElementById('btn-submit').disabled = true;
  showPhase('drawing');
}

// ── Drawing ─────────────────────────────────────────────────────────────────
function handleMapClick(e) {
  if (state.phase !== 'drawing') return;
  const { lat, lng } = e.latlng;
  state.userWaypoints.push([lat, lng]);
  const marker = createWaypointMarker([lat, lng]).addTo(map);
  state.userMarkers.push(marker);
  drawUserPolyline();
  updateWaypointCount();
  document.getElementById('btn-submit').disabled = state.userWaypoints.length < 2;
}

function drawUserPolyline() {
  if (state.userPolyline) {
    state.userPolyline.remove();
    state.userPolyline = null;
  }
  if (state.userWaypoints.length >= 2) {
    state.userPolyline = L.polyline(state.userWaypoints, {
      color: '#4a9eff',
      weight: 4,
      opacity: 0.85,
      dashArray: '8, 5',
    }).addTo(map);
  }
}

function undoLastWaypoint() {
  if (state.userWaypoints.length === 0) return;
  state.userWaypoints.pop();
  const m = state.userMarkers.pop();
  if (m) m.remove();
  drawUserPolyline();
  updateWaypointCount();
  document.getElementById('btn-submit').disabled = state.userWaypoints.length < 2;
}

function clearWaypoints() {
  state.userWaypoints = [];
  state.userMarkers.forEach(m => m.remove());
  state.userMarkers = [];
  if (state.userPolyline) { state.userPolyline.remove(); state.userPolyline = null; }
  updateWaypointCount();
  document.getElementById('btn-submit').disabled = true;
}

function updateWaypointCount() {
  const n = state.userWaypoints.length;
  document.getElementById('waypoint-count').textContent =
    n === 0 ? '0 waypoints placed'
    : n === 1 ? '1 waypoint placed — add at least one more'
    : `${n} waypoints placed`;
}

// ── Routing APIs ────────────────────────────────────────────────────────────
async function fetchOptimalRoute(origin, dest, mode) {
  if (mode === 'driving') {
    return fetchOsrmRoute(origin, dest);
  } else {
    return fetchGeoapifyRoute(origin, dest);
  }
}

async function fetchOsrmRoute(origin, dest) {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${origin.lng},${origin.lat};${dest.lng},${dest.lat}` +
    `?geometries=geojson&overview=full&steps=false&generate_hints=false`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`OSRM request failed (${res.status})`);
  const data = await res.json();

  if (!data.routes || data.routes.length === 0) {
    throw new Error('No driving route found between these points.');
  }

  const route = data.routes[0];
  return {
    geometry: route.geometry,   // GeoJSON LineString
    distance: route.distance,   // metres
    duration: route.duration,   // seconds
  };
}

async function fetchGeoapifyRoute(origin, dest) {
  const key = state.apiKey.trim();
  if (!key) {
    throw new Error(
      'A Geoapify API key is required for Bus mode.\n' +
      'Enter your free key in the sidebar (geoapify.com).'
    );
  }

  const url =
    `https://api.geoapify.com/v1/routing` +
    `?waypoints=${origin.lat},${origin.lng}|${dest.lat},${dest.lng}` +
    `&mode=transit` +
    `&apiKey=${encodeURIComponent(key)}`;

  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    if (res.status === 401 || res.status === 403) {
      throw new Error('Invalid Geoapify API key. Please check and try again.');
    }
    throw new Error(`Geoapify request failed (${res.status}): ${body}`);
  }

  const data = await res.json();

  if (!data.features || data.features.length === 0) {
    throw new Error('No transit route found. Transit routing may not be available for this pair.');
  }

  const feat = data.features[0];
  return {
    geometry: feat.geometry,
    distance: feat.properties.distance,
    duration: feat.properties.time,
  };
}

// ── Submit & Scoring ────────────────────────────────────────────────────────
async function submitRoute() {
  showPhase('loading');

  let result;
  try {
    result = await fetchOptimalRoute(state.originLandmark, state.destLandmark, state.mode);
  } catch (err) {
    document.getElementById('error-message').textContent = err.message;
    showPhase('error');
    return;
  }

  drawOptimalRoute(result.geometry);
  calculateAndShowScore(result);
  showPhase('results');
}

function drawOptimalRoute(geometry) {
  // Leaflet expects [[lat, lng], ...], GeoJSON gives [lng, lat]
  const coords = geometry.coordinates.map(c => [c[1], c[0]]);
  const color = state.mode === 'driving' ? '#f5a623' : '#1de9b6';

  state.optimalPolyline = L.polyline(coords, {
    color,
    weight: 5,
    opacity: 0.85,
  }).addTo(map);

  // Fit map to show both routes
  const allPoints = [
    ...state.userWaypoints,
    ...coords,
    [state.originLandmark.lat, state.originLandmark.lng],
    [state.destLandmark.lat,   state.destLandmark.lng],
  ];
  map.fitBounds(L.latLngBounds(allPoints), { padding: [50, 50] });
}

function calculateAndShowScore(optimalResult) {
  // ── Efficiency Score (40%) ──
  const userLine = turf.lineString(state.userWaypoints.map(([lat, lng]) => [lng, lat]));
  const userDistKm = turf.length(userLine, { units: 'kilometers' });
  const optDistKm  = optimalResult.distance / 1000;

  const ratio = userDistKm / optDistKm;
  let effScore;
  if      (ratio <= 1.05) effScore = 100;
  else if (ratio <= 1.20) effScore = 100 - (ratio - 1.05) / 0.15 * 30;   // 100→70
  else if (ratio <= 1.50) effScore = 70  - (ratio - 1.20) / 0.30 * 30;   // 70→40
  else if (ratio <= 2.00) effScore = 40  - (ratio - 1.50) / 0.50 * 30;   // 40→10
  else                    effScore = Math.max(0, 10 - (ratio - 2.0) * 5);
  effScore = Math.max(0, Math.min(100, Math.round(effScore)));

  // ── Adherence Score (60%) ──
  const optCoords  = optimalResult.geometry.coordinates; // [lng, lat]
  const optLine    = turf.lineString(optCoords);
  let totalDev = 0;
  for (const [lat, lng] of state.userWaypoints) {
    const pt = turf.point([lng, lat]);
    const snapped = turf.nearestPointOnLine(optLine, pt, { units: 'meters' });
    totalDev += snapped.properties.dist;
  }
  const avgDev = totalDev / state.userWaypoints.length;

  let adhScore;
  if      (avgDev <= 80)   adhScore = 100;
  else if (avgDev <= 200)  adhScore = 100 - (avgDev - 80)  / 120 * 40;   // 100→60
  else if (avgDev <= 500)  adhScore = 60  - (avgDev - 200) / 300 * 35;   // 60→25
  else if (avgDev <= 1000) adhScore = 25  - (avgDev - 500) / 500 * 20;   // 25→5
  else                     adhScore = Math.max(0, 5 - (avgDev - 1000) / 500);
  adhScore = Math.max(0, Math.min(100, Math.round(adhScore)));

  // ── Final ──
  const finalScore = Math.round(0.40 * effScore + 0.60 * adhScore);

  let grade, gradeLabel;
  if      (finalScore >= 90) { grade = 'S'; gradeLabel = 'Knowledge Complete!'; }
  else if (finalScore >= 75) { grade = 'A'; gradeLabel = 'Street-Smart';        }
  else if (finalScore >= 55) { grade = 'B'; gradeLabel = 'Getting There';       }
  else if (finalScore >= 35) { grade = 'C'; gradeLabel = 'Study More';          }
  else                       { grade = 'D'; gradeLabel = 'Back to Basics';      }

  // ── Update DOM ──
  const gradeBadgeEl = document.getElementById('grade-badge');
  gradeBadgeEl.textContent = grade;
  gradeBadgeEl.className = `grade-badge grade-${grade}`;

  document.getElementById('score-number').textContent = finalScore;
  document.getElementById('grade-label').textContent  = gradeLabel;

  document.getElementById('eff-score').textContent = effScore;
  document.getElementById('adh-score').textContent = adhScore;

  // Animate bars after a short delay
  setTimeout(() => {
    document.getElementById('eff-bar').style.width = `${effScore}%`;
    document.getElementById('adh-bar').style.width = `${adhScore}%`;
  }, 80);

  document.getElementById('opt-stats').textContent =
    `${optDistKm.toFixed(2)} km · ${formatDuration(optimalResult.duration)}`;
  document.getElementById('usr-stats').textContent =
    `${userDistKm.toFixed(2)} km`;
}

// ── UI Phase Machine ────────────────────────────────────────────────────────
function showPhase(phase) {
  state.phase = phase;

  const drawingControls = document.getElementById('drawing-controls');
  const loadingSection  = document.getElementById('loading-section');
  const errorSection    = document.getElementById('error-section');
  const resultsSection  = document.getElementById('results-section');

  drawingControls.classList.add('hidden');
  loadingSection.classList.add('hidden');
  errorSection.classList.add('hidden');
  resultsSection.classList.add('hidden');

  if (phase === 'drawing')  drawingControls.classList.remove('hidden');
  if (phase === 'loading')  loadingSection.classList.remove('hidden');
  if (phase === 'error')    errorSection.classList.remove('hidden');
  if (phase === 'results')  resultsSection.classList.remove('hidden');
}

// ── Mode Switching ──────────────────────────────────────────────────────────
function setMode(mode) {
  state.mode = mode;
  document.getElementById('btn-driving').classList.toggle('active', mode === 'driving');
  document.getElementById('btn-bus').classList.toggle('active', mode === 'bus');
  document.getElementById('api-key-section').classList.toggle('hidden', mode === 'driving');
}

// ── API Key Persistence ─────────────────────────────────────────────────────
function loadApiKey() {
  const saved = localStorage.getItem('sf_knowledge_api_key');
  if (saved) {
    state.apiKey = saved;
    document.getElementById('api-key-input').value = saved;
  }
}

function saveApiKey(key) {
  state.apiKey = key;
  localStorage.setItem('sf_knowledge_api_key', key);
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '—';
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem === 0 ? `${h}h` : `${h}h ${rem}min`;
}

// ── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  loadApiKey();

  document.getElementById('btn-driving').addEventListener('click', () => setMode('driving'));
  document.getElementById('btn-bus').addEventListener('click', () => setMode('bus'));

  document.getElementById('api-key-input').addEventListener('input', e => {
    saveApiKey(e.target.value);
  });

  document.getElementById('btn-new-challenge').addEventListener('click', startChallenge);

  document.getElementById('btn-undo').addEventListener('click', undoLastWaypoint);
  document.getElementById('btn-clear').addEventListener('click', clearWaypoints);
  document.getElementById('btn-submit').addEventListener('click', submitRoute);

  document.getElementById('btn-retry').addEventListener('click', () => {
    showPhase('drawing');
    // Remove optimal route if it was partially drawn
    if (state.optimalPolyline) { state.optimalPolyline.remove(); state.optimalPolyline = null; }
  });

  document.getElementById('btn-next').addEventListener('click', startChallenge);
});
