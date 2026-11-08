// Build the self-contained archive in dist/ from data/concerts.yml and data/photos/.
import { rm } from 'node:fs/promises';
import path from 'node:path';
import {
  STATUSES,
  SUPPORTED_STATUSES,
  type ArchiveData,
  type ArtistName,
  type Concert,
  type PagePayload,
  type RenderedConcert,
  type Status,
} from './types';

const ROOT = path.resolve(import.meta.dir, '..');
const DATA = path.join(ROOT, 'data');
const PHOTOS = path.join(DATA, 'photos');
const DIST = path.join(ROOT, 'dist');
const SRC = import.meta.dir;

const isInside = (child: string, parent: string) => {
  const rel = path.relative(parent, child);
  return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel);
};

/** Data stores local links relative to the project root; outputs live in dist/. */
const fromDist = (url: string) =>
  /^[a-z][a-z\d+.-]*:|^[#/]/i.test(url) ? url : path.relative(DIST, path.join(ROOT, url));

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' })[c]!);

export function artistNames(raw: string, aliases: Record<string, string>): ArtistName[] {
  let text = raw.replace(/^(?:CMJ showcase:|Also billed:|Billed:)\s*/, '');
  const billedPrefix = 'Billed performers included ';
  if (text.startsWith(billedPrefix)) {
    text = text.slice(billedPrefix.length).replaceAll(' and others', '').replaceAll(', ', '; ');
  }
  const parts = text === 'David Byrne & St. Vincent' ? ['David Byrne', 'St. Vincent'] : text.split(/;\s*| \/ /);
  const names: ArtistName[] = [];
  for (const part of parts) {
    let name = part.trim();
    if (!name || /further|not named|unresolved|showcase|CMJ party|Festival|Celebration/i.test(name)) continue;
    name = name.replace(/^special guests /, '');
    names.push({ label: name, key: (aliases[name.toLowerCase()] ?? name).toLowerCase() });
  }
  return names;
}

function validate(concert: Concert, seen: Set<string>) {
  if (seen.has(concert.id)) throw new Error(`Duplicate concert ID: ${concert.id}`);
  seen.add(concert.id);
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
}

async function loadImages(concert: Concert, images: Record<string, string>) {
  for (const photo of concert.photos) {
    const asset = path.resolve(ROOT, photo.asset);
    if (!isInside(asset, PHOTOS)) throw new Error(`Photo asset outside data/photos: ${asset}`);
    if (!photo.references.length || photo.references.some((ref) => !ref.photo_id)) {
      throw new Error(`Missing photo reference ID: ${photo.id}`);
    }
    const bytes = await Bun.file(asset).bytes();
    const image = 'data:image/webp;base64,' + Buffer.from(bytes).toString('base64');
    if (photo.id in images && images[photo.id] !== image) throw new Error(`Conflicting image ID: ${photo.id}`);
    images[photo.id] = image;
  }
}

async function bundleClient() {
  const result = await Bun.build({
    entrypoints: [path.join(SRC, 'client/archive.ts')],
    target: 'browser',
    format: 'iife',
    minify: true,
  });
  if (!result.success) throw new AggregateError(result.logs, 'Client bundle failed');
  // Keep the inline <script> from closing early.
  return (await result.outputs[0]!.text()).replace(/<\/(script)/gi, '<\\/$1');
}

/** JSON safe to inline in <script type="application/json">. */
const inlineJson = (value: unknown) => JSON.stringify(value).replaceAll('<', '\\u003c');

function markdown(data: ArchiveData, supported: number, galleries: number) {
  const lines = [
    '# ' + data.title,
    '',
    `${supported} check-in/photo/attendee supported events; ${galleries} events with image galleries.`,
    '',
    '| Date | Artist / event | Supporting / billed acts | Venue | Evidence and notes | Images |',
    '|---|---|---|---|---|---|',
  ];
  for (const row of data.concerts.toReversed()) {
    const refs = row.sources.map((s) => (s.url ? `[${s.label}](${fromDist(s.url)})` : s.label)).join('; ');
    const values = [
      row.date,
      row.artist,
      row.support || '—',
      row.venue,
      `${row.status} — ${refs} — ${row.notes}`,
      row.photos.length || 'No match',
    ];
    lines.push('| ' + values.map((v) => String(v).replaceAll('|', '/').replaceAll('\n', ' ')).join(' | ') + ' |');
  }
  return lines.join('\n') + '\n';
}

async function build() {
  const data = Bun.YAML.parse(await Bun.file(path.join(DATA, 'concerts.yml')).text()) as ArchiveData;
  if (data.schema_version !== 1) throw new Error('Unsupported YAML schema version');
  const { concerts } = data;

  const seen = new Set<string>();
  const images: Record<string, string> = {};
  const events: RenderedConcert[] = [];
  const catalog: Pick<Concert, 'id' | 'date' | 'artist' | 'venue' | 'photos' | 'photo_match'>[] = [];
  for (const [index, concert] of concerts.entries()) {
    validate(concert, seen);
    await loadImages(concert, images);
    const row = structuredClone(concert);
    events.push({
      ...row,
      archive_id: row.id,
      id: index,
      headliners: artistNames(row.artist, data.artist_aliases),
      supportArtists: artistNames(row.support, data.artist_aliases),
      sourceRefs: row.sources,
      sources: row.sources.map((s) => [s.label, s.url ? fromDist(s.url) : null]),
      photoMatch:
        row.photo_match ||
        'No photo confidently matched in this search. This does not establish that no photos exist.',
    });
    if (concert.photos.length) {
      const { id, date, artist, venue, photos, photo_match } = concert;
      catalog.push({ id, date, artist, venue, photos, photo_match });
    }
  }

  const counts = new Map<Status, number>();
  for (const { status } of concerts) counts.set(status, (counts.get(status) ?? 0) + 1);
  const count = (status: Status) => counts.get(status) ?? 0;
  const supported = SUPPORTED_STATUSES.reduce((sum, status) => sum + count(status), 0);
  const years = [...new Set(concerts.map((r) => r.date.slice(0, 4)))].sort().reverse();

  const payload: PagePayload = { events, images };
  const replacements: Record<string, string> = {
    SCRIPT:
      `<script type="application/json" id="archive-data">${inlineJson(payload)}</script>` +
      `<script>${await bundleClient()}</script>`,
    SUPPORTED: String(supported),
    TICKETS: String(count('Ticket evidence')),
    CALENDARS: String(count('Calendar only')),
    GALLERIES: String(catalog.length),
    COUNT: String(concerts.length),
    YEARS: years.map((y) => `<option>${escapeHtml(y)}</option>`).join(''),
  };
  let page = await Bun.file(path.join(SRC, 'archive.html')).text();
  for (const [key, value] of Object.entries(replacements)) page = page.replaceAll(`{{${key}}}`, value);

  await rm(DIST, { recursive: true, force: true });
  await Bun.write(path.join(DIST, 'concert-history.html'), page);
  // JSON exports are generated compatibility files, never canonical inputs.
  await Bun.write(path.join(DIST, 'concerts.json'), JSON.stringify(concerts, null, 2) + '\n');
  await Bun.write(path.join(DIST, 'photo-catalog.json'), JSON.stringify(catalog, null, 2) + '\n');
  await Bun.write(path.join(DIST, 'concert-history.md'), markdown(data, supported, catalog.length));
  console.log(
    `Built ${concerts.length} concerts, ${catalog.length} galleries, ${Object.keys(images).length} embedded images.`,
  );
}

if (import.meta.main) await build();
