#!/usr/bin/env node
// ============================================================
// Refreshes assets/data/events.json from the temples' own websites.
//
// Run by .github/workflows/update-data.yml on a schedule; the
// workflow commits the result, so the published calendar keeps
// itself current with no manual editing.
//
// Each temple in assets/data/temples.json may declare a feed. Very few
// Bay Area temple sites publish a standard calendar format, so alongside
// the generic parsers there are adapters for the shapes these particular
// temples actually ship:
//   'tribe'       WordPress "The Events Calendar" REST API
//   'ics'         an iCalendar file
//   'gcal'        a public Google Calendar id
//   'jsonld'      schema.org Event blocks in a page's HTML
//   'rss'         JEvents/Joomla RSS, date encoded in the item title
//   'wp-rest'     WordPress custom post type with the date in an ACF field
//   'squarespace' Squarespace ?format=json-pretty events collection
//   'seva-json'   a site's own JSON events API
//   'js-data'     a static per-year JS data file of festivals
// Temples with no machine-readable feed at all are covered by the
// hand-maintained assets/data/events-curated.json.
//
// Design notes:
//  - A feed that fails is NOT treated as "no events". The previous
//    run's future events for that temple are carried forward, so a
//    site being down for a day never blanks out the calendar.
//  - Nothing here invents data. Every event traces to a fetched
//    feed or to the curated file.
//
// Usage: node scripts/update-events.mjs [--dry-run] [--only <slug>]
// ============================================================

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'assets', 'data');
const TZ = 'America/Los_Angeles';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const ONLY = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;

const WINDOW_DAYS = 400;      // how far ahead to keep events
const MAX_PER_TEMPLE = 40;    // guard against a runaway feed
const MAX_PER_SERIES = 3;     // keep only the next few of a repeating series
const FETCH_TIMEOUT_MS = 20000;
const UA = 'bay-area-hindu-temples-bot/1.0 (+https://github.com/chaiprojects/hindu-temples)';

// ── date helpers (all civil dates are Pacific) ──────────────
const todayStr = () => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
const isDate = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);

