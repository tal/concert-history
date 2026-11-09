/** @jsxImportSource preact */
// The standard view of concerts: newest first, grouped by year along a glowing spine.
import { useMemo } from 'preact/hooks';
import type { Appearance, Role, Show, VenueEntry } from '../../model';
import { plural } from '../lib/format';
import { ShowRow } from './ShowRow';

export type YearAnchors = 'with_anchors' | 'no_anchors';
export type YearNotes = 'with_notes' | 'no_notes';

export interface TimelineProps {
  shows: Show[];
  anchors: YearAnchors;
  notes: YearNotes;
  roleOf?: (show: Show) => Role | undefined;
  /** When given, shows outside the set are hidden, without being unmounted. */
  visibleIds?: ReadonlySet<string>;
}

function yearNote(shows: Show[]): string {
  const byVenue = new Map<VenueEntry, number>();
  for (const show of shows) byVenue.set(show.venue, (byVenue.get(show.venue) ?? 0) + 1);
  const [top, count] = [...byVenue.entries()].sort((a, b) => b[1] - a[1])[0]!;
  return count > 1 ? `${plural(shows.length, 'show')}, most at ${top.name}` : plural(shows.length, 'show');
}

export function appearanceRole(appearances: Appearance[]) {
  const roles = new Map(appearances.map((a) => [a.show, a.role]));
  return (show: Show) => roles.get(show);
}

function groupByYear(shows: Show[]): [string, Show[]][] {
  const years = new Map<string, Show[]>();
  for (const show of shows) {
    const rows = years.get(show.year);
    if (rows) rows.push(show);
    else years.set(show.year, [show]);
  }
  return [...years.entries()];
}

export function Timeline({ shows, anchors, notes, roleOf, visibleIds }: TimelineProps) {
  const years = useMemo(() => groupByYear(shows), [shows]);
  return (
    <>
      {years.map(([year, rows]) => (
        <section
          key={year}
          class="yr"
          id={anchors === 'with_anchors' ? `y${year}` : undefined}
          data-year={year}
          hidden={visibleIds ? !rows.some((show) => visibleIds.has(show.id)) : undefined}
        >
          <header class="yr__head">
            <span class="yr__dot" aria-hidden="true"></span>
            <h2 class="neon">{year}</h2>
            <p>{notes === 'with_notes' ? yearNote(rows) : plural(rows.length, 'show')}</p>
          </header>
          <ol class="tl">
            {rows.map((show) => (
              <ShowRow key={show.id} show={show} role={roleOf?.(show)} visibility={!visibleIds || visibleIds.has(show.id) ? 'visible' : 'hidden'} />
            ))}
          </ol>
        </section>
      ))}
    </>
  );
}
