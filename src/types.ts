// Shapes of data/concerts.yml and of the rendered rows the browser receives.

export const STATUSES = [
  'Check-in confirmed',
  'Photo corroborated',
  'Attendee confirmed',
  'Ticket evidence',
  'Calendar only',
  'Tentative schedule',
  'Unidentified',
  'Needs review',
  'Excluded',
  'DJ event',
] as const;
export type Status = (typeof STATUSES)[number];

export const SUPPORTED_STATUSES: readonly Status[] = ['Check-in confirmed', 'Photo corroborated', 'Attendee confirmed'];

export type SourceType = 'email' | 'calendar' | 'checkin' | 'research' | 'web' | 'photo_catalog' | 'attendee';

export interface Source {
  type: SourceType;
  label: string;
  /** External URL, or a path relative to the project root. Absent only for attendee statements. */
  url?: string;
  provider?: string;
  message_id?: string;
  thread_id?: string;
  rfc822_message_id?: string;
  account?: string;
  subject?: string;
  event_id?: string;
  calendar_id?: string;
  url_eid?: string;
  checkin_id?: string | null;
  id_note?: string;
  /** Attendee statements: what Tal confirmed, and when (YYYY-MM-DD). */
  statement?: string;
  confirmed_on?: string;
}

export type PhotoKind = 'Photo' | 'Video still';

export interface PhotoReference {
  provider: 'apple_photos' | 'google_photos' | 'icloud_photos';
  photo_id: string;
}

export interface Photo {
  id: string;
  /** Path relative to the project root, inside data/photos/. */
  asset: string;
  captured: string;
  kind: PhotoKind;
  source: string;
  url: string | null;
  references: PhotoReference[];
}

/** One performer's set, usually from setlist.fm. */
export interface Setlist {
  artist: string;
  url: string;
  songs: string[];
  /** Index into `songs` of the first encore song, or null when no encore is marked. */
  encore_start_index: number | null;
  tour?: string | null;
}

export type PosterKind = 'show_poster' | 'tour_admat' | 'festival_lineup';

export interface Poster {
  /** Path relative to the project root, inside data/posters/. */
  asset: string;
  kind: PosterKind;
  /** Page the poster was found on. */
  page_url: string;
  /** Original image URL. */
  image_url: string;
}

/** Outcome of the web search every concert gets for support acts, setlists and a poster. */
export interface WebResearch {
  searched_on: string;
  /** not_searched: the web search could not run (e.g. search quota ran out) and still needs doing. */
  support: 'found' | 'matches_existing' | 'none_found' | 'not_searched';
  support_sources: string[];
  setlist: 'found' | 'empty_event' | 'none_found';
  poster: 'found' | 'none_found' | 'not_searched';
  notes?: string;
}

export interface Concert {
  id: string;
  date: string;
  artist: string;
  support: string;
  venue: string;
  status: Status;
  previous_status?: Status;
  notes: string;
  sources: Source[];
  photo_match: string | null;
  photos: Photo[];
  setlists?: Setlist[];
  poster?: Poster | null;
  /** Absent until the concert has been searched on the web; the build warns about those. */
  web_research?: WebResearch;
}

export interface ArchiveData {
  schema_version: number;
  title: string;
  researched_on: string;
  artist_aliases: Record<string, string>;
  concerts: Concert[];
}

export interface ArtistName {
  label: string;
  key: string;
}

/** A concert as embedded in the page: indexed by position, with artists split out and links resolved. */
export interface RenderedConcert extends Omit<Concert, 'id' | 'sources'> {
  id: number;
  archive_id: string;
  headliners: ArtistName[];
  supportArtists: ArtistName[];
  sourceRefs: Source[];
  /** [label, href] pairs, with local paths made relative to dist/. href is null for attendee statements. */
  sources: [string, string | null][];
  photoMatch: string;
}

export interface PagePayload {
  events: RenderedConcert[];
  /** Photo ID, or `poster:<concert id>`, → data: URI. */
  images: Record<string, string>;
}

export type ArtistRole = 'headliner' | 'support';
