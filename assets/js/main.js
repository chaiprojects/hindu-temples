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
  document.getElementById('navLinks')?.classList.toggle('open');
}

function closeMobileNav() {
  document.getElementById('navLinks')?.classList.remove('open');
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

// ── Apply location change — re-render everything ──
function applyLocationChange() {
  showLocationBanner('located');
  window.RahuKalam.renderRahuKalam(userLocation);
  window.Ekadashi.recomputeEkadashi(userLocation);
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

// ── Initialization ──
async function initApp() {
  // Theme
  initTheme();

  // UI interactions
  initStickyNav();
  initBackToTop();
  initActiveNavLinks();

  // Load temple events from JSON
  await window.Calendar.loadTempleEvents();

  // Render widgets with default location
  window.RahuKalam.renderRahuKalam(userLocation);
  window.Calendar.render();
  window.Temples.renderTemples(window.Temples.TEMPLES);
  window.Temples.populateCityFilter();

  // Calendar navigation
  document.getElementById('calPrev')?.addEventListener('click', window.Calendar.prevMonth);
  document.getElementById('calNext')?.addEventListener('click', window.Calendar.nextMonth);

  // Tooltip close
  document.getElementById('tooltipOverlay')?.addEventListener('click', window.Calendar.closeTooltip);

  // Search & filter
  document.getElementById('searchBar')?.addEventListener('input', window.Temples.filterTemples);
  document.getElementById('cityFilter')?.addEventListener('change', window.Temples.filterTemples);

  // Theme toggle
  document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);

  // Mobile nav
  document.getElementById('navHamburger')?.addEventListener('click', toggleMobileNav);

  // Location zip
  document.getElementById('locChangeBtn')?.addEventListener('click', toggleZipPanel);
  document.getElementById('zipSubmitBtn')?.addEventListener('click', submitZip);
  document.getElementById('zipInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') submitZip();
  });
  document.getElementById('gpsRetryBtn')?.addEventListener('click', retryGPS);

  // Start geolocation
  if ('geolocation' in navigator) {
    showLocationBanner('loading');
    navigator.geolocation.getCurrentPosition(
      onGeolocationSuccess,
      onGeolocationError,
      { timeout: 8000, maximumAge: 300000 }
    );
  } else {
    showLocationBanner('prompt');
  }

  // Start Ekadashi computation (deferred)
  window.Ekadashi.recomputeEkadashi(userLocation);
}

// Boot
document.addEventListener('DOMContentLoaded', initApp);
