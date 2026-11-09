// The site's URLs: which paths exist, what each one shows and its head tags. Pure and browser-safe.
import type { ArtistEntry, Show, Site, VenueEntry } from '../model';
import { longDate, plural } from './lib/format';
import { artistPath, showPath, venuePath } from './lib/paths';

export type NavKey = 'timeline' | 'artists' | 'venues' | 'about' | 'none';

export type Route =
  | { kind: 'home' }
  | { kind: 'artists' }
  | { kind: 'artist'; artist: ArtistEntry }
  | { kind: 'venues' }
  | { kind: 'venue'; venue: VenueEntry }
  | { kind: 'concert'; show: Show }
  | { kind: 'about' }
  | { kind: 'not_found' };

export interface RouteMeta {
  title: string;
  description: string;
  nav: NavKey;
}

const SITE_TITLE = 'Tal’s Concert History';

interface Lookups {
  artists: Map<string, ArtistEntry>;
  venues: Map<string, VenueEntry>;
  shows: Map<string, Show>;
}

const lookups = new WeakMap<Site, Lookups>();

function lookupsFor(site: Site): Lookups {
  let found = lookups.get(site);
  if (!found) {
    found = {
      artists: new Map(site.artists.map((a) => [a.slug, a])),
      venues: new Map(site.venues.map((v) => [v.slug, v])),
      shows: new Map(site.shows.map((s) => [s.id, s])),
    };
    lookups.set(site, found);
  }
  return found;
}

export function allPaths(site: Site): string[] {
  return [
    '/',
    '/about/',
    '/artists/',
    '/venues/',
    ...site.artists.map(artistPath),
    ...site.venues.map(venuePath),
    ...site.shows.map(showPath),
  ];
}

/** Drops any query, hash or `index.html` and ends the path in exactly one slash. */
export function canonicalPath(path: string): string {
  const bare = path.split(/[?#]/, 1)[0]!.replace(/\/index\.html$/, '/').replace(/\/+$/, '');
  return `${bare.startsWith('/') || !bare ? '' : '/'}${bare}/`;
}

/** The one spelling of a browser pathname that a page lives at: single slashes, and lowercase below `base`. */
export function tidyPathname(pathname: string, base: string): string {
  const single = pathname.replace(/\/{2,}/g, '/');
  return single.startsWith(base) ? base + single.slice(base.length).toLowerCase() : single;
}

export function resolveRoute(site: Site, path: string): Route {
  const canonical = canonicalPath(path);
  if (canonical === '/') return { kind: 'home' };
  if (canonical === '/about/') return { kind: 'about' };
  if (canonical === '/artists/') return { kind: 'artists' };
  if (canonical === '/venues/') return { kind: 'venues' };
  const match = /^\/(artists|venues|concerts)\/([^/]+)\/$/.exec(canonical);
  if (!match) return { kind: 'not_found' };
  const id = match[2]!;
  const { artists, venues, shows } = lookupsFor(site);
  if (match[1] === 'artists') {
    const artist = artists.get(id);
    return artist ? { kind: 'artist', artist } : { kind: 'not_found' };
  }
  if (match[1] === 'venues') {
    const venue = venues.get(id);
    return venue ? { kind: 'venue', venue } : { kind: 'not_found' };
  }
  const show = shows.get(id);
  return show ? { kind: 'concert', show } : { kind: 'not_found' };
}

export function routeMeta(site: Site, route: Route): RouteMeta {
  switch (route.kind) {
    case 'home': {
      const years = [...new Set(site.shows.map((s) => s.year))];
      return {
        title: SITE_TITLE,
        description: `${site.shows.length} live shows from ${years[years.length - 1]} to ${years[0]}, with photos, setlists, venues and artists.`,
        nav: 'timeline',
      };
    }
    case 'artists':
      return { title: `Artists · ${SITE_TITLE}`, description: `${site.artists.length} artists from Tal’s concert history.`, nav: 'artists' };
    case 'artist': {
      const { artist } = route;
      return {
        title: `${artist.name} · ${SITE_TITLE}`,
        description: `${artist.name}: ${plural(artist.appearances.length, 'show')} in Tal’s concert history.`,
        nav: 'artists',
      };
    }
    case 'venues':
      return { title: `Venues · ${SITE_TITLE}`, description: `${site.venues.length} venues from Tal’s concert history.`, nav: 'venues' };
    case 'venue': {
      const { venue } = route;
      return {
        title: `${venue.name} · ${SITE_TITLE}`,
        description: `${venue.name}: ${plural(venue.shows.length, 'show')} in Tal’s concert history.`,
        nav: 'venues',
      };
    }
    case 'concert': {
      const { show } = route;
      return {
        title: `${show.title}, ${longDate(show.date)} · ${SITE_TITLE}`,
        description: `${show.title} at ${show.venue.name}, ${longDate(show.date)}.`,
        nav: 'none',
      };
    }
    case 'about':
      return { title: `About · ${SITE_TITLE}`, description: 'How this concert archive was reconstructed and how to read its evidence.', nav: 'about' };
    case 'not_found':
      return { title: `Page not found · ${SITE_TITLE}`, description: 'That page isn’t in the archive.', nav: 'none' };
  }
}
