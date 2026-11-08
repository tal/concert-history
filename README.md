# Concert history

A personal concert archive with artist histories, evidence, and embedded photo galleries.

`data/concerts.yml` is the source of truth. Edit it and rebuild with [Bun](https://bun.sh):

```sh
bun install
bun run build
bun run open        # open dist/concert-history.html (Orca browser tab inside Orca, default browser otherwise)
bun run typecheck
```

The generated HTML embeds its photos and JavaScript and can be opened directly from disk. Artist clicks show headlining, co-billed, and supporting appearances; evidence categories distinguish attended events from bookings, tentative plans, and exclusions.

## Layout

| Path | Contents |
|---|---|
| `data/concerts.yml` | Canonical concert, source, and photo metadata |
| `data/photos/` | Portable WebP image copies, embedded at build time |
| `src/build.ts` | Validates the data and writes everything in `dist/` |
| `src/types.ts` | Types shared by the build and the browser code |
| `src/archive.html` | Page template and styles |
| `src/client/archive.ts` | Browser code, bundled inline by `Bun.build` |
| `dist/` | Generated output (Git ignores it) |
| `research/` | Local raw exports and contact sheets (Git ignores it) |

## Data and source references

Each concert has a stable `id`, date, artist, supporting acts, venue, status, notes, `sources`, and `photos`.

- Email sources store the Gmail `message_id`, `thread_id`, RFC 822 `rfc822_message_id`, account, subject, and original URL. Quote hex-looking IDs such as `'1538288955220e82'`: YAML 1.2 reads them as numbers otherwise, and the build rejects non-string IDs.
- Calendar sources store the Google Calendar `event_id`, full `calendar_id`, encoded URL `url_eid`, and original URL.
- Each photo stores its image `asset`, capture time, media kind, source URL, and provider-specific `references` with the Apple Photos UUID, Google Photos photo ID and/or iCloud Photos record ID. `url` opens the photo in Google Photos, or in iCloud Photos (`https://www.icloud.com/photos/#/i,pz,<record id>/`) when it is not in Google Photos. Video captures are displayed as labeled still images.
- Swarm sources retain the history URL. Their `checkin_id` is explicitly null because the original review did not record individual check-in IDs. Other missing IDs remain null rather than inferred.
- `photo_match` records the rationale for attaching a gallery. No matched image does not establish that no photos exist.
- Local paths in the YAML (photo `asset`s and non-HTTP source `url`s such as `research/…` or `dist/photo-catalog.json`) are relative to the project root. The build rewrites links so they resolve from `dist/`.

The `research/` directory preserves the original raw exports, saved pages, and contact sheets locally. Some older evidence links refer to these local contact sheets. The current build does not need raw research or access to the original Apple Photos library.

## Build output

`bun run build` validates source identifiers, statuses, and photo assets, then writes:

- `dist/concert-history.html`: the self-contained page. The data is in a `<script type="application/json">` tag, followed by the bundled `src/client/archive.ts`.
- `dist/concert-history.md`: a plain Markdown table.
- `dist/concerts.json` and `dist/photo-catalog.json`: derived exports. These are compatibility files, never canonical inputs.
