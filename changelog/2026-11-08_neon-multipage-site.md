# Neon multi-page site with artist, venue and concert pages

Replaced the single 7 MB HTML table with a static multi-page site. Nothing in `data/concerts.yml` changed. Not deployed.

## What changed

- **Look**: neon club night, dark only with no light theme. Subtle waveform background pattern, Tilt Neon display type, and a hero chart with one bar per month across the whole archive.
- **Timeline**: a spine with colored dots and pills, based on soff.es/plan. Color means show type (gig, festival, showcase, DJ). Festivals get a tinted card with a thick bar. Unconfirmed shows are drawn hollow. Search, filters and a sticky year rail.
- **Top-level pages**: `/artists/<slug>/`, `/venues/<slug>/`, `/concerts/<id>/`, plus artist and venue indexes and `/about/`.
- **Concert pages**: real poster with credit, or a generated type poster labeled as generated. Setlists, photos and evidence. Festivals are split by day, with the acts Tal saw highlighted.
- **New data files**: `data/venues.yml`, `data/artists.yml`, `data/festivals.yml`, so `concerts.yml` stays free of edit collisions.
- **Publishing rules, per Tal**: all records except `Excluded` appear, and evidence links are public. Local `research/` files aren't deployed, so those sources show as plain labels.
- `src/archive.html` and `src/client/archive.ts` are gone. New code is in `src/model.ts`, `src/render/`, `src/site.css`, `src/client/app.ts` and `src/client/map.ts`. `bun run preview` serves the site.

- **Left rail sound graph**: the year list became a vertical waveform with one bar per month, newest at the top so it mirrors the timeline. Bars redraw as filters change. Width is square-root compressed like an audio meter, because most months have 1-4 shows against a peak of 14; tooltips give exact counts.
- **Back links**: returning from a gig, artist or venue page now restores your exact scroll position. It used to jump to the year's heading with an animated scroll, even if you had started at the top. Smooth scrolling now applies only to deliberate year jumps.

## Data collected

| | Result |
|---|---|
| Venues | 88 raw strings merged into 69 venues; 68 have coordinates; 21 are closed |
| Venue images | 37 venues have official or Commons images; 19 fall back to Tal's photos; 13 show a monogram |
| Artists | 424 pages; 402 Spotify links (302 exact, 100 ambiguous, 22 none); 398 images; 273 Wikipedia descriptions |
| Festivals | 6 festivals, 16 days |

## Learned or corrected

- **Festival records were single rows pretending to be one day.** Actual spans: Bonnaroo 2012 Jun 7-10, Gov Ball 2012 Jun 23-24, 2014 Jun 6-8, 2015 Jun 5-7, 2016 Jun 3-5. 2011 really was one day.
- **Gov Ball 2016 Sunday was cancelled for weather**; Kanye West and the rest of that day never played. The record's `web_research` note still names him as the Sunday headliner.
- **De La Soul played Saturday at Gov Ball 2016**, not Friday as the billing implies. They traded places with Action Bronson. Flagged, not changed.
- **Twin Shadow was announced for Gov Ball 2015 but isn't on the final schedule.** It's listed under `not_on_final_schedule` because nothing shows the set happened.
- All Gov Ball 2016 photos are from Friday Jun 3, so that day could move from `unknown` to attended if Tal remembers it.
- Venue facts that are easy to get wrong: Bowery Electric closed January 2026 and is now Bowery Palace; Rockwood closed November 2024; "Shea Stadium" here is the 2016 Brooklyn DIY venue; `arlenesgrocery.net` now serves spam, so the real site is `arlenesgrocerynyc.com`.
- Governors Ball 2014 sources disagree about The Strokes (Saturday vs Sunday) because the pre-festival by-day lineup differs from what was reported afterwards.

## Bugs and mistakes, including mine

- **I sent setlist.fm a browser-style User-Agent after it answered with a 202 bot check.** The permission system blocked it. That was wrong, and `AGENTS.md` now says not to disguise the client. Support-act setlists are therefore not backfilled; they need an official setlist.fm API key.
- CARTO dark map tiles returned HTTP 200 in a `curl` test but render an "API KEY REQUIRED" watermark. Maps now use OpenStreetMap tiles darkened with a CSS filter. A status code isn't verification; only looking at the page caught this.
- The waveform background was invisible at first because `body`'s own background painted over the negative z-index layers.
- Encore dividers consumed a list number, so setlists skipped from 14 to 16.
- Wikipedia returned 429 at modest volume, and the shared limit also affected two jobs running at once. Batching about 2,500 title lookups into about 65 requests got the artist descriptions through. Wikimedia's image servers still throttled downloads after 2 files, so the other 30 Commons images are hotlinked with credits.

## Known limits

- 100 Spotify links are `ambiguous`: several artists share the name, so the link may be wrong.
- Wikipedia descriptions are matched by name with a music-related check, so a small band sharing a name with a better-known act could get the wrong blurb.
- 22 venue descriptions have no cited source and come from general knowledge or search summaries.
- `lena-horne-bandshell` has no coordinates, and `great-stage-park` coordinates are approximate.
- Spotify images are 320px, so they're slightly soft on large screens.
- 114 concerts still have `not_searched` web-research fields from before this work.
