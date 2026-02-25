// ============================================================
// Festival & Events Calendar
// Vanilla JS month-view calendar with event display.
//
// Data sources:
//   1. Static Hindu festivals (FESTIVALS array)
//   2. Ekadashi dates (from ekadashi.js)
//   3. Temple events (from assets/data/events.json)
//
// To replace mock events.json with real scraped data:
//   Update the JSON file at assets/data/events.json, keeping the
//   same schema: { temple, city, title, startDate, endDate, time, url }
// ============================================================

// Static major Hindu festivals 2025-2027
const FESTIVALS = [
  // 2025
  { name: 'Maha Shivratri',      date: '2025-02-26' },
  { name: 'Holi',                date: '2025-03-14' },
  { name: 'Ugadi / Gudi Padwa',  date: '2025-03-30' },
  { name: 'Ram Navami',          date: '2025-04-06' },
  { name: 'Hanuman Jayanti',     date: '2025-04-12' },
  { name: 'Akshaya Tritiya',     date: '2025-04-30' },
  { name: 'Rath Yatra',          date: '2025-06-27' },
  { name: 'Guru Purnima',        date: '2025-07-10' },
  { name: 'Nag Panchami',        date: '2025-07-27' },
  { name: 'Raksha Bandhan',      date: '2025-08-09' },
  { name: 'Janmashtami',         date: '2025-08-16' },
  { name: 'Ganesh Chaturthi',    date: '2025-08-27' },
  { name: 'Onam',                date: '2025-09-05' },
  { name: 'Navratri Begins',     date: '2025-09-22' },
  { name: 'Dussehra',            date: '2025-10-02' },
  { name: 'Karva Chauth',        date: '2025-10-10' },
  { name: 'Diwali',              date: '2025-10-20' },
  { name: 'Govardhan Puja',      date: '2025-10-21' },
  { name: 'Bhai Dooj',           date: '2025-10-23' },
  { name: 'Chhath Puja',         date: '2025-10-28' },
  { name: 'Vaikuntha Ekadashi',  date: '2025-12-01' },
  { name: 'Karthigai Deepam',    date: '2025-12-04' },
  // 2026
  { name: 'Makar Sankranti',     date: '2026-01-14' },
  { name: 'Pongal',              date: '2026-01-14' },
  { name: 'Maha Shivratri',      date: '2026-02-15' },
  { name: 'Holi',                date: '2026-03-03' },
  { name: 'Ugadi',               date: '2026-03-19' },
  { name: 'Ram Navami',          date: '2026-03-26' },
  { name: 'Hanuman Jayanti',     date: '2026-04-02' },
  { name: 'Akshaya Tritiya',     date: '2026-04-20' },
  { name: 'Rath Yatra',          date: '2026-07-16' },
  { name: 'Guru Purnima',        date: '2026-06-30' },
  { name: 'Raksha Bandhan',      date: '2026-08-28' },
  { name: 'Janmashtami',         date: '2026-09-04' },
  { name: 'Ganesh Chaturthi',    date: '2026-09-16' },
  { name: 'Navratri Begins',     date: '2026-10-11' },
  { name: 'Dussehra',            date: '2026-10-20' },
  { name: 'Diwali',              date: '2026-11-08' },
  { name: 'Govardhan Puja',      date: '2026-11-09' },
  { name: 'Bhai Dooj',           date: '2026-11-10' },
];

let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth();
let templeEvents = []; // Loaded from events.json

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/**
 * Load temple events from the static JSON file.
 */
async function loadTempleEvents() {
  try {
    const resp = await fetch('assets/data/events.json');
    if (!resp.ok) throw new Error('Failed to load events');
    templeEvents = await resp.json();
  } catch (e) {
    console.warn('Could not load events.json:', e.message);
    templeEvents = [];
  }
}

/**
 * Build a lookup map: 'YYYY-MM-DD' => [{ name, type, temple?, time?, url? }]
 */
function buildCalendarEvents() {
  const map = {};

  // Add static festivals
  FESTIVALS.forEach(f => {
    if (!map[f.date]) map[f.date] = [];
    map[f.date].push({ name: f.name, type: 'festival' });
  });

  // Add Ekadashi dates from the Ekadashi module
  if (window.Ekadashi) {
    window.Ekadashi.getEkadashiList().forEach(e => {
      const k = `${e.date.getUTCFullYear()}-${String(e.date.getUTCMonth() + 1).padStart(2, '0')}-${String(e.date.getUTCDate()).padStart(2, '0')}`;
      if (!map[k]) map[k] = [];
      map[k].push({ name: e.name, type: 'ekadashi' });
    });
  }

  // Add temple events from events.json
  templeEvents.forEach(e => {
    // Handle multi-day events
    const start = new Date(e.startDate + 'T00:00:00');
    const end = new Date(e.endDate + 'T00:00:00');
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!map[k]) map[k] = [];
      map[k].push({
        name: e.title,
        type: 'temple-event',
        temple: `${e.temple}, ${e.city}`,
        time: e.time,
        url: e.url
      });
    }
  });

  return map;
}

/**
 * Render the month-view calendar.
 */
