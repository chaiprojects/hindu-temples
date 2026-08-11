// ============================================================
// Main Application — Orchestrates all modules
// ============================================================

// Global mutable location state
const userLocation = {
  lat: 37.3382,    // default: San Jose
  lon: -121.8863,
  tzName: Intl.DateTimeFormat().resolvedOptions().timeZone,
  label: 'Bay Area, CA',
  source: 'default'
};

// ── Dark Mode ──
function initTheme() {
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
  updateThemeIcon(theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  updateThemeIcon(next);
  if (window.TempleMap) window.TempleMap.syncTheme();
}

function updateThemeIcon(theme) {
  const btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// ── Sticky Nav ──
function initStickyNav() {
  const nav = document.querySelector('.site-nav');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });
}

// ── Mobile Nav ──
function toggleMobileNav() {
  const navLinks = document.getElementById('navLinks');
  const overlay = document.getElementById('navOverlay');
  const hamburger = document.getElementById('navHamburger');
  if (!navLinks) return;

  const isOpen = navLinks.classList.toggle('open');
  overlay?.classList.toggle('active', isOpen);
  document.body.classList.toggle('nav-open', isOpen);
  hamburger?.setAttribute('aria-expanded', String(isOpen));
}

function closeMobileNav() {
  const navLinks = document.getElementById('navLinks');
  const overlay = document.getElementById('navOverlay');
  const hamburger = document.getElementById('navHamburger');
  navLinks?.classList.remove('open');
  overlay?.classList.remove('active');
  document.body.classList.remove('nav-open');
  hamburger?.setAttribute('aria-expanded', 'false');
}

// ── Back to Top ──
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ── Active Nav Link Highlighting ──
function initActiveNavLinks() {
  const sections = document.querySelectorAll('.content-section[id]');
  const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
        });
      }
    });
  }, { rootMargin: '-20% 0px -70% 0px' });

  sections.forEach(s => observer.observe(s));

  // Close mobile nav on link click
  navLinks.forEach(link => {
    link.addEventListener('click', closeMobileNav);
  });
}

// ── Location Banner ──
function showLocationBanner(state) {
  const text = document.getElementById('locText');
  const changeBtn = document.getElementById('locChangeBtn');
  const panel = document.getElementById('zipPanel');

  if (!text) return;

  if (state === 'loading') {
    text.innerHTML = '<span class="loc-spinner"></span> Detecting your location\u2026';
    if (changeBtn) changeBtn.style.display = 'none';
  } else if (state === 'located') {
    text.innerHTML = `Showing times for <strong>${userLocation.label}</strong>`;
    if (changeBtn) changeBtn.style.display = 'inline';
    const rahuLabel = document.getElementById('rahuLocationLabel');
    if (rahuLabel) rahuLabel.textContent = userLocation.label;
    if (panel) panel.classList.remove('show');
  } else { // 'prompt'
    text.innerHTML = 'Location not detected \u2014 enter your zip code below';
    if (changeBtn) changeBtn.style.display = 'none';
    if (panel) panel.classList.add('show');
  }
}

function toggleZipPanel() {
  document.getElementById('zipPanel')?.classList.toggle('show');
}

function showZipError(msg) {
  const el = document.getElementById('zipError');
  if (el) {
    el.textContent = msg;
    el.classList.add('show');
  }
}

function submitZip() {
  const el = document.getElementById('zipError');
  if (el) el.classList.remove('show');
  onZipSubmit(document.getElementById('zipInput')?.value.trim() || '');
}

// ── Location cache — remember the resolved location so refreshes
//    never re-hit the geolocation API (and never re-prompt). ──
const LOC_CACHE_KEY = 'bay_temples_location';

function saveLocationCache() {
  try {
    localStorage.setItem(LOC_CACHE_KEY, JSON.stringify({
      lat: userLocation.lat,
      lon: userLocation.lon,
      label: userLocation.label,
      source: userLocation.source,
      ts: Date.now()
    }));
  } catch (_) { /* private mode etc. */ }
}

function loadLocationCache() {
  try {
    const c = JSON.parse(localStorage.getItem(LOC_CACHE_KEY) || 'null');
    if (c && typeof c.lat === 'number' && typeof c.lon === 'number') return c;
  } catch (_) { /* corrupt/unavailable */ }
  return null;
}

// ── Hero sunrise/sunset ──
function renderSunTimes() {
  const riseEl = document.getElementById('heroSunrise');
  const setEl = document.getElementById('heroSunset');
  if (!riseEl || !setEl || !window.RahuKalam) return;
  const { sunrise, sunset } = window.RahuKalam.calcSunriseSunset(new Date(), userLocation);
  riseEl.textContent = window.RahuKalam.minsToTime(sunrise);
  setEl.textContent = window.RahuKalam.minsToTime(sunset);
}

