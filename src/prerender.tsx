/** @jsxImportSource preact */
// Renders one route to a complete HTML document.
import { renderToString } from 'preact-render-to-string';
import { App } from './app/App';
import { resolveRoute, routeMeta } from './app/routes';
import type { Site } from './model';

const FAVICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%2307060b'/%3E" +
  "%3Cg fill='%23ff2f92'%3E%3Crect x='6' y='12' width='3' height='8' rx='1.5'/%3E%3Crect x='11' y='7' width='3' height='18' rx='1.5'/%3E" +
  "%3Crect x='16' y='10' width='3' height='12' rx='1.5'/%3E%3Crect x='21' y='5' width='3' height='22' rx='1.5'/%3E%3C/g%3E%3C/svg%3E";

const ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (value: string) => value.replace(/[&<>"']/g, (c) => ENTITIES[c]!);

export interface DocumentOptions {
  site: Site;
  /** Site root with leading and trailing slashes. */
  base: string;
  /** Router-relative path, such as `/artists/foo/`. */
  path: string;
  /** File names inside assets/. */
  script: string;
  payload: string;
}

export function renderDocument({ site, base, path, script, payload }: DocumentOptions): string {
  const meta = routeMeta(site, resolveRoute(site, path));
  const assets = esc(`${base}assets/`);
  const app = renderToString(<App site={site} base={base} ssrPath={path} />);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="theme-color" content="#07060b">
<title>${esc(meta.title)}</title>
<meta name="description" content="${esc(meta.description)}">
<link rel="icon" href="${FAVICON}">
<link rel="preload" as="font" type="font/woff2" crossorigin href="${assets}fonts/tilt-neon.woff2">
<link rel="preload" as="fetch" type="application/json" crossorigin href="${assets}${esc(payload)}">
<link rel="stylesheet" href="${assets}leaflet.css">
<link rel="stylesheet" href="${assets}site.css">
<script type="module" src="${assets}${esc(script)}" data-payload="${assets}${esc(payload)}" data-base="${esc(base)}"></script>
</head>
<body>
<div id="app">${app}</div>
</body>
</html>
`;
}
