/** @jsxImportSource preact */
// The chrome around every page, plus what has to happen each time the page changes.
import type { ComponentChildren } from 'preact';
import { useLayoutEffect } from 'preact/hooks';
import { Link, useLocation } from 'wouter-preact';
import { LightboxProvider } from './components/Lightbox';
import { pageRendered } from './lib/scroll';
import type { NavKey, RouteMeta } from './routes';

const NAV: [Exclude<NavKey, 'none'>, string, string][] = [
  ['timeline', 'Timeline', '/'],
  ['artists', 'Artists', '/artists/'],
  ['venues', 'Venues', '/venues/'],
  ['about', 'About', '/about/'],
];

export function Shell({ meta, children }: { meta: RouteMeta; children: ComponentChildren }) {
  const [location] = useLocation();

  useLayoutEffect(() => {
    document.title = meta.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', meta.description);
  }, [meta.title, meta.description]);

  // A parent's layout effect runs after its children's, so the new page is already in the DOM.
  useLayoutEffect(() => pageRendered(), [location]);

  return (
    <LightboxProvider>
      {/* Changes with each client navigation, which is what gets the new page's name read out. */}
      <p class="vh" role="status">
        {meta.title}
      </p>
      <header class="top">
        <Link class="top__mark" href="/">
          Tal’s Concert History
        </Link>
        <nav class="top__nav" aria-label="Main">
          {NAV.map(([key, label, href]) => (
            <Link key={key} href={href} aria-current={key === meta.nav ? 'page' : undefined}>
              {label}
            </Link>
          ))}
        </nav>
      </header>
      <main tabindex={-1}>{children}</main>
      <footer class="foot">
        <p>Maps © OpenStreetMap contributors. Artist images and links via Spotify. Venue photos credited where shown. Setlists via setlist.fm. Artist descriptions from Wikipedia, CC BY-SA 4.0.</p>
      </footer>
    </LightboxProvider>
  );
}
