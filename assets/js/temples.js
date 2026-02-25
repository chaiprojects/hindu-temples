// ============================================================
// Temples Data & Rendering
// Bay Area Hindu Temples from Concord to San Jose
//
// To update temple data: modify the TEMPLES array below.
// Each entry must have: name, address, city, rating, reviews,
// hours, deity, and optionally url (official website).
// ============================================================

const TEMPLES = [
  // ── Concord ──────────────────────────────────────────────────
  {
    name: 'Shiva Murugan Temple',
    address: '1803 2nd St, Concord, CA 94519',
    city: 'Concord',
    rating: 4.9,
    reviews: 957,
    // Evening starts 6 PM (not 5:30); weekends close 9 PM
    hours: 'Mon\u2013Fri: 10 AM\u201312 PM, 6\u20139 PM | Sat\u2013Sun: 10 AM\u20139 PM',
    deity: 'Lord Shiva & Murugan',
    url: 'https://shivamurugan.org'
  },
  // ── Berkeley ──────────────────────────────────────────────────
  {
    name: 'ISKCON Berkeley',
    address: '2334 Stuart St, Berkeley, CA 94705',
    city: 'Berkeley',
    rating: 4.7,
    reviews: 236,
    hours: 'Daily: 4:30 AM\u20138:30 PM (Sun till 9 PM)',
    deity: 'Sri Sri Jagannath Baladeva Subhadra',
    url: 'https://iskconberkeley.us'
  },
  // ── San Leandro ───────────────────────────────────────────────
  {
    name: 'Badarikashrama',
    address: '15602 Maubert Ave, San Leandro, CA 94578',
    city: 'San Leandro',
    rating: 4.7,
    reviews: 63,
    // Opens 7:30 AM (not 8); evening 4:30 PM (not 5); same schedule weekdays & weekends
    hours: 'Mon\u2013Wed, Fri\u2013Sun: 7:30 AM\u201312 PM, 4:30\u20137:30 PM (Closed Thu)',
    deity: 'Multi-deity Ashrama',
    url: 'https://badarikashrama.org'
  },
  // ── Hayward ───────────────────────────────────────────────────
  {
    name: 'Vijay\'s Sherawali Temple',
    address: '20789 Garden Ave, Hayward, CA 94541',
    city: 'Hayward',
    rating: 4.8,
    reviews: 22,
    hours: 'Mon\u2013Tue: 10:30 AM\u20131 PM, 4\u20138 PM | Fri: 6\u20138 PM | Sat\u2013Sun: 10:30 AM\u20131 PM, 4\u20139 PM',
    deity: 'Mata Sherawali',
    url: ''
  },
  // ── Fremont ───────────────────────────────────────────────────
  {
    name: 'Vedic Dharma Samaj Hindu Temple',
    address: '3676 Delaware Dr, Fremont, CA 94538',
    city: 'Fremont',
    rating: 4.6,
    reviews: 704,
    hours: 'Mon\u2013Fri: 9:30 AM\u20131 PM, 5:30\u20138:30 PM | Sat\u2013Sun: 9:30 AM\u20138:30 PM',
    deity: 'Multi-deity North Indian',
    url: 'https://fremonttemple.org'
  },
  {
    name: 'Sri Siddhi Vinayaka Cultural Center',
    address: '40155 Blacow Rd, Fremont, CA 94538',
    city: 'Fremont',
    rating: 4.8,
    reviews: 1728,
    hours: 'Mon\u2013Fri: 9 AM\u201312 PM, 5:30\u20138:30 PM | Sat\u2013Sun: 9 AM\u20138 PM',
    deity: 'Lord Ganesha (Vinayaka)',
    url: 'https://www.svcctemple.org'
  },
  {
    name: 'Karya Siddhi Hanuman Temple',
    address: '4300 Hansen Ave, Fremont, CA 94536',
    city: 'Fremont',
    rating: 4.5,
    reviews: 39,
    // Weekday morning opens 8 AM (not 8:30); weekends till 1 PM (not 12)
    hours: 'Mon\u2013Fri: 8\u201310 AM, 6:30\u20138 PM | Sat\u2013Sun: 9 AM\u20131 PM, 6\u20138 PM',
    deity: 'Lord Hanuman',
    url: 'https://www.sgshanuman.org'
  },
  // ── Newark ────────────────────────────────────────────────────
  {
    name: 'Sankata Mochana Hanuman Temple',
    address: '35463 Dumbarton Ct, Newark, CA 94560',
    city: 'Newark',
    rating: 4.6,
    reviews: 169,
    hours: 'Mon\u2013Fri: 7\u20139 PM | Sat\u2013Sun: 11 AM\u20131 PM, 7\u20139 PM',
    deity: 'Lord Hanuman',
    url: 'https://bayareahanumantemple.com'
  },
  // ── Milpitas ──────────────────────────────────────────────────
  {
    name: 'Sri Satya Narayana Swamy Devasthanam',
    address: '475 Los Coches St, Milpitas, CA 95035',
    city: 'Milpitas',
    rating: 4.8,
    reviews: 576,
    hours: 'Mon\u2013Fri: 10 AM\u20131 PM, 5:30\u20139 PM | Sat\u2013Sun: 9 AM\u20139 PM',
    deity: 'Sri Satya Narayana Swamy',
    url: 'https://www.siliconvalleytemple.net'
  },
  {
    name: 'Sri Krishna Balaram Mandir',
    address: '680 E Calaveras Blvd, Milpitas, CA 95035',
    city: 'Milpitas',
    rating: 4.8,
    reviews: 315,
    // Evening 5:30 PM (not 5); Sun has a break unlike Sat
    hours: 'Mon\u2013Fri: 7:30 AM\u20131 PM, 5:30\u20138:30 PM | Sat: 7:30 AM\u20138:30 PM | Sun: 7:30 AM\u20131 PM, 5:30\u20138:30 PM',
    deity: 'Sri Sri Krishna Balaram',
    url: 'https://www.kbmandir.org'
  },
  {
    name: 'Shirdi Sai Parivaar',
    address: '1221 California Cir, Milpitas, CA 95035',
    city: 'Milpitas',
    rating: 4.7,
    reviews: 198,
    hours: 'Mon\u2013Wed, Fri: 6:15\u20137:45 AM, 11:45 AM\u20131 PM, 6\u20139 PM | Thu, Sat\u2013Sun: 6:15 AM\u20139 PM',
    deity: 'Shirdi Sai Baba',
    url: 'https://shirdisaiparivaar.org'
  },
  {
    name: 'Seva Sharadamba Temple',
    address: '1633 S Main St, Milpitas, CA 95035',
    city: 'Milpitas',
    rating: 4.8,
    reviews: 50,
    hours: 'Mon\u2013Fri: 6\u20138 PM | Sat\u2013Sun: 5:30\u20138:30 PM',
    deity: 'Sri Sharadamba (Saraswathi)',
    url: 'https://sharadaseva.org'
  },
  {
    name: 'BAPS Shri Swaminarayan Mandir',
    address: '1430 California Cir, Milpitas, CA 95035',
    city: 'Milpitas',
    rating: 4.8,
    reviews: 1077,
    // Closes 8:30 PM (not 8 PM)
    hours: 'Mon\u2013Fri: 7 AM\u201312 PM, 4\u20138:30 PM | Sat\u2013Sun: 7 AM\u20138:30 PM',
    deity: 'Swaminarayan, Shiva, Krishna, Rama',
    url: 'https://baps.org'
  },
  // ── Sunnyvale ─────────────────────────────────────────────────
  {
    name: 'Hindu Temple & Community Center',
    address: '450 Persian Dr, Sunnyvale, CA 94089',
    city: 'Sunnyvale',
    rating: 4.7,
    reviews: 3201,
    hours: 'Daily: 9 AM\u20139 PM',
    deity: 'Multi-deity (North & South Indian)',
    url: 'https://www.sunnyvale-hindutemple.org'
  },
  {
    name: 'Shirdi Sai Darbar',
    address: '255 San Geronimo Way, Sunnyvale, CA 94085',
    city: 'Sunnyvale',
    rating: 4.8,
    reviews: 1238,
    // Opens 6:15 AM continuously; Thu stays open till 9:30 PM
    hours: 'Mon\u2013Wed, Fri\u2013Sun: 6:15 AM\u20139 PM | Thu: 6:15 AM\u20139:30 PM',
    deity: 'Shirdi Sai Baba',
    url: 'https://shirdisaidarbar.org'
  },
  // ── Santa Clara ───────────────────────────────────────────────
  {
    name: 'Shiv Durga Temple of Bay Area',
    address: '3550 Flora Vista Ave, Santa Clara, CA 95051',
    city: 'Santa Clara',
    rating: 4.7,
    reviews: 439,
    // Same hours every day (weekday/weekend distinction was incorrect)
    hours: 'Daily: 9 AM\u201312:30 PM, 5\u20138:30 PM',
    deity: 'Lord Shiva & Durga Mata',
    url: 'https://shivdurgatemple.org'
  },
  {
    name: 'Sri Maha Kaleshwar Mandir',
    address: '2nd floor, 1790 Woodhaven Pl, Santa Clara, CA 95051',
    city: 'Santa Clara',
    rating: 4.6,
    reviews: 85,
    hours: 'Check website for latest timings',
    deity: 'Lord Shiva (Mahakaleshwar)',
    url: ''
  },
  // ── Saratoga ──────────────────────────────────────────────────
  {
    name: 'Saratoga Hindu Temple & Community Center',
    address: '18870 Allendale Ave, Saratoga, CA 95070',
    city: 'Saratoga',
    rating: 4.7,
    reviews: 520,
    hours: 'Mon\u2013Fri: 9 AM\u20131 PM, 5\u20138:30 PM | Sat\u2013Sun: 9 AM\u20138:30 PM',
    deity: 'Multi-deity',
    url: 'http://www.saratogatemple.org'
  },
  // ── San Jose ──────────────────────────────────────────────────
  {
    name: 'Nithyanandeshwara Hindu Temple',
    address: '120 Barnard Ave, San Jose, CA 95112',
    city: 'San Jose',
    rating: 4.5,
    reviews: 120,
    hours: 'Check website for latest timings',
    deity: 'Nithyanandeshwara & Nithyanandeshwari',
    url: ''
  },
  {
    name: 'Shri Lakshmi Ganpati Temple',
    address: '2759 S King Rd, San Jose, CA 95122',
    city: 'San Jose',
    rating: 4.6,
    reviews: 245,
    hours: 'Mon\u2013Fri: 9 AM\u20131 PM, 5\u20138:30 PM | Sat\u2013Sun: 9 AM\u20138:30 PM',
    deity: 'Lakshmi & Ganpati',
    url: ''
  },
  {
    name: 'Balaji Temple (Matha)',
    address: '5004 N First St, San Jose, CA 95002',
    city: 'San Jose',
    rating: 4.4,
    reviews: 213,
    // Weekday opens 9 AM (not 8 AM); continuous hours on weekdays
    hours: 'Mon\u2013Fri: 9 AM\u20138:30 PM | Sat\u2013Sun: 7:30 AM\u20138:30 PM',
    deity: 'Sri Venkateswara (Balaji) & Hanuman',
    url: 'https://balajitemple.net'
  },
  {
    name: 'Mandir Shreemaya Krishnadham',
    address: '175 Nortech Pkwy, San Jose, CA 95134',
    city: 'San Jose',
    rating: 4.7,
    reviews: 420,
    hours: 'Mon\u2013Fri: 11:30 AM\u20131:30 PM, 4:30\u20137 PM | Sat\u2013Sun: 11:30 AM\u20131:30 PM, 4\u20136:30 PM',
    deity: 'Sri Krishna',
    url: ''
  }
];