// ── Apply location change — re-render everything ──
function applyLocationChange() {
  showLocationBanner('located');
  saveLocationCache();
  renderSunTimes();
  window.RahuKalam.renderRahuKalam(userLocation);
  window.Ekadashi.recomputeEkadashi(userLocation);
  // Festival dates depend on sunrise at the user's location, so the
  // calendar has to be recomputed too.
  window.Calendar.onLocationChange();
}

// ── Reverse geocode ──
async function fetchLocationLabel(lat, lon) {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10&addressdetails=1`,
      { headers: { 'Accept-Language': 'en-US', 'User-Agent': 'HinduTemplesBayArea/1.0' } }
    );
    const d = await r.json();
    return [
      d.address?.city || d.address?.town || d.address?.village || d.address?.county,
      d.address?.state
    ].filter(Boolean).join(', ') || `${lat.toFixed(2)}\u00b0N`;
  } catch (e) {
    return `${lat.toFixed(2)}\u00b0N, ${Math.abs(lon).toFixed(2)}\u00b0W`;
  }
}

// ── Forward geocode (zip) ──
async function geocodeZip(zip) {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(zip)}&country=US&format=json&limit=1&addressdetails=1`,
      { headers: { 'Accept-Language': 'en-US', 'User-Agent': 'HinduTemplesBayArea/1.0' } }
    );
    const data = await r.json();
    if (!data.length) return null;
    const p = data[0];
    return {
      lat: parseFloat(p.lat),
      lon: parseFloat(p.lon),
      label: [
        p.address?.city || p.address?.town || p.address?.village || p.address?.county,
        p.address?.state
      ].filter(Boolean).join(', ') || zip
    };
  } catch (e) {
    return null;
  }
}

async function onZipSubmit(zip) {
  if (!/^\d{5}$/.test(zip)) {
    showZipError('Please enter a valid 5-digit US zip code.');
    return;
  }
  showLocationBanner('loading');
  const result = await geocodeZip(zip);
  if (!result) {
    showLocationBanner('prompt');
    showZipError('Zip code not found. Please try again.');
    return;
  }
  userLocation.lat = result.lat;
  userLocation.lon = result.lon;
  userLocation.label = result.label;
  userLocation.source = 'zip';
  userLocation.tzName = Intl.DateTimeFormat().resolvedOptions().timeZone;
  applyLocationChange();
}

// ── GPS Geolocation ──
async function onGeolocationSuccess(pos) {
  userLocation.lat = pos.coords.latitude;
  userLocation.lon = pos.coords.longitude;
  userLocation.source = 'gps';
  userLocation.tzName = Intl.DateTimeFormat().resolvedOptions().timeZone;
  userLocation.label = `${pos.coords.latitude.toFixed(2)}\u00b0N`;
  applyLocationChange();
  // Fire-and-forget reverse geocode
  fetchLocationLabel(pos.coords.latitude, pos.coords.longitude).then(label => {
    userLocation.label = label;
    saveLocationCache();
    showLocationBanner('located');
  });
}

function onGeolocationError() {
  showLocationBanner('prompt');
}

function retryGPS() {
  if (!('geolocation' in navigator)) {
    showZipError('Geolocation not supported by this browser.');
    return;
  }
  showLocationBanner('loading');
  navigator.geolocation.getCurrentPosition(onGeolocationSuccess, onGeolocationError, {
    timeout: 8000,
    maximumAge: 60000
  });
}

// ── Pull-to-refresh (home-screen app only) ──
// iOS standalone web apps have no reload button and no native
// pull-to-refresh; restore the gesture here. In-browser visits keep
// the browser's own behavior, so this activates only in standalone.
function initPullToRefresh() {
  const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                     window.navigator.standalone === true;
  if (!standalone) return;

  const THRESHOLD = 75;
  let startY = null, pulling = false, indicator = null;

  function getIndicator() {
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.style.cssText =
        'position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:9999;' +
        'background:var(--bg-card,#fff);color:var(--text-primary,#333);' +
        'padding:.45rem .95rem;border-radius:999px;box-shadow:0 2px 14px rgba(0,0,0,.25);' +
        'font-size:.8rem;font-weight:600;opacity:0;transition:opacity .15s;pointer-events:none';
      document.body.appendChild(indicator);
    }
    return indicator;
  }

  document.addEventListener('touchstart', e => {
    pulling = window.scrollY <= 0 && e.touches.length === 1;
    startY = pulling ? e.touches[0].clientY : null;
  }, { passive: true });

  document.addEventListener('touchmove', e => {
    if (!pulling || startY === null) return;
    const dy = e.touches[0].clientY - startY;
    if (dy > 20 && window.scrollY <= 0) {
      const ind = getIndicator();
      const ready = dy > THRESHOLD;
      ind.textContent = ready ? '↻ Release to refresh' : '↓ Pull to refresh';
      ind.style.opacity = '1';
      ind.dataset.ready = ready ? '1' : '';
    }
  }, { passive: true });

  document.addEventListener('touchend', () => {
    if (pulling && indicator && indicator.dataset.ready === '1') {
      indicator.textContent = '↻ Refreshing…';
      location.reload();
    } else if (indicator) {
      indicator.style.opacity = '0';
      indicator.dataset.ready = '';
    }
    pulling = false;
    startY = null;
  }, { passive: true });
}

