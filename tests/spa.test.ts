import { describe, expect, test } from 'bun:test';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { allPaths, resolveRoute, tidyPathname, type Route } from '../src/app/routes';
import { matchesFilters, NO_FILTERS, yearMatches, type TimelineFilters } from '../src/app/lib/filters';
import { normalizeBase } from '../src/build';
import { loadSite } from '../src/load';
import type { Show, Site } from '../src/model';
import { fromPayload, toPayload } from '../src/payload';
import { renderDocument } from '../src/prerender';

const site = await loadSite(path.resolve(import.meta.dir, '../data'));
const rendered = fromPayload(toPayload(site));
const SLOW = 120_000;

const documentFor = (from: Site, route: string, base = '/') =>
  renderDocument({ site: from, base, path: route, script: 'main-test.js', payload: 'site-test.json' });

describe('payload round trip', () => {
  test('publishes the same routes as the full site', () => {
    expect(allPaths(rendered)).toEqual(allPaths(site));
  });
  test('every route renders identically from the payload and from the full site', () => {
    const different = allPaths(site).filter((route) => documentFor(site, route) !== documentFor(rendered, route));
    expect(different).toEqual([]);
  }, SLOW);
});

describe('excluded concerts', () => {
  const excluded = site.concerts.filter((concert) => concert.status === 'Excluded');
  test('no excluded id from the archive appears in the payload', () => {
    const json = JSON.stringify(toPayload(site));
    expect(excluded.filter((concert) => json.includes(concert.id)).map((concert) => concert.id)).toEqual([]);
  });
  test('an excluded record is dropped however its fields look', () => {
    const canary = { ...site.concerts[0]!, id: 'excluded-canary-id', status: 'Excluded' as const };
    expect(JSON.stringify(toPayload({ ...site, concerts: [...site.concerts, canary] }))).not.toContain('excluded-canary-id');
  });
  test('an excluded id has no page', () => {
    for (const concert of excluded) expect(resolveRoute(rendered, `/concerts/${concert.id}/`).kind).toBe('not_found');
  });
});

describe('resolveRoute', () => {
  const artist = site.artists[0]!;
  const venue = site.venues[0]!;
  const show = site.shows[0]!;
  const cases: [string, Route['kind']][] = [
    ['/', 'home'],
    ['/about', 'about'],
    ['/artists', 'artists'],
    ['/venues', 'venues'],
    [`/artists/${artist.slug}`, 'artist'],
    [`/venues/${venue.slug}`, 'venue'],
    [`/concerts/${show.id}`, 'concert'],
  ];
  for (const [route, kind] of cases) {
    test(`${route} resolves with and without a trailing slash`, () => {
      expect(resolveRoute(site, route).kind).toBe(kind);
      expect(resolveRoute(site, route === '/' ? route : `${route}/`).kind).toBe(kind);
    });
  }
  test('finds the entity the slug names', () => {
    expect(resolveRoute(site, `/artists/${artist.slug}/`)).toEqual({ kind: 'artist', artist });
    expect(resolveRoute(site, `/venues/${venue.slug}`)).toEqual({ kind: 'venue', venue });
    expect(resolveRoute(site, `/concerts/${show.id}/`)).toEqual({ kind: 'concert', show });
  });
  test('unknown slugs and paths are not_found', () => {
    for (const route of ['/artists/no-such-artist/', '/artists/no-such-artist', '/venues/no-such-venue/', '/concerts/no-such-concert/', '/nope/', `/artists/${artist.slug}/extra/`]) {
      expect(resolveRoute(site, route).kind).toBe('not_found');
    }
  });
});

