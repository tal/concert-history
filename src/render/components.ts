// Pieces shared across pages, chiefly the standard timeline of concerts.
import { STATUS_LABELS, type Appearance, type ArtistEntry, type Role, type Show, type ShowType, type VenueEntry } from '../model';
import type { Ctx } from './layout';

const ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, (c) => ENTITIES[c]!);

const asDate = (iso: string) => new Date(`${iso}T12:00:00Z`);
const format = (iso: string, options: Intl.DateTimeFormatOptions) =>
  asDate(iso).toLocaleDateString('en-US', { timeZone: 'UTC', ...options });

export const shortDate = (iso: string) => format(iso, { month: 'short', day: 'numeric' });
export const longDate = (iso: string) => format(iso, { month: 'long', day: 'numeric', year: 'numeric' });
export const dayHeading = (iso: string) => format(iso, { weekday: 'long', month: 'long', day: 'numeric' });

/** `Jun 6–8`, or `Jun 28–Jul 1` across a month boundary. */
export function dateLabel(show: Show): string {
  const festival = show.festival;
  if (!festival || festival.start_date === festival.end_date) return shortDate(show.date);
  const start = shortDate(festival.start_date);
  const end = shortDate(festival.end_date);
  return start.slice(0, 3) === end.slice(0, 3) ? `${start}–${end.slice(4)}` : `${start}–${end}`;
}

export const TYPE_LABELS: Record<ShowType, string> = { gig: 'Gig', festival: 'Festival', showcase: 'Showcase', dj: 'DJ' };

export const typePill = (type: ShowType) => `<span class="pill pill--${type}">${TYPE_LABELS[type]}</span>`;

export const evidencePill = (show: Show) => `<span class="pill pill--evidence">${esc(STATUS_LABELS[show.concert.status])}</span>`;

export const artistHref = (artist: ArtistEntry, ctx: Ctx) => `${ctx.root}artists/${artist.slug}/`;
export const venueHref = (venue: VenueEntry, ctx: Ctx) => `${ctx.root}venues/${venue.slug}/`;
export const showHref = (show: Show, ctx: Ctx) => `${ctx.root}concerts/${show.id}/`;
export const assetName = (asset: string) => asset.split('/').pop()!;
export const photoSrc = (asset: string, ctx: Ctx) => `${ctx.root}assets/photos/${assetName(asset)}`;
export const posterSrc = (asset: string, ctx: Ctx) => `${ctx.root}assets/posters/${assetName(asset)}`;

export function venueWhere(venue: VenueEntry): string {
  const place = venue.neighborhood ?? venue.city;
  if (!place) return '';
  return venue.region && venue.region !== 'NY' ? `${place}, ${venue.region}` : place;
}

const PIN =
  '<svg class="pin" viewBox="0 0 12 16" aria-hidden="true"><path d="M6 0a6 6 0 0 0-6 6c0 4.2 6 10 6 10s6-5.800 6-10a6 6 0 0 0-6-6Zm0 8.200A2.200 2.200 0 1 1 6 3.800a2.200 2.200 0 0 1 0 4.400Z" fill="currentColor"/></svg>';

function photoStrip(show: Show, ctx: Ctx): string {
  const { photos, poster, coverage_photos = [] } = show.concert;
  if (!photos.length && !poster && !coverage_photos.length) return '';
  const thumbs = photos
    .slice(0, 3)
    .map((p) => `<img loading="lazy" decoding="async" src="${photoSrc(p.asset, ctx)}" alt="">`);
  const posterThumb = poster
    ? [`<img class="is-poster" loading="lazy" decoding="async" src="${posterSrc(poster.asset, ctx)}" alt="">`]
    : [];
  const more = photos.length > 3 ? `<span class="strip__more">+${photos.length - 3}</span>` : '';
  const coverage = coverage_photos[0];
  const pressThumb = coverage ? `<span class="strip__coverage" title="${esc(`Coverage photo: ${coverage.credit} / ${coverage.publication}`)}"><img loading="lazy" decoding="async" src="${esc(coverage.image_url)}" alt="${esc(coverage.caption)}" referrerpolicy="no-referrer"><span>Coverage</span></span>` : '';
  return `<div class="strip">${[...posterThumb, ...thumbs].join('')}${more}${pressThumb}</div>`;
}

function billLine(show: Show, ctx: Ctx): string {
  if (!show.supports.length) return '';
  const limit = show.type === 'festival' ? 6 : 5;
  const shown = show.supports.slice(0, limit).map((s) => `<a href="${artistHref(s.artist, ctx)}">${esc(s.label)}</a>`);
  const extra = show.supports.length - limit;
  return `<p class="show__bill">w/ ${shown.join(', ')}${extra > 0 ? ` <span>+${extra} more</span>` : ''}</p>`;
}

