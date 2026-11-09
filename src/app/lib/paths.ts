// Router-relative paths to each entity, in canonical form with a trailing slash.
import type { ArtistEntry, Show, VenueEntry } from '../../model';

export const artistPath = (artist: Pick<ArtistEntry, 'slug'>) => `/artists/${artist.slug}/`;
export const venuePath = (venue: Pick<VenueEntry, 'slug'>) => `/venues/${venue.slug}/`;
export const showPath = (show: Pick<Show, 'id'>) => `/concerts/${show.id}/`;
