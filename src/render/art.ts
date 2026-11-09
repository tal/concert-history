// Generated visuals: the background waveform tile, the hero chart and fallback posters.
import type { Show } from '../model';
import { dateLabel, esc, shortDate } from './components';

export function hashSeed(text: string): number {
  let h = 1779033703 ^ text.length;
  for (let i = 0; i < text.length; i++) {
    h = Math.imul(h ^ text.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

export function seededRandom(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Bar heights (0..1) shaped like an audio envelope rather than plain noise. */
function envelope(count: number, random: () => number): number[] {
  const p1 = random() * Math.PI * 2;
  const p2 = random() * Math.PI * 2;
  return Array.from({ length: count }, (_, i) => {
    const t = (i / count) * Math.PI * 2;
    const swell = 0.5 + 0.3 * Math.sin(t * 2 + p1) + 0.2 * Math.sin(t * 7 + p2);
    return Math.min(1, Math.max(0.05, swell * (0.35 + random() * 0.75)));
  });
}

/** The repeating page background. */
export function waveformTile(): string {
  const random = seededRandom(hashSeed('concert-history-waveform'));
  const width = 1440;
  const rowHeight = 150;
  const rows = 3;
  const step = 8;
  const bars: string[] = [];
  for (let row = 0; row < rows; row++) {
    const mid = rowHeight * row + rowHeight / 2;
    envelope(width / step, random).forEach((level, i) => {
      const h = Math.round(level * (rowHeight * 0.62));
      bars.push(`<rect x="${i * step + 2}" y="${mid - h / 2}" width="3" height="${h}" rx="1.5"/>`);
    });
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${rowHeight * rows}" ` +
    `viewBox="0 0 ${width} ${rowHeight * rows}" fill="#b9a4ff" fill-opacity=".055">${bars.join('')}</svg>\n`
  );
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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

const tipText = (month: MonthCount) => `${month.label}: ${month.count} ${month.count === 1 ? 'show' : 'shows'}`;

/** Hero chart: one mirrored bar per month, so the archive reads as a single long waveform. */
export function historyWaveform(shows: Show[]): string {
  const { years, peak } = showsByMonth(shows);
  const bars = years.flatMap(({ year, months }) =>
    months.map(
      (month) =>
        `<a class="wave__bar" tabindex="-1" href="#y${year}" data-tip="${tipText(month)}" style="--h:${(month.count / peak.count).toFixed(3)}" ` +
        `data-level="${month.count ? 'some' : 'none'}"></a>`,
    ),
  );
  const labels = years.map(({ year, months }) => `<a href="#y${year}" style="flex:${months.length}">${String(year).slice(2)}</a>`);
  const summary = `Shows per month from ${years[0]!.year} to ${years[years.length - 1]!.year}. Busiest month: ${peak.label}, ${peak.count} shows.`;
  return (
    `<figure class="wave"><div class="wave__plot" role="img" aria-label="${esc(summary)}">${bars.join('')}</div>` +
    `<nav class="wave__years" aria-label="Jump to year">${labels.join('')}</nav>` +
    `<figcaption>Every bar is a month. Busiest: ${esc(peak.label)}, ${peak.count} shows.</figcaption>` +
    `<div class="wave__tip" hidden></div></figure>`
  );
}

/** Compressed like an audio meter: most months have 1-4 shows and the peak is 14, so a linear scale hides them. Tooltips give exact counts. */
const railLevel = (count: number, peak: number) => Math.sqrt(count / peak);

/** The left rail: the same waveform stood on end, newest at the top so it lines up with the timeline. */
export function yearRail(shows: Show[]): string {
  const { years, peak } = showsByMonth(shows);
  const rows = years.toReversed().map(({ year, months, total }) => {
    const hasShows = total > 0;
    const bars = months
      .toReversed()
      .map((month) => {
        const data = `data-month="${month.key}" data-label="${month.label}" data-tip="${tipText(month)}" style="--h:${railLevel(month.count, peak.count).toFixed(3)}" data-level="${month.count ? 'some' : 'none'}"`;
        return hasShows ? `<a class="rail__bar" tabindex="-1" href="#y${year}" ${data}></a>` : `<span class="rail__bar" ${data}></span>`;
      })
      .join('');
    const label = hasShows
      ? `<a class="rail__label" href="#y${year}" aria-label="${year}, ${total} ${total === 1 ? 'show' : 'shows'}">${year}</a>`
      : `<span class="rail__label" aria-label="${year}, no shows">${year}</span>`;
    return `<div class="rail__year" data-rail="${year}" style="flex:${months.length} 1 0">${label}<div class="rail__bars" aria-hidden="true">${bars}</div></div>`;
  });
  return `<nav class="rail" aria-label="Jump to year, with shows per month" data-peak="${peak.count}">${rows.join('')}<div class="rail__tip" hidden></div></nav>`;
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
export function generatedPoster(show: Show): string {
  const random = seededRandom(hashSeed(show.id));
  const [inkA, inkB] = POSTER_INKS[Math.floor(random() * POSTER_INKS.length)]!;
  const names = show.headliners.length ? show.headliners.map((h) => h.label).slice(0, 4) : [show.title];
  const crowded = names.length > 2;
  const headline = names
    .flatMap((name) => wrapName(name, crowded ? 16 : 12))
    .map((line) => {
      const size = Math.min(crowded ? 11 : 19, 150 / Math.max(line.length, 4));
      return `<span style="font-size:${size.toFixed(1)}cqw">${esc(line)}</span>`;
    })
    .join('');
  const bars = envelope(40, random)
    .map((level, i) => {
      const h = Math.round(level * 40);
      return `<rect x="${i * 5 + 1}" y="${25 - h / 2}" width="3" height="${h}" rx="1.5"/>`;
    })
    .join('');
  const support = show.supports.slice(0, 4).map((s) => esc(s.label)).join(' · ');
  const year = show.year;
  return (
    `<div class="gposter" style="--a:${inkA};--b:${inkB}" role="img" aria-label="Generated poster for ${esc(show.title)}, ${esc(shortDate(show.date))} ${year}">` +
    `<p class="gposter__date">${esc(dateLabel(show))} <b>${year}</b></p>` +
    `<p class="gposter__names">${headline}</p>` +
    `<svg class="gposter__wave" viewBox="0 0 200 50" preserveAspectRatio="none" aria-hidden="true">${bars}</svg>` +
    (support ? `<p class="gposter__support">${support}</p>` : '') +
    `<p class="gposter__venue">${esc(show.venue.name)}</p></div>`
  );
}
