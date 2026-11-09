/** @jsxImportSource preact */
// Search, sort and count for the artist and venue directories, plus the card art they share.
import { useEffect, useMemo, useRef } from 'preact/hooks';
import { hashSeed } from '../../art-tile';
import { compareText, type Show } from '../../model';
import { usePersistentState } from '../context';
import { plural } from '../lib/format';
import type { RowVisibility } from './ShowRow';

export type ListSort = 'seen' | 'name';

export interface DirectoryEntry<T> {
  item: T;
  /** Lowercased text the search box matches against. */
  search: string;
  /** Sort key for A–Z. */
  name: string;
}

export interface DirectoryRow<T> extends DirectoryEntry<T> {
  visibility: RowVisibility;
}

export interface DirectoryControls {
  query: string;
  sort: ListSort;
  shown: number;
  setQuery(query: string): void;
  setSort(sort: ListSort): void;
}

/** `entries` come in most-seen order. The state is kept per list, so Back returns to the same search and sort. */
export function useDirectory<T>(listKey: string, entries: DirectoryEntry<T>[]): { rows: DirectoryRow<T>[]; controls: DirectoryControls } {
  const [query, setQuery] = usePersistentState(`list:${listKey}:query`, '');
  const [sort, setSort] = usePersistentState<ListSort>(`list:${listKey}:sort`, 'seen');
  const needle = query.trim().toLowerCase();
  const ordered = useMemo(() => (sort === 'name' ? entries.toSorted((a, b) => compareText(a.name, b.name)) : entries), [entries, sort]);
  const rows = useMemo(
    () => ordered.map((entry): DirectoryRow<T> => ({ ...entry, visibility: !needle || entry.search.includes(needle) ? 'visible' : 'hidden' })),
    [ordered, needle],
  );
  const shown = rows.filter((row) => row.visibility === 'visible').length;
  return { rows, controls: { query, sort, shown, setQuery, setSort } };
}

export function ListControls({ search, noun, controls }: { search: string; noun: string; controls: DirectoryControls }) {
  const { query, sort, shown, setQuery, setSort } = controls;
  const box = useRef<HTMLInputElement>(null);

  // Text typed before hydration is already in the box, and hydrating does not overwrite it.
  useEffect(() => {
    if (box.current!.value !== query) setQuery(box.current!.value);
  }, []);

  return (
    <div class="filters filters--list">
      <label class="search">
        <span class="vh">{search}</span>
        <input ref={box} data-list-search="" type="search" placeholder={search} autocomplete="off" value={query} onInput={(event) => setQuery(event.currentTarget.value)} />
      </label>
      <div class="chips" role="group" aria-label="Sort" data-sort-group="">
        <button data-sort="seen" aria-pressed={sort === 'seen' ? 'true' : 'false'} onClick={() => setSort('seen')}>
          Most seen
        </button>
        <button data-sort="name" aria-pressed={sort === 'name' ? 'true' : 'false'} onClick={() => setSort('name')}>
          A–Z
        </button>
      </div>
      <span class="count" data-list-count="" aria-live="polite" data-noun={noun}>
        {plural(shown, noun)}
      </span>
    </div>
  );
}

export function Monogram({ name }: { name: string }) {
  const letters = name
    .replace(/^the /i, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0] ?? '')
    .join('')
    .toUpperCase();
  return (
    <span class="mono" style={`--h:${hashSeed(name) % 360}`} aria-hidden="true">
      {letters}
    </span>
  );
}

export function photoFallback(shows: Show[]) {
  for (const show of shows) if (show.concert.photos[0]) return { photo: show.concert.photos[0], show };
  return null;
}
