# Deployed the site to concerts.tal.by

First public deploy. The site runs as a Caddy container in a Portainer git stack on bee1, behind the central Caddy.

## What changed

| Area | Change |
|---|---|
| `Dockerfile` | Bun builds `dist/` (it's gitignored, so Portainer can't get it from the clone), then `caddy:2.10-alpine` serves it |
| `deploy/Caddyfile` | Inner server on `:80`, with `404.html` returned as a real 404 |
| `compose.yaml` | Publishes `127.0.0.1:8765:80`; `pull_policy: build` so a redeploy rebuilds |
| `.config/deploy.yml` | `portainer:production` target, stack `43`, endpoint `2`, health check on the public URL |
| GitHub | `tal/concert-history` changed from private to public, so Portainer needs no clone credential |
| Infrastructure | Portainer stack `concert-history`, Cloudflare A record, central Caddy vhost (no Authelia). Recorded in `darr-manager/changelog/` |

## Decisions, per Tal

| Decision | Choice |
|---|---|
| Access | Public, no login |
| Repo visibility | Public as-is, after a secrets pass |
| `dist/concerts.json` mail fields | Published unchanged |

## Secrets pass before going public

Scanned all 441 blobs on all 5 refs with regexes, since gitleaks and trufflehog weren't installed.

| Finding | Result |
|---|---|
| API keys, tokens, private keys, JWTs, signed URLs | None |
| `.env`, credential files, `research/` in history | Never committed |
| Tal's own mail metadata in `data/concerts.yml` and `dist/concerts.json` (account, calendar ids, message ids, subjects) | Present, and published by Tal's decision |

## Verification

| URL | Result |
|---|---|
| `/` | 200 |
| `/artists/` | 200 |
| `/definitely/not/here` | 404, HTML |
| `/concerts.json` | 200, JSON |
| TLS | Let's Encrypt certificate, expires 2027-02-07 |

## Pipeline notes

- No `builds/portainer/production/*` tag exists yet. Creating the stack deployed the site, so the first `/deploy portainer production` makes the first tag.
- The first stack create failed with `Repository 'tal/concert-history' is disabled`, seconds after the repo went public. GitHub reported the repo healthy and a retry about a minute later worked.
- The new DNS record took about 7 minutes to appear on Cloudflare's nameservers, though the API listed it immediately.
- A resolver that already cached the NXDOMAIN keeps failing for a while after that. This Mac still couldn't resolve the name once 1.1.1.1 and 8.8.8.8 could.
- The image was never built locally because Docker wasn't running here. The first real build was on bee1. A clean clone was built with Bun beforehand and matched local `dist/`.
- Bugs of mine during the run, none of which reached a live system: a zsh loop variable named `path` overwrote `PATH`, `echo ==` is a zsh error, and `PIPESTATUS` doesn't exist in zsh.
