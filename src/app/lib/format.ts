// Dates, counts and labels shared by the pages. Browser-safe.
import type { Show, ShowType, VenueEntry, Role } from '../../model';

const asDate = (iso: string) => new Date(`${iso}T12:00:00Z`);
const format = (iso: string, options: Intl.DateTimeFormatOptions) =>
  asDate(iso).toLocaleDateString('en-US', { timeZone: 'UTC', ...options });

export const shortDate = (iso: string) => format(iso, { month: 'short', day: 'numeric' });
export const longDate = (iso: string) => format(iso, { month: 'long', day: 'numeric', year: 'numeric' });
export const dayHeading = (iso: string) => format(iso, { weekday: 'long', month: 'long', day: 'numeric' });
export const monthName = (iso: string) => format(iso, { month: 'long' });

/** `Jun 6–8`, or `Jun 28–Jul 1` across a month boundary. */
export function dateLabel(show: Show): string {
  const festival = show.festival;
  if (!festival || festival.start_date === festival.end_date) return shortDate(show.date);
  const start = shortDate(festival.start_date);
  const end = shortDate(festival.end_date);
  return start.slice(0, 3) === end.slice(0, 3) ? `${start}–${end.slice(4)}` : `${start}–${end}`;
}

export const TYPE_LABELS: Record<ShowType, string> = { gig: 'Gig', festival: 'Festival', showcase: 'Showcase', dj: 'DJ' };
export const ROLE_LABELS: Record<Role, string> = { headliner: 'Headliner', billed: 'Billed' };

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export const assetName = (asset: string) => asset.split('/').pop()!;

export function venueWhere(venue: VenueEntry): string {
  const place = venue.neighborhood ?? venue.city;
  if (!place) return '';
  return venue.region && venue.region !== 'NY' ? `${place}, ${venue.region}` : place;
}

export const EXTERNAL = /^[a-z][a-z\d+.-]*:/i;

/** External links stay as they are. Local research files aren't deployed, so those become plain labels. */
export function publicSourceUrl(url: string | undefined): string | null {
  if (!url) return null;
  if (EXTERNAL.test(url)) return url;
  return url === 'dist/photo-catalog.json' ? 'photo-catalog.json' : null;
}
