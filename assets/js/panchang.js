// ============================================================
// Panchang engine — computes Hindu festival dates from first
// principles (Jean Meeus, "Astronomical Algorithms", ch. 25/47).
//
// Replaces the old hard-coded FESTIVALS list, which covered only
// 2025-2027 and contained ordering errors. Festival dates are
// derived the same way the Ekadashi widget derives its dates:
// from the tithi (lunar day) prevailing at LOCAL SUNRISE for the
// user's location. That keeps the whole site internally
// consistent and means the calendar never runs out of years.
//
// Solar (sankranti) festivals — Pongal / Makar Sankranti / Tamil
// New Year — are resolved in IST instead, because those are
// announced on the same civil date worldwide.
//
// Loads in the browser as window.Panchang, and in Node via
// require() so the same code can be unit-tested in CI.
//
// Accuracy note: results are best-effort astronomy and can differ
// by a day from a particular temple's published date, which is
// why scraped temple events take precedence in the calendar.
// ============================================================

(function () {
'use strict';

const J2000 = 2451545.0;
const JC = 36525.0;
const D2R = Math.PI / 180;

const BAY_AREA = { lat: 37.3382, lon: -121.8863, tz: 'America/Los_Angeles' };

// ── Calendar <-> Julian Day ─────────────────────────────────
function toJD(Y, M, D) {
  if (M <= 2) { Y--; M += 12; }
  const A = Math.floor(Y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + D + B - 1524.5;
}

function jdToParts(jd) {
  const z = Math.floor(jd + 0.5);
  const f = (jd + 0.5) - z;
  let a = z;
  if (z >= 2299161) {
    const g = Math.floor((z - 1867216.25) / 36524.25);
    a = z + 1 + g - Math.floor(g / 4);
  }
  const b = a + 1524;
  const c = Math.floor((b - 122.1) / 365.25);
  const d = Math.floor(365.25 * c);
  const e = Math.floor((b - d) / 30.6001);
  const dayF = b - d - Math.floor(30.6001 * e) + f;
  const month = e < 14 ? e - 1 : e - 13;
  const year = month > 2 ? c - 4716 : c - 4715;
  return { year, month, day: Math.floor(dayF), frac: dayF - Math.floor(dayF) };
}

// ── Timezone offset (hours east of UTC) at a given instant ──
const _tzCache = new Map();
function tzOffsetHours(jd, tz) {
  const ms = (jd - 2440587.5) * 86400000;
  const key = tz + '|' + Math.floor(ms / 3600000);
  if (_tzCache.has(key)) return _tzCache.get(key);
  const date = new Date(ms);
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
  const p = {};
  for (const part of dtf.formatToParts(date)) p[part.type] = part.value;
  const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, (+p.hour) % 24, +p.minute, +p.second);
  const off = (asUTC - date.getTime()) / 3600000;
  _tzCache.set(key, off);
  return off;
}

/** Local civil date (in `tz`) of the instant `jd`, as 'YYYY-MM-DD'. */
function localDateStr(jd, tz) {
  const { year, month, day } = jdToParts(jd + tzOffsetHours(jd, tz) / 24);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// ── Solar longitude (Meeus ch. 25, ~0.01°) ──────────────────
function sunLongitude(T) {
  const L0 = (280.46646 + 36000.76983 * T + 0.0003032 * T * T) % 360;
  const M = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) * D2R;
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M)
          + (0.019993 - 0.000101 * T) * Math.sin(2 * M)
          + 0.000289 * Math.sin(3 * M);
  const Om = (125.04 - 1934.136 * T) * D2R;
  return ((L0 + C - 0.00569 - 0.00478 * Math.sin(Om)) % 360 + 360) % 360;
}

// ── Lunar longitude (Meeus ch. 47, 60 periodic terms, ~0.01°) ─
const ML = [
  [0,0,1,0,6288774],[2,0,-1,0,1274027],[2,0,0,0,658314],[0,0,2,0,213618],
  [0,1,0,0,-185116],[0,0,0,2,-114332],[2,0,-2,0,58793],[2,-1,-1,0,57066],
  [2,0,1,0,53322],[2,-1,0,0,45758],[0,1,-1,0,-40923],[1,0,0,0,-34720],
  [0,1,1,0,-30383],[2,0,0,-2,15327],[0,0,1,2,-12528],[0,0,1,-2,10980],
  [4,0,-1,0,10675],[0,0,3,0,10034],[4,0,-2,0,8548],[2,1,-1,0,-7888],
  [2,1,0,0,-6766],[1,0,-1,0,-5163],[1,1,0,0,4987],[2,-1,1,0,4036],
  [2,0,2,0,3994],[4,0,0,0,3861],[2,0,-3,0,3665],[0,1,-2,0,-2689],
  [2,0,-1,2,-2602],[2,-1,-2,0,2390],[1,0,1,0,-2348],[2,-2,0,0,2236],
  [0,1,2,0,-2120],[0,2,0,0,-2069],[2,-2,-1,0,2048],[2,0,1,-2,-1773],
  [2,0,0,2,-1595],[4,-1,-1,0,1215],[0,0,2,2,-1110],[3,0,-1,0,-892],
  [2,1,1,0,-810],[4,-1,-2,0,759],[0,2,-1,0,-713],[2,2,-1,0,-700],
  [2,1,-2,0,691],[2,-1,0,-2,596],[4,0,1,0,549],[0,0,4,0,537],
  [4,-1,0,0,520],[1,0,-2,0,-487],[2,1,0,-2,-399],[0,0,2,-2,-381],
  [1,1,1,0,351],[3,0,-2,0,-340],[4,0,-3,0,330],[2,-1,2,0,327],
  [0,2,1,0,-323],[1,1,-1,0,299],[2,0,3,0,294],[2,0,-1,-2,0]
];

function moonLongitude(T) {
  const pM = (x) => ((x % 360) + 360) % 360 * D2R;
  const Lp = pM(218.3164477 + 481267.88123421*T - 0.0015786*T*T + T*T*T/538841 - T*T*T*T/65194000);
  const D  = pM(297.8501921 + 445267.1114034*T  - 0.0018819*T*T + T*T*T/545868  - T*T*T*T/113065000);
  const M  = pM(357.5291092 + 35999.0502909*T   - 0.0001536*T*T + T*T*T/24490000);
  const Mp = pM(134.9633964 + 477198.8675055*T  + 0.0087414*T*T + T*T*T/69699   - T*T*T*T/14712000);
  const F  = pM(93.272095   + 483202.0175233*T  - 0.0036539*T*T - T*T*T/3526000 + T*T*T*T/863310000);
  const E  = 1 - 0.002516*T - 0.0000074*T*T;
  const E2 = E * E;
  const A1 = (119.75 + 131.849   * T) * D2R;
  const A2 = ( 53.09 + 479264.29 * T) * D2R;

  let suml = 0;
  for (const [dD, dM, dMp, dF, sl] of ML) {
    const ec = Math.abs(dM) === 1 ? E : Math.abs(dM) === 2 ? E2 : 1;
    suml += ec * sl * Math.sin(dD*D + dM*M + dMp*Mp + dF*F);
  }
  suml += 3958*Math.sin(A1) + 1962*Math.sin(Lp - F) + 318*Math.sin(A2);
  return ((Lp/D2R + suml*1e-6) % 360 + 360) % 360;
}

// ── Sidereal (Lahiri) conversion ────────────────────────────
// Lahiri ayanamsa: 23.853° at J2000, precessing 50.29"/yr.
function ayanamsa(jd) {
  return 23.853 + (jd - J2000) / 365.25 * (50.29 / 3600);
}
const norm360 = x => ((x % 360) + 360) % 360;

const sunSidereal  = jd => norm360(sunLongitude((jd - J2000) / JC)  - ayanamsa(jd));
const moonSidereal = jd => norm360(moonLongitude((jd - J2000) / JC) - ayanamsa(jd));

// ── Tithi & nakshatra ───────────────────────────────────────
function elongation(jd) {
  const T = (jd - J2000) / JC;
  return norm360(moonLongitude(T) - sunLongitude(T));
}
/** Tithi number 1..30 (1-15 Shukla, 16-30 Krishna; 15 = Purnima, 30 = Amavasya). */
const tithiAt = jd => Math.floor(elongation(jd) / 12) + 1;
/** Nakshatra index 0..26 (0 = Ashvini, 2 = Krittika, 7 = Pushya, 21 = Shravana). */
const nakshatraAt = jd => Math.floor(moonSidereal(jd) / (360 / 27));

// ── Root finding ────────────────────────────────────────────
/** JD at which elongation reaches `target` degrees, between jdLo and jdHi. */
function findElongation(target, jdLo, jdHi) {
  const f = jd => {
    let el = elongation(jd) - target;
    if (el >  180) el -= 360;
    if (el < -180) el += 360;
    return el;
  };
  if (f(jdLo) > 0 || f(jdHi) < 0) return null;
  for (let i = 0; i < 60 && jdHi - jdLo > 1e-7; i++) {
    const mid = (jdLo + jdHi) / 2;
    if (f(mid) <= 0) jdLo = mid; else jdHi = mid;
  }
  return (jdLo + jdHi) / 2;
}

/** JD of the new moon at or before `jd`. */
function prevNewMoon(jd) {
  let hi = jd, elHi = elongation(hi);
  for (let i = 0; i < 80; i++) {
    const lo = hi - 0.5;
    const elLo = elongation(lo);
    if (elLo > elHi) return findElongation(0, lo, hi) ?? lo;
    hi = lo; elHi = elLo;
  }
  return jd - 29.53;
}

/** JD at which the sidereal Sun reaches `target` degrees, searching forward from `from`. */
function findSankranti(target, from, span = 400) {
  const f = jd => {
    let d = sunSidereal(jd) - target;
    if (d >  180) d -= 360;
    if (d < -180) d += 360;
    return d;
  };
  let lo = from;
  for (let step = 0; step < span; step++) {
    const hi = lo + 1;
    if (f(lo) <= 0 && f(hi) > 0) {
      let a = lo, b = hi;
      for (let i = 0; i < 50 && b - a > 1e-7; i++) {
        const mid = (a + b) / 2;
        if (f(mid) <= 0) a = mid; else b = mid;
      }
      return (a + b) / 2;
    }
    lo = hi;
  }
  return null;
}

// ── Sunrise / sunset (Meeus ch. 15) ─────────────────────────
function sunEquatorial(jd) {
  const T = (jd - J2000) / JC;
  const Lp = sunLongitude(T) * D2R;
  const U = T / 100;
  const eps0 = 23 + 26/60 + 21.448/3600 + (-4680.93*U - 1.55*U*U + 1999.25*U**3
             - 51.38*U**4 - 249.67*U**5 - 39.05*U**6 + 7.12*U**7
             + 27.87*U**8 + 5.79*U**9) / 3600;
  const Om = (125.04 - 1934.136*T) * D2R;
  const eps = (eps0 + 0.00256*Math.cos(Om)) * D2R;
  return {
    ra:  Math.atan2(Math.cos(eps)*Math.sin(Lp), Math.cos(Lp)),
    dec: Math.asin(Math.sin(eps)*Math.sin(Lp))
  };
}

/** JD of sunrise (rising=true) or sunset on the UT day beginning at jd0. */
function sunEventJD(jd0, loc, rising = true) {
  const lat = loc.lat * D2R;
  const lng = loc.lon * D2R;
  const h0 = -0.8333 * D2R;
  const [eq1, eq2, eq3] = [sunEquatorial(jd0 - 1), sunEquatorial(jd0), sunEquatorial(jd0 + 1)];
  const T0 = (jd0 - J2000) / JC;
  const Th0 = norm360(100.4606184 + 36000.7700536*T0 + 0.000387933*T0*T0 - T0**3/38710000) * D2R;
  const cH = (Math.sin(h0) - Math.sin(lat)*Math.sin(eq2.dec)) / (Math.cos(lat)*Math.cos(eq2.dec));
  if (Math.abs(cH) > 1) return jd0 + (rising ? 0.25 : 0.75);
  const H0 = Math.acos(cH);
  const transit = (eq2.ra - lng - Th0) / (2*Math.PI) * 86400;
  let m = ((transit + (rising ? -1 : 1) * H0*86400/(2*Math.PI)) % 86400 + 86400) % 86400;

  for (let i = 0; i < 3; i++) {
    const n = m / 86400;
    const ra  = eq2.ra  + n*(eq3.ra  - eq1.ra) /2 + n*n*(eq3.ra  - 2*eq2.ra  + eq1.ra) /2;
    const dec = eq2.dec + n*(eq3.dec - eq1.dec)/2 + n*n*(eq3.dec - 2*eq2.dec + eq1.dec)/2;
    const th = norm360((Th0/D2R) + m*360*1.00273791/86400) * D2R;
    const H = th + lng - ra;
    const h = Math.asin(Math.sin(lat)*Math.sin(dec) + Math.cos(lat)*Math.cos(dec)*Math.cos(H));
    const dm = (h - h0) / (Math.cos(dec)*Math.cos(lat)*Math.sin(H)) * 86400/(2*Math.PI);
    m = ((m + dm) % 86400 + 86400) % 86400;
  }
  return jd0 + m / 86400;
}

// ── Lunar months (amanta) ───────────────────────────────────
const MONTHS = [
  'Chaitra', 'Vaishakha', 'Jyeshtha', 'Ashadha', 'Shravana', 'Bhadrapada',
  'Ashvina', 'Kartika', 'Margashirsha', 'Pausha', 'Magha', 'Phalguna'
];

/**
 * The amanta lunar month containing `jd`, named for the rashi the Sun
 * occupies at the new moon that begins it. A month is adhika (leap) when
 * the following new moon falls in the same rashi.
 */
function lunarMonth(jd) {
  const nm = prevNewMoon(jd);
  const rashi = Math.floor(sunSidereal(nm + 0.0001) / 30);
  const nextNm = prevNewMoon(nm + 30.5);
  const nextRashi = Math.floor(sunSidereal(nextNm + 0.0001) / 30);
  return { index: (rashi + 1) % 12, adhika: rashi === nextRashi, newMoonJD: nm };
}

// ============================================================
// Festival rules
//
// system: 'amanta'      — month runs new moon → new moon (South/West India)
//         'purnimanta'  — month runs full moon → full moon (North India);
//                          its Krishna paksha is one month ahead of amanta.
// tithi:  1..15 in the named paksha (15 = Purnima / Amavasya).
// rule:   'sunrise' (default) | 'pradosh' (evening) | 'nishita' (midnight)
// ============================================================
const LUNAR_FESTIVALS = [
  { name: 'Vasant Panchami',            month: 'Magha',       paksha: 'S', tithi: 5 },
  { name: 'Ratha Saptami',              month: 'Magha',       paksha: 'S', tithi: 7 },
  { name: 'Magha Purnima',              month: 'Magha',       paksha: 'S', tithi: 15 },
  { name: 'Maha Shivratri',             month: 'Phalguna',    paksha: 'K', tithi: 14, system: 'purnimanta', rule: 'nishita' },
  { name: 'Holika Dahan',               month: 'Phalguna',    paksha: 'S', tithi: 15, rule: 'pradosh' },
  { name: 'Holi',                       month: 'Phalguna',    paksha: 'S', tithi: 15, rule: 'pradosh', offset: 1 },
  { name: 'Ugadi / Gudi Padwa',         month: 'Chaitra',     paksha: 'S', tithi: 1 },
  { name: 'Chaitra Navratri Begins',    month: 'Chaitra',     paksha: 'S', tithi: 1 },
  { name: 'Ram Navami',                 month: 'Chaitra',     paksha: 'S', tithi: 9 },
  { name: 'Hanuman Jayanti',            month: 'Chaitra',     paksha: 'S', tithi: 15 },
  { name: 'Akshaya Tritiya',            month: 'Vaishakha',   paksha: 'S', tithi: 3 },
  { name: 'Narasimha Jayanti',          month: 'Vaishakha',   paksha: 'S', tithi: 14 },
  { name: 'Buddha Purnima',             month: 'Vaishakha',   paksha: 'S', tithi: 15 },
  { name: 'Rath Yatra',                 month: 'Ashadha',     paksha: 'S', tithi: 2 },
  { name: 'Guru Purnima',               month: 'Ashadha',     paksha: 'S', tithi: 15 },
  { name: 'Nag Panchami',               month: 'Shravana',    paksha: 'S', tithi: 5 },
  { name: 'Raksha Bandhan',             month: 'Shravana',    paksha: 'S', tithi: 15 },
  { name: 'Krishna Janmashtami',        month: 'Bhadrapada',  paksha: 'K', tithi: 8, system: 'purnimanta', rule: 'nishita' },
  { name: 'Ganesh Chaturthi',           month: 'Bhadrapada',  paksha: 'S', tithi: 4 },
  { name: 'Anant Chaturdashi',          month: 'Bhadrapada',  paksha: 'S', tithi: 14 },
  { name: 'Mahalaya Amavasya',          month: 'Bhadrapada',  paksha: 'K', tithi: 15 },
  { name: 'Navratri Begins',            month: 'Ashvina',     paksha: 'S', tithi: 1 },
  { name: 'Durga Ashtami',              month: 'Ashvina',     paksha: 'S', tithi: 8 },
  { name: 'Maha Navami / Ayudha Puja',  month: 'Ashvina',     paksha: 'S', tithi: 9 },
  { name: 'Dussehra / Vijayadashami',   month: 'Ashvina',     paksha: 'S', tithi: 10 },
  { name: 'Sharad Purnima',             month: 'Ashvina',     paksha: 'S', tithi: 15 },
  { name: 'Karva Chauth',               month: 'Kartika',     paksha: 'K', tithi: 4, system: 'purnimanta' },
  { name: 'Dhanteras',                  month: 'Kartika',     paksha: 'K', tithi: 13, system: 'purnimanta', rule: 'pradosh' },
  { name: 'Naraka Chaturdashi',         month: 'Kartika',     paksha: 'K', tithi: 14, system: 'purnimanta' },
  { name: 'Diwali / Lakshmi Puja',      month: 'Kartika',     paksha: 'K', tithi: 15, system: 'purnimanta', rule: 'pradosh' },
  { name: 'Govardhan Puja / Annakut',   month: 'Kartika',     paksha: 'S', tithi: 1 },
  { name: 'Bhai Dooj',                  month: 'Kartika',     paksha: 'S', tithi: 2 },
  { name: 'Chhath Puja',                month: 'Kartika',     paksha: 'S', tithi: 6 },
  { name: 'Skanda Sashti',              month: 'Kartika',     paksha: 'S', tithi: 6 },
  { name: 'Tulsi Vivah',                month: 'Kartika',     paksha: 'S', tithi: 12 },
  // Kartika Purnima / Dev Deepawali is a lamp-lighting observed at dusk, so
  // it follows the evening rather than the sunrise. Raksha Bandhan and Guru
  // Purnima are daytime observances and deliberately keep the sunrise rule.
  { name: 'Kartika Purnima',            month: 'Kartika',     paksha: 'S', tithi: 15, rule: 'pradosh' },
  { name: 'Gita Jayanti',               month: 'Margashirsha',paksha: 'S', tithi: 11 },
];

// Sun's entry into a sidereal rashi. Resolved in IST because these are
// announced on the same civil date everywhere.
const SANKRANTI_FESTIVALS = [
  { name: 'Makar Sankranti / Pongal',   degrees: 270, tz: 'Asia/Kolkata' },
  { name: 'Tamil New Year / Vishu',     degrees: 0,   tz: 'Asia/Kolkata' },
];

// Nakshatra-in-solar-month festivals.
const NAKSHATRA_FESTIVALS = [
  { name: 'Onam (Thiruvonam)',  nakshatra: 21, rashi: 4,  note: 'Shravana nakshatra in Chingam' },
  { name: 'Karthigai Deepam',   nakshatra: 2,  rashi: 7,  note: 'Krittika nakshatra in Kartikai', preferFull: true },
  { name: 'Thai Poosam',        nakshatra: 7,  rashi: 9,  note: 'Pushya nakshatra in Thai', preferFull: true },
];

/**
 * Build a per-day table of sunrise/sunset, tithi and lunar month for
 * every local date in [startJD, endJD].
 */
function buildDayTable(startJD, endJD, loc) {
  const days = [];
  for (let jd0 = Math.floor(startJD) + 0.5; jd0 <= endJD; jd0 += 1) {
    const sunrise = sunEventJD(jd0, loc, true);
    // West of Greenwich the sunset following a given sunrise falls in the
    // next UT day, so take the first sunset that actually comes after it.
    let sunset = sunEventJD(jd0, loc, false);
    if (sunset < sunrise) sunset = sunEventJD(jd0 + 1, loc, false);
    const t = tithiAt(sunrise);
    const lm = lunarMonth(sunrise);
    days.push({
      jd0, sunrise, sunset,
      date: localDateStr(sunrise, loc.tz),
      tithi: t,
      paksha: t <= 15 ? 'S' : 'K',
      amanta: lm.index,
      purnimanta: t <= 15 ? lm.index : (lm.index + 1) % 12,
      adhika: lm.adhika,
      lunation: Math.round(lm.newMoonJD)
    });
  }
  return days;
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * Compute Hindu festival dates for [startYear, endYear] inclusive.
 * Returns [{ name, date, type, note }] sorted by date.
 */
function computeFestivals(startYear, endYear, loc = BAY_AREA) {
  const startJD = toJD(startYear, 1, 1) - 40;
  const endJD   = toJD(endYear, 12, 31) + 40;
  const days = buildDayTable(startJD, endJD, loc);
  const out = [];

  // Index the day table by lunation (new moon to new moon) so each rule
  // fires at most once per lunar month.
  const byLunation = new Map();
  for (const d of days) {
    if (!byLunation.has(d.lunation)) byLunation.set(d.lunation, []);
    byLunation.get(d.lunation).push(d);
  }
  const dayIndex = new Map(days.map((d, i) => [d, i]));

  for (const rule of LUNAR_FESTIVALS) {
    const system = rule.system || 'amanta';
    const wantMonth = MONTHS.indexOf(rule.month);
    const wantTithi = rule.paksha === 'S' ? rule.tithi : rule.tithi + 15;

    for (const group of byLunation.values()) {
      // The month a day belongs to depends on its paksha under the
      // purnimanta system, so both must match for the rule to apply.
      const inMonth = group.filter(d =>
        !d.adhika && d[system] === wantMonth && d.paksha === rule.paksha
      );
      if (!inMonth.length) continue;

      // Normal case: the tithi prevails at one or more sunrises. When it
      // spans two sunrises (an adhika tithi) Bay Area temples observe the
      // later day — Navratri 2026 opens on 11 Oct, not 10 Oct, even though
      // Pratipada is current at both sunrises.
      const matches = inMonth.filter(d => d.tithi === wantTithi);
      let day = matches.length ? matches[matches.length - 1] : null;

      // Kshaya tithi: the tithi begins and ends between two sunrises, so it
      // never prevails at one. It is then folded into the following day, so
      // a skipped amavasya still yields Mahalaya on the day Pitru Paksha
      // closes. An amavasya can be skipped too, so the scan has to be able
      // to cross into the next lunation rather than stop at the month edge.
      if (!day) {
        const startIdx = dayIndex.get(group[0]);
        for (let i = startIdx; i < days.length; i++) {
          if (days[i].lunation > group[0].lunation || days[i].tithi > wantTithi) {
            day = days[i];
            break;
          }
        }
        if (!day) continue;
      }

      let date = day.date;
      // Pradosh (evening) and nishita (midnight) observances need the tithi
      // to cover that moment. The sunrise day is kept whenever it does —
      // moving off it too readily pushed Dhanteras a day early — and only
      // an adjacent day is used when it does not.
      if (rule.rule === 'pradosh' || rule.rule === 'nishita') {
        const probeOf = x => rule.rule === 'pradosh' ? x.sunset + 0.02 : x.sunrise + 0.75;
        if (tithiAt(probeOf(day)) !== wantTithi) {
          const i = dayIndex.get(day);
          const alt = [days[i - 1], days[i + 1]]
            .find(x => x && tithiAt(probeOf(x)) === wantTithi);
          if (alt) date = alt.date;
        }
      }
      if (rule.offset) date = addDays(date, rule.offset);
      out.push({ name: rule.name, date, type: 'festival' });
    }
  }

  // Sankranti (solar) festivals
  for (const f of SANKRANTI_FESTIVALS) {
    for (let y = startYear - 1; y <= endYear + 1; y++) {
      const jd = findSankranti(f.degrees, toJD(y, 1, 1) - 20, 400);
      if (jd === null) continue;
      out.push({ name: f.name, date: localDateStr(jd, f.tz), type: 'festival' });
    }
  }

  // Nakshatra-in-solar-month festivals
  for (const f of NAKSHATRA_FESTIVALS) {
    let run = [];
    const flush = () => {
      if (!run.length) return;
      // Karthigai Deepam and Thai Poosam are lamp/dusk observances tied to
      // the full moon, so the day whose *evening* carries Purnima wins;
      // otherwise fall back to the day closest to it at sunrise.
      const pick = f.preferFull
        ? (run.find(d => tithiAt(d.sunset + 0.02) === 15) ||
           run.reduce((a, b) => (Math.abs(b.tithi - 15) < Math.abs(a.tithi - 15) ? b : a)))
        : run[run.length - 1];
      out.push({ name: f.name, date: pick.date, type: 'festival', note: f.note });
      run = [];
    };
    for (const d of days) {
      const inMonth = Math.floor(sunSidereal(d.sunrise) / 30) === f.rashi;
      if (inMonth && nakshatraAt(d.sunrise) === f.nakshatra) run.push(d);
      else flush();
    }
    flush();
  }

  // Vaikuntha Ekadashi — the Shukla Ekadashi that falls while the Sun is in
  // Dhanu (Dhanurmasa, roughly 16 Dec - 14 Jan). Resolved per lunation with
  // the same skipped-tithi handling as the rules above, because Ekadashi is
  // skipped outright in some years (2026 runs Dashami -> Dwadashi).
  // Dhanurmasa straddles the civil year, so a given year can legitimately
  // carry two of these or none.
  const vaikunthaCandidates = [];
  for (const group of byLunation.values()) {
    if (group[0].adhika) continue;
    let day = null;
    const onEkadashi = group.filter(d => d.tithi === 11);
    if (onEkadashi.length) {
      day = onEkadashi[onEkadashi.length - 1];
    } else {
      const startIdx = dayIndex.get(group[0]);
      for (let i = startIdx; i < days.length; i++) {
        if (days[i].lunation !== group[0].lunation) break;
        if (days[i].tithi > 11) { day = days[i]; break; }
      }
    }
    if (!day) continue;
    // Dhanu spans 240-270 degrees. The window is widened slightly because in
    // some seasons (2029-30) the Shukla Ekadashi falls a day outside it on
    // both sides; the observance still happens, on whichever is nearer.
    const lon = sunSidereal(day.sunrise);
    if (lon < 234 || lon > 276) continue;
    vaikunthaCandidates.push({ day, offset: Math.abs(lon - 255) });
  }

  // One per Dhanurmasa season: candidates a lunation apart belong to the
  // same season, and the one closest to mid-Dhanu is the observance.
  vaikunthaCandidates.sort((a, b) => a.day.jd0 - b.day.jd0);
  for (let i = 0; i < vaikunthaCandidates.length;) {
    let j = i;
    while (j + 1 < vaikunthaCandidates.length &&
           vaikunthaCandidates[j + 1].day.jd0 - vaikunthaCandidates[j].day.jd0 < 45) j++;
    const best = vaikunthaCandidates.slice(i, j + 1)
      .reduce((a, b) => (b.offset < a.offset ? b : a));
    out.push({ name: 'Vaikuntha Ekadashi', date: best.day.date, type: 'festival' });
    i = j + 1;
  }

  // Varalakshmi Vratam — the Friday before Shravana Purnima.
  for (const d of days) {
    if (!(d.amanta === MONTHS.indexOf('Shravana') && d.tithi === 15 && !d.adhika)) continue;
    for (let back = 1; back <= 7; back++) {
      const cand = addDays(d.date, -back);
      if (new Date(cand + 'T12:00:00Z').getUTCDay() === 5) {
        out.push({ name: 'Varalakshmi Vratam', date: cand, type: 'festival' });
        break;
      }
    }
  }

  const seen = new Set();
  return out
    .filter(f => {
      const y = +f.date.slice(0, 4);
      if (y < startYear || y > endYear) return false;
      const k = f.name + '|' + f.date;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name));
}

/**
 * Ekadashi dates, computed the same way the browser module does
 * (tithi 11 / 26 prevailing at local sunrise) so the calendar can
 * extend past the years hard-coded in ekadashi.js.
 */
const EK_NAMES = {
  '0-S': 'Pausha Putrada Ekadashi',  '0-K': 'Shattila Ekadashi',
  '1-S': 'Jaya Ekadashi',            '1-K': 'Vijaya Ekadashi',
  '2-S': 'Amalaki Ekadashi',         '2-K': 'Papamochani Ekadashi',
  '3-S': 'Kamada Ekadashi',          '3-K': 'Varuthini Ekadashi',
  '4-S': 'Mohini Ekadashi',          '4-K': 'Apara Ekadashi',
  '5-S': 'Nirjala Ekadashi',         '5-K': 'Yogini Ekadashi',
  '6-S': 'Devshayani Ekadashi',      '6-K': 'Kamika Ekadashi',
  '7-S': 'Shravana Putrada Ekadashi','7-K': 'Aja Ekadashi',
  '8-S': 'Parsva Ekadashi',          '8-K': 'Indira Ekadashi',
  '9-S': 'Papankusha Ekadashi',      '9-K': 'Rama Ekadashi',
  '10-S': 'Devutthana Ekadashi',     '10-K': 'Utpanna Ekadashi',
  '11-S': 'Mokshada Ekadashi',       '11-K': 'Saphala Ekadashi',
};

function computeEkadashi(startYear, endYear, loc = BAY_AREA) {
  const days = buildDayTable(toJD(startYear, 1, 1) - 5, toJD(endYear, 12, 31) + 5, loc);
  const out = [];
  let lastDate = null;
  for (const d of days) {
    if (d.tithi !== 11 && d.tithi !== 26) continue;
    if (lastDate && Math.abs(new Date(d.date) - new Date(lastDate)) < 3 * 86400000) continue;
    const month = +d.date.slice(5, 7) - 1;
    const pk = d.tithi === 11 ? 'S' : 'K';
    out.push({
      date: d.date,
      name: EK_NAMES[`${month}-${pk}`] || (pk === 'S' ? 'Shukla Ekadashi' : 'Krishna Ekadashi'),
      paksha: pk === 'S' ? 'Shukla' : 'Krishna'
    });
    lastDate = d.date;
  }
  return out.filter(e => {
    const y = +e.date.slice(0, 4);
    return y >= startYear && y <= endYear;
  });
}

// ── Public API ──────────────────────────────────────────────
// Festival scanning is the expensive part (a sunrise + lunar-month
// solve per day), so results are memoised per location and year.
const _cache = new Map();

function festivalsForYear(year, loc) {
  const key = `${year}|${loc.lat.toFixed(3)},${loc.lon.toFixed(3)},${loc.tz}`;
  if (!_cache.has(key)) _cache.set(key, computeFestivals(year, year, loc));
  return _cache.get(key);
}

/**
 * Festivals between two 'YYYY-MM-DD' dates (inclusive) for `loc`.
 * Only the years actually needed are computed, so month-to-month
 * calendar navigation stays cheap after the first render.
 */
function festivalsBetween(fromDate, toDate, loc) {
  const l = loc && loc.lat != null
    ? { lat: loc.lat, lon: loc.lon != null ? loc.lon : loc.lng, tz: loc.tz || loc.tzName || BAY_AREA.tz }
    : BAY_AREA;
  const out = [];
  for (let y = +fromDate.slice(0, 4); y <= +toDate.slice(0, 4); y++) {
    for (const f of festivalsForYear(y, l)) {
      if (f.date >= fromDate && f.date <= toDate) out.push(f);
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name));
}

function clearCache() { _cache.clear(); }

const Panchang = {
  BAY_AREA, MONTHS,
  festivalsBetween, festivalsForYear, clearCache,
  computeFestivals, computeEkadashi,
  // primitives, exposed for tests
  toJD, tithiAt, nakshatraAt, lunarMonth, sunEventJD, localDateStr,
  sunSidereal, moonSidereal, findSankranti
};

if (typeof window !== 'undefined') window.Panchang = Panchang;
if (typeof module !== 'undefined' && module.exports) module.exports = Panchang;

})();