describe('tidyPathname', () => {
  test('leaves every published route alone', () => {
    expect(allPaths(rendered).filter((route) => tidyPathname(route, '/') !== route)).toEqual([]);
    expect(allPaths(rendered).filter((route) => tidyPathname(`/Concerts${route}`, '/Concerts/') !== `/Concerts${route}`)).toEqual([]);
  });
  test('collapses repeated slashes and lowers the case below the base', () => {
    expect(tidyPathname('//artists/yeah-yeah-yeahs/', '/')).toBe('/artists/yeah-yeah-yeahs/');
    expect(tidyPathname('/artists//yeah-yeah-yeahs/', '/')).toBe('/artists/yeah-yeah-yeahs/');
    expect(tidyPathname('/ARTISTS/Yeah-Yeah-Yeahs/', '/')).toBe('/artists/yeah-yeah-yeahs/');
    expect(tidyPathname('/Concerts//ARTISTS/x/', '/Concerts/')).toBe('/Concerts/artists/x/');
  });
  test('a doubled slash cannot become a link to another host', () => {
    expect(tidyPathname('//example.com/', '/').startsWith('//')).toBe(false);
  });
  test('tidying a path a second time changes nothing', () => {
    expect(tidyPathname(tidyPathname('//A//b/', '/'), '/')).toBe(tidyPathname('//A//b/', '/'));
  });
});

describe('list order', () => {
  /** Stands in for a browser whose default locale sorts differently. */
  function withDefaultLocale<T>(locale: string, run: () => T): T {
    const native = String.prototype.localeCompare;
    String.prototype.localeCompare = function (this: string, that: string, locales?: Intl.LocalesArgument, options?: Intl.CollatorOptions) {
      return native.call(this, that, locales ?? locale, options);
    };
    try {
      return run();
    } finally {
      String.prototype.localeCompare = native;
    }
  }

  test('prerendered directories do not depend on the default locale', () => {
    for (const locale of ['sv-SE', 'lt-LT', 'tr-TR']) {
      const relinked = withDefaultLocale(locale, () => fromPayload(toPayload(site)));
      for (const route of ['/artists/', '/venues/', '/']) {
        const page = withDefaultLocale(locale, () => documentFor(relinked, route));
        expect(page === documentFor(rendered, route)).toBe(true);
      }
    }
  }, SLOW);
});

describe('running from another directory', () => {
  test('the prerender imports without the project tsconfig', () => {
    const file = path.resolve(import.meta.dir, '../src/prerender.tsx');
    const result = Bun.spawnSync(['bun', file], { cwd: tmpdir(), stderr: 'pipe', stdout: 'pipe' });
    expect(result.stderr.toString()).toBe('');
    expect(result.exitCode).toBe(0);
  });
});

describe('matchesFilters', () => {
  const makeShow = (overrides: { type: Show['type']; evidence: Show['evidence']; photos?: number; coverage?: number; title: string; venue: string; date: string }) =>
    ({
      id: overrides.title,
      title: overrides.title,
      date: overrides.date,
      type: overrides.type,
      evidence: overrides.evidence,
      venue: { name: overrides.venue, city: 'Brooklyn', neighborhood: 'Williamsburg' },
      concert: {
        artist: overrides.title,
        support: 'The Openers',
        photos: Array.from({ length: overrides.photos ?? 0 }, () => ({})),
        coverage_photos: overrides.coverage ? Array.from({ length: overrides.coverage }, () => ({})) : undefined,
      },
    }) as unknown as Show;

  const gig = makeShow({ type: 'gig', evidence: 'confirmed', photos: 2, title: 'Jack White', venue: 'Radio City', date: '2012-09-30' });
  const festival = makeShow({ type: 'festival', evidence: 'unconfirmed', title: 'Bonnaroo', venue: 'The Farm', date: '2014-06-13' });
  const coverage = makeShow({ type: 'dj', evidence: 'unconfirmed', coverage: 1, title: 'Night Set', venue: 'Output', date: '2015-01-02' });
  const filters = (overrides: Partial<TimelineFilters>): TimelineFilters => ({ ...NO_FILTERS, ...overrides });

  test('no filters match everything', () => {
    for (const show of [gig, festival, coverage]) expect(matchesFilters(show, NO_FILTERS, '')).toBe('match');
  });
  test('type', () => {
    expect(matchesFilters(gig, filters({ type: 'gig' }), '')).toBe('match');
    expect(matchesFilters(festival, filters({ type: 'gig' }), '')).toBe('no_match');
  });
  test('evidence', () => {
    expect(matchesFilters(gig, filters({ evidence: 'confirmed' }), '')).toBe('match');
    expect(matchesFilters(festival, filters({ evidence: 'confirmed' }), '')).toBe('no_match');
  });
  test('photos count personal photos and press coverage', () => {
    expect(matchesFilters(gig, filters({ photos: 'with' }), '')).toBe('match');
    expect(matchesFilters(coverage, filters({ photos: 'with' }), '')).toBe('match');
    expect(matchesFilters(festival, filters({ photos: 'with' }), '')).toBe('no_match');
  });
  test('query trims, ignores case and searches artist, support, venue, place and date', () => {
    for (const query of ['  JACK white ', 'the openers', 'radio city', 'williamsburg', '2012-09']) {
      expect(matchesFilters(gig, NO_FILTERS, query)).toBe('match');
    }
    expect(matchesFilters(gig, NO_FILTERS, 'bonnaroo')).toBe('no_match');
  });
  test('yearMatches says whether a year has anything left to show', () => {
    const shows = [{ ...gig, year: '2012' }, { ...festival, year: '2014' }] as Show[];
    expect(yearMatches(shows, '2012', filters({ type: 'gig' }), '')).toBe('match');
    expect(yearMatches(shows, '2014', filters({ type: 'gig' }), '')).toBe('no_match');
    expect(yearMatches(shows, '2014', NO_FILTERS, 'jack')).toBe('no_match');
    expect(yearMatches(shows, '1999', NO_FILTERS, '')).toBe('no_match');
  });
  test('all conditions have to hold', () => {
    expect(matchesFilters(gig, filters({ type: 'gig', evidence: 'confirmed', photos: 'with' }), 'jack')).toBe('match');
    expect(matchesFilters(gig, filters({ type: 'gig', evidence: 'unconfirmed', photos: 'with' }), 'jack')).toBe('no_match');
    expect(matchesFilters(gig, filters({ type: 'gig' }), 'nobody')).toBe('no_match');
  });
});