// ── Debounce Utility ──
function debounce(fn, ms) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

// ── Site stats ──
// Derived from the temple data so the hero tiles, the map footer and the
// section subtitles can never drift out of sync with the directory.
function renderSiteStats() {
  if (!window.Temples) return;
  const { temples, cities, avgRating } = window.Temples.templeStats();

  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el && value !== null) el.textContent = value;
  };
  set('statTemples', temples);
  set('statCities', cities);

  const ratingEl = document.getElementById('statRating');
  if (ratingEl) {
    ratingEl.innerHTML = avgRating === null
      ? '&mdash;'
      : `${avgRating}<span style="font-size:.75em">★</span>`;
  }

  const mapCount = document.getElementById('mapTempleCount');
  if (mapCount) mapCount.textContent = `${temples} temples on map`;

  document.querySelectorAll('[data-temple-count]').forEach(el => {
    el.textContent = el.dataset.templeCount.replace('{n}', temples);
  });

  const resultCount = document.getElementById('templeResultCount');
  if (resultCount) resultCount.textContent = `${temples} temples`;
}

// ── Featured Temple Carousel ──
function initCarousel() {
  const track = document.getElementById('carouselTrack');
  const dotsWrap = document.getElementById('carouselDots');
  if (!track || !dotsWrap || !window.Temples) return;

  const esc = window.Temples.escHtml;

  // Most-reviewed temples first; entries without a verified review count
  // simply sort last rather than being excluded.
  const top5 = [...window.Temples.TEMPLES]
    .sort((a, b) => (b.reviews || 0) - (a.reviews || 0))
    .slice(0, 5);
  if (!top5.length) return;

  track.innerHTML = top5.map((t, i) => {
    const mapsUrl = window.Temples.mapsUrlFor(t);
    const siteLink = window.Temples.safeUrl(t.url) || mapsUrl;
    const rating = typeof t.rating === 'number' && t.rating > 0
      ? `<div class="t-rating">
           <span class="stars">${window.Temples.starsHtml(t.rating)}</span>
           <span class="rnum">${t.rating}${t.reviews ? ` (${Number(t.reviews).toLocaleString()})` : ''}</span>
         </div>`
      : '';
    return `<div class="carousel-slide" role="listitem">
      <div class="carousel-slide-accent"></div>
      <div class="carousel-slide-body">
        <div class="carousel-rank">#${i + 1}</div>
        <h3 class="t-name">${esc(t.name)}</h3>
        <div class="t-deity">${esc(t.deity || '')}</div>
        <div class="carousel-slide-city">${esc(t.city)}</div>
        ${rating}
        <div class="carousel-slide-actions">
          <a class="carousel-action-primary" href="${esc(mapsUrl)}" target="_blank" rel="noopener">Directions</a>
          <a class="carousel-action-secondary" href="${esc(siteLink)}" target="_blank" rel="noopener">Website</a>
        </div>
      </div>
    </div>`;
  }).join('');

  // Create dots
  dotsWrap.innerHTML = top5.map((_, i) =>
    `<button class="carousel-dot${i === 0 ? ' active' : ''}" role="tab" aria-label="Slide ${i + 1}" data-slide="${i}"></button>`
  ).join('');

  // Wire prev/next
  document.getElementById('carouselPrev')?.addEventListener('click', () => {
    track.scrollBy({ left: -350, behavior: 'smooth' });
  });
  document.getElementById('carouselNext')?.addEventListener('click', () => {
    track.scrollBy({ left: 350, behavior: 'smooth' });
  });

  // Dot click
  dotsWrap.addEventListener('click', e => {
    const dot = e.target.closest('.carousel-dot');
    if (!dot) return;
    const idx = parseInt(dot.dataset.slide);
    const slide = track.children[idx];
    if (slide) slide.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
  });

  // Sync dots with scroll
  const slides = track.querySelectorAll('.carousel-slide');
  const dotObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const idx = [...slides].indexOf(entry.target);
        dotsWrap.querySelectorAll('.carousel-dot').forEach((d, i) => {
          d.classList.toggle('active', i === idx);
        });
      }
    });
  }, { root: track, threshold: 0.6 });

  slides.forEach(s => dotObserver.observe(s));
}

