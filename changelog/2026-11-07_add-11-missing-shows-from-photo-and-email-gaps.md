# Add 11 missing shows found through photo and email gaps

## Why

The 2017 Gogol Bordello boat show was missing even though the Apple concert search had flagged its photos. That suggested other shows were missing the same way. Two sweeps were run:

- **Photo gap check:** compared every night in `research/apple-concert-search.json` (photos before 5 AM count toward the previous night) with the archive dates. 42 of 126 photo nights had no row. Each was checked against Gmail, the Family and Personal calendars, and the web.
- **Small ticket sellers:** a Gmail sweep of indie and small sellers (Ticketfly, TicketWeb, Ticket Prophet, Ticketstoday, Eventbrite, DICE, Songkick Tickets, See Tickets and about 25 others) for purchases with no archive row.

## Added

| Date | Show | Venue | Status | Photos | Evidence |
|---|---|---|---|---|---|
| 2013-05-17 | Yeah Yeah Yeahs / The Flaming Lips (GoogaMooga Friday kickoff) | Prospect Park | Photo corroborated | 2 | Eventbrite order forwarded by Allie; photos at 8:34 PM, during the YYY set |
| 2013-09-26 | Grouplove | The McKittrick Hotel (Manderley Bar) | Photo corroborated | 6 | Tal's RSVP and the bar's confirmation; GPS at the venue |
| 2014-06-07 | Governors Ball Music Festival | Randall’s Island | Photo corroborated | 7 | Eventbrite tickets, app claim, on-site photo booth emails |
| 2015-06-05 | Governors Ball Music Festival | Randall’s Island | Photo corroborated | 4 | Eventbrite tickets, Friday shuttle pass, transport tickets |
| 2015-06-14 | Run The Jewels | 50 Kent Ave | Ticket evidence | 0 | Songkick Tickets order |
| 2015-11-08 | DIIV | Webster Hall | Ticket evidence | 0 | Songkick Tickets order |
| 2021-10-21 | Mating Ritual | Market Hotel | Ticket evidence | 0 | Eventbrite tickets and reminder |
| 2022-08-09 | Glass Animals | The Brooklyn Mirage | Photo corroborated | 9 | DICE tickets, Family calendar |
| 2025-09-24 | Chappell Roan | Forest Hills Stadium | Photo corroborated | 11 | Family calendar ticket entry |
| 2025-10-16 | ANIMA! | Public Records | Ticket evidence | 0 | DICE post-show feedback email, Songkick reminder |
| 2026-04-14 | Lily Allen | Radio City Music Hall | Photo corroborated | 12 | Tal confirmed attending (attendee source); photos of the show and marquee |

- 51 new WebP assets in `data/photos/`. 34 have both Apple and Google references, and 17 are Google-only.
- Totals after the build: 243 concerts, 103 galleries, 289 embedded images.

## Changed

- **2021-09-16 Lord Huron:** `Calendar only` → `Attendee confirmed` (`previous_status` set). Tal says they went. The conflict is kept in `notes` and as a source: at about 6 PM that day, Tal emailed the parents group offering both tickets. The Ticketmaster ticket email was also added.

## Learned / corrected

- **The earlier email searches missed small sellers.** Songkick Tickets, DICE, AdHoc's Eventbrite events, and tickets Allie bought (forwarded emails, Family calendar) were the main gaps. Every Ticketfly, TicketWeb, Ticket Prophet, Ticketstoday, See Tickets and Seated order was already in the archive.
- **The Family calendar holds tickets Tal never got an email for** (Glass Animals, Chappell Roan, and the 30 Rock event).
- **Sleigh Bells at Le Poisson Rouge** was dated by its after-midnight check-in. The Ticket Prophet receipt says Oct 5, 2013, 11 PM. A parallel session made the same fix.
- **Grouplove at the McKittrick** was billed as acoustic, but the photos show a drum kit and electric guitars.
- **Apple and Google timestamps can drift.** For the 2022 photos, Google times run about 0.6 s ahead of Apple Photos, so matches there allow 1 s.
- **Photo nights ruled out (not concerts):**
  - John Mulaney at Radio City (2018-02-18)
  - Probably Hamilton (2021-09-14)
  - The 30 Rock 20th anniversary event (2026-10-11)
  - A Denver trip where nothing played at Ball Arena that night (2026-04-21)
  - Election night at the Javits Center (2016-11-08)
  - Kids' and family outings
  - About 20 nights with only one photo
- **Tal confirmed two non-concerts:** the 2026-10-22 Joe's Pub show was comedy, and the 2014-09-18 Daybreaker was a dance party. Neither was added.

## Still open

- **Web research:** support, setlist and poster searches (see `AGENTS.md`) are incomplete for some of these rows. A parallel session is running that sweep.
- **Two 2022 Apple items were left out on purpose:** `46161D18…` and `01C17E13…` at 9:23 PM. They look like re-saved copies of earlier shots.
