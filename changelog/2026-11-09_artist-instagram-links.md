# Artist Instagram links

## What changed

- Added `instagram` (bare username or null) to `Artist` in `src/types.ts` and to the stub artists in `src/model.ts`.
- Artist pages show an `Instagram ↗` button between Spotify and Wikipedia when a username exists (`src/render/pages.ts`).
- Added `scripts/fetch-instagram.ts`, which fills empty usernames from Wikidata property P2003. It reports by default and saves with `--write`. It only touches `instagram` lines and never replaces an existing username.
- Filled `data/artists.yml`: 195 of 424 artists have a username, 229 are null.
- Documented the field and script in `README.md`.

## Matching rules

| Case | Rule |
| --- | --- |
| `spotify_match: exact` | Match the Wikidata item by Spotify ID (P1902) or English Wikipedia article |
| `spotify_match: ambiguous` | Only used when the Spotify ID and the Wikipedia article point to the same Wikidata item; 27 skipped |
| `spotify_match: none` | Wikipedia article only |
| Several usernames on the item | Keep the one that exactly equals the artist's name, otherwise leave null |

## What was learned

- Wikidata's P2003 values are not all clean. Seven artists had two values, and some were mangled or belonged to someone else: `othing` for Nothing But Thieves, `he` for The Hundred in the Hands, `tadebimpe` (a member) for TV on the Radio.
- The exact-name tiebreak resolved all seven:

| Artist | Kept | Dropped |
| --- | --- | --- |
| Childish Gambino | `childishgambino` | `donaldglover` |
| Dragonette | `dragonette` | `dragonetteband` |
| Fitz and the Tantrums | `fitzandthetantrums` | `fitzandthetantrumsofficial` |
| The Hundred in the Hands | `thehundredinthehands` | `he` |
| Miami Horror | `miamihorror` | `miamihorror__` |
| Nothing But Thieves | `nothingbutthieves` | `othing` |
| TV on the Radio | `tvontheradio` | `tadebimpe` |

## Known gaps

- Usernames were not opened on Instagram, so a renamed or abandoned account would not have been caught.
- The Flaming Lips link is `waynecoyne5`, the frontman's personal account, because that is what Wikidata lists.
- Small bands mostly have no Wikidata username and show no button.