// Need starsHtml for carousel
function starsHtml(r) {
  const f = Math.floor(r);
  const h = r % 1 >= 0.5 ? 1 : 0;
  const e = 5 - f - h;
  return '\u2605'.repeat(f) + (h ? '\u2BE8' : '') + '\u2606'.repeat(e);
}

// ── Card Glow Effect ──
function initCardGlow() {
  document.addEventListener('mousemove', e => {
    const card = e.target.closest('.temple-card');
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mouse-x', (e.clientX - rect.left) + 'px');
    card.style.setProperty('--mouse-y', (e.clientY - rect.top) + 'px');
  }, { passive: true });
}

// ── Scroll Reveal ──
function initScrollReveal() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  window._revealObserver = observer;
}

// ── Initialization ──
async function initApp() {
  // Theme
  initTheme();

  // UI interactions
  initStickyNav();
  initBackToTop();
  initActiveNavLinks();

  // Load the temple directory and their events before first render.
  // Both are static JSON, so this is one round trip each.
  await Promise.all([
    window.Temples.loadTemples(),
    window.Calendar.loadTempleEvents()
  ]);

  // Render widgets with default location
  renderSunTimes();
  window.RahuKalam.renderRahuKalam(userLocation);
  window.Calendar.render();
  window.Temples.renderTemples(window.Temples.TEMPLES);
  window.Temples.populateCityFilter();
  renderSiteStats();

  // Initialize interactive map
  if (window.TempleMap) window.TempleMap.init();

  // Daily devotional bhajan + mini Rahu Kalam widget + visit counter
  if (window.DailyBhajan) {
    window.DailyBhajan.render();
    window.DailyBhajan.renderMiniInWidget();
    window.DailyBhajan.loadVisitCount();
  }

  // Carousel, scroll reveal, card glow
  initCarousel();
  initScrollReveal();
  initCardGlow();

  // Calendar navigation
  document.getElementById('calPrev')?.addEventListener('click', window.Calendar.prevMonth);
  document.getElementById('calNext')?.addEventListener('click', window.Calendar.nextMonth);

  // Tooltip close
  document.getElementById('tooltipOverlay')?.addEventListener('click', window.Calendar.closeTooltip);

  // Search & filter (sync both temple cards and map markers)
  function syncFilters() {
    const q = document.getElementById('searchBar')?.value || '';
    const city = document.getElementById('cityFilter')?.value || '';
    window.Temples.filterTemples();
    if (window.TempleMap) window.TempleMap.filterMarkers(q, city);
  }
  document.getElementById('searchBar')?.addEventListener('input', debounce(syncFilters, 200));
  document.getElementById('cityFilter')?.addEventListener('change', syncFilters);

  // Theme toggle
  document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);

  // Mobile nav
  document.getElementById('navHamburger')?.addEventListener('click', toggleMobileNav);
  document.getElementById('navOverlay')?.addEventListener('click', closeMobileNav);

  // Location zip
  document.getElementById('locChangeBtn')?.addEventListener('click', toggleZipPanel);
  document.getElementById('zipSubmitBtn')?.addEventListener('click', submitZip);
  document.getElementById('zipInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') submitZip();
  });
  document.getElementById('gpsRetryBtn')?.addEventListener('click', retryGPS);

  // Start location. A previously resolved location (GPS or zip) is
  // reused from localStorage so refreshes never re-prompt for
  // permission; geolocation is only queried silently in the
  // background when permission is already granted.
  const cachedLoc = loadLocationCache();
  if (cachedLoc) {
    userLocation.lat = cachedLoc.lat;
    userLocation.lon = cachedLoc.lon;
    userLocation.label = cachedLoc.label || userLocation.label;
    userLocation.source = cachedLoc.source || 'cache';
    userLocation.tzName = Intl.DateTimeFormat().resolvedOptions().timeZone;
    applyLocationChange();
    if (navigator.permissions?.query && 'geolocation' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then(p => {
        if (p.state === 'granted') {
          navigator.geolocation.getCurrentPosition(
            onGeolocationSuccess,
            () => { /* keep cached location */ },
            { timeout: 8000, maximumAge: 300000 }
          );
        }
      }).catch(() => { /* keep cached location */ });
    }
  } else if ('geolocation' in navigator) {
    showLocationBanner('loading');
    navigator.geolocation.getCurrentPosition(
      onGeolocationSuccess,
      onGeolocationError,
      { timeout: 8000, maximumAge: 300000 }
    );
  } else {
    showLocationBanner('prompt');
  }

  // Pull-to-refresh gesture for the home-screen app
  initPullToRefresh();

  // Start Ekadashi computation (deferred)
  window.Ekadashi.recomputeEkadashi(userLocation);
}

// Boot
document.addEventListener('DOMContentLoaded', initApp);
