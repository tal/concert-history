/** @jsxImportSource preact */
// The whole app: providers, the router and the page for the current location.
import { Router, useLocation } from 'wouter-preact';
import type { Site } from '../model';
import { SiteProvider, useSite } from './context';
import { AboutPage } from './pages/AboutPage';
import { ArtistPage } from './pages/ArtistPage';
import { ArtistsIndex } from './pages/ArtistsIndex';
import { ConcertPage } from './pages/ConcertPage';
import { Home } from './pages/Home';
import { NotFoundPage } from './pages/NotFoundPage';
import { VenuePage } from './pages/VenuePage';
import { VenuesIndex } from './pages/VenuesIndex';
import { canonicalPath, resolveRoute, routeMeta, type Route } from './routes';
import { Shell } from './Shell';

function Page({ route }: { route: Route }) {
  switch (route.kind) {
    case 'home':
      return <Home />;
    case 'artists':
      return <ArtistsIndex />;
    case 'artist':
      return <ArtistPage artist={route.artist} />;
    case 'venues':
      return <VenuesIndex />;
    case 'venue':
      return <VenuePage venue={route.venue} />;
    case 'concert':
      return <ConcertPage show={route.show} />;
    case 'about':
      return <AboutPage />;
    case 'not_found':
      return <NotFoundPage />;
  }
}

function RoutedPage() {
  const site = useSite();
  const [location] = useLocation();
  const route = resolveRoute(site, location);
  return (
    <Shell meta={routeMeta(site, route)}>
      {/* Keyed by path: moving between two artists has to start the page's hooks and map over. */}
      <Page key={canonicalPath(location)} route={route} />
    </Shell>
  );
}

export interface AppProps {
  site: Site;
  /** Site root with leading and trailing slashes, such as `/` or `/concerts/`. */
  base: string;
  /** The router-relative path to render when there is no browser location. */
  ssrPath?: string;
}

export function App({ site, base, ssrPath }: AppProps) {
  const routerBase = base.replace(/\/$/, '');
  return (
    <SiteProvider site={site} base={base}>
      <Router base={routerBase} ssrPath={ssrPath === undefined ? undefined : routerBase + ssrPath}>
        <RoutedPage />
      </Router>
    </SiteProvider>
  );
}
