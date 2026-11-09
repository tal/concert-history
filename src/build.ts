// Builds the static site in dist/ from the YAML files in data/.
import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { loadSite, type Site } from './model';
import { STATUSES, type Concert } from './types';
import { waveformTile } from './render/art';
import { artistPage, artistsIndex, aboutPage, concertPage, homePage, publicSourceUrl, venuePage, venuesIndex } from './render/pages';

const ROOT = path.resolve(import.meta.dir, '..');
const DATA = path.join(ROOT, 'data');
const PHOTOS = path.join(DATA, 'photos');
const POSTERS = path.join(DATA, 'posters');
const VENUE_IMAGES = path.join(DATA, 'venues');
const DIST = path.join(ROOT, 'dist');
const ASSETS = path.join(DIST, 'assets');
const SRC = import.meta.dir;
const MODULES = path.join(ROOT, 'node_modules');

const isInside = (child: string, parent: string) => {
  const rel = path.relative(parent, child);
  return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel);
};

export function validate(concert: Concert, seen: Set<string>) {
  if (seen.has(concert.id)) throw new Error(`Duplicate concert ID: ${concert.id}`);
  seen.add(concert.id);
  if (!/^[a-z0-9-]+$/.test(concert.id)) throw new Error(`Concert ID is not URL-safe: ${concert.id}`);
  if (!STATUSES.includes(concert.status)) throw new Error(`Unknown status "${concert.status}": ${concert.id}`);
  for (const source of concert.sources) {
    if (source.type === 'email' && typeof source.message_id !== 'string') {
      // YAML 1.2 reads hex-looking IDs such as 1538288955220e82 as numbers unless quoted.
      throw new Error(`Missing or non-string email message ID: ${concert.id}`);
    }
    if (source.type === 'calendar' && !(source.event_id && source.calendar_id)) {
      throw new Error(`Missing calendar identifiers: ${concert.id}`);
    }
    if (source.type === 'attendee' && !(source.statement && /^\d{4}-\d{2}-\d{2}$/.test(source.confirmed_on ?? ''))) {
      throw new Error(`Attendee source needs a statement and confirmed_on date: ${concert.id}`);
    }
    if (source.type !== 'attendee' && !source.url) throw new Error(`Missing source URL: ${concert.id}`);
  }
  for (const setlist of concert.setlists ?? []) {
    if (!setlist.artist || !setlist.url || !Array.isArray(setlist.songs)) {
      throw new Error(`Setlist needs artist, url and songs: ${concert.id}`);
    }
  }
  for (const photo of concert.photos) {
    if (!isInside(path.resolve(ROOT, photo.asset), PHOTOS)) throw new Error(`Photo asset outside data/photos: ${photo.asset}`);
    if (!photo.references.length || photo.references.some((ref) => !ref.photo_id)) {
      throw new Error(`Missing photo reference ID: ${photo.id}`);
    }
  }
  if (concert.poster && !isInside(path.resolve(ROOT, concert.poster.asset), POSTERS)) {
    throw new Error(`Poster asset outside data/posters: ${concert.poster.asset}`);
  }
  const research = concert.web_research;
  if (research) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(research.searched_on ?? '')) {
      throw new Error(`web_research needs a searched_on date: ${concert.id}`);
    }
    if ((research.poster === 'found') !== Boolean(concert.poster)) {
      throw new Error(`web_research.poster disagrees with poster: ${concert.id}`);
    }
    if ((research.setlist === 'found') !== Boolean(concert.setlists?.some((s) => s.songs.length))) {
      throw new Error(`web_research.setlist disagrees with setlists: ${concert.id}`);
    }
  }
}

async function bundle(entry: string, name: string) {
  const result = await Bun.build({ entrypoints: [path.join(SRC, 'client', entry)], target: 'browser', format: 'iife', minify: true });
  if (!result.success) throw new AggregateError(result.logs, `Bundling ${entry} failed`);
  await Bun.write(path.join(ASSETS, name), await result.outputs[0]!.text());
}

async function copyInto(directory: string, file: string) {
  await mkdir(directory, { recursive: true });
  await cp(path.resolve(ROOT, file), path.join(directory, path.basename(file)));
}

