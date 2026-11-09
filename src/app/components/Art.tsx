/** @jsxImportSource preact */
// Generated visuals: the hero chart, the left rail and fallback posters.
import { memo } from 'preact/compat';
import { useLayoutEffect, useMemo, useRef, useState } from 'preact/hooks';
import { envelope, hashSeed, seededRandom } from '../../art-tile';
import type { Show } from '../../model';
import { dateLabel, plural, shortDate } from '../lib/format';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export type MonthCounts = ReadonlyMap<string, number>;

interface MonthCount {
  key: string;
  label: string;
  count: number;
}

interface YearCounts {
  year: number;
  total: number;
  months: MonthCount[];
}

/** Every month from the first show to the last, including silent ones, oldest first. */
function showsByMonth(shows: Show[]): { years: YearCounts[]; peak: MonthCount } {
  const counts = new Map<string, number>();
  for (const show of shows) {
    const month = show.date.slice(0, 7);
    counts.set(month, (counts.get(month) ?? 0) + 1);
  }
  const oldest = shows[shows.length - 1]!.date;
  const newest = shows[0]!.date;
  const firstYear = Number(oldest.slice(0, 4));
  const lastYear = Number(newest.slice(0, 4));
  const firstMonth = Number(oldest.slice(5, 7)) - 1;
  const lastMonth = Number(newest.slice(5, 7)) - 1;

  const years: YearCounts[] = [];
  let peak: MonthCount = { key: '', label: '', count: 0 };
  for (let year = firstYear; year <= lastYear; year++) {
    const from = year === firstYear ? firstMonth : 0;
    const to = year === lastYear ? lastMonth : 11;
    const months: MonthCount[] = [];
    for (let month = from; month <= to; month++) {
      const key = `${year}-${String(month + 1).padStart(2, '0')}`;
      const entry = { key, label: `${MONTHS[month]} ${year}`, count: counts.get(key) ?? 0 };
      months.push(entry);
      if (entry.count > peak.count) peak = entry;
    }
    years.push({ year, months, total: months.reduce((sum, m) => sum + m.count, 0) });
  }
  return { years, peak };
}

const tipText = (label: string, count: number) => `${label}: ${plural(count, 'show')}`;

export interface ChartProps {
  shows: Show[];
  /** Per-month counts to draw instead of the shows' own. The layout and scale stay fixed to `shows`. */
  counts?: MonthCounts;
}

const barTarget = (event: Event, selector: string) => (event.target as Element).closest<HTMLElement>(selector);

interface WaveBarsProps {
  years: YearCounts[];
  peak: number;
  counts?: MonthCounts;
}

const WaveBars = memo(function WaveBars({ years, peak, counts }: WaveBarsProps) {
  return (
    <>
      {years.flatMap(({ year, months }) =>
        months.map((month) => {
          const count = counts ? (counts.get(month.key) ?? 0) : month.count;
          return (
            <a
              key={month.key}
              class="wave__bar"
              tabindex={-1}
              href={`#y${year}`}
              data-tip={tipText(month.label, count)}
              style={`--h:${(count / peak).toFixed(3)}`}
              data-level={count ? 'some' : 'none'}
            ></a>
          );
        }),
      )}
    </>
  );
});

interface WaveTip {
  text: string;
  center: number;
}

/** Hero chart: one mirrored bar per month, so the archive reads as a single long waveform. */
export const HistoryWaveform = memo(function HistoryWaveform({ shows, counts }: ChartProps) {
  const { years, peak } = useMemo(() => showsByMonth(shows), [shows]);
  const figure = useRef<HTMLElement>(null);
  const tipBox = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<WaveTip | null>(null);

  // The tooltip has to be on screen with its new text before its width can be measured.
  useLayoutEffect(() => {
    if (!tip) return;
    const half = tipBox.current!.offsetWidth / 2;
    const width = figure.current!.getBoundingClientRect().width;
    tipBox.current!.style.left = `${Math.min(width - half, Math.max(half, tip.center))}px`;
  }, [tip]);

  const showTip = (event: Event) => {
    const bar = barTarget(event, '.wave__bar');
    if (!bar) return;
    const box = bar.getBoundingClientRect();
    setTip({ text: bar.dataset.tip!, center: box.left + box.width / 2 - figure.current!.getBoundingClientRect().left });
  };

  const summary = `Shows per month from ${years[0]!.year} to ${years[years.length - 1]!.year}. Busiest month: ${peak.label}, ${peak.count} shows.`;
  return (
    <figure class="wave" ref={figure}>
      <div class="wave__plot" role="img" aria-label={summary} onPointerOver={showTip} onPointerLeave={() => setTip(null)}>
        <WaveBars years={years} peak={peak.count} counts={counts} />
      </div>
      <nav class="wave__years" aria-label="Jump to year">
        {years.map(({ year, months }) => (
          <a key={year} href={`#y${year}`} style={`flex:${months.length}`}>
            {String(year).slice(2)}
          </a>
        ))}
      </nav>
      <figcaption>{`Every bar is a month. Busiest: ${peak.label}, ${peak.count} shows.`}</figcaption>
      <div class="wave__tip" ref={tipBox} hidden={tip === null}>
        {tip?.text}
      </div>
    </figure>
  );
});

/** Compressed like an audio meter: most months have 1-4 shows and the peak is 14, so a linear scale hides them. Tooltips give exact counts. */
const railLevel = (count: number, peak: number) => Math.sqrt(count / peak);

