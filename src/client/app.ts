// Runs on every page: timeline filters, list search and sort, the image lightbox and waveform tooltips.
export {};

const $$ = <T extends Element = HTMLElement>(selector: string, root: ParentNode = document) => [...root.querySelectorAll<T>(selector)];

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

function setPressed(buttons: HTMLElement[], active: HTMLElement) {
  for (const button of buttons) button.setAttribute('aria-pressed', button === active ? 'true' : 'false');
}

/* ---------- Timeline filters (home page) ---------- */

function initTimeline() {
  const bar = document.querySelector('[data-timeline-filters]');
  if (!bar) return;
  const search = document.querySelector<HTMLInputElement>('#q')!;
  const count = document.querySelector<HTMLElement>('#visible')!;
  const empty = document.querySelector<HTMLElement>('#empty')!;
  const rows = $$('.show');
  const years = $$('.yr');
  const rail = $$('[data-rail]');
  const railBars = $$('.rail__bar');
  const railPeak = Number(document.querySelector<HTMLElement>('.rail')?.dataset.peak ?? 1);
  const state: Record<string, string> = { type: 'all', evidence: 'all', photos: 'any' };

  function apply() {
    const query = search.value.trim().toLowerCase();
    let shown = 0;
    for (const row of rows) {
      const { type, evidence, photos, search: text } = row.dataset;
      const match =
        (state.type === 'all' || type === state.type) &&
        (state.evidence === 'all' || evidence === state.evidence) &&
        (state.photos === 'any' || photos === state.photos) &&
        (!query || text!.includes(query));
      row.hidden = !match;
      if (match) shown++;
    }
    for (const year of years) {
      const any = $$('.show', year).some((row) => !row.hidden);
      year.hidden = !any;
      const link = rail.find((a) => a.dataset.rail === year.dataset.year);
      if (link) link.dataset.empty = any ? 'no' : 'yes';
    }
    count.textContent = plural(shown, 'show');
    empty.hidden = shown > 0;
    drawRail();
  }

  /** Redraws the left sound graph from whatever the filters left visible, on a fixed scale so bars stay comparable. */
  function drawRail() {
    const perMonth = new Map<string, number>();
    for (const row of rows) {
      if (row.hidden) continue;
      const month = row.querySelector('time')!.dateTime.slice(0, 7);
      perMonth.set(month, (perMonth.get(month) ?? 0) + 1);
    }
    for (const bar of railBars) {
      const shows = perMonth.get(bar.dataset.month!) ?? 0;
      bar.style.setProperty('--h', String(Math.sqrt(shows / railPeak))); // Same compression as yearRail in art.ts.
      bar.dataset.level = shows ? 'some' : 'none';
      bar.dataset.tip = `${bar.dataset.label}: ${plural(shows, 'show')}`;
    }
  }

  const root = document.documentElement;
  const measureFilters = () => root.style.setProperty('--filters-h', `${(bar as HTMLElement).offsetHeight}px`);
  measureFilters();
  new ResizeObserver(measureFilters).observe(bar);

  search.addEventListener('input', apply);
  const photosToggle = document.querySelector<HTMLElement>('[data-photos-toggle]')!;
  photosToggle.addEventListener('click', () => {
    state.photos = state.photos === 'any' ? 'with' : 'any';
    photosToggle.setAttribute('aria-pressed', state.photos === 'with' ? 'true' : 'false');
    apply();
  });
  for (const group of $$('[data-group]', bar)) {
    const buttons = $$('button', group);
    for (const button of buttons) {
      button.addEventListener('click', () => {
        state[group.dataset.group!] = button.dataset.value!;
        setPressed(buttons, button);
        apply();
      });
    }
  }

  if (rail.length && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const year = (entry.target as HTMLElement).dataset.year;
          for (const link of rail) {
            if (link.dataset.rail === year) link.setAttribute('aria-current', 'true');
            else link.removeAttribute('aria-current');
          }
        }
      },
      { rootMargin: '-25% 0px -70% 0px' },
    );
    for (const year of years) observer.observe(year);
  }
}

/* ---------- Artist and venue indexes ---------- */

function initLists() {
  const list = document.querySelector<HTMLElement>('[data-list]');
  const search = document.querySelector<HTMLInputElement>('[data-list-search]');
  if (!list || !search) return;
  const items = $$<HTMLLIElement>(':scope > li', list);
  const count = document.querySelector<HTMLElement>('[data-list-count]')!;
  const noun = count.dataset.noun!;

  search.addEventListener('input', () => {
    const query = search.value.trim().toLowerCase();
    let shown = 0;
    for (const item of items) {
      item.hidden = Boolean(query) && !item.dataset.search!.includes(query);
      if (!item.hidden) shown++;
    }
    count.textContent = plural(shown, noun);
  });

  const buttons = $$('[data-sort-group] button');
  const byName = (a: HTMLElement, b: HTMLElement) => a.dataset.name!.localeCompare(b.dataset.name!);
  const sorters: Record<string, (a: HTMLElement, b: HTMLElement) => number> = {
    seen: (a, b) => Number(b.dataset.seen) - Number(a.dataset.seen) || byName(a, b),
    name: byName,
  };
  for (const button of buttons) {
    button.addEventListener('click', () => {
      setPressed(buttons, button);
      list.append(...items.toSorted(sorters[button.dataset.sort!]));
    });
  }
}

