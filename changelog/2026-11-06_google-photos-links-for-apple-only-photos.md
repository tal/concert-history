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

## Still without a Google link (url: null)

| Concert | Photo | Status |
|---|---|---|
| 2025-08-02 Gogol Bordello | 19:58:27 photo | Not in Google Photos: the timeline jumps from 7:37:48 PM to 8:44:28 PM |
| 2026-02-25 Ella Red | 20:17:07 and 20:17:29 video stills | Not found yet: search returns nothing, and the timeline walk was interrupted |
