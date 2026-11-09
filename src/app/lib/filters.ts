// Pure timeline filtering: which shows match the search box and chips.
import type { Evidence, Show, ShowType } from '../../model';
import { monthName } from './format';

export type PhotoFilter = 'any' | 'with';
export type FilterMatch = 'match' | 'no_match';

export interface TimelineFilters {
  type: ShowType | 'all';
  evidence: Evidence | 'all';
  photos: PhotoFilter;
}

export const NO_FILTERS: TimelineFilters = { type: 'all', evidence: 'all', photos: 'any' };

const searchTexts = new WeakMap<Show, string>();

export function showSearchText(show: Show): string {
  let text = searchTexts.get(show);
  if (text === undefined) {
    const parts = [
      show.title,
      show.concert.artist,
      show.concert.support,
      show.venue.name,
      show.venue.city,
      show.venue.neighborhood,
      show.date,
      monthName(show.date),
    ];
    text = parts.filter(Boolean).join(' ').toLowerCase();
    searchTexts.set(show, text);
  }
  return text;
}

const photoState = (show: Show) => (show.concert.photos.length || show.concert.coverage_photos?.length ? 'with' : 'none');

/** `query` is the raw search box text; it is trimmed and lowercased here. */
export function matchesFilters(show: Show, filters: TimelineFilters, query: string): FilterMatch {
  const needle = query.trim().toLowerCase();
  const matched =
    (filters.type === 'all' || show.type === filters.type) &&
    (filters.evidence === 'all' || show.evidence === filters.evidence) &&
    (filters.photos === 'any' || photoState(show) === filters.photos) &&
    (!needle || showSearchText(show).includes(needle));
  return matched ? 'match' : 'no_match';
}

export function visibleShowIds(shows: Show[], filters: TimelineFilters, query: string): Set<string> {
  return new Set(shows.filter((show) => matchesFilters(show, filters, query) === 'match').map((show) => show.id));
}

/** Whether a year has anything to show. A year with no match is hidden, so it can't be scrolled to. */
export function yearMatches(shows: Show[], year: string, filters: TimelineFilters, query: string): FilterMatch {
  return shows.some((show) => show.year === year && matchesFilters(show, filters, query) === 'match') ? 'match' : 'no_match';
}

/** Shows per `YYYY-MM`. */
export function monthCounts(shows: Show[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const show of shows) {
    const month = show.date.slice(0, 7);
    counts.set(month, (counts.get(month) ?? 0) + 1);
  }
  return counts;
}
