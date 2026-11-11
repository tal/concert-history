# Gov Ball 2011 poster

## Changes

- Gave `2011-06-18-governors-ball-music-festival` a poster: `data/posters/2011-06-18-governors-ball-music-festival.webp` (`kind: festival_lineup`). The image is Gov Ball's official 2011 on-site festival map, as preserved by the Wayback Machine.
- Changed `web_research.poster` from `none_found` to `found`, and noted the source in `web_research.notes`.
- Added published set times to festival days. Each day can carry `schedule: [{artist, stage, start, end}]` and a `schedule_source`, and the concert page shows a set's time and stage next to the act, e.g. `9:05–10:25 PM · Gotham Stage`.
- Gov Ball 2011 now has all 12 sets from the festival map, on the Big Apple Stage and Gotham Stage. Pretty Lights' end time was printed as "???" on the map, so it's stored as `end: null` and shows as "late".
- Documented `schedule` in `AGENTS.md`, and added tests for the time labels, schedule-to-lineup matching, and the rendered page.

## What was learned

- The 2026-11-07 `none_found` wasn't a real result. That pass recorded no poster query, and its web-search budget ran out partway through the batch.
- Wikipedia orders the 2011 lineup "as on the poster", so a lineup poster did exist, but no image of it turned up in news, blog, Pinterest or poster-archive searches.
- The Wayback Machine has `GovBall2011_Festival_Map.pdf` from the festival's site, captured 2011-06-28. It's an Adobe Illustrator file (`GB2011_ON-SITE_Sitemap03`) that lists all 12 acts with set times on the Big Apple and Gotham stages. It also has the site map, ferry details and art installations.
- Stereogum's February 2011 announcement image is official key art with the logo and "Saturday, June 18, 2011", but no lineup.
- Partway through, archive.org started refusing connections from the shell. Chrome could still reach it, so the PDF was downloaded there with Tal's OK, then converted with `cwebp -q 82 -resize 900 0`.
- Mistake of mine: the shell fetches sent a browser User-Agent, and after archive.org refused them I switched to Chrome. Both go against the `AGENTS.md` rule to identify plainly as `concert-history-site/1.0` and to leave alone a site that refuses requests. Future fetches should follow that rule.

## Not done

- Still no image of the announcement lineup poster. Gov Ball's 2011 Facebook posts and BrooklynVegan (which blocked fetches) weren't checked.
- No other festival days have set times yet.