/**
 * Generate star rating HTML.
 */
function starsHtml(r) {
  const f = Math.floor(r);
  const h = r % 1 >= 0.5 ? 1 : 0;
  const e = 5 - f - h;
  return '\u2605'.repeat(f) + (h ? '\u2BE8' : '') + '\u2606'.repeat(e);
}

/**
 * Render temple cards into the grid.
 */
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

  grid.innerHTML = list.map(t => {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(t.name + ' ' + t.address)}`;
    const siteLink = t.url
      ? `<a class="t-link" href="${t.url}" target="_blank" rel="noopener" aria-label="Visit ${t.name} website">🔗 Official Website</a>`
      : '';
    return `<article class="temple-card">
      <span class="t-icon" aria-hidden="true">🛕</span>
      <h3 class="t-name">${t.name}</h3>
      <div class="t-addr">📍 ${t.address}</div>
      <div class="t-deity">✦ ${t.deity}</div>
      <div class="t-rating">
        <span class="stars" aria-label="${t.rating} out of 5 stars">${starsHtml(t.rating)}</span>
        <span class="rnum">${t.rating} (${t.reviews.toLocaleString()})</span>
      </div>
      <div class="t-hours"><span class="hlbl">Hours</span>${t.hours}</div>
      ${siteLink}
      <a class="t-link" href="${mapsUrl}" target="_blank" rel="noopener" aria-label="Open ${t.name} in Google Maps">🗺 Open in Google Maps</a>
    </article>`;
  }).join('');
}

/**
 * Filter temples by search text and city.
 */
function filterTemples() {
  const q = (document.getElementById('searchBar')?.value || '').toLowerCase();
  const cityFilter = document.getElementById('cityFilter')?.value || '';

  renderTemples(TEMPLES.filter(t => {
    const matchesSearch = !q ||
      t.name.toLowerCase().includes(q) ||
      t.city.toLowerCase().includes(q) ||
      t.deity.toLowerCase().includes(q) ||
      t.address.toLowerCase().includes(q);
    const matchesCity = !cityFilter || t.city === cityFilter;
    return matchesSearch && matchesCity;
  }));
}

/**
 * Populate the city filter dropdown with unique cities.
 */
function populateCityFilter() {
  const select = document.getElementById('cityFilter');
  if (!select) return;

  const cities = [...new Set(TEMPLES.map(t => t.city))].sort();
  cities.forEach(city => {
    const opt = document.createElement('option');
    opt.value = city;
    opt.textContent = city;
    select.appendChild(opt);
  });
}

// Export
window.Temples = {
  TEMPLES,
  renderTemples,
  filterTemples,
  populateCityFilter
};
