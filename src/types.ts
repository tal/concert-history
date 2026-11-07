// Shapes of data/concerts.yml and of the rendered rows the browser receives.

export const STATUSES = [
  'Check-in confirmed',
  'Photo corroborated',
  'Ticket evidence',
  'Calendar only',
  'Tentative schedule',
  'Unidentified',
  'Needs review',
  'Excluded',
  'DJ event',
] as const;
export type Status = (typeof STATUSES)[number];

export const SUPPORTED_STATUSES: readonly Status[] = ['Check-in confirmed', 'Photo corroborated'];

export type SourceType = 'email' | 'calendar' | 'checkin' | 'research' | 'web' | 'photo_catalog';

export interface Source {
  type: SourceType;
  label: string;
  /** External URL, or a path relative to the project root. */
  url: string;
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
}

export type PhotoKind = 'Photo' | 'Video still';

export interface PhotoReference {
  provider: 'apple_photos' | 'google_photos';
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
  /** [label, href] pairs, with local paths made relative to dist/. */
  sources: [string, string][];
  photoMatch: string;
}

export interface PagePayload {
  events: RenderedConcert[];
  /** Photo ID → data: URI. */
  images: Record<string, string>;
}

export type ArtistRole = 'headliner' | 'support';
