# SPA review fixes

Fixes for the defects a review of the Preact conversion found against the old multi-page site.

## Fixed

| Area | Problem | Fix |
|---|---|---|
| Year crumb | With a remembered Home filter hiding the crumb's year, the crumb landed at the top with the year missing | The crumb clears Home's filters only when they hide its year (`yearMatches` in `lib/filters.ts`, `onOpen` on `BackLink`) |
| Before hydration | Back or Forward changed the URL with nothing to render it, then hydrated one route over another's DOM | `main.tsx` does a real load for a popstate to another page until the app is running, and forever if the payload failed |
| Smooth year jump | Navigating during the animation left the next page a few dozen pixels off | The arrival is held for the jump's window (`smoothJumpStarted` in `scroll.ts`) |
| List order | Sorting with the browser's locale reordered cards against the prerender, so a card could show one artist's name with another's link and image | `compareText` in `model.ts` fixes the locale to `en` everywhere the order is rendered |
| Festival days | Back collapsed days the reader had expanded | Open state kept per concert and day in `usePersistentState` |
| Directory search | Text typed before hydration was ignored, then wiped | `ListControls` adopts it on mount, as Home already did |
| Odd URLs | `//artists/x/`, `/artists//x/` and `/ARTISTS/x/` hydrated into Page not found | `main.tsx` replaces them with the tidy URL (`tidyPathname` in `routes.ts`) |
| Slashless base | `/concerts` to `/concerts/` under a base path left an arrival pending and froze scroll tracking | Arrivals compare canonical paths |
| Bun from another directory | The build and tests failed importing JSX | `/** @jsxImportSource preact */` on every `.tsx` file |
| README | Still described deleted files | Updated source layout, build output and `BASE_PATH` |
| Preview | Malformed escapes and NUL bytes returned a 500 error page | They return the 404 page |
| Keyboard focus on Back | Focus was lost, so the next Tab jumped to the top of the page | Each entry remembers its focused link by href and position, restored on arrival |
| Controls before the payload | Chip and sort presses before hydration were lost, and stayed dead if the payload failed | Early presses replay after hydration; on failure a note replaces the filter bar |
| Screen readers | Route changes named no page | A visually hidden `role="status"` line carries the page title |

## Corrected or learned

- The odd-URL fix does not change `resolveRoute`. Making the client accept those paths would have hydrated an artist page over `404.html` on any case-sensitive host. Redirecting to the tidy URL works whichever page the server sent.
- A smooth scroll in flight is not cancelled by an instant `scrollTo` in a way that sticks: the page reads 0, then settles off target. Re-applying the arrival on later frames holds it.
- A `pagehide` save during a pending arrival would have overwritten the destination entry's position with the outgoing page's, so that save is now skipped. Without this, the new reload on Back would have landed in the wrong place.
- Supersedes the earlier note that the prerender only imports from the project root. The full account is in `2026-11-09_preact-spa-conversion.md`.