function fmtTime(h, m) {
  const ap = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:${String(m).padStart(2, '0')} ${ap}`;
}

/** Civil date + wall time in `TZ` for a UTC instant. */
function toLocalParts(dateObj) {
  const p = {};
  for (const part of new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  }).formatToParts(dateObj)) p[part.type] = part.value;
  return {
    date: `${p.year}-${p.month}-${p.day}`,
    hour: (+p.hour) % 24,
    minute: +p.minute
  };
}

// ── networking ──────────────────────────────────────────────
async function get(url, accept = 'text/html,application/xhtml+xml,*/*') {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: ctl.signal,
      headers: { 'User-Agent': UA, Accept: accept }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

const decodeEntities = s => String(s)
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
  .replace(/&#0?39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');

const clean = s => decodeEntities(String(s ?? ''))
  .replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * Some temples publish an event whose title is really its URL slug
 * ("saisatcharitra-parayan"). Presenting that verbatim looks broken, so a
 * title that is entirely lowercase-hyphenated is spaced and capitalised.
 * Anything with a space is left exactly as the temple wrote it.
 */
function prettifyTitle(t) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)+$/.test(t)) return t;
  return t.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// ── feed parsers ────────────────────────────────────────────

/** WordPress "The Events Calendar" REST API. */
async function fromTribe(feedUrl) {
  const url = new URL(feedUrl);
  url.searchParams.set('per_page', '50');
  url.searchParams.set('start_date', todayStr());
  const body = await get(url.toString(), 'application/json');
  const json = JSON.parse(body);
  const list = Array.isArray(json.events) ? json.events : [];
  return list.map(e => {
    const start = String(e.start_date || '').slice(0, 10);
    const end = String(e.end_date || '').slice(0, 10) || start;
    let time = null;
    if (!e.all_day && /\d{2}:\d{2}/.test(e.start_date || '')) {
      const [h, m] = e.start_date.slice(11, 16).split(':').map(Number);
      time = fmtTime(h, m);
      if (e.end_date && e.end_date.slice(0, 10) === start) {
        const [h2, m2] = e.end_date.slice(11, 16).split(':').map(Number);
        time += ` – ${fmtTime(h2, m2)}`;
      }
    }
    return { title: clean(e.title), startDate: start, endDate: end, time, url: e.url || null };
  });
}

/** Minimal RRULE expansion — enough for weekly/monthly temple programmes. */
function expandRecurrence(rrule, startDate, windowEnd) {
  const parts = Object.fromEntries(
    rrule.split(';').map(kv => kv.split('=')).filter(kv => kv.length === 2)
  );
  const freq = parts.FREQ;
  if (!freq) return [startDate];
  const interval = Math.max(1, parseInt(parts.INTERVAL || '1', 10));
  const count = parts.COUNT ? parseInt(parts.COUNT, 10) : null;
  const until = parts.UNTIL ? parts.UNTIL.slice(0, 4) + '-' + parts.UNTIL.slice(4, 6) + '-' + parts.UNTIL.slice(6, 8) : null;
  const limit = until && until < windowEnd ? until : windowEnd;

  const DAYS = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
  const byDay = (parts.BYDAY || '').split(',').map(d => DAYS[d.slice(-2)]).filter(d => d !== undefined);

  const out = [];
  let cur = startDate;
  for (let i = 0; i < 400 && cur <= limit; i++) {
    if (freq === 'WEEKLY' && byDay.length) {
      const weekStart = addDays(cur, -new Date(cur + 'T12:00:00Z').getUTCDay());
      for (const d of byDay) {
        const occ = addDays(weekStart, d);
        if (occ >= startDate && occ <= limit) out.push(occ);
      }
      cur = addDays(cur, 7 * interval);
    } else {
      out.push(cur);
      cur = freq === 'DAILY' ? addDays(cur, interval)
          : freq === 'WEEKLY' ? addDays(cur, 7 * interval)
          : freq === 'MONTHLY' ? shiftMonths(cur, interval)
          : freq === 'YEARLY' ? shiftMonths(cur, 12 * interval)
          : limit + 'x';
    }
    if (count && out.length >= count) break;
  }
  return [...new Set(out)].sort().slice(0, count || 60);
}

function shiftMonths(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1 + n, 1));
  const lastDay = new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth() + 1, 0)).getUTCDate();
  dt.setUTCDate(Math.min(d, lastDay));
  return dt.toISOString().slice(0, 10);
}

/** iCalendar (.ics). Handles line folding, DATE vs DATE-TIME, UTC, simple RRULEs. */
function parseICS(text, windowEnd) {
  const unfolded = text.replace(/\r\n/g, '\n').replace(/\n[ \t]/g, '');
  const out = [];
  const blocks = unfolded.split('BEGIN:VEVENT').slice(1);

  for (const block of blocks) {
    const body = block.split('END:VEVENT')[0];
    const props = {};
    for (const line of body.split('\n')) {
      const idx = line.indexOf(':');
      if (idx < 0) continue;
      const rawName = line.slice(0, idx);
      const value = line.slice(idx + 1);
      const [name, ...params] = rawName.split(';');
      props[name.toUpperCase()] = { value, params: params.join(';') };
    }
    if (!props.DTSTART) continue;

    const parseDT = p => {
      if (!p) return null;
      const v = p.value.trim();
      const dateOnly = /^\d{8}$/.test(v);
      if (dateOnly) {
        return { date: `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}`, hour: null, minute: null };
      }
      const m = v.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/);
      if (!m) return null;
      if (m[7] === 'Z') {
        return toLocalParts(new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6])));
      }
      // A TZID is present (or the value is floating). Every temple in this
      // directory is in Pacific time, so the wall clock is already local.
      return { date: `${m[1]}-${m[2]}-${m[3]}`, hour: +m[4], minute: +m[5] };
    };

    const start = parseDT(props.DTSTART);
    if (!start) continue;
    const end = parseDT(props.DTEND) || start;

    let time = null;
    if (start.hour !== null) {
      time = fmtTime(start.hour, start.minute);
      if (end.hour !== null && end.date === start.date) time += ` – ${fmtTime(end.hour, end.minute)}`;
    }

    // An all-day DTEND is exclusive in iCalendar.
    let endDate = end.date;
    if (start.hour === null && endDate > start.date) endDate = addDays(endDate, -1);

    const title = clean(props.SUMMARY?.value || '');
    if (!title) continue;
    const url = props.URL?.value?.trim() || null;
    const span = Math.max(0, (new Date(endDate) - new Date(start.date)) / 86400000);

    const dates = props.RRULE
      ? expandRecurrence(props.RRULE.value.trim(), start.date, windowEnd)
      : [start.date];

    for (const d of dates) {
      out.push({ title, startDate: d, endDate: span ? addDays(d, span) : d, time, url });
    }
  }
  return out;
}

async function fromICS(feedUrl, windowEnd) {
  return parseICS(await get(feedUrl, 'text/calendar,*/*'), windowEnd);
}

async function fromGCal(calendarId, windowEnd) {
  const id = encodeURIComponent(calendarId.trim());
  return fromICS(`https://calendar.google.com/calendar/ical/${id}/public/basic.ics`, windowEnd);
}

