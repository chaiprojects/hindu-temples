# SPEC — Bay Area Hindu Temples

A single-page static website and installable PWA that serves as a centralized guide to
Hindu temples in the San Francisco Bay Area (Concord → Oakland → Fremont → Tri-Valley →
Milpitas → San Jose). Live at **https://github.com/chaiprojects/hindu-temples**
(GitHub Pages, served from the `main` branch root).

## Tech stack

- **Plain HTML/CSS/JavaScript** — no framework, no build step, no package manager.
  Open `index.html` (or serve the directory) and it runs.
- **Leaflet.js 1.9.4** (unpkg CDN) with **CartoDB** raster tiles for the map — no API key.
- **Google Fonts** — Playfair Display (headings) + Inter (body).
- **YouTube IFrame API** for the bhajan audio player.
- **Nominatim** (OpenStreetMap) for forward/reverse geocoding — no API key.
- All astronomy (sunrise/sunset, tithi) is computed client-side; no backend anywhere.

## File structure

```
index.html                  Single page; all sections, loads modules with ?v= cache busters
manifest.json               PWA manifest (start_url/scope: /hindu-temples/ for GitHub Pages)
assets/
  css/styles.css            All styling (~2,800 lines), CSS custom properties, dark mode
  js/
    rahukalam.js            NOAA solar-position sunrise/sunset + Rahu Kalam calculator
    ekadashi.js             Jean Meeus lunar/solar longitude → tithi → Ekadashi dates
    temples.js              TEMPLES data array (28 entries) + card grid/carousel rendering
    map.js                  Leaflet map module (window.TempleMap)
    calendar.js             Month-view festival calendar + upcoming events list
    bhajan.js               Daily deity/bhajan player (window.DailyBhajan) + visit counter
    main.js                 Orchestrator: location state, theme, nav, wiring (loads last)
  data/events.json          Temple events (20 entries; schema below)
  icons/                    Favicons + PWA icons (16–512 px)
.gitignore                  Ignores .DS_Store, .claude/, GITHUB-DEPLOY-STEPS.md
```

Script load order matters and is enforced in `index.html`: Leaflet → rahukalam →
ekadashi → temples → map → calendar → bhajan → main.

## Features

### Location awareness
- On load, a previously resolved location is reused from localStorage
  (`bay_temples_location`) so refreshes never re-prompt for geolocation permission;
  when permission is already granted it silently refreshes coordinates in the
  background. First-ever visit tries browser geolocation, falling back to a zip-code
  entry panel; default is San Jose (37.3382, −121.8863).
- Zip codes are geocoded and coordinates reverse-geocoded to a display label via
  Nominatim. Global mutable state lives in `userLocation` (`main.js`).
- Changing location recomputes Rahu Kalam and Ekadashi for the new lat/lon/timezone.

### Rahu Kalam widget (`rahukalam.js`)
- Computes sunrise/sunset with NOAA simplified solar formulas for any
  lat/lon/IANA-timezone, then divides daylight into 8 segments.
- Traditional weekday→segment mapping (0-based from sunrise):
  Sun=8th, Mon=2nd, Tue=7th, Wed=5th, Thu=6th, Fri=4th, Sat=3rd.
- Renders a weekly grid, a "today" callout, and embeds the mini daily-deity widget.

### Ekadashi widget (`ekadashi.js`)
- Full astronomical tithi calculation (Meeus ch. 25 & 47): tithi = 12° slices of
  Moon−Sun elongation; Ekadashi = 11th tithi of each paksha (elongation 120° / 300°).
- Governing tithi is the one active at **local sunrise**. Includes Parana (fast-breaking)
  times and Katha story content per Ekadashi.
- The module header documents how to swap in a real Panchang API while keeping the
  `{ date, name, paksha }` shape.

### Interactive map (`map.js`)
- Leaflet with custom 🛕 div-icon pins and styled popups (name, deity, city, rating,
  hours, directions link).
- Light/dark tile sets (CartoDB Positron / Dark Matter) that follow the site theme via
  `TempleMap.syncTheme()`. Pins dim/highlight in sync with the list filters below.

