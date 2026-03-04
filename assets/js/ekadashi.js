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

// Verified Ekadashi dates from drikpanchang.com for Fremont, CA (Pacific timezone)
// Format: [month(0-indexed), day, name, paksha]
const EKADASHI_DATA = {
  2025: [
    [0,9,'Pausha Putrada Ekadashi','Shukla'],[0,24,'Shattila Ekadashi','Krishna'],
    [1,7,'Jaya Ekadashi','Shukla'],[1,23,'Vijaya Ekadashi','Krishna'],
    [2,9,'Amalaki Ekadashi','Shukla'],[2,25,'Papamochani Ekadashi','Krishna'],
    [3,8,'Kamada Ekadashi','Shukla'],[3,23,'Varuthini Ekadashi','Krishna'],
    [4,7,'Mohini Ekadashi','Shukla'],[4,23,'Apara Ekadashi','Krishna'],
    [5,6,'Nirjala Ekadashi','Shukla'],[5,21,'Yogini Ekadashi','Krishna'],
    [6,6,'Devshayani Ekadashi','Shukla'],[6,20,'Kamika Ekadashi','Krishna'],
    [7,4,'Shravana Putrada Ekadashi','Shukla'],[7,18,'Aja Ekadashi','Krishna'],
    [8,3,'Parsva Ekadashi','Shukla'],[8,17,'Indira Ekadashi','Krishna'],
    [9,2,'Papankusha Ekadashi','Shukla'],[9,16,'Rama Ekadashi','Krishna'],
    [10,1,'Devutthana Ekadashi','Shukla'],[10,15,'Utpanna Ekadashi','Krishna'],
    [10,30,'Mokshada Ekadashi','Shukla'],[11,15,'Saphala Ekadashi','Krishna'],
    [11,30,'Pausha Putrada Ekadashi','Shukla']
  ],
  2026: [
    [0,13,'Shattila Ekadashi','Krishna'],[0,28,'Jaya Ekadashi','Shukla'],
    [1,12,'Vijaya Ekadashi','Krishna'],[1,27,'Amalaki Ekadashi','Shukla'],
    [2,14,'Papamochani Ekadashi','Krishna'],[2,28,'Kamada Ekadashi','Shukla'],
    [3,13,'Varuthini Ekadashi','Krishna'],[3,26,'Mohini Ekadashi','Shukla'],
    [4,12,'Apara Ekadashi','Krishna'],[4,26,'Padmini Ekadashi','Shukla'],
    [5,11,'Parama Ekadashi','Krishna'],[5,25,'Nirjala Ekadashi','Shukla'],
    [6,10,'Yogini Ekadashi','Krishna'],[6,24,'Devshayani Ekadashi','Shukla'],
    [7,8,'Kamika Ekadashi','Krishna'],[7,23,'Shravana Putrada Ekadashi','Shukla'],
    [8,6,'Aja Ekadashi','Krishna'],[8,22,'Parsva Ekadashi','Shukla'],
    [9,6,'Indira Ekadashi','Krishna'],[9,21,'Papankusha Ekadashi','Shukla'],
    [10,4,'Rama Ekadashi','Krishna'],[10,20,'Devutthana Ekadashi','Shukla'],
    [11,4,'Utpanna Ekadashi','Krishna'],[11,19,'Mokshada Ekadashi','Shukla']
  ],
  2027: [
    [0,2,'Saphala Ekadashi','Krishna'],[0,18,'Pausha Putrada Ekadashi','Shukla'],
    [1,1,'Shattila Ekadashi','Krishna'],[1,16,'Jaya Ekadashi','Shukla'],
    [2,3,'Vijaya Ekadashi','Krishna'],[2,18,'Amalaki Ekadashi','Shukla'],
    [3,2,'Papamochani Ekadashi','Krishna'],[3,16,'Kamada Ekadashi','Shukla'],
    [4,2,'Varuthini Ekadashi','Krishna'],[4,15,'Mohini Ekadashi','Shukla'],
    [4,31,'Apara Ekadashi','Krishna'],[5,14,'Nirjala Ekadashi','Shukla'],
    [5,29,'Yogini Ekadashi','Krishna'],[6,13,'Devshayani Ekadashi','Shukla'],
    [6,29,'Kamika Ekadashi','Krishna'],[7,12,'Shravana Putrada Ekadashi','Shukla'],
    [7,27,'Aja Ekadashi','Krishna'],[8,11,'Parsva Ekadashi','Shukla'],
    [8,25,'Indira Ekadashi','Krishna'],[9,10,'Papankusha Ekadashi','Shukla'],
    [9,25,'Rama Ekadashi','Krishna'],[10,9,'Devutthana Ekadashi','Shukla'],
    [10,23,'Utpanna Ekadashi','Krishna'],[11,9,'Mokshada Ekadashi','Shukla'],
    [11,23,'Saphala Ekadashi','Krishna']
  ]
};

