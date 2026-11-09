/** @jsxImportSource preact */
// App-wide context: the linked site, asset URLs and page state that outlives a page.
import { createContext, type ComponentChildren } from 'preact';
import { useCallback, useContext, useMemo, useReducer, useRef } from 'preact/hooks';
import type { Site } from '../model';
import type { VenueImage } from '../types';
import { NO_FILTERS, type TimelineFilters } from './lib/filters';
import { assetName } from './lib/format';

export interface Urls {
  photo(asset: string): string;
  poster(asset: string): string;
  venueImage(image: VenueImage): string;
  asset(relativePath: string): string;
}

interface SiteContextValue {
  site: Site;
  urls: Urls;
  state: Map<string, unknown>;
}

const SiteContext = createContext<SiteContextValue | null>(null);

function useSiteContext(): SiteContextValue {
  const value = useContext(SiteContext);
  if (!value) throw new Error('Needs a SiteProvider above it');
  return value;
}

/** `base` is the site root with leading and trailing slashes, such as `/` or `/concerts/`. */
function makeUrls(base: string): Urls {
  const asset = (relativePath: string) => `${base}${relativePath.replace(/^\/+/, '')}`;
  return {
    asset,
    photo: (file) => asset(`assets/photos/${assetName(file)}`),
    poster: (file) => asset(`assets/posters/${assetName(file)}`),
    venueImage: (image) => (image.asset ? asset(`assets/venues/${assetName(image.asset)}`) : (image.url ?? '')),
  };
}

export function SiteProvider({ site, base, children }: { site: Site; base: string; children: ComponentChildren }) {
  const state = useRef(new Map<string, unknown>()).current;
  const value = useMemo(() => ({ site, urls: makeUrls(base), state }), [site, base, state]);
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export const useSite = (): Site => useSiteContext().site;
export const useUrls = (): Urls => useSiteContext().urls;

export type StateUpdate<T> = T | ((previous: T) => T);

/** Like useState, but the value lives in the provider, so it survives leaving a page and pressing Back. */
export function usePersistentState<T>(key: string, initial: T): [T, (next: StateUpdate<T>) => void] {
  const { state } = useSiteContext();
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  const initialRef = useRef(initial);
  initialRef.current = initial;

  const read = useCallback(() => (state.has(key) ? (state.get(key) as T) : initialRef.current), [state, key]);
  const write = useCallback(
    (next: StateUpdate<T>) => {
      const previous = read();
      const value = typeof next === 'function' ? (next as (previous: T) => T)(previous) : next;
      if (Object.is(value, previous)) return;
      state.set(key, value);
      rerender(0);
    },
    [state, key, read],
  );
  return [read(), write];
}

/** Home's search and chips, which outlive the page. */
export function useHomeFilters() {
  const [filters, setFilters] = usePersistentState<TimelineFilters>('home:filters', NO_FILTERS);
  const [query, setQuery] = usePersistentState('home:query', '');
  return { filters, setFilters, query, setQuery };
}
