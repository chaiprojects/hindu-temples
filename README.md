# Bay Area Hindu Temples

A guide to Hindu temples across the San Francisco Bay Area, with an interactive map,
Rahu Kalam calculator, Ekadashi dates, a festival calendar, and a daily devotional bhajan.

**Live site:** https://chaiprojects.github.io/hindu-temples/

## Running locally

Plain HTML, CSS and JavaScript with no build step. Serve the folder and open it in a browser:

```
python3 -m http.server 8080
```

Then visit http://localhost:8080/.

## Notes

- Temple events are refreshed daily by a GitHub Action from the temples' own calendar feeds.
- See `SPEC.md` for the full technical spec and file layout.
