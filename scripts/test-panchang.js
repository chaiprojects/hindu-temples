#!/usr/bin/env node
// Regression tests for assets/js/panchang.js — run with `node scripts/test-panchang.js`.
// Loads the same file the browser loads, so CI tests the shipped code.

const path = require('path');
const P = require(path.join(__dirname, '..', 'assets', 'js', 'panchang.js'));

const INDIA = { lat: 19.0760, lon: 72.8777, tz: 'Asia/Kolkata' };

let pass = 0, fail = 0;
function check(label, actual, expected) {
  if (actual === expected) { pass++; return; }
  fail++;
  console.error(`  FAIL ${label}\n       expected ${expected}\n       actual   ${actual}`);
}

function dateOf(list, name, year) {
  const hits = list.filter(f => f.name === name && f.date.startsWith(String(year)));
  return hits.length ? hits.map(f => f.date).join(',') : '(none)';
}

// ── Dates published by Bay Area temples for 2026 ──
// This is the set that actually matters: the site serves the Bay Area, and
// temples here compute their own local dates rather than reprinting an
// Indian calendar. Fremont's 2026 calendar says so explicitly — "prepared
// for North America Based on San Francisco (PST/PDT) ... may differ from
// the respective dates in India". Sources: Fremont Vedic Dharma Samaj,
// Livermore HCCC, Sunnyvale HTCC, SVCC Fremont, Sharadamba, Sri Sai.
console.log('Bay Area temple-published dates (2026):');
const bay = P.computeFestivals(2026, 2026, P.BAY_AREA);
[
  ['Nag Panchami', '2026-08-16'],
  ['Varalakshmi Vratam', '2026-08-21'],
  ['Raksha Bandhan', '2026-08-27'],
  ['Krishna Janmashtami', '2026-09-03'],
  ['Ganesh Chaturthi', '2026-09-14'],
  ['Mahalaya Amavasya', '2026-10-10'],
  ['Navratri Begins', '2026-10-11'],
  ['Durga Ashtami', '2026-10-18'],
  ['Maha Navami / Ayudha Puja', '2026-10-19'],
  ['Dussehra / Vijayadashami', '2026-10-20'],
  ['Dhanteras', '2026-11-06'],
  ['Naraka Chaturdashi', '2026-11-07'],
  ['Diwali / Lakshmi Puja', '2026-11-08'],
  ['Govardhan Puja / Annakut', '2026-11-09'],
  ['Skanda Sashti', '2026-11-15'],
  ['Tulsi Vivah', '2026-11-21'],
  ['Kartika Purnima', '2026-11-23'],
].forEach(([n, want]) => check(`${n} 2026`, dateOf(bay, n, 2026), want));
// Not asserted, because Bay Area temples themselves publish different days:
// Gita Jayanti is 19 Dec at Sunnyvale and 20 Dec at Krishna Balaram Mandir,
// and Janmashtami splits Smarta (3 Sep) from Vaishnava (4 Sep).

// ── Published Indian dates, used to validate the astronomy itself ──
// Computing with an Indian location must reproduce India's published
// dates; that the same code then yields the Bay Area dates above is the
// cross-check that the location handling is right.
// Krishna Janmashtami is deliberately absent: Smarta and Vaishnava
// traditions observe different days (Fremont's own calendar prints both,
// 3 and 4 Sep 2026), so there is no single correct answer to assert.
console.log('India-configured festival dates:');
const ind = P.computeFestivals(2025, 2026, INDIA);
[
  ['Maha Shivratri', 2025, '2025-02-26'],
  ['Ugadi / Gudi Padwa', 2025, '2025-03-30'],
  ['Ram Navami', 2025, '2025-04-06'],
  ['Akshaya Tritiya', 2025, '2025-04-30'],
  ['Raksha Bandhan', 2025, '2025-08-09'],
  ['Ganesh Chaturthi', 2025, '2025-08-27'],
  ['Navratri Begins', 2025, '2025-09-22'],
  ['Dussehra / Vijayadashami', 2025, '2025-10-02'],
  ['Karva Chauth', 2025, '2025-10-10'],
  ['Diwali / Lakshmi Puja', 2025, '2025-10-20'],
  ['Bhai Dooj', 2025, '2025-10-23'],
  ['Makar Sankranti / Pongal', 2026, '2026-01-14'],
  ['Maha Shivratri', 2026, '2026-02-15'],
  ['Akshaya Tritiya', 2026, '2026-04-20'],
  ['Raksha Bandhan', 2026, '2026-08-28'],
  ['Navratri Begins', 2026, '2026-10-11'],
  ['Diwali / Lakshmi Puja', 2026, '2026-11-08'],
].forEach(([n, y, want]) => check(`${n} ${y}`, dateOf(ind, n, y), want));

