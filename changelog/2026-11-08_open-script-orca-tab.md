# `bun run open` uses an Orca browser tab inside Orca

## Changes

- `package.json`: `scripts.open` now branches on `ORCA_TERMINAL_HANDLE`.
  - Set: `orca tab create --url "file://$PWD/dist/concert-history.html"`
  - Unset: `open dist/concert-history.html`, as before
- `README.md`: updated the comment on `bun run open`.

## Learned

- Orca's browser loads `file://` URLs, so the self-contained archive page needs no local server.
- Orca sets `ORCA_TERMINAL_HANDLE` in its managed terminals, and the `orca` CLI is on `PATH` there.

## Verified

| Case | Result |
| --- | --- |
| Inside Orca | Tab created; `orca tab list` shows the `file://` URL with the title "Tal’s concert history" |
| `ORCA_TERMINAL_HANDLE` unset, `open` stubbed | `open dist/concert-history.html` called |
