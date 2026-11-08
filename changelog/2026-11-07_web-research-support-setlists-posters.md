# Web research: support acts, setlists and posters for every concert

## What changed

- New per-concert fields in `data/concerts.yml`: `setlists`, `poster`, `web_research` (types in `src/types.ts`).
- Posters saved as WebP in `data/posters/`, embedded in the page; setlists render as collapsible song lists with a link to the source site.
- `bun run build` validates `web_research` against `setlists`/`poster` and warns about concerts not yet searched (or with `not_searched` fields).
- `AGENTS.md` (new) requires the same web search for every concert added later; README documents the fields.
- Markdown export gained Setlist and Poster columns.

## Results (all 243 concerts searched on 2026-11-07)

| | found | matches existing | empty setlist.fm event | none found | not searched |
|---|---|---|---|---|---|
| Support | 68 | 47 | – | 60 | 68 |
| Setlist | 113 | – | 40 | 90 | – |
| Poster | 10 | – | – | 121 | 112 |

Support additions were appended to `support`; nothing was removed. `status` was never changed.

## What went wrong

- The session's shared web-search quota (200 calls) ran out roughly halfway through every batch. Later rows fell back to setlist.fm and direct page fetches, so posters and non-setlist.fm support checks were often skipped. Those fields are recorded as `not_searched`, not `none_found` (an initial draft would have recorded them as `none_found`). 112 concerts need a top-up pass.
- BrooklynVegan and concertarchives.org refused fetches (403); a Jack White Radio City 2012-09-30 numbered poster exists on eBay but couldn't be downloaded.
- Two posters (Florence + the Machine 2016, Courtney Barnett/San Fermin 2014) are undated tour artwork, kept as `tour_admat`.

## Possible errors in existing data (flagged, not changed)

| Concert | Finding |
|---|---|
| 2021-10-07 Jungle | Avant Gardner show was Oct 8, 2021 |
| 2012-03-09 RJD2 Webster Hall | No trace; only 2012 Webster Hall date is Aug 3 |
| 2013-04-11 Not Blood Paint | Listing shows Apr 11, **2012** at The Studio at Webster Hall |
| 2013-06-20 Pacific Air, Mercury Lounge | setlist.fm: Bowery Ballroom, Jun 18 |
| 2012-10-17 Daughter | No show that date; nearest Oct 18 Terminal 5 |
| 2011-10-22 Dovecote CMJ party, Glasslands | Sources show Dovecote showcase at Pianos on 10/21 |
| 2012-10-19 CMJ showcase | Savages were at Public Assembly, not Mercury Lounge |
| 2012-03-28 Youth Lagoon | Porcelain Raft support run was Apr 2–14 |
| 2013-05-11 Lady Lamb | Xenia Rubinos supported that tour, not Slothrust (Slothrust pairing dated May 2) |
| 2011-09-06 Braids | Painted Palms / Blue Hawaii not confirmed; Pepper Rabbit named |
| 2012-06-21 The Canon Logic | Paper Route may have headlined |
| 2014-10-01 Jungle, Warsaw | setlist.fm only has Oct 2, Irving Plaza |
| 2014-10-22 San Fermin & Courtney Barnett | Same co-headline show, logged as two rows |
| Stuyvesant Oval | Misspelled "Stuyvesent" in the YAML |
| 2022-08-25 Sleigh Bells, 2026-10-02 Strokes, 2025-07-28 YYY | Shows went ahead (setlists exist) |

Unidentified-row leads are in each row's `web_research.notes` (e.g. 2011-09-10 Arlene's Grocery live-band karaoke; 2012-07-13 Bushwick Walkabout day 1, Penrose).