type RailYearState = 'current' | 'other';

interface RailYearProps {
  entry: YearCounts;
  peak: number;
  counts?: MonthCounts;
  state: RailYearState;
}

const RailYear = memo(function RailYear({ entry: { year, months, total }, peak, counts, state }: RailYearProps) {
  const countOf = (month: MonthCount) => (counts ? (counts.get(month.key) ?? 0) : month.count);
  const anyShown = months.some((month) => countOf(month) > 0);
  return (
    <div
      class="rail__year"
      data-rail={year}
      style={`flex:${months.length} 1 0`}
      aria-current={state === 'current' ? 'true' : undefined}
      data-empty={counts && total > 0 ? (anyShown ? 'no' : 'yes') : undefined}
    >
      {total > 0 ? (
        <a class="rail__label" href={`#y${year}`} aria-label={`${year}, ${plural(total, 'show')}`}>
          {year}
        </a>
      ) : (
        <span class="rail__label" aria-label={`${year}, no shows`}>
          {year}
        </span>
      )}
      <div class="rail__bars" aria-hidden="true">
        {months.toReversed().map((month) => {
          const count = countOf(month);
          const bar = {
            'data-month': month.key,
            'data-label': month.label,
            'data-tip': tipText(month.label, count),
            style: `--h:${railLevel(count, peak).toFixed(3)}`,
            'data-level': count ? 'some' : 'none',
          };
          return total > 0 ? (
            <a key={month.key} class="rail__bar" tabindex={-1} href={`#y${year}`} {...bar}></a>
          ) : (
            <span key={month.key} class="rail__bar" {...bar}></span>
          );
        })}
      </div>
    </div>
  );
});

export interface YearRailProps extends ChartProps {
  /** The year being read, from the timeline's `data-year`. */
  currentYear?: string;
}

interface RailTip {
  text: string;
  top: number;
}

/** The left rail: the same waveform stood on end, newest at the top so it lines up with the timeline. */
export function YearRail({ shows, counts, currentYear }: YearRailProps) {
  const { years, peak } = useMemo(() => showsByMonth(shows), [shows]);
  const rail = useRef<HTMLElement>(null);
  const [tip, setTip] = useState<RailTip | null>(null);

  const showTip = (event: Event) => {
    const bar = barTarget(event, '.rail__bar');
    if (!bar) return;
    const box = bar.getBoundingClientRect();
    setTip({ text: bar.dataset.tip!, top: box.top + box.height / 2 - rail.current!.getBoundingClientRect().top });
  };

  return (
    <nav
      class="rail"
      ref={rail}
      aria-label="Jump to year, with shows per month"
      data-peak={peak.count}
      onPointerOver={showTip}
      onPointerLeave={() => setTip(null)}
    >
      {years.toReversed().map((entry) => (
        <RailYear
          key={entry.year}
          entry={entry}
          peak={peak.count}
          counts={counts}
          state={String(entry.year) === currentYear ? 'current' : 'other'}
        />
      ))}
      <div class="rail__tip" hidden={tip === null} style={tip ? `top:${tip.top}px` : undefined}>
        {tip?.text}
      </div>
    </nav>
  );
}

const POSTER_INKS: [string, string][] = [
  ['#ff2f92', '#27e3f0'],
  ['#a06bff', '#ff2f92'],
  ['#27e3f0', '#a06bff'],
  ['#ffb627', '#ff2f92'],
  ['#9dff5c', '#27e3f0'],
];

/** Wraps a name on word boundaries into lines of about `limit` characters. */
function wrapName(name: string, limit: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of name.split(/\s+/)) {
    if (line && line.length + word.length + 1 > limit) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** A type-only poster built from the bill, for concerts with no real one. */
export function GeneratedPoster({ show }: { show: Show }) {
  const random = seededRandom(hashSeed(show.id));
  const [inkA, inkB] = POSTER_INKS[Math.floor(random() * POSTER_INKS.length)]!;
  const names = show.headliners.length ? show.headliners.map((h) => h.label).slice(0, 4) : [show.title];
  const crowded = names.length > 2;
  const lines = names.flatMap((name) => wrapName(name, crowded ? 16 : 12));
  const bars = envelope(40, random);
  const support = show.supports.slice(0, 4).map((s) => s.label).join(' · ');
  return (
    <div
      class="gposter"
      style={`--a:${inkA};--b:${inkB}`}
      role="img"
      aria-label={`Generated poster for ${show.title}, ${shortDate(show.date)} ${show.year}`}
    >
      <p class="gposter__date">
        {`${dateLabel(show)} `}
        <b>{show.year}</b>
      </p>
      <p class="gposter__names">
        {lines.map((line, i) => (
          <span key={i} style={`font-size:${Math.min(crowded ? 11 : 19, 150 / Math.max(line.length, 4)).toFixed(1)}cqw`}>
            {line}
          </span>
        ))}
      </p>
      <svg class="gposter__wave" viewBox="0 0 200 50" preserveAspectRatio="none" aria-hidden="true">
        {bars.map((level, i) => {
          const h = Math.round(level * 40);
          return <rect key={i} x={i * 5 + 1} y={25 - h / 2} width="3" height={h} rx="1.5" />;
        })}
      </svg>
      {support ? <p class="gposter__support">{support}</p> : null}
      <p class="gposter__venue">{show.venue.name}</p>
    </div>
  );
}
