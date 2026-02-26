// ============================================================
// Temple Map Module — Leaflet.js interactive map
// Uses CartoDB tiles (free, no API key required)
// Light mode: CartoDB Positron | Dark mode: CartoDB Dark Matter
// ============================================================

window.TempleMap = (() => {
  let map = null;
  let markerData = [];
  let lightTile = null;
  let darkTile = null;
  let activeTile = null;
  let initialized = false;

  const LIGHT_TILE_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
  const DARK_TILE_URL  = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  const ATTRIBUTION    = '&copy; <a href="https://carto.com/attributions" target="_blank">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>';

  // ── Custom Marker Icon ──────────────────────────────────────
  function makeIcon(active) {
    return L.divIcon({
      className: 'temple-marker-wrap' + (active ? '' : ' temple-marker-dim'),
      html: '<div class="tm-pin"><span class="tm-emoji">🛕</span></div>',
      iconSize: [40, 46],
      iconAnchor: [20, 46],
      popupAnchor: [0, -50]
    });
  }

  // ── Popup HTML ──────────────────────────────────────────────
  function makePopup(temple, idx) {
    const r = Math.round(temple.rating);
    const stars = '★'.repeat(r) + '☆'.repeat(5 - r);
    return `
      <div class="map-popup-inner">
        <div class="mp-name">${temple.name}</div>
        <div class="mp-deity">✦ ${temple.deity}</div>
        <div class="mp-meta">
          <span class="mp-city">📍 ${temple.city}</span>
          <span class="mp-rating"><span class="mp-stars">${stars}</span> ${temple.rating}</span>
        </div>
        <button class="mp-btn" onclick="window.TempleMap.scrollToCard(${idx})">
          View Details <span class="mp-arrow">→</span>
        </button>
      </div>`;
  }

  // ── Initialize Map ──────────────────────────────────────────
  function init() {
    if (initialized || !window.L || !window.Temples) return;
    const mapEl = document.getElementById('templeMap');
    if (!mapEl) return;

    const temples = window.Temples.TEMPLES;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    // Create map centered on Bay Area
    map = L.map('templeMap', {
      center: [37.52, -121.95],
      zoom: 10,
      zoomControl: false,
      scrollWheelZoom: false,
      attributionControl: true
    });

    // Custom zoom control position
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Tile layers
    lightTile = L.tileLayer(LIGHT_TILE_URL, {
      attribution: ATTRIBUTION,
      maxZoom: 18,
      subdomains: 'abcd'
    });
    darkTile = L.tileLayer(DARK_TILE_URL, {
      attribution: ATTRIBUTION,
      maxZoom: 18,
      subdomains: 'abcd'
    });

    activeTile = isDark ? darkTile : lightTile;
    activeTile.addTo(map);

    // Enable scroll zoom only when map is focused
    mapEl.addEventListener('click', () => map.scrollWheelZoom.enable());
    document.addEventListener('click', (e) => {
      if (!mapEl.contains(e.target)) map.scrollWheelZoom.disable();
    });

    // Add markers for all temples with coordinates
    temples.forEach((temple, idx) => {
      if (!temple.lat || !temple.lng) return;

      const marker = L.marker([temple.lat, temple.lng], { icon: makeIcon(true) })
        .bindPopup(makePopup(temple, idx), {
          maxWidth: 260,
          className: 'temple-leaflet-popup',
          closeButton: true,
          autoPan: true,
          autoPanPadding: [40, 40]
        })
        .addTo(map);

      markerData.push({ marker, temple, idx, active: true });
    });

    // Update count badge
    const badge = document.getElementById('mapTempleCount');
    if (badge) badge.textContent = markerData.length + ' temples on map';

    initialized = true;
  }

  // ── Theme Sync ──────────────────────────────────────────────
  function syncTheme() {
    if (!map || !lightTile || !darkTile) return;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const newTile = isDark ? darkTile : lightTile;
    if (newTile === activeTile) return;
    map.removeLayer(activeTile);
    newTile.addTo(map);
    activeTile = newTile;
  }

  // ── Filter Markers ──────────────────────────────────────────
  function filterMarkers(searchTerm, city) {
    const q = (searchTerm || '').trim().toLowerCase();
    let activeCount = 0;

    markerData.forEach(({ marker, temple }) => {
      const cityMatch = !city || temple.city === city;
      const searchMatch = !q ||
        temple.name.toLowerCase().includes(q) ||
        temple.city.toLowerCase().includes(q) ||
        temple.deity.toLowerCase().includes(q) ||
        temple.address.toLowerCase().includes(q);

      const isMatch = cityMatch && searchMatch;

      marker.setIcon(makeIcon(isMatch));
      marker.setOpacity(isMatch ? 1 : 0.2);

      if (isMatch) activeCount++;
    });

    // Update count badge
    const badge = document.getElementById('mapTempleCount');
    if (badge) {
      badge.textContent = activeCount + ' temple' + (activeCount !== 1 ? 's' : '') + ' shown';
    }

    // If filtering to a city, re-center the map
    if (city && activeCount > 0) {
      const cityMarkers = markerData.filter(m => m.temple.city === city);
      if (cityMarkers.length === 1) {
        map.setView([cityMarkers[0].temple.lat, cityMarkers[0].temple.lng], 14, { animate: true });
      } else if (cityMarkers.length > 1) {
        const bounds = L.latLngBounds(cityMarkers.map(m => [m.temple.lat, m.temple.lng]));
        map.fitBounds(bounds, { padding: [60, 60], animate: true });
      }
    } else if (!city && !q) {
      // Reset to full Bay Area view
      map.setView([37.52, -121.95], 10, { animate: true });
    }
  }

  // ── Scroll to Card (from popup button) ──────────────────────
  function scrollToCard(idx) {
    // Close all popups
    map.closePopup();

    // Find the card with matching index
    const cards = document.querySelectorAll('.temple-card');
    const card = cards[idx];
    if (!card) return;

    // Scroll to card section first if not visible
    const templesSection = document.getElementById('temples');
    if (templesSection) {
      const rect = templesSection.getBoundingClientRect();
      if (rect.top < 0 || rect.top > window.innerHeight) {
        templesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => highlightCard(card), 600);
        return;
      }
    }
    highlightCard(card);
  }

  function highlightCard(card) {
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card.classList.add('map-highlight');
    setTimeout(() => card.classList.remove('map-highlight'), 2200);
  }

  // ── Public API ───────────────────────────────────────────────
  return { init, syncTheme, filterMarkers, scrollToCard };
})();
