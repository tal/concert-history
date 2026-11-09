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

/** Hotlinked concert photography published after this particular show. Never attendance evidence. */
export interface CoveragePhoto {
  image_url: string;
  page_url: string;
  publication: string;
  credit: string;
  caption: string;
  /** Date photographed, which may be a particular day of a festival. */
  concert_date: string;
}

export interface CoverageResearch {
  searched_on: string;
  outcome: 'found' | 'none_found' | 'unavailable' | 'not_searched';
  queries: string[];
  sources: string[];
  notes: string;
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
  coverage_photos?: CoveragePhoto[];
  coverage_research?: CoverageResearch;
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

export type VenueKind = 'club' | 'theater' | 'arena' | 'stadium' | 'park' | 'festival_grounds' | 'bar' | 'boat' | 'other';
export type OperatingStatus = 'open' | 'closed' | 'unknown';

export interface LinkedSource {
  label: string;
  url: string;
}

export type VenueImageView = 'exterior' | 'interior';

export interface VenueImage {
  view: VenueImageView;
  /** Local file inside data/venues/; only for freely licensed images. */
  asset?: string;
  /** Hotlinked official image, used when no free image exists. */
  url?: string;
  credit: string;
  license: string | null;
  source_url: string;
}

export interface Venue {
  slug: string;
  name: string;
  /** Every raw `venue` string in concerts.yml that means this place. */
  aliases: string[];
  kind: VenueKind;
  city: string | null;
  region: string | null;
  country: string | null;
  neighborhood: string | null;
  address: string | null;
  lat: number | null;
  lon: number | null;
  coordinates_source: 'wikipedia' | 'nominatim' | 'manual' | null;
  operating_status: OperatingStatus;
  closed_year: number | null;
  description: string | null;
  description_source: LinkedSource | null;
  website: string | null;
  wikipedia: string | null;
  images: VenueImage[];
}

export interface VenuesFile {
  schema_version: number;
  venues: Venue[];
}

export type SpotifyMatch = 'exact' | 'ambiguous' | 'none';

export interface Artist {
  slug: string;
  name: string;
  /** Other spellings used on bills. */
  aliases: string[];
  spotify_id: string | null;
  spotify_match: SpotifyMatch;
  /** Hotlinked from Spotify, which is why it is a URL and not a file. */
  image_url: string | null;
  description: string | null;
  wikipedia: string | null;
  /** Username only, without the @ or URL. */
  instagram: string | null;
}

export interface ArtistsFile {
  schema_version: number;
  artists: Artist[];
}

export type DayAttendance = 'attended' | 'not_attended' | 'unknown';
export type LineupStatus = 'complete' | 'partial' | 'not_found';
export type SeenBasis = 'attendee_confirmed' | 'photo' | 'setlist';

export interface FestivalDay {
  date: string;
  attendance: DayAttendance;
  attendance_basis: string;
  lineup: string[];
  lineup_source: string | null;
  lineup_status: LineupStatus;
  /** Only set when the day did not go ahead as scheduled. */
  event_status?: 'cancelled';
  event_status_source?: string;
  /** Acts that were announced for this day but never made the final schedule. */
  not_on_final_schedule?: string[];
}

export interface FestivalSeen {
  artist: string;
  /** Null when the act played more than one day and the evidence can't narrow it down. */
  date: string | null;
  possible_dates?: string[];
  basis: SeenBasis;
}

export interface Festival {
  concert_id: string;
  name: string;
  start_date: string;
  end_date: string;
  days: FestivalDay[];
  seen: FestivalSeen[];
  unplaced?: string[];
  unplaced_note?: string;
  lineup_note?: string;
}

export interface FestivalsFile {
  schema_version: number;
  festivals: Festival[];
}
