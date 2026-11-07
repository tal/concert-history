# Google Photos links for Apple-only photos

## What changed

- `data/concerts.yml`: 59 photos that only had an Apple Photos reference now also have:
  - `url: https://photos.google.com/photo/<id>`, which makes the gallery show "Open in Google Photos ↗"
  - a `google_photos` entry in `references`
  - `source: Google Photos + Apple Photos`
- Apple Photos references were kept as history. The user no longer has the Photos.app library on this Mac.
- Totals: 213 of 216 photos now have a Google Photos link (was 154).

## How the matches were found

| Method | Photos |
|---|---|
| Google Photos date search, then exact capture-second match | 47 |
| Near match (clock offset or sub-second rounding), visually compared with the local WebP | 11 |
| Found by stepping through timeline neighbours (date search returned nothing) | 1 (2025-10-04 The Cave video) |

- Every one of the 59 IDs was re-opened in Google Photos afterwards, and its capture date was confirmed before writing.
- When Google holds two copies of the same photo with the same timestamp, the first one was used (2012-03-10 ×2, 2012-03-22 ×2, 2016-02-02 ×1).

## Learned / corrected

- **Google and Apple timestamps don't always agree:**
  - 2010-08-12 Gogol Bordello: Google shows them 2 hours earlier, a camera clock/timezone issue
  - 2012-03-10 RJD2 (01:12:09): Google shows 06:12:09, i.e. UTC
  - 2016-07-07 Zella Day: Apple stores an odd `-03:59` offset, so Google's 10:01:15 PM is the same moment as Apple's 22:02:15
  - 2017 and 2018: Google rounds sub-seconds up, so times differ by 1 s
- The earlier `research/` Google exports came from "concert YYYY" keyword searches. They covered only 4 of these 62 photos, so it's wrong to assume "no Google link" means the photo isn't in Google Photos.
- Google Photos date search is unreliable for automation:
  - After about 30 fast searches it starts returning "No results" for everything, i.e. rate limiting
  - It returned nothing for 2025-08-02, 2025-10-04 and 2026-02-25, even before the rate limiting started
  - Opening `/photo/<id>` directly still works while search is throttled

## Follow-up: iCloud Photos links

- The 2 Ella Red (2026-02-25) videos were found in iCloud Photos on icloud.com. They are linked there because Google Photos search couldn't find them.
  - 20:17:07 (portrait) → iCloud record `109B1F4C-CC8B-476D-91BC-7081C5EDF1DE`
  - 20:17:29 (landscape) → iCloud record `1B1FB9F4-43B5-4947-B920-D2046E78409C`
- New provider `icloud_photos` in `src/types.ts`. Source label is `iCloud Photos + Apple Photos`.
- The gallery link label now follows the URL host: "Open in iCloud Photos ↗" or "Open in Google Photos ↗" (`src/client/archive.ts`). The README was updated to match.
- iCloud deep links look like `https://www.icloud.com/photos/#/i,pz,<record id>,<library index>/`.
  - The index is the photo's position in the library and shifts as photos are added.
  - The link without the index (`#/i,pz,<record id>/`) was tested and opens the right item, so links are stored in that form.
- iCloud record IDs are **not** the same as the old Apple Photos UUIDs in the research export.
- iCloud web search needs "Enable Search with <device>", which changes an account setting, so it wasn't used. The library was navigated by date instead, using the "View months" year/month picker.
- Totals: 215 of 216 photos have a link.

## Still without a link (url: null)

| Concert | Photo | Why |
|---|---|---|
| 2025-08-02 Gogol Bordello | 19:58:27 photo (`B89204C1…`) | It's a "Shared with You" photo someone sent in Messages: `syndicated: true`, `IMG_4076.heic` from an iPhone 16 Pro Max. It isn't in the user's iCloud or Google library. Both timelines jump from 7:37 PM to 8:44 PM that night |
