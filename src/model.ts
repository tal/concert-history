// Turns the YAML files into the linked model that every page renders from.
import path from 'node:path';
import {
  SUPPORTED_STATUSES,
  type ArchiveData,
  type Artist,
  type ArtistsFile,
  type Concert,
  type Festival,
  type FestivalsFile,
  type Status,
  type Venue,
  type VenuesFile,
} from './types';

export type ShowType = 'gig' | 'festival' | 'showcase' | 'dj';
export type Evidence = 'confirmed' | 'unconfirmed';
export type Role = 'headliner' | 'billed';

export interface Billing {
  label: string;
  artist: ArtistEntry;
}

export interface Show {
  concert: Concert;
  id: string;
  date: string;
  year: string;
  type: ShowType;
  evidence: Evidence;
  title: string;
  headliners: Billing[];
  supports: Billing[];
  venue: VenueEntry;
  festival: Festival | null;
}

export interface Appearance {
  show: Show;
  role: Role;
}

export interface ArtistEntry extends Artist {
  appearances: Appearance[];
}

export interface VenueEntry extends Venue {
  shows: Show[];
}

export interface Site {
  data: ArchiveData;
  /** Every record, including the excluded ones the site never shows. */
  concerts: Concert[];
  /** Newest first, excluded records removed. */
  shows: Show[];
  artists: ArtistEntry[];
  venues: VenueEntry[];
  /** Lookup by normalizeName, for lineups that are plain strings. */
  artistByName: Map<string, ArtistEntry>;
  warnings: string[];
}

/** Short label for each evidence status. */
export const STATUS_LABELS: Record<Status, string> = {
  'Check-in confirmed': 'Checked in',
  'Photo corroborated': 'Photo proof',
  'Attendee confirmed': 'Remembered',
  'Ticket evidence': 'Ticket only',
  'Calendar only': 'Calendar only',
  'Tentative schedule': 'Tentative',
  Unidentified: 'Artist unknown',
  'Needs review': 'Needs review',
  Excluded: 'Excluded',
  'DJ event': 'DJ event',
};

/** Folds names so `Art vs Science` / `Art vs. Science` and `Beyoncé` / `Beyonce` compare equal. */
export function normalizeName(name: string): string {
  const folded = name
    .replace(/[øØ]/g, 'o')
    .replace(/[æÆ]/g, 'ae')
    .replace(/ß/g, 'ss')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\(.*?\)/g, ' ')
    .toLowerCase()
    .replace(/[&+]/g, ' and ')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/^the /, '')
    .replace(/\s+/g, ' ')
    .trim();
  return folded || name.trim().toLowerCase();
}

export const slugify = (name: string) => normalizeName(name).replaceAll(' ', '-');

/** Venue strings differ only by stray spaces, case and curly quotes when they mean the same place. */
const normalizeVenue = (raw: string) => raw.replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim().toLowerCase();

const NOT_A_PERFORMER = /further|not named|unresolved|showcase|CMJ party|Festival|Celebration|^not found$/i;

/** Splits an `artist` or `support` field into performer names. */
export function billNames(raw: string): string[] {
  let text = raw.replace(/^(?:CMJ showcase:|Also billed:|Billed:)\s*/, '');
  const billedPrefix = 'Billed performers included ';
  if (text.startsWith(billedPrefix)) {
    text = text.slice(billedPrefix.length).replaceAll(' and others', '').replaceAll(', ', '; ');
  }
  const parts = text === 'David Byrne & St. Vincent' ? ['David Byrne', 'St. Vincent'] : text.split(/;\s*| \/ /);
  return parts.map((part) => part.trim().replace(/^special guests /, '')).filter((p) => p && !NOT_A_PERFORMER.test(p));
}

function showType(concert: Concert, festival: Festival | null): ShowType {
  if (concert.status === 'DJ event') return 'dj';
  if (festival || /festival|bonnaroo|governors ball|googamooga/i.test(`${concert.artist} ${concert.venue}`)) return 'festival';
  if (concert.status === 'Tentative schedule' || /showcase|\bcmj\b/i.test(concert.artist)) return 'showcase';
  return 'gig';
}

async function loadYaml<T>(file: string, warnings: string[]): Promise<T | null> {
  const handle = Bun.file(file);
  if (!(await handle.exists())) {
    warnings.push(`${path.basename(file)} is missing`);
    return null;
  }
  try {
    return Bun.YAML.parse(await handle.text()) as T;
  } catch (error) {
    warnings.push(`${path.basename(file)} could not be parsed: ${String(error)}`);
    return null;
  }
}

