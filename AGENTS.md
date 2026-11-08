# Agent notes

`data/concerts.yml` is the source of truth; see `README.md` for the schema. Other sessions may edit it concurrently, so merge by concert `id` and never overwrite the whole file from a stale copy.

## Every concert gets a web search

Whenever a concert is added (or its artist/date/venue is corrected), search the web for all three of these and record the outcome, even when nothing turns up:

| What | Where to look | Stored as |
|---|---|---|
| Supporting / other billed artists | setlist.fm event pages, Songkick, concertarchives.org, JamBase, venue and news listings | merged into `support` (`; `-separated) |
| Setlist(s) | setlist.fm (one per headliner on co-bills) | `setlists: [{artist, url, songs, encore_start_index, tour}]` |
| Poster | gigposters.com, artist/venue social posts, event pages, tour admats | `poster: {asset, kind, page_url, image_url}`, image saved as `data/posters/<id>.webp` |

Then write a `web_research` block:

```yaml
web_research:
  searched_on: 'YYYY-MM-DD'
  support: found | matches_existing | none_found | not_searched
  support_sources: [url, ...]
  setlist: found | empty_event | none_found   # empty_event: setlist.fm page exists, no songs
  poster: found | none_found | not_searched
  notes: what was searched / conflicts found
```

Rules:

- The date **and** venue must match. Another night of the same tour is not a match.
- A tour admat that lists the date counts (`kind: tour_admat`); festivals use the day's lineup poster (`festival_lineup`).
- Look at a downloaded poster before keeping it. Convert to WebP (`cwebp -q 82 -resize 900 0`).
- Web results never change `status`; a web-found bill doesn't prove attendance. For `Unidentified` rows, record artist candidates in `web_research.notes` rather than changing `artist`.
- Use `not_searched` when a search couldn't actually run (e.g. the web-search quota ran out); never record `none_found` for a search that didn't happen.
- `bun run build` warns about concerts with no `web_research` or with `not_searched` fields and fails if `web_research` disagrees with `setlists`/`poster`.
- Write a changelog entry in `changelog/` for each batch of additions.
