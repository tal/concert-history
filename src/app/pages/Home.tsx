/** @jsxImportSource preact */
// The home page: the hero, then every concert on one filterable timeline.
import type { RefObject } from 'preact';
import { memo } from 'preact/compat';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { Show } from '../../model';
import { HistoryWaveform, type MonthCounts, YearRail } from '../components/Art';
import { Timeline } from '../components/Timeline';
import { useHomeFilters, useSite, type StateUpdate } from '../context';
import { monthCounts, visibleShowIds, type TimelineFilters } from '../lib/filters';
import { plural } from '../lib/format';
import { smoothJumpStarted } from '../lib/scroll';

interface Chip<T extends string> {
  value: T;
  label: string;
}

const TYPE_CHIPS: Chip<TimelineFilters['type']>[] = [
  { value: 'all', label: 'All' },
  { value: 'gig', label: 'Gigs' },
  { value: 'festival', label: 'Festivals' },
  { value: 'showcase', label: 'Showcases' },
  { value: 'dj', label: 'DJ' },
];

const EVIDENCE_CHIPS: Chip<TimelineFilters['evidence']>[] = [
  { value: 'all', label: 'All' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'unconfirmed', label: 'Unconfirmed' },
];

/** Only deliberate year jumps animate. Smooth scrolling in CSS would also animate every page load with a #year in the URL. */
function jumpToYear(event: MouseEvent) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#y"]');
  const target = link && document.querySelector(link.hash);
  if (!link || !target) return;
  event.preventDefault();
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  target.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' });
  if (!calm) smoothJumpStarted();
  history.replaceState(history.state, '', link.hash);
}

const Hero = memo(function Hero() {
  const { shows, artists, venues } = useSite();
  const stats: [number, string][] = [
    [shows.length, 'shows logged'],
    [shows.filter((show) => show.evidence === 'confirmed').length, 'confirmed'],
    [artists.length, 'artists billed'],
    [venues.length, 'venues'],
  ];
  return (
    <section class="hero" onClick={jumpToYear}>
      <p class="eyebrow">{`Live music, ${shows[shows.length - 1]!.year} to ${shows[0]!.year}`}</p>
      <h1 class="neon neon--xl">Tal’s concert history</h1>
      <dl class="stats">
        {stats.map(([value, label]) => (
          <div key={label}>
            <dd class="neon">{value}</dd>
            <dt>{label}</dt>
          </div>
        ))}
      </dl>
      <HistoryWaveform shows={shows} />
    </section>
  );
});

interface ChipGroupProps<T extends string> {
  label: string;
  chips: Chip<T>[];
  value: T;
  onSelect: (value: T) => void;
}

function ChipGroup<T extends string>({ label, chips, value, onSelect }: ChipGroupProps<T>) {
  return (
    <div class="chips" role="group" aria-label={label}>
      {chips.map((chip) => (
        <button key={chip.value} aria-pressed={chip.value === value ? 'true' : 'false'} onClick={() => onSelect(chip.value)}>
          {chip.label}
        </button>
      ))}
    </div>
  );
}

interface FilterBarProps {
  filters: TimelineFilters;
  query: string;
  shown: number;
  onFilters: (next: StateUpdate<TimelineFilters>) => void;
  onQuery: (next: string) => void;
}

function FilterBar({ filters, query, shown, onFilters, onQuery }: FilterBarProps) {
  const bar = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);

  // The sticky rail and the year anchors sit below this bar, and it wraps to more lines on narrow screens.
  useLayoutEffect(() => {
    const element = bar.current!;
    const root = document.documentElement;
    const measure = () => root.style.setProperty('--filters-h', `${element.offsetHeight}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => {
      observer.disconnect();
      root.style.removeProperty('--filters-h');
    };
  }, []);

  // Text typed before hydration is already in the box, and hydrating does not overwrite it.
  useEffect(() => {
    if (search.current!.value !== query) onQuery(search.current!.value);
  }, []);

  return (
    <div class="filters" ref={bar}>
      <label class="search">
        <span class="vh">Search shows</span>
        <input
          id="q"
          ref={search}
          type="search"
          placeholder="Artist, venue or date"
          autocomplete="off"
          value={query}
          onInput={(event) => onQuery(event.currentTarget.value)}
        />
      </label>
      <ChipGroup label="Show type" chips={TYPE_CHIPS} value={filters.type} onSelect={(type) => onFilters((f) => ({ ...f, type }))} />
      <ChipGroup
        label="Evidence"
        chips={EVIDENCE_CHIPS}
        value={filters.evidence}
        onSelect={(evidence) => onFilters((f) => ({ ...f, evidence }))}
      />
      <div class="chips">
        <button
          aria-pressed={filters.photos === 'with' ? 'true' : 'false'}
          onClick={() => onFilters((f) => ({ ...f, photos: f.photos === 'any' ? 'with' : 'any' }))}
        >
          With photos
        </button>
      </div>
      <span class="count" id="visible" aria-live="polite">
        {plural(shown, 'show')}
      </span>
    </div>
  );
}

interface TrackedRailProps {
  shows: Show[];
  counts: MonthCounts;
  timeline: RefObject<HTMLElement | null>;
}

/** Holds the highlighted year here so that scrolling past one redraws only the rail. */
function TrackedRail({ shows, counts, timeline }: TrackedRailProps) {
  const [currentYear, setCurrentYear] = useState<string>();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setCurrentYear((entry.target as HTMLElement).dataset.year);
        }
      },
      { rootMargin: '-25% 0px -70% 0px' },
    );
    for (const section of timeline.current!.querySelectorAll('.yr')) observer.observe(section);
    return () => observer.disconnect();
  }, [timeline]);

  return <YearRail shows={shows} counts={counts} currentYear={currentYear} />;
}

export function Home() {
  const { shows } = useSite();
  const { filters, setFilters, query, setQuery } = useHomeFilters();
  const timeline = useRef<HTMLDivElement>(null);

  const visibleIds = useMemo(() => visibleShowIds(shows, filters, query), [shows, filters, query]);
  const counts = useMemo(() => monthCounts(shows.filter((show) => visibleIds.has(show.id))), [shows, visibleIds]);

  return (
    <>
      <Hero />
      <FilterBar filters={filters} query={query} shown={visibleIds.size} onFilters={setFilters} onQuery={setQuery} />
      <div class="layout" onClick={jumpToYear}>
        <TrackedRail shows={shows} counts={counts} timeline={timeline} />
        <div id="timeline" ref={timeline}>
          <Timeline shows={shows} anchors="with_anchors" notes="with_notes" visibleIds={visibleIds} />
          <p class="empty" id="empty" hidden={visibleIds.size > 0}>
            No shows match that.
          </p>
        </div>
      </div>
    </>
  );
}
