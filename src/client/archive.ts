// Browser code for dist/concert-history.html. src/build.ts bundles it inline next to the JSON payload.
import { SUPPORTED_STATUSES, type ArtistName, type ArtistRole, type PagePayload, type RenderedConcert } from '../types';

function $<T extends Element = HTMLElement>(selector: string): T {
  const el = document.querySelector<T>(selector);
  if (!el) throw new Error(`Missing element: ${selector}`);
  return el;
}

const { events, images } = JSON.parse($('#archive-data').textContent!) as PagePayload;

const ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ENTITIES[c]!);
const supported = (r: RenderedConcert) => SUPPORTED_STATUSES.includes(r.status);
const artistButton = (a: ArtistName) => `<button class="artist" data-artist="${esc(a.key)}">${esc(a.label)}</button>`;

function names(r: RenderedConcert, role: ArtistRole = 'headliner') {
  const artists = role === 'support' ? r.supportArtists : r.headliners;
  const original = role === 'support' ? r.support : r.artist;
  if (!artists.length) return esc(original || 'Not found');
  let rendered = artists.map(artistButton).join(' <span aria-hidden="true">/</span> ');
  if (role === 'support') {
    const unknown = original.split(';').filter((x) => /further|not named/i.test(x));
    if (unknown.length) rendered += ' · ' + esc(unknown.join('; ').trim());
  }
  return rendered;
}

const badge = (r: RenderedConcert) => `<span class="status ${supported(r) ? 'good' : ''}">${esc(r.status)}</span>`;

function gallery(r: RenderedConcert) {
  if (!r.photos.length) return '';
  const thumbs = r.photos
    .slice(0, 2)
    .map(
      (p, i) =>
        `<button class="thumb" data-gallery="${r.id}" data-index="${i}" aria-label="Open photo ${i + 1} of ${r.photos.length}: ${esc(r.artist)}, ${esc(r.date)}">` +
        `<img loading="lazy" src="${images[p.id]}" alt="Concert photo, ${esc(r.artist)}, ${esc(r.date)}"></button>`,
    )
    .join('');
  const count = `${r.photos.length} ${r.photos.length === 1 ? 'photo' : 'photos'}`;
  return `<div class="gallery-strip">${thumbs}<span class="photo-count">${count}</span></div>`;
}

function evidence(r: RenderedConcert) {
  const links = r.sources
    .map(([label, url]) =>
      url ? `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(label)}</a>` : `<span>${esc(label)}</span>`,
    )
    .join(' · ');
  return (
    `<details><summary>Evidence & notes</summary>` +
    `<p>${esc(r.notes || 'Source record supports the event details.')}</p>` +
    `<div class="links">${links}</div><p>${esc(r.photoMatch)}</p></details>`
  );
}

// Table
const body = $<HTMLTableSectionElement>('#events');
body.innerHTML = events
  .toReversed()
  .map(
    (r) =>
      `<tr data-id="${r.id}" data-status="${supported(r) ? 'confirmed' : esc(r.status)}" data-year="${esc(r.date.slice(0, 4))}">` +
      `<td class="date">${esc(r.date)}</td>` +
      `<td><strong>${names(r)}</strong>${gallery(r)}${evidence(r)}</td>` +
      `<td class="support">${names(r, 'support')}</td>` +
      `<td>${esc(r.venue)}</td><td>${badge(r)}</td></tr>`,
  )
  .join('');

// Filters
const search = $<HTMLInputElement>('#search');
const status = $<HTMLSelectElement>('#status');
const year = $<HTMLSelectElement>('#year');
const withPhotos = $<HTMLInputElement>('#withphotos');
const rows = [...body.rows];

function filter() {
  const q = search.value.trim().toLowerCase();
  let shown = 0;
  for (const row of rows) {
    const r = events[Number(row.dataset.id)]!;
    row.hidden = !(
      (status.value === 'all' || row.dataset.status === status.value) &&
      (year.value === 'all' || row.dataset.year === year.value) &&
      (!withPhotos.checked || r.photos.length > 0) &&
      [r.artist, r.support, r.venue, r.date, r.notes].join(' ').toLowerCase().includes(q)
    );
    if (!row.hidden) shown++;
  }
  $('#visible').textContent = `${shown} shown`;
  document.querySelector('#empty')?.remove();
  if (!shown) {
    body.insertAdjacentHTML('beforeend', '<tr id="empty"><td colspan="5" class="empty">No shows match these filters.</td></tr>');
  }
}
for (const input of [search, status, year, withPhotos]) input.addEventListener('input', filter);
filter();

