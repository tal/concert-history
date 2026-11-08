# Zella Day, Grimes and Sleigh Bells from Tal's recollections

Tal remembered three shows: Zella Day at Santos Party House, Grimes at Glasslands, and "the band with Rill Rill" (Sleigh Bells) at Le Poisson Rouge. Each was checked against Gmail, Google Calendar, Google Photos and web archives.

## Code: recording things Tal confirms

| File | Change |
|---|---|
| `src/types.ts` | New source type `attendee` (with `statement` and `confirmed_on`; `url` is now optional for this type only). New status `Attendee confirmed`, which counts as supported. |
| `src/build.ts` | Validates that attendee sources have a statement and a YYYY-MM-DD `confirmed_on`, and that every other source has a URL. Attendee sources render with no link, and in Markdown as plain labels. |
| `src/client/archive.ts` | Renders link-less sources as `<span>`. The artist dialog says "check-in/photo/attendee supported". |
| `src/archive.html` | Counter, filter label and "How to read this list" now cover `Attendee confirmed`. |
| `README.md` | Documents attendee sources and the new status. |

## Data changes

### 2014-10-23 Neon Gold "New Shapes" CMJ showcase, Santos Party House

Entry: `2014-10-23-cmj-showcase-kate-boy-made-in-heights-fenech-soler-george-maple`. This was merged on top of a concurrent session's edits (see `2026-11-07_identify-aurora-at-cmj-santos-showcase.md`), which had added Aurora.

- `support` now lists the full bill from the venue's own archived listing: Aurora, Zella Day, Seinabo Sey, Cathedrals, Verite, Circa Waves, Thief, Hoodlem, Twin Peaks, Nothing But Thieves. Kate Boy, Made in Heights, Fenech-Soler and George Maple stay in the title.
- Added sources:
  - two attendee sources: Tal remembers seeing Zella Day, and Tal identified the 19:55 photo (IMG_0979, `26DEDE00…`) as Zella Day
  - five calendar events Tal made on 2014-10-22 for Santos: Aurora 7:00, Zella Day 7:30, Twin Peaks 8:30, Cathedrals 10:00, George Maple 11:30
  - three web sources: the Santos homepage archived 2014-10-20, the label press release with her set time, and B3SCI's CMJ preview (basement, 7:30–8:15 PM)
- Status stays `Check-in confirmed`, because Swarm confirms the night.

### 2012-03-24 Grimes, Glasslands Gallery (new: `2012-03-24-grimes`)

- Status: `Attendee confirmed`, on Tal's word. It is the first entry with this status.
- Support: Born Gold; DJ Dog Dick.
- Sources:
  - Ryan Jorgenson's two show lists (Dec 2011, Jan 2012), both naming "Grimes @ Glasslands" on 3/24
  - Tal's 2012-03-12 Craigslist inquiry to buy Glasslands Grimes tickets (the show was sold out)
  - the archived Ticketfly event and BrooklynVegan's post-show write-up
- No ticket receipt, check-in or photo from the show was found.

### 2013 Sleigh Bells, Le Poisson Rouge (`2013-10-06-sleigh-bells`)

- Date corrected from 2013-10-06 to **2013-10-05**. The ID is unchanged so it stays stable.
- Added the Ticket Prophet receipt (4 GA, Oct 5, 2013, 11 PM show) and Tal's email to Ryan ("sleigh bells at 11pm") as sources.

### 2025-11-01 Of Monsters and Men, Brooklyn Paramount (new: `2025-11-01-of-monsters-and-men`)

- Tal remembered this as "of lions and men". It's Of Monsters and Men's Mouse Parade tour, with Arny Margret opening.
- Status: `Attendee confirmed`.
- Sources:
  - Tal's memory
  - the Family calendar event "Need babysitter - Of Monsters And Men" (Brooklyn Paramount, Nov 1, 7–11 PM)
  - BrooklynVegan's tour announcement
- **The band played two nights, Nov 1 and an added Nov 2. Nov 1 is the one Tal went to.**
  - The babysitter booking is for Nov 1.
  - On Nov 2 the family flew JFK to Paris at 7:49 PM.
  - No ticket email was found, and Google Photos has no evening photos on either day.

## Learned / corrected

- **Zella Day was already in the archive, unnamed.** Her Santos set was hidden among the CMJ entry's "nine further billed acts".
  - The venue listed 14 acts. Songkick counts 13.
  - Her 7:30–8:15 PM basement set was her first CMJ show.
- **George Maple at Santos is now supported.** A concurrent session had flagged it as unresolved, because the entry's original calendar source is "George Maple at Rough Trade".
  - That source is now labeled as a separate plan.
  - A second calendar event ("George Maple at Santos Party House, 11:30 PM") and the venue listing put George Maple on the Santos bill.
- **The Grimes date conflicts with Tal's photos, and is kept on purpose.**
  - Google Photos GPS puts Tal in **Killington, VT** at 7:12 PM on 2012-03-24, about 250 miles from Glasslands. Doors were at 8:30 PM.
  - Photos on Mar 25 show the drive home.
  - Tal was told this and still chose 3/24/2012. The conflict is written into the entry's notes.
- **Other Grimes dates that could fit:**

  | Date | Venue | Details |
  |---|---|---|
  | 2010-10-17 | Glasslands | Headlining after Silly Kissers and Family Dynamics |
  | 2013-05-21 | Glasslands | DJ set as the Majical Cloudz special guest |
  | 2012-03-23 | Mercury Lounge | Early and late shows with Born Gold |
  | 2011-03-07 | Silent Barn | Often miscredited to Glasslands |

  Tal's Craigslist subject "GL for ML" means Glasslands for Mercury Lounge.
  - Google Photos has nothing on 2010-10-17 or 2012-03-23.
  - On 2013-05-21 it has only dog-park photos.
- **Sleigh Bells was already archived twice at LPR, both with photos** (2013 and 2016-09-08), so nothing was missing.
  - The 2013 date was a day late: the after-midnight check-in and photos (00:53–01:20) had set the date.
- **Bug I introduced and fixed:** an unquoted `: ` inside the Grimes `notes` broke YAML parsing. The notes are now a quoted string.

## Still open

- **`rfc822_message_id`** is left out of the new email sources because the Gmail connector doesn't expose headers.
- **The Grimes date** has no corroborating ticket, check-in or photo.
