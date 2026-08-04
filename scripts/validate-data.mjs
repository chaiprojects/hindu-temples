#!/usr/bin/env node
// Schema checks for the data files the site renders. Runs in CI before the
// event refresh, so a malformed edit fails the job instead of shipping a
// broken directory to GitHub Pages.

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const DATA = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'data');

const errors = [];
const warnings = [];
const err = m => errors.push(m);
const warn = m => warnings.push(m);

const readJson = async name => JSON.parse(await readFile(path.join(DATA, name), 'utf8'));

// Bay Area bounding box — a coordinate outside it is almost certainly a
// transcription error and would drop a pin in the ocean.
const BOUNDS = { minLat: 36.8, maxLat: 38.9, minLng: -123.2, maxLng: -121.0 };
const FEED_TYPES = new Set([
  'tribe', 'ics', 'gcal', 'jsonld', 'rss',
  'wp-rest', 'squarespace', 'seva-json', 'js-data'
]);
const isHttp = u => { try { return /^https?:$/.test(new URL(u).protocol); } catch { return false; } };
const isDate = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s));

// ── temples.json ────────────────────────────────────────────
const temples = await readJson('temples.json');
if (!Array.isArray(temples)) err('temples.json must be an array');

const slugs = new Set();
const seenLocations = new Map();

for (const [i, t] of (temples || []).entries()) {
  const at = `temples[${i}] (${t?.name || 'unnamed'})`;

  for (const field of ['slug', 'name', 'city']) {
    if (!t?.[field] || typeof t[field] !== 'string') err(`${at}: missing ${field}`);
  }
  if (t.slug) {
    if (!/^[a-z0-9-]+$/.test(t.slug)) err(`${at}: slug "${t.slug}" must be lowercase kebab-case`);
    if (slugs.has(t.slug)) err(`${at}: duplicate slug "${t.slug}"`);
    slugs.add(t.slug);
  }

  if (typeof t.lat !== 'number' || typeof t.lng !== 'number') {
    err(`${at}: lat/lng must be numbers`);
  } else {
    if (t.lat < BOUNDS.minLat || t.lat > BOUNDS.maxLat || t.lng < BOUNDS.minLng || t.lng > BOUNDS.maxLng) {
      err(`${at}: coordinates ${t.lat},${t.lng} fall outside the Bay Area`);
    }
    // Two temples sharing a coordinate stack pins on the map; legitimate for
    // temples that genuinely share a building, so only a warning.
    const key = `${t.lat.toFixed(4)},${t.lng.toFixed(4)}`;
    if (seenLocations.has(key)) warn(`${at}: same coordinates as ${seenLocations.get(key)}`);
    else seenLocations.set(key, t.name);
  }

  for (const field of ['url', 'eventsUrl']) {
    if (t[field] != null && !isHttp(t[field])) err(`${at}: ${field} is not a valid http(s) URL: ${t[field]}`);
  }

  if (t.feedType != null) {
    if (!FEED_TYPES.has(t.feedType)) err(`${at}: unknown feedType "${t.feedType}"`);
    if (!t.feedUrl && !t.eventsUrl) err(`${at}: feedType "${t.feedType}" needs a feedUrl`);
    // gcal feedUrl is a calendar id, not a URL; everything else must be one.
    if (t.feedUrl && t.feedType !== 'gcal' && !isHttp(t.feedUrl)) {
      err(`${at}: feedUrl is not a valid http(s) URL: ${t.feedUrl}`);
    }
  } else if (t.feedUrl) {
    err(`${at}: feedUrl set without a feedType`);
  }

  if (t.rating != null && (typeof t.rating !== 'number' || t.rating < 0 || t.rating > 5)) {
    err(`${at}: rating must be a number 0-5`);
  }
  if (t.reviews != null && (!Number.isInteger(t.reviews) || t.reviews < 0)) {
    err(`${at}: reviews must be a non-negative integer`);
  }
  if (t.rating != null && t.reviews == null) warn(`${at}: has a rating but no review count`);
}

// ── events-curated.json ─────────────────────────────────────
let curated = [];
try { curated = await readJson('events-curated.json'); }
catch { warn('events-curated.json missing or unreadable — continuing with feeds only'); }

const templeNames = new Set((temples || []).map(t => t.name));
for (const [i, e] of curated.entries()) {
  const at = `events-curated[${i}] (${e?.title || 'untitled'})`;
  for (const field of ['temple', 'city', 'title', 'startDate']) {
    if (!e?.[field]) err(`${at}: missing ${field}`);
  }
  if (e.startDate && !isDate(e.startDate)) err(`${at}: startDate must be YYYY-MM-DD`);
  if (e.endDate && !isDate(e.endDate)) err(`${at}: endDate must be YYYY-MM-DD`);
  if (isDate(e.startDate) && isDate(e.endDate) && e.endDate < e.startDate) {
    err(`${at}: endDate is before startDate`);
  }
  if (e.url != null && !isHttp(e.url)) err(`${at}: url is not a valid http(s) URL: ${e.url}`);
  // A typo here silently detaches the event from its temple in the UI.
  if (e.temple && !templeNames.has(e.temple)) {
    warn(`${at}: temple "${e.temple}" does not match any name in temples.json`);
  }
}

// ── report ──────────────────────────────────────────────────
const withFeeds = (temples || []).filter(t => t.feedType).length;
console.log(`temples.json: ${temples?.length ?? 0} temples, ${slugs.size} slugs, ${withFeeds} with event feeds`);
console.log(`events-curated.json: ${curated.length} events`);

for (const w of warnings) console.warn(`  warn: ${w}`);
for (const e of errors) console.error(`  ERROR: ${e}`);

if (errors.length) {
  console.error(`\n${errors.length} error(s) — failing.`);
  process.exit(1);
}
console.log(`\nOK${warnings.length ? ` (${warnings.length} warning(s))` : ''}`);