function searchText(show: Show): string {
  const parts = [
    show.title,
    show.concert.artist,
    show.concert.support,
    show.venue.name,
    show.venue.city,
    show.venue.neighborhood,
    show.date,
    format(show.date, { month: 'long' }),
  ];
  return parts.filter(Boolean).join(' ').toLowerCase();
}

const ROLE_LABELS: Record<Role, string> = { headliner: 'Headliner', billed: 'Billed' };

export interface RowOptions {
  /** Shown on artist pages, where a billing is not proof the set was seen. */
  role?: Role;
}

export function showRow(show: Show, ctx: Ctx, { role }: RowOptions = {}): string {
  const where = venueWhere(show.venue);
  const pills = [
    role ? `<span class="pill pill--role">${ROLE_LABELS[role]}</span>` : '',
    show.evidence === 'unconfirmed' ? evidencePill(show) : '',
    typePill(show.type),
  ].join('');
  return (
    `<li class="show show--${show.type} show--${show.evidence}" data-type="${show.type}" data-evidence="${show.evidence}" ` +
    `data-photos="${show.concert.photos.length || show.concert.coverage_photos?.length ? 'with' : 'none'}" data-search="${esc(searchText(show))}">` +
    `<span class="show__dot" aria-hidden="true"></span><div class="show__body">` +
    `<div class="show__meta"><time datetime="${show.date}">${esc(dateLabel(show))}</time><span class="show__pills">${pills}</span></div>` +
    `<h3 class="show__title"><a href="${showHref(show, ctx)}">${esc(show.title)}</a></h3>` +
    `<p class="show__venue">${PIN}<a href="${venueHref(show.venue, ctx)}">${esc(show.venue.name)}</a>${where ? `<span>${esc(where)}</span>` : ''}</p>` +
    billLine(show, ctx) +
    photoStrip(show, ctx) +
    `</div></li>`
  );
}

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export type YearAnchors = 'with_anchors' | 'no_anchors';
export type YearNotes = 'with_notes' | 'no_notes';

export interface TimelineOptions {
  anchors: YearAnchors;
  notes: YearNotes;
  roleOf?: (show: Show) => Role | undefined;
}

function yearNote(shows: Show[]): string {
  const byVenue = new Map<VenueEntry, number>();
  for (const show of shows) byVenue.set(show.venue, (byVenue.get(show.venue) ?? 0) + 1);
  const [top, count] = [...byVenue.entries()].sort((a, b) => b[1] - a[1])[0]!;
  return count > 1 ? `${plural(shows.length, 'show')}, most at ${top.name}` : plural(shows.length, 'show');
}

/** The standard view of concerts: newest first, grouped by year along a glowing spine. */
export function timeline(shows: Show[], ctx: Ctx, { anchors, notes, roleOf }: TimelineOptions): string {
  const years = new Map<string, Show[]>();
  for (const show of shows) years.set(show.year, [...(years.get(show.year) ?? []), show]);
  return [...years.entries()]
    .map(([year, rows]) => {
      const id = anchors === 'with_anchors' ? ` id="y${year}"` : '';
      const note = notes === 'with_notes' ? yearNote(rows) : plural(rows.length, 'show');
      const items = rows.map((show) => showRow(show, ctx, { role: roleOf?.(show) })).join('');
      return (
        `<section class="yr"${id} data-year="${year}"><header class="yr__head"><span class="yr__dot" aria-hidden="true"></span>` +
        `<h2 class="neon">${year}</h2><p>${esc(note)}</p></header><ol class="tl">${items}</ol></section>`
      );
    })
    .join('');
}

export const appearanceRole = (appearances: Appearance[]) => {
  const roles = new Map(appearances.map((a) => [a.show, a.role]));
  return (show: Show) => roles.get(show);
};

/** Interactive map; `src/client/map.ts` reads the points. */
export interface MapPoint {
  lat: number;
  lon: number;
  label: string;
  href: string;
  count: number;
}

export function mapBlock(points: MapPoint[], label: string, size: 'map--tall' | 'map--short' = 'map--short'): string {
  if (!points.length) return '';
  return `<div class="map ${size}" role="region" aria-label="${esc(label)}" data-points="${esc(JSON.stringify(points))}"></div>`;
}

export function venuePoint(venue: VenueEntry, ctx: Ctx, count: number): MapPoint | null {
  if (venue.lat == null || venue.lon == null) return null;
  return { lat: venue.lat, lon: venue.lon, label: venue.name, href: venueHref(venue, ctx), count };
}
