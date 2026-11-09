# Agent notes

`data/concerts.yml` is the source of truth; see `README.md` for the schema. Other sessions may edit it concurrently, so merge by concert `id` and never overwrite the whole file from a stale copy.

## Adding a concert

Work through these steps in order. Each one leaves a record in the entry, so a later session can see what was checked.

1. **Check it isn't already there.** Search `data/concerts.yml` for the date and the artist (and `artist_aliases`). If the show exists, correct or add evidence to that entry instead of adding a second one.
2. **Find Tal's own evidence.** This is what sets `status`, so do it before any web search.
   - Gmail: search for the artist, venue and ticket sellers (Ticketmaster, Live Nation, AXS, Eventbrite, Dice, See Tickets, Bowery Presents, Songkick, the venue's box office). Look for order confirmations, ticket deliveries, "your event is tomorrow" reminders, and transfers. A purchase alone is `Ticket evidence`; it doesn't show Tal went.
   - Google Calendar: an event with the artist or venue on that date.
   - Swarm check-ins at the venue that night (an after-midnight check-in can belong to the previous evening's show).
   - Photos: Google Photos / Apple Photos captures from that night at that place.
   - Tal's memory, when Tal tells you directly (an `attendee` source).
3. **Confirm the date and venue.** Make sure every source agrees on one date and one venue, and resolve conflicts before writing the entry:
   - An order email is sent days or months before the show. Read the show date from the ticket text, not the email's date.
   - Check the date against the tour itinerary (setlist.fm, Songkick, the artist's or venue's event page). Another night of the same tour is a different show.
   - When the date or venue is still uncertain, say so in `notes` and use `Needs review` rather than guessing.
4. **Search the web** for support acts, setlists and a poster (see [Every concert gets a web search](#every-concert-gets-a-web-search)). Record the outcome in `web_research`, even when nothing turns up.
5. **Link the artist, venue and festival.** Every performer needs a `data/artists.yml` entry and every raw `venue` string needs a venue (see [Adding a venue](#adding-a-venue)). A festival also needs a `data/festivals.yml` entry.
6. **Write a changelog entry** in `changelog/YYYY-MM-DD_<short-slug>.md` with `## Changes`, `## What was learned` (sources, conflicts, what Tal said) and `## Not done` (searches that didn't happen).
7. **Run** `bun run typecheck`, `bun test` and `bun run build`, and fix any error or new warning about the concert.

### Choosing a status

Pick the strongest evidence the record actually has. Web results never change it.

| Status | Use when |
|---|---|
| `Check-in confirmed` | A Swarm check-in at the venue that night |
| `Photo corroborated` | Tal's photos from that night match the venue or stage |
| `Attendee confirmed` | Tal confirmed it from memory; keep conflicting evidence in `notes` |
| `Ticket evidence` | A ticket order or delivery, with nothing showing Tal went |
| `Calendar only` | Only a calendar event |
| `Tentative schedule` | A planned schedule or showcase where the specific sets aren't known |
| `Unidentified` | Tal was there, but the headliner isn't known; record candidates in `notes` |
| `Needs review` | Evidence conflicts or is too thin to classify |
| `Excluded` | Not a show Tal attended (e.g. Tal said they didn't go); never published |
| `DJ event` | A DJ night rather than a concert |

When a status changes later, keep the old one in `previous_status`.

### The concert entry

`data/concerts.yml` lists concerts under `concerts:` in date order. Insert a new entry at its date; don't append it to the end. Other sessions edit this file at the same time, so re-read it just before writing and merge by `id`.

```yaml
- date: 'YYYY-MM-DD'               # quoted; the show date in the venue's local time
  artist: Headliner Name           # co-bills: 'Artist A / Artist B'; unknown headliner: Unidentified status
  support: Opener One; Opener Two  # '; '-separated, '' when none
  venue: Venue Name                # the raw string; must be an alias in data/venues.yml
  status: Ticket evidence          # see "Choosing a status"
  sources:                         # Tal's evidence, strongest first
  - type: email
    label: Email
    url: https://mail.google.com/mail/u/?authuser=swimming.bird%40gmail.com#all/<message_id>
    provider: gmail
    account: swimming.bird@gmail.com
    message_id: '<gmail message id>'   # quote it: hex IDs can parse as numbers
    thread_id: '<gmail thread id>'
    subject: Your Ticketmaster Order ...
    rfc822_message_id: <...@reply.ticketmaster.com>
  notes: 'What the evidence shows and any conflicts.'
  id: YYYY-MM-DD-artist-slug       # lowercase a-z, 0-9 and '-', unique
  photo_match: null                # rationale string when photos are attached
  photos: []
  setlists: []                     # or one entry per headliner, see below
  poster: null                     # or the poster block, see below
  web_research: {...}              # required, see below
```

Other source types, all with a `label`:

- `calendar`: `url`, `provider: google_calendar`, `event_id`, full `calendar_id`, `url_eid`.
- `checkin`: Swarm `url` (`https://www.swarmapp.com/user/<user_id>/checkin/<checkin_id>`), `checkin_id`, and `id_note` with the original venue name and local timestamp.
- `attendee`: `statement` (what Tal said) and `confirmed_on` (YYYY-MM-DD). No `url`.
- `web`: a public `url` that documents the bill or the event.
- `research` / `photo_catalog`: a local path such as `research/...`, which the site shows as a plain label.

Photos, `coverage_photos` and `coverage_research` are described in `README.md` and under [Post-show coverage photos](#post-show-coverage-photos).

## Adding a venue

Every raw `venue` string in `concerts.yml` must be listed in exactly one venue's `aliases`, or the build warns and the page has no map, picture or link.

1. Search `data/venues.yml` for the place under every name it has had (renamed rooms, rooms inside a complex, a festival held on the same grounds). If it exists, add the new string to its `aliases` and stop.
2. Otherwise add a venue in alphabetical order by `slug`. Look up the address and coordinates (Wikipedia first, then Nominatim with a plain client identity), whether it is still open, and a short factual description.
3. Find up to two images: an exterior and, for indoor venues, an interior. Only store a freely licensed image locally (`data/venues/<slug>-1.webp`, converted with `cwebp`); hotlink everything else with a credit. Wikimedia Commons images are usually hotlinked through `Special:FilePath/<file>?width=1600` because Commons throttles bulk downloads.
4. Mention the new venue in the changelog entry, including where the coordinates came from.

```yaml
- slug: venue-name                 # lowercase, '-'-separated, unique; used in the URL
  name: Venue Name                 # the current or best-known name
  aliases:                         # every raw `venue` string that means this place
    - Venue Name
    - Venue Name – Brooklyn, NY
  kind: club                       # club | theater | arena | stadium | park | festival_grounds | bar | boat | other
  city: New York
  region: NY                       # state or province
  country: US                      # ISO country code
  neighborhood: Williamsburg       # or null
  address: 123 Example St          # or null
  lat: 40.71074                    # or null when unknown
  lon: -73.92574
  coordinates_source: nominatim    # wikipedia | nominatim | manual | null
  operating_status: open           # open | closed | unknown
  closed_year: null                # year it closed, when known
  description: One to three factual sentences about the place.
  description_source:              # or null when written from general knowledge
    label: Publication name
    url: https://...
  website: https://...             # or null
  wikipedia: https://en.wikipedia.org/wiki/...   # or null
  images:                          # at most one of each view, exterior first
    - view: exterior
      asset: data/venues/venue-name-1.webp       # local file: free licence only
      credit: Photographer name
      license: CC BY-SA 4.0
      source_url: https://commons.wikimedia.org/wiki/File:...
    - view: interior
      url: https://...                           # hotlinked official image
      credit: "Venue Name (official site)"
      license: null
      source_url: https://...
```

Open-air venues (parks, piers, festival grounds) only get an exterior image.

## New artists and festivals

- Add performers to `data/artists.yml`. Take the Spotify ID from the Spotify connector and only accept an exact name match; mark it `ambiguous` if several artists share the name. Other spellings on bills go in the artist's `aliases`, or in `artist_aliases` at the top of `concerts.yml`.
- A festival needs a `data/festivals.yml` entry. Attendance and `seen` only ever come from the record's own evidence.
- The site is public: only freely licensed images are stored locally, Spotify images are hotlinked, and other third-party images are hotlinked with a credit.
- When fetching, send a plain client identity such as `concert-history-site/1.0`. If a site challenges or refuses the request, leave that site alone; don't disguise the client. setlist.fm needs its official API key.

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

## Post-show coverage photos

- Search each published show for post-concert photo reports and official live galleries (BrooklynVegan, local music publications, and photographers’ own reports).
- Keep verified hotlinks in `coverage_photos`, with `image_url`, `page_url`, `publication`, `credit`, `caption`, and `concert_date`. Never mix them into Tal’s `photos` or use them as attendance evidence.
- Record searches, reviewed source URLs, outcomes and rejected nearby nights in `coverage_research` (see README). An unavailable page is not proof that coverage does not exist. Respect refusals and challenges.
- Match the photographed night and venue; a multi-night report without per-photo dates is insufficient. Credit an unnamed photographer explicitly as uncredited rather than inferring the photographer from the article’s author.

## Changing the site

Page changes are JSX in `src/app/`. The same components produce the prerendered HTML and the hydrated app, so there are no HTML templates or separate page scripts to keep in step.

- Link with router paths such as `/artists/lizzo/` (`src/app/lib/paths.ts`). The router adds `BASE_PATH`. Build asset URLs with `useUrls()` from `src/app/context.tsx`, never with relative paths.
- A page can only use what is in the payload. Add new fields in `src/payload.ts`, and keep research-only data and excluded concerts out of it.
- The first browser render must match the prerender. Sort displayed text with `compareText` from `src/model.ts` rather than a bare `localeCompare`, and keep browser-only values out of the first render.
- Start every `.tsx` file with `/** @jsxImportSource preact */`, or the build fails when Bun runs from another directory.
- Before finishing, run `bun run typecheck`, `bun test` and `bun run build`.