/** schema.org Event objects embedded as JSON-LD. */
async function fromJsonLd(pageUrl) {
  const html = await get(pageUrl);
  const out = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    let parsed;
    try { parsed = JSON.parse(m[1].trim()); } catch { continue; }
    const stack = [parsed];
    while (stack.length) {
      const node = stack.pop();
      if (Array.isArray(node)) { stack.push(...node); continue; }
      if (!node || typeof node !== 'object') continue;
      if (node['@graph']) stack.push(node['@graph']);
      const type = node['@type'];
      const isEvent = type && (Array.isArray(type)
        ? type.some(t => String(t).endsWith('Event'))
        : String(type).endsWith('Event'));
      if (!isEvent || !node.startDate) continue;
      const start = String(node.startDate).slice(0, 10);
      if (!isDate(start)) continue;
      const end = isDate(String(node.endDate || '').slice(0, 10)) ? String(node.endDate).slice(0, 10) : start;
      let time = null;
      const hm = String(node.startDate).match(/T(\d{2}):(\d{2})/);
      if (hm) time = fmtTime(+hm[1], +hm[2]);
      out.push({
        title: clean(node.name || ''),
        startDate: start, endDate: end, time,
        url: typeof node.url === 'string' ? node.url : null
      });
    }
  }
  return out.filter(e => e.title);
}

/**
 * Temple calendars often carry an entry repeated every day of a stretch
 * ("Summer Recess", "Chaturmasya"), which arrives here as dozens of
 * single-day events and would bury everything else. Consecutive events
 * sharing a temple and title are merged back into one dated span.
 */
function collapseRuns(events) {
  const groups = new Map();
  for (const e of events) {
    const key = `${e.temple}|${e.title.toLowerCase()}`;
    (groups.get(key) || groups.set(key, []).get(key)).push(e);
  }
  const out = [];
  for (const group of groups.values()) {
    group.sort((a, b) => a.startDate.localeCompare(b.startDate));
    let run = null;
    for (const e of group) {
      if (run && e.startDate <= addDays(run.endDate, 1)) {
        // Extend the current span rather than emitting a duplicate.
        if (e.endDate > run.endDate) run.endDate = e.endDate;
        if (run.time && e.time && run.time !== e.time) run.time = null;
        continue;
      }
      if (run) out.push(run);
      run = { ...e };
    }
    if (run) out.push(run);
  }
  return out.sort((a, b) => a.startDate.localeCompare(b.startDate));
}

/**
 * A weekly class repeats ~52 times a year. Left alone it would fill the
 * per-temple quota and push the festivals nobody wants to miss off the
 * calendar, so only the next few instances of any one series are kept.
 */
function limitSeries(events, max = MAX_PER_SERIES) {
  const seen = new Map();
  return events.filter(e => {
    const key = `${e.temple}|${e.title.toLowerCase()}`;
    const n = (seen.get(key) || 0) + 1;
    seen.set(key, n);
    return n <= max;
  });
}

/**
 * JEvents (Joomla) RSS. Item titles are "04 Aug 2026 : Event name", which is
 * the only place the date appears — pubDate is the feed build time.
 */
