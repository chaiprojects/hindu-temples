# SPEC — Bay Area Hindu Temples

A single-page static website and installable PWA that serves as a centralized guide to
Hindu temples across the San Francisco Bay Area — 50 temples in 25 cities, from
Petaluma and Vallejo through San Francisco, the East Bay and the Tri-Valley down to
San Jose and Tracy. Live at **https://github.com/chaiprojects/hindu-temples**
(GitHub Pages, served from the `main` branch root).

The festival calendar and the temple event listings both keep themselves current:
festival dates are computed astronomically in the browser, and temple events are
refreshed daily from the temples' own calendar feeds by a GitHub Action.

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
  css/styles.css            All styling (~2,830 lines), CSS custom properties, dark mode
  js/
    rahukalam.js            NOAA solar-position sunrise/sunset + Rahu Kalam calculator
    ekadashi.js             Jean Meeus lunar/solar longitude → tithi → Ekadashi dates
    panchang.js             Festival engine: tithi/nakshatra → festival dates, any year
    temples.js              Loads temples.json; card grid, filters, derived stats
    map.js                  Leaflet map module (window.TempleMap)
    calendar.js             Month-view calendar merging festivals/Ekadashi/temple events
    bhajan.js               Daily deity/bhajan player (window.DailyBhajan) + visit counter
    main.js                 Orchestrator: location state, theme, nav, wiring (loads last)
  data/
    temples.json            The temple directory — single source of truth (50 entries)
    events.json             Generated: temple events, refreshed by CI (do not hand-edit)
    events-curated.json     Hand-maintained events for temples with no machine feed
  icons/                    Favicons + PWA icons (16–512 px)
scripts/
  test-panchang.js          Regression tests for the festival engine (221 assertions)
  validate-data.mjs         Schema + sanity checks for the two hand-edited data files
  update-events.mjs         Fetches temple feeds and regenerates events.json
.github/workflows/
  update-data.yml           Daily cron: test → validate → refresh → commit
