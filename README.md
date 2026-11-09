# Concert history

A personal concert archive, built as a static multi-page site: a chronological timeline, plus a page for every concert, artist and venue. Always dark, by design.

`data/concerts.yml` is the source of truth for shows. Edit the files in `data/` and rebuild with [Bun](https://bun.sh):

```sh
bun install
bun run build
bun run preview     # serve dist/ at http://127.0.0.1:4173/
bun run open        # the same, and open it (Orca browser tab inside Orca, default browser otherwise)
bun run typecheck
```

The site has real directory URLs (`/artists/lizzo/`), so view it through `preview` or a static host rather than opening the files from disk. Records with status `Excluded` are never published. Everything else appears, with unconfirmed shows drawn hollow.

## Layout

| Path | Contents |
|---|---|
| `data/concerts.yml` | Canonical concert, source, and photo metadata |
| `data/venues.yml`, `data/venues/` | Venues: merged name variants, location, description, credited images |
| `data/artists.yml` | Artists: Spotify ID, hotlinked Spotify image, Wikipedia description |
| `data/festivals.yml` | Festival days: daily lineups, which days Tal attended, which acts were seen |
| `data/photos/` | Portable WebP image copies |
| `data/posters/` | Gig posters found on the web, as WebP |
| `AGENTS.md` | Checklist for adding concerts, including the required web search |
| `src/build.ts` | Validates the data and writes everything in `dist/` |
| `src/model.ts` | Links concerts, artists, venues and festivals into what the pages render |
| `src/types.ts` | Shapes of the YAML files |
| `src/render/` | HTML for each page type, the shared timeline, and generated art (waveforms, fallback posters) |
| `src/site.css` | All styles |
| `src/client/` | Browser code: `app.ts` (filters, lightbox) and `map.ts` (Leaflet maps) |
| `src/preview.ts` | Local server for `dist/` |
| `dist/` | Generated output (Git ignores it) |
| `research/` | Local raw exports and contact sheets (Git ignores it) |

## Data and source references

Each concert has a stable `id`, date, artist, supporting acts, venue, status, notes, `sources`, and `photos`.

- Email sources store the Gmail `message_id`, `thread_id`, RFC 822 `rfc822_message_id`, account, subject, and original URL. Quote hex-looking IDs such as `'1538288955220e82'`: YAML 1.2 reads them as numbers otherwise, and the build rejects non-string IDs.
- Calendar sources store the Google Calendar `event_id`, full `calendar_id`, encoded URL `url_eid`, and original URL.
- Each photo stores its image `asset`, capture time, media kind, source URL, and provider-specific `references` with the Apple Photos UUID, Google Photos photo ID and/or iCloud Photos record ID. `url` opens the photo in Google Photos, or in iCloud Photos (`https://www.icloud.com/photos/#/i,pz,<record id>/`) when it is not in Google Photos. Video captures are displayed as labeled still images.
- Swarm sources link to individual check-ins at `https://www.swarmapp.com/user/<user_id>/checkin/<checkin_id>`. Their `checkin_id` values were recovered from Swarm history by matching the local date, venue, and event or shout where available. `id_note` records the original check-in venue and local timestamp; after-midnight check-ins can belong to the previous evening's concert. Other missing IDs remain null rather than inferred.
- Attendee sources (`type: attendee`) record something Tal confirmed from memory, such as seeing a set or identifying who is in a photo. They have a `statement` and a `confirmed_on` date (YYYY-MM-DD), and no `url`. The page shows their label as plain text.
- The `Attendee confirmed` status marks a show logged on Tal's word. It counts as supported, and its `notes` keep any evidence that conflicts with it.
- `setlists` holds each headliner's songs from setlist.fm (`encore_start_index` marks the first encore song). `poster` points at a WebP in `data/posters/` with its `kind` (`show_poster`, `tour_admat` or `festival_lineup`) and source URLs.
- `web_research` records the web search every concert gets for support acts, setlist and poster: the date searched and a `found` / `none_found` outcome for each (plus `matches_existing` for support and `empty_event` for an empty setlist.fm page). The build warns about concerts that have not been searched yet. See `AGENTS.md` for the checklist when adding a concert.
- `photo_match` records the rationale for attaching a gallery. No matched image does not establish that no photos exist.
- `coverage_photos` contains hotlinked photos from post-show reports and official galleries, separate from Tal’s personal `photos`. Each has `image_url`, `page_url`, `publication`, `credit`, `caption`, and `concert_date`. The gig page labels the galleries “Tal’s photos” and “Coverage photos”; coverage thumbnails also carry a label. Photographer credits and links to the original coverage appear below each photo and in its lightbox. Third-party images are never copied into the build.
- `coverage_research` records `searched_on`, `outcome` (`found`, `none_found`, `unavailable`, or `not_searched`), exact `queries`, reviewed `sources`, and `notes`, including conflicting dates and unavailable pages. `found` requires attached coverage photos. Match the photographed date and venue, not just the article’s publication date. For a festival, identify the photographed day. Coverage never changes attendance status, personal photo references, or which sets were seen. `scripts/merge-coverage.ts` merges a reviewed JSON batch into the latest YAML by concert ID, checks artist/date/venue, and preserves existing fields.
- Local paths in the YAML (photo `asset`s and non-HTTP source `url`s such as `research/…` or `dist/photo-catalog.json`) are relative to the project root. `research/` is never deployed, so those sources show as plain labels on the site.
- `data/venues.yml`: every raw `venue` string in `concerts.yml` must be listed in exactly one venue's `aliases`. Only freely licensed images are ever stored locally. Most images are credited hotlinks, including Commons ones, because Wikimedia throttles bulk downloads. Each image has a `view` of `exterior` or `interior`, at most one of each, exterior first; open-air venues only get an exterior.
- `data/artists.yml`: `spotify_match` is `exact`, `ambiguous` (several Spotify artists share the name, so the link may be wrong) or `none`. `image_url` is hotlinked from Spotify, never re-hosted.
- `data/festivals.yml`: attendance and `seen` come only from a concert's own evidence. `seen[].date` is null when an act played two days and the evidence can't narrow it down.

The `research/` directory preserves the original raw exports, saved pages, and contact sheets locally. Some older evidence links refer to these local contact sheets. The current build does not need raw research or access to the original Apple Photos library.

## Build output

`bun run build` validates source identifiers, statuses, and photo assets, warns about any artist or venue missing from its YAML file, then writes:

- `dist/index.html`: the timeline.
- `dist/artists/`, `dist/venues/`, `dist/concerts/`: an index and a page per item (concerts have no index; the timeline is it).
- `dist/about/`: how the archive was reconstructed and how to read it.
- `dist/assets/`: bundled JS, CSS, fonts and images.
- `dist/concert-history.md`: a plain Markdown table.
- `dist/concerts.json` and `dist/photo-catalog.json`: derived exports. These are compatibility files, never canonical inputs.
