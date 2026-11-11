// Dates, counts and labels shared by the pages. Browser-safe.
import type { Show, ShowType, VenueEntry, Role } from '../../model';
import type { ScheduledSet } from '../../types';

const asDate = (iso: string) => new Date(`${iso}T12:00:00Z`);
const format = (iso: string, options: Intl.DateTimeFormatOptions) =>
  asDate(iso).toLocaleDateString('en-US', { timeZone: 'UTC', ...options });

export const shortDate = (iso: string) => format(iso, { month: 'short', day: 'numeric' });
export const longDate = (iso: string) => format(iso, { month: 'long', day: 'numeric', year: 'numeric' });
export const dayHeading = (iso: string) => format(iso, { weekday: 'long', month: 'long', day: 'numeric' });
export const monthName = (iso: string) => format(iso, { month: 'long' });

/** `21:05` → `9:05 PM`. */
export function clockTime(hhmm: string): string {
  const [h = 0, m = 0] = hhmm.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

/** `9:05–10:25 PM · Gotham Stage`; an open end reads `10:30 PM–late`. */
export function setTimeLabel(set: ScheduledSet): string {
  const start = clockTime(set.start);
  if (!set.end) return `${start}–late · ${set.stage}`;
  const end = clockTime(set.end);
  const sameHalf = start.slice(-2) === end.slice(-2);
  return `${sameHalf ? start.slice(0, -3) : start}–${end} · ${set.stage}`;
}

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
