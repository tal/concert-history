# Preact SPA conversion

Replaced the static multi-page site (HTML strings plus vanilla DOM scripts) with a Preact JSX app that is prerendered per route and hydrated. Links inside the site no longer reload the page. Nothing in `data/` changed as part of this work. The fix-by-fix detail is in `2026-11-09_spa-review-fixes.md`.

## What changed

- **Gone**: `src/render/` and `src/client/app.ts`, `src/client/map.ts`.
- **New**: `src/app/` (routes, shell, pages, components, scroll memory), `src/client/main.tsx`, `src/prerender.tsx`, `src/payload.ts`, `src/load.ts`, `src/art-tile.ts`, `tests/spa.test.ts`.
- **Build**: `src/build.ts` bundles `main.tsx` as split ESM with hashed names, with Leaflet as its own chunk. It writes the payload to `dist/assets/site-<hash>.json`, one `index.html` per route, and `dist/404.html`.
- **Preview**: `src/preview.ts` serves `dist/404.html` with status 404 for unmatched paths.
- **Scroll and history**: each history entry gets a key in `history.state`, with positions in `sessionStorage`. Back, Forward and reload restore them. Entries also record the path they were pushed from, which `BackLink` uses to decide whether to call `history.back()`.

## Decisions

| Decision | Why |
|---|---|
| Preact and wouter-preact | One set of JSX components renders on the server and in the browser. The main bundle is 81 KB. wouter handles the router base and leaves modified clicks to the browser |
| Prerender, then hydrate | Every route is still a complete HTML file, so any static host works, a failed payload still leaves a readable page, and no rewrite rule is needed |
| One fetched JSON payload | Built by `toPayload`, holding only what rendering needs and never an excluded concert. It is one hashed file rather than copied into 734 HTML files |
| Prerender from the payload | Pages render from `fromPayload(toPayload(site))`, the same data the browser gets. `validate()` and the exports still use the full `loadSite` result |
| Absolute URLs with `BASE_PATH` | The old pages used `../` prefixes worked out from each page's depth. That can't hold when one page's DOM moves between routes, or for `404.html`, which is served at any depth. Set `BASE_PATH` at build time for a subfolder |

## Verification

The first five rows ran before the fixes below. The parity run was repeated on the fixed build with the same results: 734 routes, no differences outside the accepted ones, and all 734 pages match a direct render. The only new markup is a deliberate, visually hidden `role="status"` line on every page.

| Check | Result |
|---|---|
| HTML parity against the old renderer, same data | 734 of 734 old routes. 85,783 element pairs and 45,072 text nodes with no differences outside the accepted ones. Maps (490 blocks, 678 points) and gallery links (560) matched. A mutated control copy was detected in all 4 places |
| Exports | `concerts.json`, `photo-catalog.json` and `concert-history.md` byte-identical to the old build |
| Excluded records | For all 11, no id, notes, source URL, message or event id, photo or poster anywhere in `dist/` |
| Build | Deterministic across two runs. A frozen-lockfile install builds. 1,032 local references with none missing |
| Browser, headless Chrome | About 190 assertions: hydration on 9 page types, navigation, exact scroll on Back and Forward, year jumps, payload delay and failure, `BASE_PATH=/sub/`, 390px width. Separate runs covered focus, keyboard, lightbox and client-rendered DOM parity |
| After the fixes | Typecheck and build pass, 37 tests pass (7 new). Each bug's reproduction was re-run, and hydration and navigation re-checked in headless Chrome |

## Learned or corrected

- Preact hydration patches text but not mismatched attributes. That turned a sort-order difference into cards with one artist's name and another's link and image, and it is why the first browser render has to match the prerender exactly.
- `localeCompare` with no locale gave different orders by browser language. 8 of 425 artist cards were wrong in sv-SE and 242 in lt-LT, while en-US showed none.
- Bun takes JSX settings from the tsconfig in the working directory. The first version of the prerender therefore only imported from the project root. `/** @jsxImportSource preact */` on every `.tsx` file removes the dependency.
- A smooth scroll in flight survives an instant `scrollTo`: the page reads 0, then settles off target. Re-applying the arrival on later frames holds it.
- Re-applying a restored position only when `scrollY` hadn't moved left a reload 4px off, because font loading and scroll anchoring move it. The restore now re-applies unless the reader has scrolled or pressed a key.
- A `pagehide` save during a pending arrival would overwrite the destination entry's position with the outgoing page's, so that save is skipped.
- Accepting odd URLs in `resolveRoute` was the wrong fix for the Page-not-found bug, because it would hydrate an artist page over `404.html` on case-sensitive hosts. Redirecting to the tidy URL works whichever page the server sent.

## Bugs found in review

16 findings, 14 distinct. All fixed. Unless noted, each was a regression from the old site.

| Bug | Severity | Fix |
|---|---|---|
| Year crumb landed at the top of Home, with the year missing, when a remembered filter hid that year (found twice) | Medium | The crumb clears Home's filters only when they hide its year |
| Back before hydration changed the URL but not the page, then hydrated Home onto concert DOM with a stale hero class. With a failed payload it never loaded the page | Medium | Real page load on popstate until the app runs, permanently if the payload failed |
| Directory sort followed the browser's locale, so cards could mix one artist's name with another's link and image | Medium | `compareText` fixes `en` at all 7 sort sites |
| Back lost keyboard position, so the next Tab jumped to the top of the page | Medium | Each entry remembers its focused link by href and occurrence |
| Filter chips ignored clicks until the payload arrived, and stayed dead if it failed | Medium | Early presses replay after hydration. On failure a note replaces the filter bar |
| Artist and venue search ignored text typed before hydration, then erased it (found twice) | Medium | `ListControls` adopts the typed value on mount |
| Navigating during a smooth year jump landed off target | Low | The arrival is re-applied each frame for the jump's window |
| Back collapsed festival days the reader had expanded | Low | Open state kept per concert and day |
| `//artists/x/`, `/artists//x/` and `/ARTISTS/x/` hydrated into Page not found | Low | `main.tsx` replaces them with the tidy URL |
| Slashless root under a base path left an arrival pending and froze scroll tracking | Low | Arrivals compare canonical paths |
| Build and tests failed when Bun started outside the project root | Low | `@jsxImportSource` on all 22 `.tsx` files |
| Route changes gave screen readers no page name | Low | A visually hidden `role="status"` line carries the title |
| README still described deleted files (docs, not a site regression) | Low | Updated source layout, build output and `BASE_PATH`, and added deploy notes |
| Preview returned a 500 page for malformed or NUL paths (already in the old preview) | Low | They return the 404 page |

## Known limits

- The 655 KB payload is fetched on every page.
- `leaflet.css` is linked on every page, including the 244 with no map.
- `bun run preview` only serves a root build, so a `BASE_PATH` build needs another server to view it.
- With a failed payload, the map container on venue pages stays an empty box.
- Focus returns on Back only if the link had focus when leaving. Browsers that don't focus links on mouse click keep the old behaviour.
- The page-name announcement was checked in the DOM, not with a screen reader.
- The `data-type`, `data-evidence`, `data-photos` and `data-search` row attributes are gone. Filtering reads the data instead.
- On mobile, a year jump lands with a 186px gap under the filter bar. The old site had the same gap at 190px.
