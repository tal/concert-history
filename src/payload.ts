// The site data the browser fetches. Holds only what rendering needs and never an excluded concert.
import { publicSourceUrl } from './app/lib/format';
import { linkSite, slugify, type Site } from './model';
import type { Artist, Concert, CoveragePhoto, Festival, FestivalDay, Photo, Poster, Setlist, Source, Venue } from './types';

type PayloadSource = Pick<Source, 'type' | 'label' | 'url' | 'statement' | 'confirmed_on'>;
type PayloadPhoto = Pick<Photo, 'asset' | 'captured' | 'kind' | 'url'>;
type PayloadPoster = Pick<Poster, 'asset' | 'kind' | 'page_url'>;
type PayloadArtist = Omit<Artist, 'spotify_match'>;
type PayloadVenue = Omit<Venue, 'kind' | 'country' | 'coordinates_source'>;
type PayloadDay = Omit<FestivalDay, 'event_status_source'>;
type PayloadFestival = Omit<Festival, 'days'> & { days: PayloadDay[] };

interface PayloadConcert extends Pick<Concert, 'id' | 'date' | 'artist' | 'support' | 'venue' | 'status' | 'previous_status' | 'notes' | 'photo_match'> {
  sources: PayloadSource[];
  photos: PayloadPhoto[];
  coverage_photos?: CoveragePhoto[];
  setlists?: Setlist[];
  poster: PayloadPoster | null;
  research_notes?: string;
}

export interface SitePayload {
  title: string;
  researched_on: string;
  artist_aliases: Record<string, string>;
  concerts: PayloadConcert[];
  artists: PayloadArtist[];
  venues: PayloadVenue[];
  festivals: PayloadFestival[];
  reserved_artist_slugs: string[];
}

const packSource = ({ type, label, url, statement, confirmed_on }: Source): PayloadSource => ({
  type,
  label,
  url: publicSourceUrl(url) ? url : undefined,
  statement,
  confirmed_on,
});

const packConcert = (concert: Concert): PayloadConcert => ({
  id: concert.id,
  date: concert.date,
  artist: concert.artist,
  support: concert.support,
  venue: concert.venue,
  status: concert.status,
  previous_status: concert.previous_status,
  notes: concert.notes,
  photo_match: concert.photo_match,
  sources: concert.sources.map(packSource),
  photos: concert.photos.map(({ asset, captured, kind, url }) => ({ asset, captured, kind, url })),
  coverage_photos: concert.coverage_photos,
  setlists: concert.setlists,
  poster: concert.poster ? { asset: concert.poster.asset, kind: concert.poster.kind, page_url: concert.poster.page_url } : null,
  research_notes: concert.web_research?.notes,
});

const packArtist = ({ slug, name, aliases, spotify_id, image_url, description, wikipedia, instagram }: Artist): PayloadArtist => ({
  slug,
  name,
  aliases,
  spotify_id,
  image_url,
  description,
  wikipedia,
  instagram,
});

const packVenue = (venue: Venue): PayloadVenue => ({
  slug: venue.slug,
  name: venue.name,
  aliases: venue.aliases,
  city: venue.city,
  region: venue.region,
  neighborhood: venue.neighborhood,
  address: venue.address,
  lat: venue.lat,
  lon: venue.lon,
  operating_status: venue.operating_status,
  closed_year: venue.closed_year,
  description: venue.description,
  description_source: venue.description_source,
  website: venue.website,
  wikipedia: venue.wikipedia,
  images: venue.images,
});

const packFestival = (festival: Festival): PayloadFestival => ({
  ...festival,
  days: festival.days.map(({ event_status_source: _dropped, ...day }) => day),
});

/** Dropped artists whose slug a stub's numbering would have stepped over. Anything else would just publish an unused name. */
function reservedSlugs(site: Site): string[] {
  const declared = new Set(site.declaredArtists);
  const stubBases = new Set(site.artists.filter((a) => !declared.has(a)).map((a) => slugify(a.name)));
  return site.declaredArtists
    .filter((a) => !a.appearances.length && (stubBases.has(a.slug) || stubBases.has(a.slug.replace(/-\d+$/, ''))))
    .map((a) => a.slug);
}

export function toPayload(site: Site): SitePayload {
  return {
    title: site.data.title,
    researched_on: site.data.researched_on,
    artist_aliases: site.data.artist_aliases,
    concerts: site.concerts.filter((c) => c.status !== 'Excluded').map(packConcert),
    artists: site.declaredArtists.filter((a) => a.appearances.length).map(packArtist),
    venues: site.declaredVenues.filter((v) => v.shows.length).map(packVenue),
    festivals: site.shows.flatMap((show) => (show.festival ? [packFestival(show.festival)] : [])),
    reserved_artist_slugs: reservedSlugs(site),
  };
}

/** Dropped fields come back as inert defaults so the browser's Site keeps its type. No page reads them. */
const unpackConcert = ({ photos, poster, research_notes, ...concert }: PayloadConcert): Concert => ({
  ...concert,
  photos: photos.map((photo) => ({ ...photo, id: photo.asset, source: '', references: [] })),
  poster: poster && { ...poster, image_url: '' },
  web_research: research_notes
    ? { searched_on: '', support: 'not_searched', support_sources: [], setlist: 'none_found', poster: 'not_searched', notes: research_notes }
    : undefined,
});

export function fromPayload(payload: SitePayload): Site {
  return linkSite({
    data: {
      schema_version: 1,
      title: payload.title,
      researched_on: payload.researched_on,
      artist_aliases: payload.artist_aliases,
      concerts: payload.concerts.map(unpackConcert),
    },
    artists: payload.artists.map((artist) => ({ ...artist, spotify_match: 'none' })),
    venues: payload.venues.map((venue) => ({ ...venue, kind: 'other', country: null, coordinates_source: null })),
    festivals: payload.festivals,
    reservedArtistSlugs: payload.reserved_artist_slugs,
    warnings: [],
  });
}