export async function loadSite(dataDir: string): Promise<Site> {
  const warnings: string[] = [];
  const data = Bun.YAML.parse(await Bun.file(path.join(dataDir, 'concerts.yml')).text()) as ArchiveData;
  if (data.schema_version !== 1) throw new Error('Unsupported YAML schema version');

  const venuesFile = await loadYaml<VenuesFile>(path.join(dataDir, 'venues.yml'), warnings);
  const artistsFile = await loadYaml<ArtistsFile>(path.join(dataDir, 'artists.yml'), warnings);
  const festivalsFile = await loadYaml<FestivalsFile>(path.join(dataDir, 'festivals.yml'), warnings);

  const venueByAlias = new Map<string, VenueEntry>();
  const venues: VenueEntry[] = [];
  for (const venue of venuesFile?.venues ?? []) {
    const entry: VenueEntry = { ...venue, shows: [] };
    venues.push(entry);
    for (const alias of [venue.name, ...venue.aliases]) venueByAlias.set(normalizeVenue(alias), entry);
  }

  const artistByName = new Map<string, ArtistEntry>();
  const artists: ArtistEntry[] = [];
  for (const artist of artistsFile?.artists ?? []) {
    const entry: ArtistEntry = { ...artist, appearances: [] };
    artists.push(entry);
    for (const alias of [artist.name, ...artist.aliases]) artistByName.set(normalizeName(alias), entry);
  }

  const festivals = new Map((festivalsFile?.festivals ?? []).map((f) => [f.concert_id, f]));

  const usedSlugs = new Set([...artists.map((a) => a.slug)]);
  const lookupArtist = (label: string): ArtistEntry => {
    const key = normalizeName(data.artist_aliases[label.toLowerCase()] ?? label);
    const known = artistByName.get(key);
    if (known) return known;
    let slug = slugify(label);
    for (let n = 2; usedSlugs.has(slug); n++) slug = `${slugify(label)}-${n}`;
    usedSlugs.add(slug);
    const stub: ArtistEntry = {
      slug,
      name: label,
      aliases: [],
      spotify_id: null,
      spotify_match: 'none',
      image_url: null,
      description: null,
      wikipedia: null,
      appearances: [],
    };
    artists.push(stub);
    artistByName.set(key, stub);
    warnings.push(`Artist missing from artists.yml: ${label}`);
    return stub;
  };

  const lookupVenue = (raw: string): VenueEntry => {
    const key = normalizeVenue(raw);
    const known = venueByAlias.get(key);
    if (known) return known;
    const stub: VenueEntry = {
      slug: slugify(raw),
      name: raw.trim(),
      aliases: [raw],
      kind: 'other',
      city: null,
      region: null,
      country: null,
      neighborhood: null,
      address: null,
      lat: null,
      lon: null,
      coordinates_source: null,
      operating_status: 'unknown',
      closed_year: null,
      description: null,
      description_source: null,
      website: null,
      wikipedia: null,
      images: [],
      shows: [],
    };
    venues.push(stub);
    venueByAlias.set(key, stub);
    warnings.push(`Venue missing from venues.yml: ${raw}`);
    return stub;
  };

  const billing = (raw: string) => {
    const seen = new Set<ArtistEntry>();
    const out: Billing[] = [];
    for (const label of billNames(raw)) {
      const artist = lookupArtist(label);
      if (seen.has(artist)) continue;
      seen.add(artist);
      out.push({ label, artist });
    }
    return out;
  };

  const shows: Show[] = [];
  for (const concert of data.concerts) {
    if (concert.status === 'Excluded') continue;
    const festival = festivals.get(concert.id) ?? null;
    const headliners = billing(concert.artist);
    const taken = new Set(headliners.map((h) => h.artist));
    const supports = billing(concert.support).filter((s) => !taken.has(s.artist));
    const show: Show = {
      concert,
      id: concert.id,
      date: concert.date,
      year: concert.date.slice(0, 4),
      type: showType(concert, festival),
      evidence: SUPPORTED_STATUSES.includes(concert.status) ? 'confirmed' : 'unconfirmed',
      title: festival?.name ?? concert.artist,
      headliners,
      supports,
      venue: lookupVenue(concert.venue),
      festival,
    };
    shows.push(show);
  }
  shows.sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));

  for (const show of shows) {
    show.venue.shows.push(show);
    for (const { artist } of show.headliners) artist.appearances.push({ show, role: 'headliner' });
    for (const { artist } of show.supports) artist.appearances.push({ show, role: 'billed' });
  }

  return {
    data,
    concerts: data.concerts,
    shows,
    artists: artists.filter((a) => a.appearances.length).sort((a, b) => a.name.localeCompare(b.name)),
    venues: venues.filter((v) => v.shows.length).sort((a, b) => a.name.localeCompare(b.name)),
    artistByName,
    warnings,
  };
}
