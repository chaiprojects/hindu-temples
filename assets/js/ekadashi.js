// ============================================================
// Ekadashi Calculator — Astronomical Algorithm
// Based on Jean Meeus, Chapters 25 & 47
//
// Calculates tithis (lunar days) by computing the elongation
// (Moon longitude - Sun longitude). Each tithi = 12° of elongation.
// Ekadashi = 11th tithi of Shukla Paksha (waxing, elongation 120°)
//          + 11th tithi of Krishna Paksha (waning, elongation 300°)
//
// The "governing tithi" is the one active at local SUNRISE.
//
// To swap in a real Ekadashi API:
//   Replace computeEkadashiDates() with a fetch call to your
//   preferred Panchang API, mapping its response to the same
//   { date, name, paksha } format used here.
// ============================================================

const J2000 = 2451545.0;
const JC = 36525.0;
const D2R = Math.PI / 180;

// Julian Day from Gregorian calendar
function toJD(Y, M, D) {
  if (M <= 2) { Y--; M += 12; }
  const A = Math.floor(Y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + D + B - 1524.5;
}

function jdFromDate(date) {
  return toJD(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate() + (date.getUTCHours() * 3600 + date.getUTCMinutes() * 60 + date.getUTCSeconds()) / 86400
  );
}

function jdToDate(jd) {
  let z = Math.floor(jd + 0.5);
  let f = (jd + 0.5) - z;
  let a = z;
  if (z >= 2299161) {
    const g = Math.floor((z - 1867216.25) / 36524.25);
    a = z + 1 + g - Math.floor(g / 4);
  }
  const b = a + 1524;
  const c = Math.floor((b - 122.1) / 365.25);
  const d = Math.floor(365.25 * c);
  const e = Math.floor((b - d) / 30.6001);
  const day = b - d - Math.floor(30.6001 * e) + f;
  const month = e < 14 ? e - 1 : e - 13;
  const year = month > 2 ? c - 4716 : c - 4715;
  return new Date(Date.UTC(year, month - 1, Math.floor(day)));
}

// Sun ecliptic longitude (Meeus Ch.25, ~0.01° accuracy)
function sunLongitude(T) {
  const L0 = (280.46646 + 36000.76983 * T + 0.0003032 * T * T) % 360;
  const M = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) * D2R;
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M)
          + (0.019993 - 0.000101 * T) * Math.sin(2 * M)
          + 0.000289 * Math.sin(3 * M);
  const Om = (125.04 - 1934.136 * T) * D2R;
  return ((L0 + C - 0.00569 - 0.00478 * Math.sin(Om)) % 360 + 360) % 360;
}

// Moon ecliptic longitude (Meeus Ch.47, 60-term table, ~0.01° accuracy)
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
  const Mp = pM(134.9633964 + 477198.8675055*T  + 0.0087414*T*T + T*T*T/69699    - T*T*T*T/14712000);
  const F  = pM(93.272095   + 483202.0175233*T  - 0.0036539*T*T - T*T*T/3526000  + T*T*T*T/863310000);
  const E  = 1 - 0.002516*T - 0.0000074*T*T;
  const E2 = E * E;
  const A1 = (119.75 + 131.849   * T) * D2R;
  const A2 = ( 53.09 + 479264.29 * T) * D2R;

  let suml = 0;
  for (const [dD,dM,dMp,dF,sl] of ML) {
    const ec = Math.abs(dM) === 1 ? E : Math.abs(dM) === 2 ? E2 : 1;
    suml += ec * sl * Math.sin(dD*D + dM*M + dMp*Mp + dF*F);
  }
  suml += 3958*Math.sin(A1) + 1962*Math.sin(Lp - F) + 318*Math.sin(A2);
  return ((Lp/D2R + suml*1e-6) % 360 + 360) % 360;
}

// Elongation (Moon minus Sun) and tithi (1-30)
function elongation(T) {
  return ((moonLongitude(T) - sunLongitude(T)) % 360 + 360) % 360;
}

function tithi(T) {
  return Math.floor(elongation(T) / 12) + 1;
}

// Binary search: find JD when elongation = targetDeg
function findElongationCrossing(targetDeg, jdLo, jdHi) {
  const fn = jd => {
    let el = elongation((jd - J2000) / JC);
    if (targetDeg < 30  && el > 330) el -= 360;
    if (targetDeg > 330 && el < 30)  el += 360;
    return el - targetDeg;
  };
  if (fn(jdLo) * fn(jdHi) > 0) return null;
  for (let i = 0; i < 60; i++) {
    const mid = (jdLo + jdHi) / 2;
    if (jdHi - jdLo < 1e-7) break;
    fn(jdLo) * fn(mid) <= 0 ? (jdHi = mid) : (jdLo = mid);
  }
  return (jdLo + jdHi) / 2;
}

