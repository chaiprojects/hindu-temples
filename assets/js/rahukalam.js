// ============================================================
// Rahukalam Calculator
// Calculates Rahu Kalam times based on sunrise/sunset astronomy.
//
// Rahu Kalam is an inauspicious period each day, calculated by
// dividing daylight hours into 8 equal segments and selecting
// the segment for each weekday using the traditional mapping:
//   Monday=2nd, Tuesday=7th, Wednesday=5th, Thursday=6th,
//   Friday=4th, Saturday=3rd, Sunday=8th segment from sunrise.
//
// This module uses NOAA solar position formulas to compute
// sunrise/sunset for any lat/lon/timezone combination.
// ============================================================

/**
 * Get UTC offset in hours for a given IANA timezone and date.
 * E.g., returns -7 for PDT, -8 for PST, 5.5 for IST.
 */
function getTZOffsetHours(date, tzName) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tzName,
      hour: 'numeric',
      hour12: false,
      timeZoneName: 'shortOffset'
    }).formatToParts(date);
    const off = parts.find(p => p.type === 'timeZoneName');
    if (off) {
      const m = off.value.match(/GMT([+-])(\d+)(?::(\d+))?/);
      if (m) {
        return (m[1] === '+' ? 1 : -1) * (parseInt(m[2]) + (parseInt(m[3] || 0) / 60));
      }
    }
  } catch (e) { /* fallback below */ }
  return -date.getTimezoneOffset() / 60;
}

/**
 * Compute approximate sunrise and sunset for a date and location.
 * Uses NOAA simplified solar position formulas.
 * @param {Date} date - The date to calculate for
 * @param {{ lat: number, lon: number, tzName: string }} loc - Location
 * @returns {{ sunrise: number, sunset: number }} - Minutes from midnight (local time)
 */
function calcSunriseSunset(date, loc) {
  const JD = Math.floor(date.getTime() / 86400000) + 2440587.5;
  const n = JD - 2451545.0;
  const L = (280.46 + 0.9856474 * n) % 360;
  const g = ((357.528 + 0.9856003 * n) % 360) * Math.PI / 180;
  const lambda = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * Math.PI / 180;
  const eps = 23.439 * Math.PI / 180;
  const decl = Math.asin(Math.sin(eps) * Math.sin(lambda));
  const lat = loc.lat * Math.PI / 180;
  const cosH = (Math.cos(90.833 * Math.PI / 180) - Math.sin(lat) * Math.sin(decl)) /
               (Math.cos(lat) * Math.cos(decl));

  // Fallback if sun doesn't set/rise (polar regions)
  if (Math.abs(cosH) > 1) return { sunrise: 6 * 60, sunset: 18 * 60 };

  const H = Math.acos(cosH) * 180 / Math.PI;
  let eot = L - 0.0057183 - (Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda)) * 180 / Math.PI);
  // Normalize eot to [-180, 180] to handle L/RA wrapping across 0°/360° boundary
  while (eot > 180) eot -= 360;
  while (eot < -180) eot += 360;
  const noon = 12 * 60 - (loc.lon * 4) - (eot * 4);
  const tz = getTZOffsetHours(date, loc.tzName) * 60;

  return {
    sunrise: noon - H * 4 + tz,
    sunset: noon + H * 4 + tz
  };
}

// Rahu Kalam slot index by weekday (0=Sun..6=Sat), 0-based from sunrise.
// Sun=8th(7), Mon=2nd(1), Tue=7th(6), Wed=5th(4), Thu=6th(5), Fri=4th(3), Sat=3rd(2)
const RAHU_SLOT = [7, 1, 6, 4, 5, 3, 2];

/**
 * Convert minutes from midnight to human-readable time.
 */
function minsToTime(mins) {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  const ap = h >= 12 ? 'PM' : 'AM';
  const hh = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hh}:${String(m).padStart(2, '0')} ${ap}`;
}

/**
 * Calculate Rahu Kalam start/end for a given date.
 * @param {Date} date - The date
 * @param {{ lat: number, lon: number, tzName: string }} loc - User location
 * @returns {{ start: string, end: string, startMins: number, endMins: number }}
 */
function calculateRahukalam(date, loc) {
  const { sunrise, sunset } = calcSunriseSunset(date, loc);
  const dayLen = (sunset - sunrise) / 8;
  const dow = date.getDay();
  const slot = RAHU_SLOT[dow];
  const start = sunrise + slot * dayLen;
  const end = start + dayLen;
  return {
    start: minsToTime(start),
    end: minsToTime(end),
    startMins: start,
    endMins: end
  };
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Render the Rahu Kalam weekly grid and today's callout.
 */
function renderRahuKalam(loc) {
  const today = new Date();
  const todayDow = today.getDay();
  const grid = document.getElementById('rahuGrid');
  const callout = document.getElementById('rahuCallout');

  if (!grid || !callout) return;

  // Calculate for this week (Sunday-Saturday)
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - todayDow);

  let html = '';
  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    const rk = calculateRahukalam(d, loc);
    const isToday = i === todayDow;
    html += `<div class="rahu-day${isToday ? ' today' : ''}" role="listitem">
      <span class="rdn">${DAY_SHORT[i]}</span>
      <div class="rdt">${rk.start}&ndash;<br>${rk.end}</div>
    </div>`;
  }
  grid.innerHTML = html;

  const todayRk = calculateRahukalam(today, loc);
  callout.innerHTML = `<strong>Today (${DAY_NAMES[todayDow]}):</strong> ${todayRk.start} &ndash; ${todayRk.end}<br>
    <span style="font-size:.75rem;color:var(--text-muted)">Avoid starting important work during this time.</span>`;
}

// Export for use by other modules
window.RahuKalam = {
  calculateRahukalam,
  renderRahuKalam,
  getTZOffsetHours,
  calcSunriseSunset,
  minsToTime
};
