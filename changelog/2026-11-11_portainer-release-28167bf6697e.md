# portainer release 28167bf6697e (production)

| Field | Value |
|---|---|
| Version | 28167bf6697e |
| Channel | production (Portainer stack 43 `concert-history`, endpoint 2, https://concerts.tal.by/) |
| Artifact | stack ConfigHash `28167bf6697ee61c3a0fad76f44b235f54b76f9f`, image `sha256:f563da3487d1`, container `b18118509422` |
| Bump commit / tag | none (git-sha scheme) / `builds/portainer/production/28167bf6697e` |
| Previous production release | 75f8e2c20678 |
| Status | shipped |

## What's New
- Added Girl Talk at Keystone and Jungle's Tumblr IRL show, with a Jungle poster.
- Governors Ball 2011 is now confirmed from your memory.
- Courtney Barnett at Pianos, CMJ 2013 is now confirmed, using the Oct 18 set you picked.
- Added In Flames and Opeth at the Worcester Palladium, Dec 19, 2014.

## Pipeline notes
- `since-last-tag.sh` reported two of the three merged PRs as unclassified (#3 and #5), because their squash-merge titles have no conventional-commit prefix. Both are user-facing, so both are in What's New.
- PRs #4 and #5 were squash-merged with their follow-up commits. Their `claude/project-thread-*` branches still show 2 commits that aren't in `main`'s history, but the content is already on `main`.
- The redeploy PUT returned 200 with `Status: 3`. The stack reached `Status: 1` about 50 s later, with a new container and image (`31af88b427a9` → `f563da3487d1`), running with 0 restarts in two checks 20 s apart.
- Verified live: the home page, the In Flames / Opeth page and the Jungle poster all return 200.
- The tag was created before this changelog, so the tree was clean. Last release, writing the changelog first made `tag.sh` refuse.