// Artist dialog
const artistDialog = $<HTMLDialogElement>('#artist-dialog');
const photoDialog = $<HTMLDialogElement>('#photo-dialog');
const DISPLAY_NAMES: Record<string, string> = { chromeo: 'Chromeo', 'lady lamb': 'Lady Lamb' };

function displayName(key: string, matches: RenderedConcert[]) {
  const first = matches[0]!;
  return DISPLAY_NAMES[key] ?? [...first.headliners, ...first.supportArtists].find((a) => a.key === key)!.label;
}

function openArtist(key: string) {
  const matches = events.toReversed().filter((r) => [...r.headliners, ...r.supportArtists].some((a) => a.key === key));
  $('#artist-title').textContent = displayName(key, matches);
  const confirmed = matches.filter(supported).length;
  $('#artist-meta').textContent =
    `${matches.length} ${matches.length === 1 ? 'appearance' : 'appearances'} in your records · ${confirmed} check-in/photo/attendee supported. ` +
    'Other records retain their booking, plan, or exclusion labels. Supporting listings do not prove you saw that set.';
  $('#artist-events').innerHTML = matches
    .map((r) => {
      const role = r.headliners.some((a) => a.key === key) ? 'Headliner / co-bill' : 'Supporting / other billed act';
      return (
        `<article class="appearance"><div class="role">${role} ${badge(r)}</div>` +
        `<h3>${esc(r.date)} · ${esc(r.venue)}</h3>` +
        `<p>${esc(r.artist)}${r.support ? ' · With ' + esc(r.support) : ''}</p>` +
        `${gallery(r)}${evidence(r)}</article>`
      );
    })
    .join('');
  artistDialog.showModal();
}

// Photo dialog
const previous = $<HTMLButtonElement>('#previous');
const next = $<HTMLButtonElement>('#next');
let activeEvent: RenderedConcert | null = null;
let photoIndex = 0;

function showPhoto() {
  if (!activeEvent) return;
  const p = activeEvent.photos[photoIndex]!;
  const img = $<HTMLImageElement>('#fullphoto');
  img.src = images[p.id]!;
  img.alt = `Concert image from ${activeEvent.artist} at ${activeEvent.venue}, ${activeEvent.date}`;
  const service = p.url && new URL(p.url).hostname.endsWith('icloud.com') ? 'iCloud Photos' : 'Google Photos';
  const link = p.url ? ` · <a href="${esc(p.url)}" target="_blank" rel="noopener">Open in ${service} ↗</a>` : '';
  $('#photo-caption').innerHTML =
    `${esc(activeEvent.artist)} · ${esc(activeEvent.venue)} · ${esc(activeEvent.date)}<br>` +
    `${esc(p.kind)} · ${esc(p.source)} · Captured ${esc(p.captured.slice(0, 19).replace('T', ' '))}${link}`;
  $('#photo-position').textContent = `${photoIndex + 1} / ${activeEvent.photos.length}`;
  previous.disabled = photoIndex === 0;
  next.disabled = photoIndex === activeEvent.photos.length - 1;
}

function step(delta: -1 | 1) {
  if (!activeEvent) return;
  const target = photoIndex + delta;
  if (target < 0 || target >= activeEvent.photos.length) return;
  photoIndex = target;
  showPhoto();
}

document.addEventListener('click', (e) => {
  const target = e.target as Element;
  const artist = target.closest<HTMLElement>('[data-artist]');
  if (artist) {
    openArtist(artist.dataset.artist!);
    return;
  }
  const thumb = target.closest<HTMLElement>('[data-gallery]');
  if (thumb) {
    activeEvent = events[Number(thumb.dataset.gallery)]!;
    photoIndex = Number(thumb.dataset.index);
    showPhoto();
    photoDialog.showModal();
  }
});

for (const dialog of [artistDialog, photoDialog]) {
  dialog.querySelector<HTMLButtonElement>('.close')!.onclick = () => dialog.close();
  // Close on backdrop clicks: the click lands on the dialog itself but outside its box.
  dialog.addEventListener('click', (e) => {
    if (e.target !== dialog) return;
    const b = dialog.getBoundingClientRect();
    if (e.clientX < b.left || e.clientX > b.right || e.clientY < b.top || e.clientY > b.bottom) dialog.close();
  });
}

previous.onclick = () => step(-1);
next.onclick = () => step(1);
photoDialog.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') step(-1);
  if (e.key === 'ArrowRight') step(1);
});
