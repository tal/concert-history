# portainer release 75f8e2c20678 (production)

| Field | Value |
|---|---|
| Version | 75f8e2c20678 |
| Channel | production (Portainer stack 43 `concert-history`, endpoint 2, https://concerts.tal.by/) |
| Artifact | stack ConfigHash `75f8e2c20678e490809e95c0907e6cecffa5b60d`, image `sha256:31af88b427a9`, container `6f4e55de601f` |
| Bump commit / tag | none (git-sha scheme) / `builds/portainer/production/75f8e2c20678` |
| Previous production release | none (first tagged release; replaced the untagged setup deploy of `bff16c8`) |
| Status | shipped |

## What's New
- First tagged release of the concert archive at concerts.tal.by.
- Festival pages show each act's set time and stage when the schedule is known, starting with Governors Ball 2011.
- Governors Ball 2011 now has a poster: the festival's official 2011 site map.
- Added R.E.M. at Red Rocks on June 3, 2008.
- Alex Winston at The Westway on March 5, 2015 is now confirmed from your memory.

## Pipeline notes
- There was no earlier tag, so `since-last-tag.sh` reported all 25 `feat`/`fix` commits in history. What's New covers only the changes since `bff16c8`, the build that was live from the 2026-11-09 setup.
- The redeploy PUT returned 200 with `Status: 3`. The stack reached `Status: 1` about 50 s later, with a new container and a new image (`d04a44cde1af` → `31af88b427a9`). Two checks 20 s apart showed it running with 0 restarts.
- Verified live: the home page returns 200, the Gov Ball 2011 page shows its set times, and the new poster returns 200.