async function copyAssets(site: Site) {
  await mkdir(path.join(ASSETS, 'fonts'), { recursive: true });
  const fonts: [string, string][] = [
    ['@fontsource/tilt-neon/files/tilt-neon-latin-400-normal.woff2', 'tilt-neon.woff2'],
    ['@fontsource-variable/figtree/files/figtree-latin-wght-normal.woff2', 'figtree.woff2'],
    ['@fontsource/dm-mono/files/dm-mono-latin-400-normal.woff2', 'dm-mono.woff2'],
  ];
  for (const [from, to] of fonts) await cp(path.join(MODULES, from), path.join(ASSETS, 'fonts', to));
  await cp(path.join(MODULES, 'leaflet/dist/leaflet.css'), path.join(ASSETS, 'leaflet.css'));
  await cp(path.join(SRC, 'site.css'), path.join(ASSETS, 'site.css'));
  await Bun.write(path.join(ASSETS, 'waveform.svg'), waveformTile());

  for (const show of site.shows) {
    for (const photo of show.concert.photos) await copyInto(path.join(ASSETS, 'photos'), photo.asset);
    if (show.concert.poster) await copyInto(path.join(ASSETS, 'posters'), show.concert.poster.asset);
  }
  for (const venue of site.venues) {
    for (const image of venue.images) {
      if (image.view !== 'exterior' && image.view !== 'interior') throw new Error(`Venue image needs view exterior or interior: ${venue.slug}`);
      if (!image.asset) continue;
      if (!isInside(path.resolve(ROOT, image.asset), VENUE_IMAGES)) throw new Error(`Venue image outside data/venues: ${image.asset}`);
      await copyInto(path.join(ASSETS, 'venues'), image.asset);
    }
  }
}

function markdown(site: Site, published: Concert[]) {
  const confirmed = site.shows.filter((s) => s.evidence === 'confirmed').length;
  const lines = [
    '# ' + site.data.title,
    '',
    `${confirmed} check-in/photo/attendee supported events; ${published.filter((c) => c.photos.length).length} events with image galleries.`,
    '',
    '| Date | Artist / event | Supporting / billed acts | Venue | Evidence and notes | Images | Setlist | Poster |',
    '|---|---|---|---|---|---|---|---|',
  ];
  for (const row of published.toReversed()) {
    const refs = row.sources
      .map((s) => {
        const url = publicSourceUrl(s.url);
        return url ? `[${s.label}](${url})` : s.label;
      })
      .join('; ');
    const values = [
      row.date,
      row.artist,
      row.support || '—',
      row.venue,
      `${row.status} — ${refs} — ${row.notes}`,
      row.photos.length || 'No match',
      row.setlists?.map((l) => `[${l.artist} (${l.songs.length} songs)](${l.url})`).join('; ') || '—',
      row.poster ? `[Poster](assets/posters/${path.basename(row.poster.asset)})` : '—',
    ];
    lines.push('| ' + values.map((v) => String(v).replaceAll('|', '/').replaceAll('\n', ' ')).join(' | ') + ' |');
  }
  return lines.join('\n') + '\n';
}

const writePage = (relative: string, html: string) => Bun.write(path.join(DIST, relative, 'index.html'), html);

async function build() {
  const site = await loadSite(DATA);
  const seen = new Set<string>();
  for (const concert of site.concerts) validate(concert, seen);

  await rm(DIST, { recursive: true, force: true });
  await mkdir(ASSETS, { recursive: true });
  await copyAssets(site);
  await bundle('app.ts', 'app.js');
  await bundle('map.ts', 'map.js');

  await writePage('', homePage(site));
  await writePage('about', aboutPage(site));
  await writePage('artists', artistsIndex(site));
  await writePage('venues', venuesIndex(site));
  for (const artist of site.artists) await writePage(`artists/${artist.slug}`, artistPage(site, artist));
  for (const venue of site.venues) await writePage(`venues/${venue.slug}`, venuePage(venue));
  for (const show of site.shows) await writePage(`concerts/${show.id}`, concertPage(site, show));

  // Exports follow the site: excluded records stay out of everything published.
  const published = site.concerts.filter((c) => c.status !== 'Excluded');
  const catalog = published.filter((c) => c.photos.length).map(({ id, date, artist, venue, photos, photo_match }) => ({ id, date, artist, venue, photos, photo_match }));
  await Bun.write(path.join(DIST, 'concerts.json'), JSON.stringify(published, null, 2) + '\n');
  await Bun.write(path.join(DIST, 'photo-catalog.json'), JSON.stringify(catalog, null, 2) + '\n');
  await Bun.write(path.join(DIST, 'concert-history.md'), markdown(site, published));

  console.log(`Built ${site.shows.length} concerts, ${site.artists.length} artists, ${site.venues.length} venues.`);
  if (site.warnings.length) console.warn(`${site.warnings.length} warnings:\n  ${site.warnings.slice(0, 15).join('\n  ')}${site.warnings.length > 15 ? '\n  …' : ''}`);
  const unresearched = site.concerts
    .filter((c) => !c.web_research || c.web_research.support === 'not_searched' || c.web_research.poster === 'not_searched')
    .map((c) => c.id);
  if (unresearched.length) console.warn(`${unresearched.length} concerts still need a web search for support acts, setlist and poster (see AGENTS.md).`);
}

if (import.meta.main) await build();