### Temple directory (`temples.js`)
- `TEMPLES` array of 28 entries: `name, address, city, lat, lng, rating, reviews,
  hours, deity, url`. Updating data = editing this array.
- Featured-temple carousel, text search (name/city/deity), city dropdown filter,
  responsive card grid; filters stay in sync with the map.

### Festival calendar (`calendar.js`)
- Month-view grid merging three sources: a static `FESTIVALS` array (major festivals
  2025–2027, hard-coded dates), computed Ekadashi dates, and `events.json` temple events.
- Legend distinguishes Festival / Ekadashi / Temple Event dots; click opens a detail
  modal; an "Upcoming Events" list renders below the grid.
- `events.json` schema: `{ temple, city, title, startDate, endDate, time, url }`.

### Daily devotional (`bhajan.js`)
- Day-of-week → deity mapping (Sun=Surya … Sat=Shani) with mantra (English +
  Devanagari), blessing, accent color, and a **pool of ~5 curated YouTube bhajans per
  day** (`songs: [{ t, v }]`, video IDs verified via YouTube oEmbed, August 2026).
- **Song rotation**: a localStorage counter (`bhajan_song_idx`) increments on every
  page load; the song played is `songs[(counter + skip) % songs.length]`, so each
  refresh plays a different bhajan from that day's pool.
- **Autoplay**: the bhajan auto-starts ~0.8 s after page load (muted — allowed by
  browser autoplay policy — then attempts unmute). If the browser blocks the unmute,
  the *first user interaction anywhere on the page* (tap/click/keypress, captured via
  one-shot pointerdown/keydown/touchend listeners) switches sound on automatically;
  a "🔊 Tap anywhere for sound" chip in the mini-player bar doubles as a visual cue.
- **Error skip**: if a video is unavailable (YT `onError`), the player advances to the
  next song in the pool automatically.
- Renders a full card in `#bhajan-card-wrap` and a mini widget (deity, mantra, current
  song title) inside the Rahu Kalam callout; both share play/stop state.
- Playback uses the YouTube IFrame API in a floating mini-player (`#bhajanMiniPlayer`).
- Also owns the site visit counter (countapi.xyz with a localStorage fallback).

### UI / UX
- Dark mode: `data-theme` attribute on `<html>`, persisted in localStorage, defaults to
  `prefers-color-scheme`; map tiles switch with it.
- Sticky nav with mobile hamburger drawer, scroll-reveal animations, back-to-top
  button, hero stat tiles, ARIA labels/roles throughout.

### PWA
- `manifest.json`: standalone display, portrait orientation, themed colors, maskable
  192/512 icons. Apple touch icons and iOS web-app meta tags in `index.html`.
- **No service worker** — installable, but not offline-capable.

## External services (all keyless)

| Service | Used for | Failure mode |
|---|---|---|
| CartoDB tiles / OSM | Map tiles | Map blank |
| Nominatim | Zip + reverse geocoding | Falls back to coords label / default location |
| YouTube IFrame API | Bhajan playback | Play button no-ops |
| Google Fonts | Typography | System font fallback |
| countapi.xyz | Visit counter | localStorage-only count |

## Conventions

- Script tags carry `?v=N` cache busters — bump the number when editing a JS file.
- Modules expose globals (`window.TempleMap`, `window.DailyBhajan`, top-level
  functions); `main.js` wires everything on `DOMContentLoaded`.
- Deploy = push to `main`; GitHub Pages serves the repo root. No CI.

## Known issues / limitations

- `assets/data/events.json`: first entry's URL contains a stray Arabic character
  (`https://ثshivamurugan.org`) — should be `https://shivamurugan.org`.
- countapi.xyz has been unreliable/discontinued; the counter usually falls back to the
  per-device localStorage count.
- Hero stats (28 temples, 16 cities, 4.7★) are hard-coded in `index.html`, not derived
  from `TEMPLES` — they drift when temple data changes.
- `FESTIVALS` only covers 2025–2027 and `events.json` is manually curated; both need
  periodic updates.
- Astronomical results are best-effort and may differ slightly from traditional
  panchang sources (disclosed in the About section).
- No service worker, no tests, no linting.