describe('BASE_PATH', () => {
  test('normalizes to a leading and trailing slash', () => {
    for (const value of ['concerts', '/concerts', 'concerts/', '/concerts/', '//concerts//']) expect(normalizeBase(value)).toBe('/concerts/');
    for (const value of ['', '/', '//']) expect(normalizeBase(value)).toBe('/');
    expect(normalizeBase('a/b')).toBe('/a/b/');
  });

  const rootRelative = (html: string) =>
    [...html.matchAll(/\b(?:href|src|data-payload)="(\/[^"]*)"|url\(['"]?(\/[^'")]*)/g)].map((match) => match[1] ?? match[2]!);

  test('every root-relative href, src and asset carries the base', () => {
    const missing = allPaths(rendered).flatMap((route) =>
      rootRelative(documentFor(rendered, route, '/concerts/'))
        .filter((url) => !url.startsWith('/concerts/'))
        .map((url) => `${route} -> ${url}`),
    );
    expect(missing).toEqual([]);
  }, SLOW);

  test('no internal link is relative to the current page', () => {
    const relative = allPaths(rendered).filter((route) => /\b(?:href|src)="\.{1,2}\//.test(documentFor(rendered, route)));
    expect(relative).toEqual([]);
  }, SLOW);

  test('prefixes navigation, year crumbs, static exports and assets', () => {
    const show = rendered.shows.find((candidate) => candidate.concert.photos.length)!;
    const concert = documentFor(rendered, `/concerts/${show.id}/`, '/concerts/');
    expect(concert).toContain('href="/concerts/artists/"');
    expect(concert).toContain(`href="/concerts/#y${show.year}"`);
    expect(concert).toContain(`/concerts/assets/photos/${path.basename(show.concert.photos[0]!.asset)}`);
    expect(concert).toContain('src="/concerts/assets/main-test.js"');
    expect(concert).toContain('data-payload="/concerts/assets/site-test.json"');
    expect(concert).toContain('data-base="/concerts/"');
    expect(documentFor(rendered, '/about/', '/concerts/')).toContain('href="/concerts/concert-history.md"');
  });

  test('a root build keeps plain absolute paths', () => {
    const home = documentFor(rendered, '/');
    expect(home).toContain('href="/artists/"');
    expect(home).toContain('src="/assets/main-test.js"');
  });
});
