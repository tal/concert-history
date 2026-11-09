# Orca terminal theme: Neon Archive

## Changes

- Added `design/terminal-theme.json`, an Orca terminal and Claude Code theme based on the site's look.
- Ran `orca-theme install`, which generated `~/.claude/themes/concert-history-night.json` and set `custom:concert-history-night` in the personal `.claude/settings.local.json`.

## How the colors were chosen

Colors came from an Orca browser screenshot of `/artists/rub/` and the tokens in `src/site.css`.

| Share of the page | Page element | Theme slot | Color |
|---|---|---|---|
| Dominant | Near-black violet field | Night background | `#0c0b11` |
| Corner glow | Plum wash at the top left | Day background | `#230d1b` |
| Primary text | Violet-tinted white | Foreground | `#f4effc` |
| Secondary text | Muted lavender | Claude Code `inactive` | `#aea6c1` |
| Small, on frames | Magenta avatar ring and nav underline | Prompt border, night cursor | `#ff2f92` |
| Small, on labels | Cyan section labels | Statusline name, Claude glyph, day cursor | `#27e3f0` |

- The ANSI palette uses the site's magenta, cyan, violet and amber, plus the Spotify button green. Red is a new `#ff5a5f`, so errors stay distinct from magenta.
- Sampled image pixels from the album art were left out because they belong to the artist photo, not the site.

## Verified contrast

| Pair | Ratio |
|---|---|
| Foreground on night background | 17.36:1 |
| Foreground on day background | 16.25:1 |
| ANSI grey on night background | 5.34:1 |
| ANSI grey on day background | 5.00:1 |

## Noticed, not changed

- `/artists/rub/` shows the bio and art for Reni's 1998 Manchester band, but the 2014 show is pinned in Gowanus, Brooklyn. This may be a wrong artist match for the Brooklyn DJ crew The Rub. It has not been verified.