/* ---------- Lightbox ---------- */

function initLightbox() {
  const dialog = document.querySelector<HTMLDialogElement>('#lightbox');
  if (!dialog) return;
  const image = dialog.querySelector<HTMLImageElement>('#lb-img')!;
  const caption = dialog.querySelector<HTMLElement>('#lb-cap')!;
  const position = dialog.querySelector<HTMLElement>('#lb-pos')!;
  const previous = dialog.querySelector<HTMLButtonElement>('#lb-prev')!;
  const next = dialog.querySelector<HTMLButtonElement>('#lb-next')!;
  let group: HTMLAnchorElement[] = [];
  let index = 0;

  function show() {
    const link = group[index]!;
    image.src = link.href;
    image.alt = link.querySelector('img')?.alt ?? '';
    caption.textContent = link.dataset.caption ?? '';
    if (link.dataset.source) {
      const source = document.createElement('a');
      source.href = link.dataset.source;
      source.target = '_blank';
      source.rel = 'noopener nofollow';
      source.textContent = link.dataset.sourceLabel ?? 'Original';
      caption.append(' · ', source);
    }
    position.textContent = group.length > 1 ? `${index + 1} / ${group.length}` : '';
    previous.hidden = next.hidden = group.length < 2;
  }

  const step = (delta: number) => {
    index = (index + delta + group.length) % group.length;
    show();
  };

  document.addEventListener('click', (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey) return;
    const link = (event.target as Element).closest<HTMLAnchorElement>('a[data-lightbox]');
    if (!link) return;
    event.preventDefault();
    group = $$<HTMLAnchorElement>(`a[data-lightbox="${link.dataset.lightbox}"]`);
    index = group.indexOf(link);
    show();
    dialog.showModal();
  });
  previous.addEventListener('click', () => step(-1));
  next.addEventListener('click', () => step(1));
  dialog.querySelector('.lb__close')!.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') step(-1);
    if (event.key === 'ArrowRight') step(1);
  });
}

/* ---------- Waveform tooltip ---------- */

function initWaveform() {
  const figure = document.querySelector<HTMLElement>('.wave');
  if (!figure) return;
  const tip = figure.querySelector<HTMLElement>('.wave__tip')!;
  const plot = figure.querySelector<HTMLElement>('.wave__plot')!;
  plot.addEventListener('pointerover', (event) => {
    const bar = (event.target as Element).closest<HTMLElement>('.wave__bar');
    if (!bar) return;
    tip.textContent = bar.dataset.tip!;
    tip.hidden = false;
    const barBox = bar.getBoundingClientRect();
    const figureBox = figure.getBoundingClientRect();
    const half = tip.offsetWidth / 2;
    const center = barBox.left + barBox.width / 2 - figureBox.left;
    tip.style.left = `${Math.min(figureBox.width - half, Math.max(half, center))}px`;
  });
  plot.addEventListener('pointerleave', () => {
    tip.hidden = true;
  });
}

const plainClick = (event: MouseEvent) => !(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey);

/** Back links return to the exact spot on the list you came from, instead of reloading it at a fixed anchor. */
function initBackLinks() {
  document.addEventListener('click', (event) => {
    if (!plainClick(event) || !document.referrer) return;
    const link = (event.target as Element).closest<HTMLAnchorElement>('a[data-back]');
    if (!link) return;
    const from = new URL(document.referrer);
    // A page opened in a new tab has nothing to go back to, so it follows the link instead.
    if (from.origin === location.origin && from.pathname === link.pathname && history.length > 1) {
      event.preventDefault();
      history.back();
    }
  });
}

/** Only deliberate year jumps animate. Smooth scrolling in CSS would also animate every page load with a #year in the URL. */
function initYearJumps() {
  document.addEventListener('click', (event) => {
    if (!plainClick(event)) return;
    const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#y"]');
    const target = link && document.querySelector(link.hash);
    if (!link || !target) return;
    event.preventDefault();
    const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' });
    history.replaceState(null, '', link.hash);
  });
}

function initRailTip() {
  const rail = document.querySelector<HTMLElement>('.rail');
  if (!rail) return;
  const tip = rail.querySelector<HTMLElement>('.rail__tip')!;
  rail.addEventListener('pointerover', (event) => {
    const bar = (event.target as Element).closest<HTMLElement>('.rail__bar');
    if (!bar) return;
    tip.textContent = bar.dataset.tip!;
    tip.hidden = false;
    const barBox = bar.getBoundingClientRect();
    tip.style.top = `${barBox.top + barBox.height / 2 - rail.getBoundingClientRect().top}px`;
  });
  rail.addEventListener('pointerleave', () => {
    tip.hidden = true;
  });
}

initTimeline();
initLists();
initLightbox();
initWaveform();
initRailTip();
initBackLinks();
initYearJumps();