// Sunrise JD for a given date midnight JD (Meeus Ch.15)
function sunriseJD(jd0, loc) {
  const ekLat = loc.lat * D2R;
  const ekLng = loc.lon * D2R;
  const h0 = -0.8333 * D2R;

  function sunEquatorial(jd) {
    const T = (jd - J2000) / JC;
    const Lp = sunLongitude(T) * D2R;
    const U = T / 100;
    const eps0 = 23 + 26/60 + 21.448/3600 + (-4680.93*U - 1.55*U*U + 1999.25*U*U*U
               - 51.38*Math.pow(U,4) - 249.67*Math.pow(U,5) - 39.05*Math.pow(U,6)
               + 7.12*Math.pow(U,7) + 27.87*Math.pow(U,8) + 5.79*Math.pow(U,9))/3600;
    const Om = (125.04 - 1934.136*T) * D2R;
    const eps = (eps0 + 0.00256*Math.cos(Om)) * D2R;
    return {
      ra: Math.atan2(Math.cos(eps)*Math.sin(Lp), Math.cos(Lp)),
      dec: Math.asin(Math.sin(eps)*Math.sin(Lp))
    };
  }

  const [eq1, eq2, eq3] = [sunEquatorial(jd0-1), sunEquatorial(jd0), sunEquatorial(jd0+1)];
  const T0 = (jd0 - J2000) / JC;
  const Th0 = ((100.4606184 + 36000.7700536*T0 + 0.000387933*T0*T0 - T0*T0*T0/38710000) % 360 + 360) % 360 * D2R;
  const cH = (Math.sin(h0) - Math.sin(ekLat)*Math.sin(eq2.dec)) / (Math.cos(ekLat)*Math.cos(eq2.dec));
  if (Math.abs(cH) > 1) return jd0 + 0.25;
  const H0 = Math.acos(cH);
  const mt = (eq2.ra - ekLng - Th0) / (2*Math.PI) * 86400;
  let m = ((mt - H0*86400/(2*Math.PI)) % 86400 + 86400) % 86400;

  for (let i = 0; i < 2; i++) {
    const n = m / 86400;
    const ra = eq2.ra + n*(eq3.ra - eq1.ra)/2 + n*n*(eq3.ra - 2*eq2.ra + eq1.ra)/2;
    const dec = eq2.dec + n*(eq3.dec - eq1.dec)/2 + n*n*(eq3.dec - 2*eq2.dec + eq1.dec)/2;
    const th = ((Th0 + m*2*Math.PI*1.00273791/86400) % (2*Math.PI) + 2*Math.PI) % (2*Math.PI);
    const H = th - ekLng - ra;
    const h = Math.asin(Math.sin(ekLat)*Math.sin(dec) + Math.cos(ekLat)*Math.cos(dec)*Math.cos(H));
    const dm = (h - h0) / (Math.cos(dec)*Math.cos(ekLat)*Math.sin(H)) * 86400/(2*Math.PI);
    m = ((m + dm) % 86400 + 86400) % 86400;
  }
  return jd0 + m / 86400;
}

// Ekadashi name lookup by solar month and paksha
const EK_NAMES = {
  '0-S':'Putrada Ekadashi',    '0-K':'Shattila Ekadashi',
  '1-S':'Jaya Ekadashi',       '1-K':'Vijaya Ekadashi',
  '2-S':'Amalaki Ekadashi',    '2-K':'Papamochani Ekadashi',
  '3-S':'Kamada Ekadashi',     '3-K':'Varuthini Ekadashi',
  '4-S':'Mohini Ekadashi',     '4-K':'Apara Ekadashi',
  '5-S':'Nirjala Ekadashi',    '5-K':'Yogini Ekadashi',
  '6-S':'Devshayani Ekadashi', '6-K':'Kamika Ekadashi',
  '7-S':'Putrada Ekadashi (Shravana)', '7-K':'Aja Ekadashi',
  '8-S':'Parsva Ekadashi',     '8-K':'Indira Ekadashi',
  '9-S':'Papankusha Ekadashi', '9-K':'Rama Ekadashi',
  '10-S':'Devutthana Ekadashi','10-K':'Utpanna Ekadashi',
  '11-S':'Mokshada Ekadashi',  '11-K':'Saphala Ekadashi',
  'adhik-S':'Padmini Ekadashi','adhik-K':'Parama Ekadashi',
};

/**
 * Compute Ekadashi dates for a year range at a given location.
 * @param {number} yearStart
 * @param {number} yearEnd
 * @param {{ lat: number, lon: number, tzName: string }} loc
 * @returns {Array<{ date: Date, name: string, paksha: string }>}
 */