async function fromRSS(feedUrl) {
  const xml = await get(feedUrl, 'application/rss+xml,application/xml,*/*');
  const out = [];
  const MON = { jan:1, feb:2, mar:3, apr:4, may:5, jun:6, jul:7, aug:8, sep:9, oct:10, nov:11, dec:12 };
  for (const item of xml.split(/<item[\s>]/).slice(1)) {
    const rawTitle = clean((item.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '');
    const link = clean((item.match(/<link>([\s\S]*?)<\/link>/) || [])[1] || '') || null;
    const m = rawTitle.match(/^(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s+(\d{4})\s*:\s*(.+)$/);
    if (!m) continue;
    const month = MON[m[2].toLowerCase()];
    if (!month) continue;
    const date = `${m[3]}-${String(month).padStart(2, '0')}-${String(+m[1]).padStart(2, '0')}`;
    out.push({ title: m[4].trim(), startDate: date, endDate: date, time: null, url: link });
  }
  return out;
}

/**
 * WordPress custom post type exposed through the core REST API, where the
 * date lives in an ACF field rather than in a standard event schema.
 */
async function fromWpRest(feedUrl) {
  const list = JSON.parse(await get(feedUrl, 'application/json'));
  if (!Array.isArray(list)) return [];
  return list.map(p => {
    const acf = p.acf || {};
    const raw = String(acf.event_date || acf.date || '');
    const m = raw.match(/^(\d{4})(\d{2})(\d{2})$/) || raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return null;
    const date = `${m[1]}-${m[2]}-${m[3]}`;
    const title = clean(acf.event_title || p.title?.rendered || '');
    if (!title) return null;
    return { title, startDate: date, endDate: date, time: null, url: p.link || null };
  }).filter(Boolean);
}

/** Squarespace events collection (?format=json-pretty), epoch-ms dates. */
async function fromSquarespace(feedUrl) {
  const json = JSON.parse(await get(feedUrl, 'application/json'));
  const items = [...(json.upcoming || []), ...(json.items || [])];
  const origin = new URL(feedUrl).origin;
  return items.map(it => {
    if (!it.startDate) return null;
    const start = toLocalParts(new Date(it.startDate));
    const end = it.endDate ? toLocalParts(new Date(it.endDate)) : start;
    const title = clean(it.title || '');
    if (!title) return null;
    // Squarespace marks all-day events with a midnight-to-midnight span.
    const allDay = start.hour === 0 && start.minute === 0;
    return {
      title,
      startDate: start.date,
      endDate: end.date >= start.date ? end.date : start.date,
      time: allDay ? null : fmtTime(start.hour, start.minute),
      url: it.fullUrl ? origin + it.fullUrl : null
    };
  }).filter(Boolean);
}

/** A site's own JSON events API: [{ date, time, event, link }]. */
async function fromSevaJson(feedUrl, eventsUrl) {
  const json = JSON.parse(await get(feedUrl, 'application/json'));
  const list = Array.isArray(json) ? json : (json.events || json.data || []);
  return list.map(e => {
    const date = String(e.date || e.event_date || '').slice(0, 10);
    if (!isDate(date)) return null;
    const title = clean(e.event || e.title || e.name || '');
    if (!title) return null;
    return {
      title,
      startDate: date,
      endDate: date,
      time: e.time ? clean(e.time) : null,
      url: e.link || eventsUrl || null
    };
  }).filter(Boolean);
}

/**
 * A static JS data file of the form
 *   var festivals_2026 = { January: [ { date: 1, events: ["..."] } ] }
 * Published per calendar year, so both the current and next year are tried.
 */
async function fromJsData(feedUrlTemplate, eventsUrl) {
  const MONTHS = ['january','february','march','april','may','june',
                  'july','august','september','october','november','december'];
  const year = +todayStr().slice(0, 4);
  const out = [];
  let anyLoaded = false;

  for (const y of [year, year + 1]) {
    const url = feedUrlTemplate.replace('{year}', String(y));
    let text;
    try { text = await get(url, 'application/javascript,*/*'); }
    catch { continue; } // next year's file usually does not exist yet
    anyLoaded = true;

    const brace = text.indexOf('{');
    if (brace < 0) continue;
    let parsed;
    try {
      // The file is a JS assignment, not JSON: keys are bare words and the
      // statement may end in a semicolon.
      const objText = text.slice(brace).replace(/;\s*$/, '')
        .replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g, '$1"$2":')
        .replace(/,(\s*[}\]])/g, '$1');
      parsed = JSON.parse(objText);
    } catch { continue; }

    for (const [monthName, days] of Object.entries(parsed)) {
      const mi = MONTHS.indexOf(String(monthName).toLowerCase());
      if (mi < 0 || !Array.isArray(days)) continue;
      for (const d of days) {
        const day = parseInt(d?.date, 10);
        if (!day) continue;
        const date = `${y}-${String(mi + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        for (const name of [].concat(d.events || d.event || [])) {
          const title = clean(typeof name === 'string' ? name : name?.name);
          if (title) out.push({ title, startDate: date, endDate: date, time: null, url: eventsUrl || null });
        }
      }
    }
  }
  if (!anyLoaded) throw new Error('no year file reachable');
  return out;
}

async function fetchFeed(temple, windowEnd) {
  switch (temple.feedType) {
    case 'tribe':       return fromTribe(temple.feedUrl);
    case 'ics':         return fromICS(temple.feedUrl, windowEnd);
    case 'gcal':        return fromGCal(temple.feedUrl, windowEnd);
    case 'jsonld':      return fromJsonLd(temple.feedUrl || temple.eventsUrl);
    case 'rss':         return fromRSS(temple.feedUrl);
    case 'wp-rest':     return fromWpRest(temple.feedUrl);
    case 'squarespace': return fromSquarespace(temple.feedUrl);
    case 'seva-json':   return fromSevaJson(temple.feedUrl, temple.eventsUrl);
    case 'js-data':     return fromJsData(temple.feedUrl, temple.eventsUrl);
    default: throw new Error(`unknown feedType ${temple.feedType}`);
  }
}

// ── main ────────────────────────────────────────────────────
const readJson = async (name, fallback) => {
  try { return JSON.parse(await readFile(path.join(DATA, name), 'utf8')); }
  catch { return fallback; }
};

const temples = await readJson('temples.json', []);
const curated = await readJson('events-curated.json', []);
const previous = await readJson('events.json', {});
const prevEvents = Array.isArray(previous) ? previous : (previous.events || []);

const today = todayStr();
const windowEnd = addDays(today, WINDOW_DAYS);
const feedTemples = temples.filter(t => t.feedType && (t.feedUrl || t.eventsUrl));

console.log(`Refreshing events for ${today} .. ${windowEnd}`);
console.log(`${temples.length} temples, ${feedTemples.length} with feeds, ${curated.length} curated events`);

const collected = [];
const report = [];
const failedTemples = new Set();

for (const t of feedTemples) {
  if (ONLY && t.slug !== ONLY) continue;
  try {
    const raw = await fetchFeed(t, windowEnd);
    const events = raw
      .filter(e => isDate(e.startDate) && e.title)
      .map(e => ({
        temple: t.name,
        city: t.city,
        title: prettifyTitle(e.title).slice(0, 120),
        startDate: e.startDate,
        endDate: isDate(e.endDate) && e.endDate >= e.startDate ? e.endDate : e.startDate,
        time: e.time || null,
        url: e.url || t.eventsUrl || t.url || null,
        source: t.feedType
      }))
      .filter(e => e.endDate >= today && e.startDate <= windowEnd);
    const merged = limitSeries(collapseRuns(events)).slice(0, MAX_PER_TEMPLE);
    collected.push(...merged);
    report.push({ temple: t.name, feedType: t.feedType, ok: true, count: merged.length });
    console.log(`  ok   ${t.name} (${t.feedType}) -> ${merged.length} (from ${events.length} raw)`);
  } catch (err) {
    failedTemples.add(t.name);
    report.push({ temple: t.name, feedType: t.feedType, ok: false, error: String(err.message || err) });
    console.warn(`  FAIL ${t.name} (${t.feedType}): ${err.message || err}`);
  }
  await new Promise(r => setTimeout(r, 400)); // be polite to temple servers
}

// Carry forward the last known events for feeds that failed this run, so a
// temporary outage never empties the calendar.
const carried = prevEvents.filter(e =>
  failedTemples.has(e.temple) && isDate(e.startDate) && (e.endDate || e.startDate) >= today
);
if (carried.length) console.log(`Carrying forward ${carried.length} events from ${failedTemples.size} unreachable feed(s)`);

const curatedInWindow = curated
  .filter(e => isDate(e.startDate) && (e.endDate || e.startDate) >= today && e.startDate <= windowEnd)
  .map(e => ({ ...e, endDate: e.endDate || e.startDate, source: 'curated' }));

// Merge, preferring live feed data over carried-forward and curated copies.
const byKey = new Map();
const keyOf = e => [
  (e.temple || '').toLowerCase().trim(),
  (e.title || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(),
  e.startDate
].join('|');

for (const group of [curatedInWindow, carried, collected]) {
  for (const e of group) byKey.set(keyOf(e), e);
}

const events = [...byKey.values()].sort(
  (a, b) => a.startDate.localeCompare(b.startDate) || a.temple.localeCompare(b.temple)
);

const output = {
  generatedAt: new Date().toISOString(),
  windowStart: today,
  windowEnd,
  counts: {
    total: events.length,
    fromFeeds: collected.length,
    curated: curatedInWindow.length,
    carriedForward: carried.length,
    feedsOk: report.filter(r => r.ok).length,
    feedsFailed: report.filter(r => !r.ok).length
  },
  sources: report,
  events
};

console.log(`\n${events.length} events (${collected.length} live, ${curatedInWindow.length} curated, ${carried.length} carried)`);

if (DRY_RUN) {
  console.log('--dry-run: not writing');
  for (const e of events.slice(0, 25)) console.log(`  ${e.startDate}  ${e.temple} — ${e.title}`);
} else {
  await writeFile(path.join(DATA, 'events.json'), JSON.stringify(output, null, 2) + '\n');
  console.log('Wrote assets/data/events.json');
}