function renderCalendar() {
  const evtMap = buildCalendarEvents();
  const today = new Date();
  const label = document.getElementById('calLabel');
  const grid = document.getElementById('calGrid');

  if (!label || !grid) return;

  label.textContent = `${MONTH_NAMES[calMonth]} ${calYear}`;

  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  let html = days.map(d => `<div class="cal-day-hdr">${d}</div>`).join('');

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const daysInPrev = new Date(calYear, calMonth, 0).getDate();

  // Previous month padding
  for (let i = 0; i < firstDay; i++) {
    const d = daysInPrev - firstDay + 1 + i;
    html += `<div class="cal-cell other-month"><div class="cal-date">${d}</div></div>`;
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dk = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const evts = evtMap[dk] || [];
    const isToday = today.getFullYear() === calYear && today.getMonth() === calMonth && today.getDate() === d;
    const hasEvt = evts.length > 0;

    html += `<div class="cal-cell${isToday ? ' today' : ''}${hasEvt ? ' has-event' : ''}">
      <div class="cal-date">${d}</div>
      ${evts.slice(0, 2).map(e =>
        `<div class="cal-event${e.type === 'ekadashi' ? ' ekadashi' : e.type === 'temple-event' ? ' temple-event' : ''}"
              onclick="Calendar.showEvent('${e.name.replace(/'/g, "\\'")}','${(e.temple || '').replace(/'/g, "\\'")}','${dk}','${(e.time || '').replace(/'/g, "\\'")}','${(e.url || '').replace(/'/g, "\\'")}')"
              title="${e.name}">${e.name}</div>`
      ).join('')}
      ${evts.length > 2 ? `<div style="font-size:.52rem;color:var(--gold);cursor:pointer" onclick="Calendar.showAllEvents('${dk}')">+${evts.length - 2} more</div>` : ''}
    </div>`;
  }

  // Next month padding
  const remaining = 42 - firstDay - daysInMonth;
  for (let d = 1; d <= remaining && d <= 14; d++) {
    html += `<div class="cal-cell other-month"><div class="cal-date">${d}</div></div>`;
  }

  grid.innerHTML = html;

  // Render upcoming events list
  renderUpcomingEvents(evtMap);
}

/**
 * Show event details in the tooltip modal.
 */
function showEvent(name, temple, date, time, url) {
  const titleEl = document.getElementById('tipTitle');
  const bodyEl = document.getElementById('tipBody');
  if (!titleEl || !bodyEl) return;

  titleEl.textContent = name;
  bodyEl.innerHTML = `
    <strong>Date:</strong> ${date}<br>
    ${temple ? `<strong>Temple:</strong> ${temple}<br>` : ''}
    ${time ? `<strong>Time:</strong> ${time}<br>` : ''}
    ${url ? `<br><a href="${url}" target="_blank" rel="noopener" style="color:var(--saffron)">View on temple website &rarr;</a><br>` : ''}
    <br><em style="color:var(--text-muted);font-size:.85rem">Check with your local temple for exact program schedule.</em>
  `;
  document.getElementById('tooltipOverlay')?.classList.add('show');
}

/**
 * Show all events for a given date.
 */
function showAllEvents(date) {
  const evtMap = buildCalendarEvents();
  const evts = evtMap[date] || [];
  const titleEl = document.getElementById('tipTitle');
  const bodyEl = document.getElementById('tipBody');
  if (!titleEl || !bodyEl) return;

  titleEl.textContent = `Events on ${date}`;
  bodyEl.innerHTML = evts.map(e =>
    `<div style="margin-bottom:.5rem;padding:.5rem;background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:6px">
      <strong style="color:var(--saffron)">${e.name}</strong>
      ${e.temple ? `<br><span style="font-size:.8rem;color:var(--text-muted)">${e.temple}</span>` : ''}
      ${e.time ? `<br><span style="font-size:.75rem;color:var(--text-muted)">${e.time}</span>` : ''}
    </div>`
  ).join('');
  document.getElementById('tooltipOverlay')?.classList.add('show');
}

/**
 * Render the "Upcoming Events" compact list below the calendar.
 */
function renderUpcomingEvents(evtMap) {
  const container = document.getElementById('upcomingList');
  if (!container) return;

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Collect all events from today onward, sorted by date
  const allEvents = [];
  Object.keys(evtMap).sort().forEach(dateKey => {
    if (dateKey >= todayStr) {
      evtMap[dateKey].forEach(evt => {
        allEvents.push({ ...evt, date: dateKey });
      });
    }
  });

  // Show first 8 upcoming
  const upcoming = allEvents.slice(0, 8);
  if (upcoming.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted);font-style:italic;font-size:.88rem">No upcoming events found.</p>';
    return;
  }

  container.innerHTML = upcoming.map(e => {
    const d = new Date(e.date + 'T12:00:00');
    return `<div class="upcoming-item">
      <div class="upcoming-date-badge">
        <div class="month">${MONTH_SHORT[d.getMonth()]}</div>
        <div class="day">${d.getDate()}</div>
      </div>
      <div class="upcoming-info">
        <div class="event-title">${e.name}</div>
        <div class="event-meta">${e.temple || 'Hindu Festival'}${e.time ? ' &bull; ' + e.time : ''}</div>
      </div>
    </div>`;
  }).join('');
}

function closeTooltip(e) {
  if (e.target === document.getElementById('tooltipOverlay')) {
    document.getElementById('tooltipOverlay')?.classList.remove('show');
  }
}

// Calendar navigation
function prevMonth() {
  calMonth--;
  if (calMonth < 0) { calMonth = 11; calYear--; }
  renderCalendar();
}

function nextMonth() {
  calMonth++;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  renderCalendar();
}

// Export
window.Calendar = {
  loadTempleEvents,
  render: renderCalendar,
  showEvent,
  showAllEvents,
  closeTooltip,
  prevMonth,
  nextMonth
};
