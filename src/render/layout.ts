// The HTML shell shared by every page.
import { esc } from './components';

/** `root` is the relative path from the current page back to the site root. */
export interface Ctx {
  root: string;
}

export const ctxAt = (depth: number): Ctx => ({ root: '../'.repeat(depth) });

export type NavKey = 'timeline' | 'artists' | 'venues' | 'about' | 'none';
export type MapUse = 'with_map' | 'no_map';

export interface PageOptions {
  title: string;
  description: string;
  ctx: Ctx;
  nav: NavKey;
  map: MapUse;
  body: string;
}

const FAVICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%2307060b'/%3E" +
  "%3Cg fill='%23ff2f92'%3E%3Crect x='6' y='12' width='3' height='8' rx='1.5'/%3E%3Crect x='11' y='7' width='3' height='18' rx='1.5'/%3E" +
  "%3Crect x='16' y='10' width='3' height='12' rx='1.5'/%3E%3Crect x='21' y='5' width='3' height='22' rx='1.5'/%3E%3C/g%3E%3C/svg%3E";

const NAV: [Exclude<NavKey, 'none'>, string, string][] = [
  ['timeline', 'Timeline', ''],
  ['artists', 'Artists', 'artists/'],
  ['venues', 'Venues', 'venues/'],
  ['about', 'About', 'about/'],
];

export function page({ title, description, ctx, nav, map, body }: PageOptions): string {
  const links = NAV.map(
    ([key, label, href]) =>
      `<a href="${ctx.root}${href || './'}"${key === nav ? ' aria-current="page"' : ''}>${label}</a>`,
  ).join('');
  const mapHead = map === 'with_map' ? `<link rel="stylesheet" href="${ctx.root}assets/leaflet.css">` : '';
  const mapScript = map === 'with_map' ? `<script defer src="${ctx.root}assets/map.js"></script>` : '';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="theme-color" content="#07060b">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="icon" href="${FAVICON}">
<link rel="preload" as="font" type="font/woff2" crossorigin href="${ctx.root}assets/fonts/tilt-neon.woff2">
${mapHead}<link rel="stylesheet" href="${ctx.root}assets/site.css">
<script defer src="${ctx.root}assets/app.js"></script>${mapScript}
</head>
<body>
<header class="top"><a class="top__mark" href="${ctx.root || './'}">Tal’s Concert History</a><nav class="top__nav" aria-label="Main">${links}</nav></header>
<main>${body}</main>
<footer class="foot"><p>Maps © OpenStreetMap contributors. Artist images and links via Spotify. Venue photos credited where shown. Setlists via setlist.fm. Artist descriptions from Wikipedia, CC BY-SA 4.0.</p></footer>
<dialog id="lightbox" aria-label="Image viewer"><button class="lb__close" aria-label="Close">×</button><img id="lb-img" alt=""><p id="lb-cap"></p><div class="lb__nav"><button id="lb-prev" aria-label="Previous image">←</button><span id="lb-pos" aria-live="polite"></span><button id="lb-next" aria-label="Next image">→</button></div></dialog>
</body>
</html>
`;
}