/**
 * Convert JD to local time string (e.g., "6:42 AM").
 */
function formatJDToTime(jd, tzHours) {
  const utcFrac = ((jd + 0.5) % 1 + 1) % 1;
  let localHours = utcFrac * 24 + tzHours;
  if (localHours < 0) localHours += 24;
  if (localHours >= 24) localHours -= 24;
  const h = Math.floor(localHours);
  const m = Math.round((localHours - h) * 60);
  const ap = h >= 12 ? 'PM' : 'AM';
  const hh = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hh}:${String(m).padStart(2, '0')} ${ap}`;
}

/**
 * Calculate Parana (fast-breaking) window for an Ekadashi.
 * Parana: sunrise on Dwadashi (day after Ekadashi) to end of Dwadashi tithi.
 */
function calculateParana(ekadashi, loc) {
  const dwadashiDate = new Date(ekadashi.date);
  dwadashiDate.setUTCDate(dwadashiDate.getUTCDate() + 1);

  // Use proven NOAA sunrise from RahuKalam (returns minutes from midnight local)
  const localDate = new Date(
    dwadashiDate.getUTCFullYear(),
    dwadashiDate.getUTCMonth(),
    dwadashiDate.getUTCDate()
  );
  const { sunrise: srMins } = window.RahuKalam.calcSunriseSunset(localDate, loc);
  const startTime = window.RahuKalam.minsToTime(srMins);

  // End of Dwadashi tithi: 144° (Shukla) or 324° (Krishna)
  const tz = window.RahuKalam.getTZOffsetHours(localDate, loc.tzName);
  const jd0hUT = toJD(
    dwadashiDate.getUTCFullYear(),
    dwadashiDate.getUTCMonth() + 1,
    dwadashiDate.getUTCDate()
  );
  const endEl = ekadashi.paksha === 'Shukla' ? 144 : 324;
  const endJD = findElongationCrossing(endEl, jd0hUT, jd0hUT + 3);

  let endTime = null;
  if (endJD) endTime = formatJDToTime(endJD, tz);

  const mo = MONTHS[dwadashiDate.getUTCMonth()];
  const day = dwadashiDate.getUTCDate();
  const label = endTime
    ? `${mo} ${day}, ${startTime} \u2013 ${endTime}`
    : `${mo} ${day}, after ${startTime}`;

  return { date: dwadashiDate, startTime, endTime, label };
}

/**
 * Compute Ekadashi dates for a year range at a given location.
 * @param {number} yearStart
 * @param {number} yearEnd
 * @param {{ lat: number, lon: number, tzName: string }} loc
 * @returns {Array<{ date: Date, name: string, paksha: string }>}
 */
function computeEkadashiDates(yearStart, yearEnd, loc) {
  // Always use astronomical algorithm based on user's location (sunrise-based tithi)
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
            // sunriseJD expects JD at 0h UT — toJD returns exactly that
            const jd0hUT = toJD(
              checkDate.getUTCFullYear(), checkDate.getUTCMonth() + 1, checkDate.getUTCDate()
            );
            const srJD = sunriseJD(jd0hUT, loc);
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

// Ekadashi Katha (stories) data — keyed by Ekadashi name
const EK_KATHAS = {
  'Pausha Putrada Ekadashi': {
    summary: 'King Suketumaan of Bhadravati had no heir. On Lord Vishnu\'s advice, he observed this Ekadashi with full devotion and was blessed with a worthy son. This vrat is especially recommended for those desiring virtuous progeny.',
    scripture: 'Bhavishya Purana',
    videoId: '3TPK0tftAoU'
  },
  'Shattila Ekadashi': {
    summary: 'Named for the six sacred uses of sesame (til) in its observance. A devoted Brahmin woman accumulated spiritual merit but neglected charity to others. Lord Vishnu taught her the importance of generous giving through this vrat.',
    scripture: 'Bhavishya Uttara Purana',
    videoId: 'KtdNdecLWas'
  },
  'Jaya Ekadashi': {
    summary: 'Two celestial beings, Malyavan and Pushpavati, were cursed by Indra to be born as demons after they were found lost in each other\'s company. Observing this Ekadashi freed them from the curse and restored their divine forms.',
    scripture: 'Padma Purana',
    videoId: '7bQ8DjFAcUg'
  },
  'Vijaya Ekadashi': {
    summary: 'When Lord Rama was preparing to cross the ocean to Lanka, sage Bakadalbhya advised Him to observe this Ekadashi to ensure victory. Lord Rama followed the counsel, and the vrat granted Him triumph over Ravana.',
    scripture: 'Skanda Purana',
    videoId: 'aZiukR99uH8'
  },
  'Amalaki Ekadashi': {
    summary: 'Named after the sacred Amla tree. King Chaitraratha worshipped Lord Vishnu beneath an Amla tree on this day. A hunter resting nearby unknowingly participated in the worship and was also liberated from his accumulated sins.',
    scripture: 'Brahmanda Purana',
    videoId: 'XHIQMMnyAgw'
  },
  'Papamochani Ekadashi': {
    summary: 'The apsara Manjughosha and sage Medhavi developed an attachment that disrupted his penance. Sage Chyavana cursed them both, but revealed that observing this Ekadashi would destroy even the gravest of sins and free them.',
    scripture: 'Bhavishya Uttara Purana',
    videoId: 'FlK1SUKlE4w'
  },
  'Kamada Ekadashi': {
    summary: 'A celestial musician named Lalit was cursed to become a fearsome demon. His devoted wife Lalita, unwavering in her love, observed this Ekadashi with complete faith. The accumulated merit freed Lalit from his terrible curse.',
    scripture: 'Varaha Purana',
    videoId: 'LUJtB4K7SSA'
  },
  'Varuthini Ekadashi': {
    summary: 'This Ekadashi bestows merit equivalent to donating elephants, horses, and gold. King Mandhata observed this sacred vrat and attained imperishable virtue that protected his kingdom and ensured prosperity for generations.',
    scripture: 'Bhavishya Purana',
    videoId: 'acHs_T1LpmE'
  },
  'Mohini Ekadashi': {
    summary: 'Named after Lord Vishnu\'s Mohini avatar. A merchant named Dhanapala had a wayward son who had fallen into terrible sins through bad company. By observing this Ekadashi, all his misdeeds were absolved and his soul was elevated.',
    scripture: 'Surya Purana',
    videoId: 'yTU_BWF0fsw'
  },
  'Apara Ekadashi': {
    summary: 'The merit of this Ekadashi equals bathing in all holy rivers and performing every sacred ritual. Even visiting Kurukshetra during a solar eclipse cannot compare to the spiritual fruit gained by faithfully observing this day.',
    scripture: 'Brahmanda Purana',
    videoId: 'ZfnLUwOtgDA'
  },
  'Nirjala Ekadashi': {
    summary: 'The most austere of all Ekadashis, observed without even water. Bhimasena, who loved food and could not fast on every Ekadashi, was advised by sage Vyasa to observe just this one strictly to gain the combined merit of all twenty-four Ekadashis.',
    scripture: 'Padma Purana',
    videoId: '-sfdjS-pfFs'
  },
  'Yogini Ekadashi': {
    summary: 'A gardener named Hemamali neglected his sacred duties serving flowers to Lord Vishnu because of attachment to his wife. He was cursed with leprosy and terrible suffering. Observing this Ekadashi vrat cured him completely.',
    scripture: 'Brahma Vaivarta Purana',
    videoId: 'XfuXOZJ-YwM'
  },
  'Devshayani Ekadashi': {
    summary: 'This day marks the beginning of Chaturmas, when Lord Vishnu enters His cosmic sleep on the serpent Shesha. King Mandhata learned that observing this Ekadashi ensures divine protection and prosperity during the four sacred months.',
    scripture: 'Padma Purana',
    videoId: 'RCuDAJEnGKY'
  },
  'Kamika Ekadashi': {
    summary: 'Even the merit of donating an umbrella and sandals to a Brahmin during scorching summer cannot equal observing this vrat. This Ekadashi is especially dear to Lord Vishnu and attracts His eternal blessings upon the devotee.',
    scripture: 'Brahma Vaivarta Purana',
    videoId: 'ClfqEVXDC2M'
  },
  'Shravana Putrada Ekadashi': {
    summary: 'The King of Mahishmati and his queen had no heir despite ruling a prosperous kingdom. They observed this sacred Ekadashi with unwavering devotion and faith, and were blessed with a noble and virtuous son.',
    scripture: 'Bhavishya Purana',
    videoId: 'Fs2SnHz3Cak'
  },
  'Aja Ekadashi': {
    summary: 'When the righteous King Harishchandra lost his kingdom, family, and everything through a series of devastating trials, sage Gautama compassionately advised him to observe this Ekadashi. Its merit restored all that he had lost.',
    scripture: 'Padma Purana',
    videoId: 'rrrNUx63qO4'
  },
  'Parsva Ekadashi': {
    summary: 'Also known as Parivartini Ekadashi, marking when Lord Vishnu turns in His cosmic sleep. King Ambarisha observed this vrat with such profound devotion that Lord Vishnu Himself appeared to protect him from the wrath of sage Durvasa.',
    scripture: 'Brahma Vaivarta Purana',
    videoId: 'dJWP-H44-nE'
  },
  'Indira Ekadashi': {
    summary: 'King Indrasena\'s deceased father appeared to him in a dream, suffering in a lower realm and pleading for liberation. By observing this Ekadashi and dedicating its merit, the king elevated his father to the heavenly realms.',
    scripture: 'Brahma Vaivarta Purana',
    videoId: 'XZGv9OD1NAo'
  },
  'Papankusha Ekadashi': {
    summary: 'Like a divine hook (ankusha) that pulls devotees from the ocean of sins (papa). Observing this Ekadashi frees the devotee from all fear of Yamaraja, the lord of death, and opens the path to Lord Vishnu\'s supreme abode.',
    scripture: 'Brahma Vaivarta Purana',
    videoId: 'aRNY-6v_Hts'
  },
  'Rama Ekadashi': {
    summary: 'The name means "delightful" and is not related to Lord Rama. A pious Brahmin\'s wife Chandrabali unknowingly committed a transgression that brought great sin upon the family. Observing this Ekadashi absolved them all completely.',
    scripture: 'Brahma Vaivarta Purana',
    videoId: 'gpm6re0R49Q'
  },
  'Devutthana Ekadashi': {
    summary: 'This joyous day marks Lord Vishnu\'s awakening from His four-month cosmic sleep. It is one of the most auspicious days in the Hindu calendar for weddings and new ventures, as the Lord resumes His active protection of the universe.',
    scripture: 'Padma Purana',
    videoId: '9GWn7EcCdQ0'
  },
  'Utpanna Ekadashi': {
    summary: 'This Ekadashi celebrates the origin of all Ekadashis. When the demon Mura threatened the cosmos, a radiant feminine power manifested from Lord Vishnu and vanquished the demon. She became Ekadashi Devi, and all Ekadashis are observed in her honor.',
    scripture: 'Padma Purana',
    videoId: '8_W8XdWzIpM'
  },
  'Mokshada Ekadashi': {
    summary: 'King Vaikhanasa was deeply troubled because his departed father was suffering in a lower realm. Lord Krishna advised him that observing this Ekadashi and offering its merit could grant liberation (moksha) to departed ancestors.',
    scripture: 'Brahmanda Purana',
    videoId: 'BudvvUGN2Uw'
  },
  'Saphala Ekadashi': {
    summary: 'A prince named Lumpaka led a sinful life and was banished by his father. Forced to sleep beneath a sacred tree on this Ekadashi night, he unknowingly observed the vrat. This transformed his destiny and led him toward righteousness.',
    scripture: 'Brahma Vaivarta Purana',
    videoId: '_xyCU5HgBs4'
  },
  'Padmini Ekadashi': {
    summary: 'This rare Ekadashi occurs only during Adhik Maas (the extra lunar month). Observing it carries extraordinary spiritual merit, as the extra month is considered Lord Vishnu\'s own special month, amplifying the power of all devotional practices.',
    scripture: 'Padma Purana',
    videoId: 'gH6egt2FfjE'
  },
  'Parama Ekadashi': {
    summary: 'Occurring only during the sacred Adhik Maas, this special Ekadashi bestows supreme spiritual merit. It is considered a rare and precious opportunity for devotees to earn exceptional divine grace during the extra lunar month.',
    scripture: 'Padma Purana',
    videoId: '-7XNU1jVMk8'
  }
};

/**
 * Show Katha (story) for an Ekadashi in the tooltip modal.
 */
function showKatha(name) {
  const katha = EK_KATHAS[name];
  if (!katha) return;
  const title = document.getElementById('tipTitle');
  const body = document.getElementById('tipBody');
  if (title) title.textContent = name;

  const playBtn = katha.videoId
    ? `<button class="ek-listen-btn" onclick="window.Ekadashi.playKatha('${name.replace(/'/g, "\\'")}')">`
      + '\uD83C\uDFA7 Listen to Katha</button>'
    : '';

  if (body) body.innerHTML = '<p>' + katha.summary + '</p>'
    + playBtn
    + '<p style="margin-top:.75rem;font-size:.75rem;color:var(--text-muted);font-style:italic">'
    + '\uD83D\uDCDC Source: ' + katha.scripture + '</p>';
  const overlay = document.getElementById('tooltipOverlay');
  if (overlay) overlay.classList.add('show');
}

