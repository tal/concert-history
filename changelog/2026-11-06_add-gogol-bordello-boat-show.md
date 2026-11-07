# Add 2017-04-06 Gogol Bordello boat show

## What changed

- `data/concerts.yml`: new concert `2017-04-06-gogol-bordello`
  - Gogol Bordello with DeVotchKa, on the Immigraniada Boat Show (Rocks Off concert cruise from Pier 36, an ACLU benefit)
  - Status: `Check-in confirmed` (Swarm check-in at Pier 36)
  - Sources: the Swarm check-in, the Ticketstoday receipt (#12236139, 2 GA tickets), the 2017-03-16 cruise info email, the band's 2017 news page and The Waster's announcement
  - 12 photos: 6 with Apple Photos and Google Photos references, 6 Google-only (including 2 video stills)
- `data/photos/`: 12 new WebP assets (max 480 px)
- Totals after the build: 230 concerts, 96 galleries, 228 embedded images

## How it was found

| Step | Result |
|---|---|
| Web search | Band page and press give the date, Pier 36, the ACLU benefit and DeVotchKa |
| Gmail `gogol OR immigraniada OR devotchka …` | Receipt plus cruise info email |
| Google Photos date search "April 6, 2017" | "No results" |
| Timeline walk from the 2017-04-05 Crystal Fighters photo | 45 items from 8:22 to 11:15 PM |
| `research/apple-concert-search.json` | 10 Apple photos from this night, with GPS |

## Learned / corrected

- **This show was missing from the archive** even though the Apple concert search had already flagged 10 photos from it. The Ticketstoday receipt also never made it into the earlier email searches.
- **Boat name conflict:**
  - The receipt and the cruise email say *Liberty Belle*
  - The band's site says the show moved to the larger *Cornucopia Majesty*
  - An 11:15 PM Instagram story clip in Google Photos is tagged "Cornucopia Majesty Cruise Ship", so the archive records Cornucopia Majesty
- **GPS traces the cruise route:** Pier 36 (8:26 PM), the East River near Long Island City (8:46 PM), the Battery (9:26 PM), Upper New York Bay (10:09 PM), then back at Pier 36 (10:51 PM).
- **Who is in the photos:** the 8:26–8:46 PM shots appear to show DeVotchKa's opening set (sousaphone), and Gogol Bordello's set runs from about 9:26 PM.
- **Left out on purpose:**
  - 2 selfies
  - Shared-library photos from someone else's phone at home (10:37 PM)
  - Screenshots taken after midnight
  - A video dated Apr 7, 3:06 PM that looks like the boat, which is probably a re-saved clip with a wrong date
- **Google Photos thumbnails need the browser's login.** `photos.fife.usercontent.google.com` returns 403 to curl. The assets were made by rendering each image in the page and saving a screenshot, then trimming and converting to WebP.

## Swarm check-in (follow-up)

- Found in Swarm history (April 2017): **Pier 36**, 2017-04-06 7:52 PM EDT, with the shout "Gogol Bordello"
  - Check-in ID `58e6d4ad76f2ca76deda7a1f`, URL `https://www.swarmapp.com/user/9203/checkin/58e6d4ad76f2ca76deda7a1f`
  - The time fits the 7 PM boarding and 8 PM departure
- Status raised from `Photo corroborated` to `Check-in confirmed`. `previous_status` isn't set because the entry was new and never committed with the old status.
- This is the first check-in in the archive with a real `checkin_id`. The others are `null` because the original review didn't record IDs.
- **Corrected:** the first Swarm attempt failed with "Permission denied" on reads and clicks, even though navigation and screenshots worked. After the user set the extension to all pages, it worked.
- **Swarm history UI:** the year dropdown also lists months, so pick "April" under 2017. The page lazy-loads as you scroll. Each entry links to `/user/<id>/checkin/<checkin_id>`, and `data-created-at` holds the Unix time.

## Still open

- **`rfc822_message_id`** is left out for both emails because the Gmail connector doesn't expose headers.
