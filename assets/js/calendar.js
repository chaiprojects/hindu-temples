// ============================================================
// Festival & Events Calendar
//
// Merges three sources into one month view:
//   1. Hindu festivals  — computed by panchang.js for the user's
//                         location (no hard-coded date list, so the
//                         calendar never runs out of years)
//   2. Ekadashi dates   — from ekadashi.js
//   3. Temple events    — assets/data/events.json, refreshed from
//                         the temples' own feeds by CI
//
// Temple event text comes from third-party websites, so everything
// rendered here is HTML-escaped and event handlers are attached by
// delegation rather than built into markup.
// ============================================================

let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth();
let templeEvents = [];
let eventsMeta = null;
let _evtMapCache = null;
let _evtMapKey = '';

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const esc = s => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const dateKey = d =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function addDaysStr(dateStr, n) {
  const d = new Date(dateStr + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * Load temple events. Accepts both the current
 * { generatedAt, events: [...] } shape and the older bare array.
 */
async function loadTempleEvents() {
  try {
    const resp = await fetch('assets/data/events.json', { cache: 'no-cache' });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const data = await resp.json();
    if (Array.isArray(data)) {
      templeEvents = data;
      eventsMeta = null;
    } else {
      templeEvents = Array.isArray(data.events) ? data.events : [];
      eventsMeta = data;
    }
  } catch (e) {
    console.warn('Could not load events.json:', e.message);
    templeEvents = [];
    eventsMeta = null;
  }
  _evtMapCache = null;
}

/**
 * Build 'YYYY-MM-DD' => [event] for a date range.
 * Festivals are computed on demand; panchang.js memoises per year, so
 * paging through months stays cheap.
 */
function buildCalendarEvents(fromDate, toDate) {
  // Ekadashi dates are computed off the main thread and land after the
  // first render, so their count is part of the key — otherwise the
  // re-render would serve a cached map that predates them.
  const ekCount = window.Ekadashi ? window.Ekadashi.getEkadashiList().length : 0;
  const key = `${fromDate}|${toDate}|${templeEvents.length}|${ekCount}`;
  if (_evtMapCache && _evtMapKey === key) return _evtMapCache;

  const map = {};
  const push = (k, evt) => { (map[k] || (map[k] = [])).push(evt); };

  // 1. Computed festivals
  if (window.Panchang) {
    try {
      const loc = typeof userLocation !== 'undefined' ? userLocation : undefined;
      for (const f of window.Panchang.festivalsBetween(fromDate, toDate, loc)) {
        push(f.date, { name: f.name, type: 'festival', note: f.note });
      }
    } catch (e) {
      console.warn('Festival computation failed:', e.message);
    }
  }

  // 2. Ekadashi
  if (window.Ekadashi) {
    for (const e of window.Ekadashi.getEkadashiList()) {
      const k = `${e.date.getUTCFullYear()}-${String(e.date.getUTCMonth() + 1).padStart(2, '0')}-${String(e.date.getUTCDate()).padStart(2, '0')}`;
      if (k >= fromDate && k <= toDate) push(k, { name: e.name, type: 'ekadashi' });
    }
  }

  // 3. Temple events (multi-day events occupy every day they span)
  for (const e of templeEvents) {
    if (!e || !e.startDate) continue;
    const end = e.endDate && e.endDate >= e.startDate ? e.endDate : e.startDate;
    for (let d = e.startDate; d <= end; d = addDaysStr(d, 1)) {
      if (d < fromDate || d > toDate) continue;
      push(d, {
        name: e.title,
        type: 'temple-event',
        temple: e.city ? `${e.temple}, ${e.city}` : e.temple,
        time: e.time,
        url: e.url
      });
      if (end === d) break;
    }
  }

  _evtMapCache = map;
  _evtMapKey = key;
  return map;
}

/** Range covering both the displayed month and the upcoming-events window. */
function activeRange() {
  const mm = String(calMonth + 1).padStart(2, '0');
  const monthStart = `${calYear}-${mm}-01`;
  const monthEnd = `${calYear}-${mm}-${String(new Date(calYear, calMonth + 1, 0).getDate()).padStart(2, '0')}`;
  const today = dateKey(new Date());
  return [
    monthStart < today ? monthStart : today,
    monthEnd > addDaysStr(today, 200) ? monthEnd : addDaysStr(today, 200)
  ];
}

function renderCalendar() {
  const [from, to] = activeRange();
  const evtMap = buildCalendarEvents(from, to);
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

  for (let i = 0; i < firstDay; i++) {
    const d = daysInPrev - firstDay + 1 + i;
    html += `<div class="cal-cell other-month"><div class="cal-date">${d}</div></div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dk = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const evts = evtMap[dk] || [];
    const isToday = today.getFullYear() === calYear && today.getMonth() === calMonth && today.getDate() === d;

    html += `<div class="cal-cell${isToday ? ' today' : ''}${evts.length ? ' has-event' : ''}">
      <div class="cal-date">${d}</div>
      ${evts.slice(0, 2).map((e, i) => {
        const cls = e.type === 'ekadashi' ? ' ekadashi' : e.type === 'temple-event' ? ' temple-event' : '';
        return `<div class="cal-event${cls}" role="button" tabindex="0"
                     data-date="${dk}" data-idx="${i}"
                     title="${esc(e.name)}">${esc(e.name)}</div>`;
      }).join('')}
      ${evts.length > 2
        ? `<div class="cal-more" role="button" tabindex="0" data-date="${dk}" data-all="1"
                style="font-size:.52rem;color:var(--gold);cursor:pointer">+${evts.length - 2} more</div>`
        : ''}
    </div>`;
  }

  const remaining = 42 - firstDay - daysInMonth;
  for (let d = 1; d <= remaining && d <= 14; d++) {
    html += `<div class="cal-cell other-month"><div class="cal-date">${d}</div></div>`;
  }

  grid.innerHTML = html;
  renderUpcomingEvents(evtMap);
  renderEventsMeta();
}

/** Provenance line: when the temple events were last refreshed. */
function renderEventsMeta() {
  const el = document.getElementById('eventsMeta');
  if (!el) return;
  if (!eventsMeta || !eventsMeta.generatedAt) { el.textContent = ''; return; }
  const when = new Date(eventsMeta.generatedAt);
  if (isNaN(when)) { el.textContent = ''; return; }
  const c = eventsMeta.counts || {};
  const n = c.total != null ? c.total : templeEvents.length;
  el.textContent = `${n} temple event${n === 1 ? '' : 's'} · updated ${when.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

function openModal(title, bodyHtml) {
  const titleEl = document.getElementById('tipTitle');
  const bodyEl = document.getElementById('tipBody');
  if (!titleEl || !bodyEl) return;
  titleEl.textContent = title;
  bodyEl.innerHTML = bodyHtml;
  document.getElementById('tooltipOverlay')?.classList.add('show');
}

function eventCardHtml(e, date) {
  return `
    <strong>Date:</strong> ${esc(date)}<br>
    ${e.temple ? `<strong>Temple:</strong> ${esc(e.temple)}<br>` : ''}
    ${e.time ? `<strong>Time:</strong> ${esc(e.time)}<br>` : ''}
    ${e.note ? `<em style="color:var(--text-muted)">${esc(e.note)}</em><br>` : ''}
    ${e.url ? `<br><a href="${esc(e.url)}" target="_blank" rel="noopener" style="color:var(--saffron)">View on temple website &rarr;</a><br>` : ''}
    <br><em style="color:var(--text-muted);font-size:.85rem">${e.type === 'temple-event'
      ? 'Listed from the temple&rsquo;s own calendar. Confirm before travelling.'
      : 'Festival date computed for your location; temples may observe it a day either side.'}</em>`;
}

function showEventAt(date, idx) {
  const [from, to] = activeRange();
  const e = (buildCalendarEvents(from, to)[date] || [])[idx];
  if (!e) return;
  openModal(e.name, eventCardHtml(e, date));
}

function showAllEvents(date) {
  const [from, to] = activeRange();
  const evts = buildCalendarEvents(from, to)[date] || [];
  openModal(`Events on ${date}`, evts.map(e =>
    `<div style="margin-bottom:.5rem;padding:.5rem;background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:6px">
      <strong style="color:var(--saffron)">${esc(e.name)}</strong>
      ${e.temple ? `<br><span style="font-size:.8rem;color:var(--text-muted)">${esc(e.temple)}</span>` : ''}
      ${e.time ? `<br><span style="font-size:.75rem;color:var(--text-muted)">${esc(e.time)}</span>` : ''}
      ${e.url ? `<br><a href="${esc(e.url)}" target="_blank" rel="noopener" style="font-size:.75rem;color:var(--saffron)">Details &rarr;</a>` : ''}
    </div>`
  ).join(''));
}

function renderUpcomingEvents(evtMap) {
  const container = document.getElementById('upcomingList');
  if (!container) return;

  const todayStr = dateKey(new Date());
  const upcoming = [];
  // A multi-day event occupies every day it spans in the calendar grid, but
  // should appear in this list once, on the first day still ahead.
  const seen = new Set();
  for (const k of Object.keys(evtMap).sort()) {
    if (k < todayStr) continue;
    evtMap[k].forEach((evt, idx) => {
      const id = `${evt.name}|${evt.temple || ''}`;
      if (seen.has(id)) return;
      seen.add(id);
      upcoming.push({ ...evt, date: k, idx });
    });
    if (upcoming.length >= 8) break;
  }

  if (!upcoming.length) {
    container.innerHTML = '<p style="color:var(--text-muted);font-style:italic;font-size:.88rem">No upcoming events found.</p>';
    return;
  }

  container.innerHTML = upcoming.slice(0, 8).map(e => {
    const d = new Date(e.date + 'T12:00:00');
    return `<div class="upcoming-item" role="button" tabindex="0"
                 data-date="${e.date}" data-idx="${e.idx}">
      <div class="upcoming-date-badge">
        <div class="month">${MONTH_SHORT[d.getMonth()]}</div>
        <div class="day">${d.getDate()}</div>
      </div>
      <div class="upcoming-info">
        <div class="event-title">${esc(e.name)}</div>
        <div class="event-meta">${esc(e.temple || 'Hindu Festival')}${e.time ? ' &bull; ' + esc(e.time) : ''}</div>
      </div>
    </div>`;
  }).join('');
}

function closeTooltip(e) {
  if (!e || e.target === document.getElementById('tooltipOverlay')) {
    document.getElementById('tooltipOverlay')?.classList.remove('show');
  }
}

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

/** Recompute when the user's location changes — festival dates depend on it. */
function onLocationChange() {
  window.Panchang?.clearCache();
  _evtMapCache = null;
  renderCalendar();
}

// Delegated handlers, so scraped titles never end up inside markup.
document.addEventListener('click', handleActivate);
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') handleActivate(e);
  if (e.key === 'Escape') closeTooltip(null);
});

function handleActivate(e) {
  const el = e.target.closest?.('[data-date]');
  if (!el) return;
  e.preventDefault();
  if (el.dataset.all) showAllEvents(el.dataset.date);
  else showEventAt(el.dataset.date, +el.dataset.idx || 0);
}

window.Calendar = {
  loadTempleEvents,
  render: renderCalendar,
  showEvent: showEventAt,
  showAllEvents,
  closeTooltip,
  prevMonth,
  nextMonth,
  onLocationChange
};
