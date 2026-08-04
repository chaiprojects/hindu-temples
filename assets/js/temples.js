// ============================================================
// Temple Directory — data loading & rendering
//
// Temple data lives in assets/data/temples.json, not in this file.
// Editing that JSON (or letting CI refresh it) updates the map, the
// directory, the city filter, the carousel and the hero stats
// together — nothing here needs changing.
//
// Schema per entry (only name/address/city/lat/lng are required):
//   slug, name, address, city, lat, lng, deity, hours,
//   url, eventsUrl, feedType, feedUrl, rating, reviews
// ============================================================

// Mutated in place rather than reassigned, so other modules can hold
// a reference to it from load time.
const TEMPLES = [];

const escHtml = s => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** Only http(s) links are allowed through to href attributes. */
function safeUrl(u) {
  if (!u) return null;
  try {
    const parsed = new URL(u, window.location.href);
    return /^https?:$/.test(parsed.protocol) ? parsed.href : null;
  } catch { return null; }
}

/**
 * Load the temple directory. Returns the number of temples loaded.
 */
async function loadTemples() {
  try {
    const resp = await fetch('assets/data/temples.json', { cache: 'no-cache' });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const data = await resp.json();
    const list = Array.isArray(data) ? data : (data.temples || []);
    TEMPLES.length = 0;
    for (const t of list) {
      if (!t || !t.name || typeof t.lat !== 'number' || typeof t.lng !== 'number') continue;
      TEMPLES.push(t);
    }
    TEMPLES.sort((a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name));
  } catch (e) {
    console.error('Could not load temples.json:', e.message);
  }
  return TEMPLES.length;
}

/** Aggregate figures for the hero tiles, derived rather than hard-coded. */
function templeStats() {
  const rated = TEMPLES.filter(t => typeof t.rating === 'number' && t.rating > 0);
  const avg = rated.length
    ? rated.reduce((s, t) => s + t.rating, 0) / rated.length
    : null;
  return {
    temples: TEMPLES.length,
    cities: new Set(TEMPLES.map(t => t.city)).size,
    avgRating: avg === null ? null : Math.round(avg * 10) / 10
  };
}

function starsHtml(r) {
  const f = Math.floor(r);
  const h = r % 1 >= 0.5 ? 1 : 0;
  return '★'.repeat(f) + (h ? '⯨' : '') + '☆'.repeat(Math.max(0, 5 - f - h));
}

function mapsUrlFor(t) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(t.name + ' ' + (t.address || t.city))}`;
}

function renderTemples(list) {
  const grid = document.getElementById('templesGrid');
  const nr = document.getElementById('noResults');
  if (!grid) return;

  if (!list.length) {
    grid.innerHTML = '';
    if (nr) nr.style.display = 'block';
    return;
  }
  if (nr) nr.style.display = 'none';

  grid.innerHTML = list.map((t, i) => {
    const site = safeUrl(t.url);
    const events = safeUrl(t.eventsUrl);
    // Rating is optional: a temple with no verified Google rating shows
    // nothing rather than a fabricated score.
    const rating = typeof t.rating === 'number' && t.rating > 0
      ? `<div class="t-rating">
           <span class="stars" aria-label="${t.rating} out of 5 stars">${starsHtml(t.rating)}</span>
           <span class="rnum">${t.rating}${t.reviews ? ` (${Number(t.reviews).toLocaleString()})` : ''}</span>
         </div>`
      : '';
    return `<article class="temple-card reveal" style="--reveal-i:${i}">
      <span class="t-icon" aria-hidden="true">🛕</span>
      <h3 class="t-name">${escHtml(t.name)}</h3>
      <div class="t-addr">📍 ${escHtml(t.address || t.city)}</div>
      ${t.deity ? `<div class="t-deity">✦ ${escHtml(t.deity)}</div>` : ''}
      ${rating}
      <div class="t-hours"><span class="hlbl">Hours</span>${escHtml(t.hours || 'Check temple website for current timings')}</div>
      ${site ? `<a class="t-link" href="${escHtml(site)}" target="_blank" rel="noopener" aria-label="Visit ${escHtml(t.name)} website">🔗 Official Website</a>` : ''}
      ${events ? `<a class="t-link" href="${escHtml(events)}" target="_blank" rel="noopener" aria-label="${escHtml(t.name)} events calendar">📅 Events Calendar</a>` : ''}
      <a class="t-link" href="${escHtml(mapsUrlFor(t))}" target="_blank" rel="noopener" aria-label="Open ${escHtml(t.name)} in Google Maps">🗺 Open in Google Maps</a>
    </article>`;
  }).join('');

  if (window._revealObserver) {
    grid.querySelectorAll('.reveal').forEach(el => window._revealObserver.observe(el));
  }
}

/** Temples matching the current search box and city dropdown. */
function currentFilter() {
  const q = (document.getElementById('searchBar')?.value || '').toLowerCase().trim();
  const cityFilter = document.getElementById('cityFilter')?.value || '';
  return TEMPLES.filter(t => {
    const matchesSearch = !q ||
      [t.name, t.city, t.deity, t.address].some(v => String(v || '').toLowerCase().includes(q));
    return matchesSearch && (!cityFilter || t.city === cityFilter);
  });
}

function filterTemples() {
  const list = currentFilter();
  renderTemples(list);
  const count = document.getElementById('templeResultCount');
  if (count) {
    count.textContent = list.length === TEMPLES.length
      ? `${TEMPLES.length} temples`
      : `${list.length} of ${TEMPLES.length} temples`;
  }
}

function populateCityFilter() {
  const select = document.getElementById('cityFilter');
  if (!select) return;
  const current = select.value;
  select.querySelectorAll('option:not([value=""])').forEach(o => o.remove());
  for (const city of [...new Set(TEMPLES.map(t => t.city))].sort()) {
    const opt = document.createElement('option');
    opt.value = city;
    opt.textContent = city;
    select.appendChild(opt);
  }
  if (current) select.value = current;
}

window.Temples = {
  TEMPLES,
  loadTemples,
  templeStats,
  renderTemples,
  filterTemples,
  populateCityFilter,
  starsHtml,
  mapsUrlFor,
  escHtml,
  safeUrl
};
