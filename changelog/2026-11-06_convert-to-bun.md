# Convert build from Python/uv to Bun + TypeScript

## Layout changes

| Before | After |
|---|---|
| `concerts.yml` | `data/concerts.yml` |
| `assets/photos/*.webp` | `data/photos/*.webp` |
| `build.py` | `src/build.ts` (+ shared `src/types.ts`) |
| `templates/archive.html` | `src/archive.html` |
| `static/archive.js` | `src/client/archive.ts` (typed, bundled with `Bun.build`) |
| `concert-history.{html,md}`, `concerts.json`, `photo-catalog.json` at root | `dist/` |
| `pyproject.toml`, `uv.lock`, `.venv/` | `package.json`, `tsconfig.json`, `bun.lock` |

- Deleted the old Python scripts and `__pycache__/` in `research/`. The raw exports and contact sheets stay there.
- `artifact-script.js` is no longer generated. Nothing in the repo used it. It held the browser script with the data spliced in, but the HTML now carries the data in a JSON `<script>` tag.

## Behavior changes

- Data is no longer spliced into the JS with `EVENTDATA`/`IMAGEDATA` string replacement. It now lives in `<script type="application/json" id="archive-data">`, with `<` escaped as `<`. The client calls `JSON.parse` on it.
- The build checks each `status` against a typed list (`STATUSES` in `src/types.ts`) and fails on an unknown value.
- Local links in the YAML stay relative to the project root. The build rewrites them relative to `dist/` for the HTML and Markdown. For example, `research/album-contact-sheet.jpg` becomes `../research/album-contact-sheet.jpg`. The template links to `../data/concerts.yml`.
- The YAML URL `photo-catalog.json` became `dist/photo-catalog.json` to match the new location.
- `npm`-style scripts: `bun run build`, `bun run typecheck`, `bun run open`.

## Bug found during conversion

- Gmail message `1538288955220e82` (`message_id` and `thread_id`) was unquoted in the YAML. PyYAML (YAML 1.1) kept it as a string. Bun's YAML 1.2 parser read it as the float `1.53828895522e+94`. The fix quotes it in the data. The build now rejects non-string email `message_id`s so a value like this can't be silently mangled again.

## Verification

- `dist/concerts.json`, `dist/photo-catalog.json`, and `dist/concert-history.md` match the last Python output byte-for-byte, except for the moved paths and the `../` link prefixes.
- The embedded events and images payload deep-equals the old one after the same path normalization. The HTML shell outside the scripts is identical.
- A headless Chrome probe exercised filters, the empty state, artist dialogs (including alias display), photo navigation, arrow keys, and captions. Old and new pages gave identical results.