.gitignore                  Ignores .DS_Store, .claude/, GITHUB-DEPLOY-STEPS.md
```

Script load order matters and is enforced in `index.html`: Leaflet → rahukalam →
ekadashi → panchang → temples → map → calendar → bhajan → main.

## How the site stays current

Three layers, in increasing order of authority:

1. **Computed festivals** (`panchang.js`) — derived from astronomy in the browser for
   the user's location, so the calendar never runs out of years.
2. **Computed Ekadashi** (`ekadashi.js`) — same approach, already location-aware.
3. **Real temple events** (`events.json`) — scraped from the temples' own calendars by
   a scheduled GitHub Action. These are authoritative: where a computed festival and a
   temple's published date disagree, the temple is right.

Nothing on the site is hard-coded to a date range any more, and no step invents data.

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

### Temple directory (`temples.js` + `assets/data/temples.json`)
- 50 temples across 25 cities, from Petaluma and Vallejo down through San Francisco,
  the East Bay and the Tri-Valley to San Jose and Tracy.
- Schema per entry — only `slug`, `name`, `city`, `lat`, `lng` are required:
  `slug, name, address, city, lat, lng, deity, hours, url, eventsUrl,
   feedType, feedUrl, rating, reviews`.
- Updating the directory means editing that JSON; the map, cards, city filter,
  carousel and hero stats all derive from it.
- `rating`/`reviews` are optional. 28 entries carry legacy Google-style ratings of
  unverified provenance; newer entries have none rather than a fabricated score, and
  the card simply omits the stars.
- Coordinates were verified against the Census/Nominatim geocoders; 12 legacy
  coordinates were off by 1–5 km and corrected.
- Featured-temple carousel, text search (name/city/deity), city dropdown filter,
  responsive card grid; filters stay in sync with the map.

### Festival engine (`panchang.js`)
- Computes festival dates from first principles (Meeus ch. 25/47): tithi = 12° slices
  of Moon−Sun elongation, nakshatra from the sidereal Moon (Lahiri ayanamsa), lunar
  months named from the Sun's rashi at the new moon that begins them.
- ~40 festivals expressed as rules over (lunar month, paksha, tithi), plus
  sankranti-based (Pongal, Tamil New Year) and nakshatra-based (Onam, Karthigai
  Deepam, Thai Poosam) ones.
- Handles the awkward cases explicitly: **adhika** tithis that span two sunrises take
  the later day, **kshaya** tithis that are skipped entirely fold into the following
  day, and evening observances (Diwali, Dhanteras, Holika Dahan, Kartika Purnima) use
  a pradosh rule while Janmashtami and Shivratri use a midnight one.
- Dates are computed for the **user's location**, matching how Bay Area temples
  actually publish. Fremont's own 2026 calendar states it is "prepared for North
  America Based on San Francisco (PST/PDT) … may differ from the respective dates in
  India". Sankrantis are the exception and resolve in IST, since Pongal and Tamil New
  Year are announced on the same civil date worldwide.
- Loads as `window.Panchang` in the browser and via `require()` in Node, so CI tests
  the exact file that ships. Results are memoised per location and year (~33 ms/year).
- Verified against 17 dates published by Bay Area temples for 2026 and against
  India's published dates when configured with an Indian location.

### Festival calendar (`calendar.js`)
- Month-view grid merging three sources: festivals computed by `panchang.js` for the
  current location, computed Ekadashi dates, and `events.json` temple events.
- Legend distinguishes Festival / Ekadashi / Temple Event dots; click opens a detail
  modal; an "Upcoming Events" list renders below the grid, showing each multi-day
  event once. A provenance line reports the event count and last refresh.
- Event text comes from third-party sites, so everything is HTML-escaped and handlers
  are attached by delegation rather than built into markup.
- `events.json` shape: `{ generatedAt, windowStart, windowEnd, counts, sources,
  events: [{ temple, city, title, startDate, endDate, time, url, source }] }`.
  The older bare-array form is still accepted.

### Daily devotional (`bhajan.js`)
- Day-of-week → deity mapping (Sun=Surya … Sat=Shani) with mantra (English +
  Devanagari), blessing, accent color, and a **pool of ~5 curated YouTube bhajans per
  day** (`songs: [{ t, v }]`, video IDs verified via YouTube oEmbed, August 2026).
- **Song rotation**: a localStorage counter (`bhajan_song_idx`) increments on every
  page load; the song played is `songs[(counter + skip) % songs.length]`, so each
  refresh plays a different bhajan from that day's pool.
- **Play on demand**: the bhajan starts only when a ▶ Play button is clicked (no
  autoplay on page load). Playback starts muted then unmutes immediately; if the
  browser blocks the unmute, the *first user interaction anywhere on the page*
  (tap/click/keypress, captured via one-shot pointerdown/keydown/touchend listeners)
  switches sound on automatically; a "🔊 Tap anywhere for sound" chip in the
  mini-player bar doubles as a visual cue.
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

## Event ingestion (`scripts/update-events.mjs`)

Bay Area temple sites rarely publish a standard calendar format, so alongside the
generic parsers there are adapters for the shapes these temples actually ship:

| `feedType` | What it reads |
|---|---|
| `tribe` | WordPress "The Events Calendar" REST API |
| `ics` / `gcal` | iCalendar file / public Google Calendar id |
| `jsonld` | schema.org `Event` blocks in page HTML |
| `rss` | JEvents/Joomla RSS, date encoded in the item title |
| `wp-rest` | WordPress custom post type with the date in an ACF field |
| `squarespace` | Squarespace `?format=json-pretty` events collection |
| `seva-json` | A site's own JSON events API |
| `js-data` | A static per-year JS file of festivals |

11 of 50 temples expose something machine-readable; the rest are covered by
`events-curated.json`. Behaviour worth knowing:

- A feed that fails is **not** treated as "no events" — the previous run's future
  events for that temple are carried forward, so an outage never blanks the calendar.
- Runs of the same title on consecutive days collapse into one dated span, and only
  the next 3 instances of a repeating series are kept, so a weekly class cannot crowd
  festivals out of the calendar.
- Some sites return HTTP 200 with an HTML soft-404 for `/wp-json/tribe/...`; parsing
  fails and is reported rather than silently accepted as an empty feed.

## Conventions

- Script tags carry `?v=N` cache busters — bump the number when editing a JS file.
- Modules expose globals (`window.TempleMap`, `window.Panchang`, `window.DailyBhajan`);
  `main.js` wires everything on `DOMContentLoaded`.
- Deploy = push to `main`; GitHub Pages serves the repo root.
- CI (`.github/workflows/update-data.yml`) runs daily at ~03:17 Pacific and on any
  push touching the data or scripts: it runs the panchang tests, validates the data
  files, refreshes `events.json`, and commits only if something changed.
- `events.json` is generated — edit `temples.json` or `events-curated.json` instead.
- Local checks: `node scripts/test-panchang.js`, `node scripts/validate-data.mjs`,
  `node scripts/update-events.mjs --dry-run`.

## Known issues / limitations

- **South Bay coverage is the thinnest part of the directory.** Santa Clara County
  entries are largely inherited from the original list; Cupertino, Mountain View,
  Campbell, Los Altos, Morgan Hill and Gilroy have not had the same verification
  sweep as the East Bay, Peninsula and North Bay, so temples there are likely missing.
- Legacy `rating`/`reviews` values on 28 entries have no recorded source and may be
  stale; they are shown as-is and drive the "Avg Rating" hero tile.
- Several temple sites are stale or compromised — `fremonttemple.org` and
  `panchamukhahanuman.org` carry injected SEO spam, and `shirdisaidarbar.org`'s
  "upcoming" notices are commented-out 2024/2025 leftovers. Their listed events are
  therefore curated by hand rather than scraped.
- No temple publishes anything past 2026-12-31, so 2027 temple events will only
  appear once the temples themselves post them. Computed festivals cover 2027+.
- 3 of 20 checked festival dates differ by a day from some temples (Karthigai Deepam,
  Vaikuntha Ekadashi, Gita Jayanti) — cases where the temples disagree among
  themselves. The calendar discloses that festival dates are computed.
- countapi.xyz has been unreliable/discontinued; the visit counter usually falls back
  to the per-device localStorage count.
- No service worker; no linting.

## Notable fix

`ekadashi.js` carried a sign error in the hour angle (`H = θ − lng − α` where Meeus'
west-positive convention requires `θ + lng − α` for an east-positive longitude). It
put sunrise hours off, which quietly moved some tithi-at-sunrise decisions onto the
wrong day. Both `ekadashi.js` and `panchang.js` are now within ~2 minutes of published
sunrise/sunset for San Jose and Mumbai, and the test suite asserts it so it cannot
regress.