// Sunrise and sunset drive every tithi-at-sunrise decision, so they are
// checked directly against published times. A sign error here shifts
// festivals by a day without any other symptom.
console.log('Sunrise / sunset accuracy:');
const clock = (jd, tz) => new Intl.DateTimeFormat('en-GB',
  { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(
    new Date((jd - 2440587.5) * 86400000));
const minutesApart = (a, b) => {
  const [h1, m1] = a.split(':').map(Number), [h2, m2] = b.split(':').map(Number);
  return Math.abs((h1 * 60 + m1) - (h2 * 60 + m2));
};
for (const [label, loc, wantRise, wantSet] of [
  ['San Jose 2025-10-20', P.BAY_AREA, '07:22', '18:24'],
  ['Mumbai 2025-10-20', INDIA, '06:33', '18:11'],
]) {
  const jd0 = P.toJD(2025, 10, 20);
  const rise = P.sunEventJD(jd0, loc, true);
  let set = P.sunEventJD(jd0, loc, false);
  if (set < rise) set = P.sunEventJD(jd0 + 1, loc, false);
  check(`${label} sunrise within 5 min`, minutesApart(clock(rise, loc.tz), wantRise) <= 5, true);
  check(`${label} sunset within 5 min`, minutesApart(clock(set, loc.tz), wantSet) <= 5, true);
}

// ── Structural invariants that must hold for any year/location ──
console.log('Structural invariants:');
for (const year of [2024, 2025, 2026, 2027, 2028, 2029, 2030]) {
  const f = P.computeFestivals(year, year, P.BAY_AREA);
  const on = n => f.filter(x => x.name === n).map(x => x.date);

  // Every major festival must appear exactly once a year. A missing entry
  // means a skipped (kshaya) tithi was mishandled; a duplicate means a
  // repeated tithi or a month-matching bug.
  for (const name of [
    'Maha Shivratri', 'Holi', 'Ugadi / Gudi Padwa', 'Ram Navami',
    'Krishna Janmashtami', 'Ganesh Chaturthi', 'Navratri Begins',
    'Dussehra / Vijayadashami', 'Diwali / Lakshmi Puja', 'Govardhan Puja / Annakut',
    'Bhai Dooj', 'Guru Purnima', 'Raksha Bandhan', 'Makar Sankranti / Pongal',
    'Mahalaya Amavasya', 'Karva Chauth', 'Dhanteras',
  ]) {
    check(`${year} ${name} occurs once`, on(name).length, 1);
  }

  // Ordering relationships fixed by the lunar calendar. Guru Purnima is 13
  // tithis after Rath Yatra, so it can never precede it — the bug that was
  // present in the old hard-coded list.
  const one = n => on(n)[0];
  if (one('Rath Yatra') && one('Guru Purnima')) {
    check(`${year} Rath Yatra before Guru Purnima`, one('Rath Yatra') < one('Guru Purnima'), true);
  }
  check(`${year} Navratri before Dussehra`, one('Navratri Begins') < one('Dussehra / Vijayadashami'), true);
  check(`${year} Dhanteras before Diwali`, one('Dhanteras') < one('Diwali / Lakshmi Puja'), true);
  check(`${year} Diwali before Govardhan Puja`, one('Diwali / Lakshmi Puja') < one('Govardhan Puja / Annakut'), true);
  check(`${year} Mahalaya before Navratri`, one('Mahalaya Amavasya') < one('Navratri Begins'), true);
  check(`${year} Holika Dahan day before Holi`,
    new Date(one('Holi')) - new Date(one('Holika Dahan')), 86400000);

  // Dussehra is the 10th tithi of the same paksha Navratri starts, so the
  // gap is 8-10 civil days depending on skipped/repeated tithis.
  const gap = (new Date(one('Dussehra / Vijayadashami')) - new Date(one('Navratri Begins'))) / 86400000;
  check(`${year} Navratri->Dussehra gap plausible`, gap >= 8 && gap <= 10, true);
}

// Vaikuntha Ekadashi tracks Dhanurmasa (Sun in Dhanu, ~16 Dec - 14 Jan),
// which straddles the civil year, so a single year can hold two or none.
// What must hold is that no two-year window is ever empty.
console.log('Vaikuntha Ekadashi seasons:');
for (let year = 2024; year <= 2032; year++) {
  const span = P.computeFestivals(year, year + 1, P.BAY_AREA)
    .filter(f => f.name === 'Vaikuntha Ekadashi');
  check(`${year}-${year + 1} has a Vaikuntha Ekadashi`, span.length >= 1, true);
}

// ── The calendar must never run dry, at any location ──
console.log('Coverage:');
for (const loc of [P.BAY_AREA, INDIA, { lat: 40.7128, lon: -74.0060, tz: 'America/New_York' }]) {
  for (const year of [2027, 2035]) {
    const n = P.computeFestivals(year, year, loc).length;
    check(`${loc.tz} ${year} has 35+ festivals`, n >= 35, true);
  }
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