/**
 * Play Ekadashi katha audio via the shared bhajan mini-player.
 */
function playKatha(name) {
  const katha = EK_KATHAS[name];
  if (!katha || !katha.videoId) return;

  // Stop any currently playing audio first
  if (document.body.classList.contains('bhajan-playing')) {
    window.DailyBhajan.closeMiniPlayer();
  }

  // Reuse the shared player from bhajan module
  window.DailyBhajan._startPlayer(katha.videoId, '\uD83D\uDCD6 Ekadashi Katha', name);
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
    const paranaHtml = e.parana
      ? `<div class="ek-parana">\u23F0 Parana: ${e.parana.label}</div>`
      : '';
    const hasKatha = !!EK_KATHAS[e.name];
    const escapedName = e.name.replace(/'/g, "\\'");
    const kathaBtn = hasKatha
      ? `<button class="ek-katha-link" onclick="window.Ekadashi.showKatha('${escapedName}')" title="Read the story of ${e.name}">\uD83D\uDCD6 Katha</button>`
      : '';
    return `<div class="ek-item${isPast ? ' past' : ''}${isNext ? ' next' : ''}" role="listitem">
      <div class="ek-info">
        <span class="ek-name">${e.name}${isNext ? '<span class="badge">Next</span>' : ''}</span>
        <br><span class="ek-date">${fmtDate(e.date)} &bull; ${e.paksha}</span>
        ${paranaHtml}
      </div>
      <div class="ek-actions">
        ${kathaBtn}
        ${isPast ? '<span style="font-size:.65rem;opacity:.5">&#10003;</span>' : ''}
      </div>
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
    // Add Parana (fast-breaking) data for each Ekadashi
    for (const e of _ekCache) {
      try { e.parana = calculateParana(e, loc); } catch (_) { /* skip */ }
    }
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
  showKatha,
  playKatha,
  fmtDate
};