function computeEkadashiDates(yearStart, yearEnd, loc) {
  const results = [];
  const jdStart = toJD(yearStart, 1, 1) - 1;
  const jdEnd = toJD(yearEnd, 12, 31) + 2;
  const step = 0.45; // scan step < one tithi duration (~0.98 day)

  let prevTithi = tithi((jdStart - J2000) / JC);

  for (let jd = jdStart; jd < jdEnd; jd += step) {
    const curTithi = tithi((jd - J2000) / JC);

    if (curTithi !== prevTithi) {
      for (const target of [11, 26]) {
        const crossed = prevTithi < curTithi
          ? (prevTithi < target && target <= curTithi)
          : (prevTithi < target || target <= curTithi);

        if (crossed) {
          const targetEl = (target - 1) * 12;
          const jdCross = findElongationCrossing(targetEl, jd - step, jd + step);
          if (jdCross === null) continue;

          const tz = window.RahuKalam.getTZOffsetHours(jdToDate(jdCross), loc.tzName);
          const localDate = jdToDate(jdCross + tz / 24);

          for (const offset of [0, 1]) {
            const checkDate = new Date(localDate);
            checkDate.setUTCDate(checkDate.getUTCDate() + offset);
            const localMidnightJD = toJD(
              checkDate.getUTCFullYear(), checkDate.getUTCMonth() + 1, checkDate.getUTCDate()
            ) + 0.5 - tz / 24;
            const srJD = sunriseJD(localMidnightJD, loc);
            const tSunrise = tithi((srJD - J2000) / JC);

            if (tSunrise === target) {
              const paksha = target === 11 ? 'Shukla' : 'Krishna';
              const mo = checkDate.getUTCMonth();
              const pk = target === 11 ? 'S' : 'K';
              const key = `${mo}-${pk}`;
              const name = EK_NAMES[key] || `${paksha} Ekadashi`;
              results.push({ date: new Date(checkDate), name, paksha });
              break;
            }
          }
        }
      }
    }
    prevTithi = curTithi;
  }

  // Post-process: if two Ekadashis of same paksha in same month → mark second as Adhik Maas
  const seen = {};
  for (const e of results) {
    const mo = e.date.getUTCMonth();
    const pk = e.paksha[0];
    const key = `${e.date.getUTCFullYear()}-${mo}-${pk}`;
    if (seen[key]) {
      e.name = EK_NAMES[`adhik-${pk}`] || e.name;
    } else {
      seen[key] = true;
    }
  }

  return results;
}

// Mutable cache — filled after location is known
let _ekCache = [];
let _ekGeneration = 0;

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function fmtDate(d) {
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

/**
 * Get the next Ekadashi from cache.
 * @returns {{ dateISO: string, localDateString: string, ekadashiName: string, type: string } | null}
 */
function getNextEkadashi(lat, lon, tz) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = _ekCache.filter(e => e.date >= today);
  if (upcoming.length === 0) return null;
  const next = upcoming[0];
  return {
    dateISO: next.date.toISOString().split('T')[0],
    localDateString: fmtDate(next.date),
    ekadashiName: next.name,
    type: next.paksha
  };
}

function getEkadashiList() {
  return _ekCache;
}

/**
 * Render the Ekadashi list widget showing past and upcoming dates.
 */
function renderEkadashi() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const list = document.getElementById('ekadashiList');
  if (!list) return;

  const ekList = getEkadashiList();
  const upcoming = ekList.filter(e => e.date >= today);
  const past = ekList.filter(e => e.date < today).slice(-2);
  const show = [...past, ...upcoming.slice(0, 7)];

  list.innerHTML = show.map(e => {
    const isPast = e.date < today;
    const isNext = upcoming.length > 0 && e.date.getTime() === upcoming[0].date.getTime();
    return `<div class="ek-item${isPast ? ' past' : ''}${isNext ? ' next' : ''}" role="listitem">
      <div>
        <span class="ek-name">${e.name}${isNext ? '<span class="badge">Next</span>' : ''}</span>
        <br><span class="ek-date">${fmtDate(e.date)} &bull; ${e.paksha}</span>
      </div>
      ${isPast ? '<span style="font-size:.65rem;opacity:.5">&#10003;</span>' : ''}
    </div>`;
  }).join('');
}

/**
 * Recompute Ekadashi dates (heavy — deferred off main thread).
 */
function recomputeEkadashi(loc) {
  const gen = ++_ekGeneration;
  const listEl = document.getElementById('ekadashiList');
  if (listEl) {
    listEl.innerHTML = '<div class="cal-loading"><span class="spinner"></span> Calculating Ekadashi dates&hellip;</div>';
  }
  setTimeout(() => {
    if (gen !== _ekGeneration) return;
    _ekCache = computeEkadashiDates(
      new Date().getFullYear() - 1,
      new Date().getFullYear() + 1,
      loc
    );
    renderEkadashi();
    // Notify calendar to re-render with Ekadashi dates
    if (window.Calendar && window.Calendar.render) {
      window.Calendar.render();
    }
  }, 0);
}

// Export
window.Ekadashi = {
  computeEkadashiDates,
  getNextEkadashi,
  getEkadashiList,
  renderEkadashi,
  recomputeEkadashi,
  fmtDate
};
