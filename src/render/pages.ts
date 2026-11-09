// One function per page type. Everything renders from the linked model in ../model.ts.
import { normalizeName, STATUS_LABELS, type ArtistEntry, type Show, type Site, type VenueEntry } from '../model';
import type { FestivalDay, Setlist, Source, VenueImage } from '../types';
import { generatedPoster, hashSeed, historyWaveform, yearRail } from './art';
import {
  appearanceRole,
  artistHref,
  assetName,
  dayHeading,
  esc,
  evidencePill,
  longDate,
  mapBlock,
  photoSrc,
  plural,
  posterSrc,
  timeline,
  typePill,
  venueHref,
  venuePoint,
  venueWhere,
  type MapPoint,
} from './components';
import { ctxAt, page, type Ctx } from './layout';

const EXTERNAL = /^[a-z][a-z\d+.-]*:/i;
const out = (href: string, label: string, cls = '') =>
  `<a${cls ? ` class="${cls}"` : ''} href="${esc(href)}" rel="noopener nofollow" target="_blank">${esc(label)}</a>`;

/** External links stay as they are. Local research files aren't deployed, so those become plain labels. */
export function publicSourceUrl(url: string | undefined): string | null {
  if (!url) return null;
  if (EXTERNAL.test(url)) return url;
  return url === 'dist/photo-catalog.json' ? 'photo-catalog.json' : null;
}

/* ---------- Home ---------- */

export function homePage(site: Site): string {
  const ctx = ctxAt(0);
  const { shows } = site;
  const confirmed = shows.filter((s) => s.evidence === 'confirmed').length;
  const years = [...new Set(shows.map((s) => s.year))];
  const stats: [number, string][] = [
    [shows.length, 'shows logged'],
    [confirmed, 'confirmed'],
    [site.artists.length, 'artists billed'],
    [site.venues.length, 'venues'],
  ];
  const chip = (value: string, label: string, pressed: 'on' | 'off' = 'off') =>
    `<button data-value="${value}" aria-pressed="${pressed === 'on' ? 'true' : 'false'}">${label}</button>`;
  const body = `
<section class="hero">
  <p class="eyebrow">Live music, ${years[years.length - 1]} to ${years[0]}</p>
  <h1 class="neon neon--xl">Tal’s concert history</h1>
  <dl class="stats">${stats.map(([n, label]) => `<div><dd class="neon">${n}</dd><dt>${label}</dt></div>`).join('')}</dl>
  ${historyWaveform(shows)}
</section>
<div class="filters" data-timeline-filters>
  <label class="search"><span class="vh">Search shows</span><input id="q" type="search" placeholder="Artist, venue or date" autocomplete="off"></label>
  <div class="chips" role="group" aria-label="Show type" data-group="type">${chip('all', 'All', 'on')}${chip('gig', 'Gigs')}${chip('festival', 'Festivals')}${chip('showcase', 'Showcases')}${chip('dj', 'DJ')}</div>
  <div class="chips" role="group" aria-label="Evidence" data-group="evidence">${chip('all', 'All', 'on')}${chip('confirmed', 'Confirmed')}${chip('unconfirmed', 'Unconfirmed')}</div>
  <div class="chips"><button data-photos-toggle aria-pressed="false">With photos</button></div>
  <span class="count" id="visible" aria-live="polite">${plural(shows.length, 'show')}</span>
</div>
<div class="layout">
  ${yearRail(shows)}
  <div id="timeline">${timeline(shows, ctx, { anchors: 'with_anchors', notes: 'with_notes' })}<p class="empty" id="empty" hidden>No shows match that.</p></div>
</div>`;
  return page({
    title: 'Tal’s Concert History',
    description: `${shows.length} live shows from ${years[years.length - 1]} to ${years[0]}, with photos, setlists, venues and artists.`,
    ctx,
    nav: 'timeline',
    map: 'no_map',
    body,
  });
}

/* ---------- Shared bits for artist and venue pages ---------- */

function monogram(name: string): string {
  const letters = name
    .replace(/^the /i, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0] ?? '')
    .join('')
    .toUpperCase();
  return `<span class="mono" style="--h:${hashSeed(name) % 360}" aria-hidden="true">${esc(letters)}</span>`;
}

function photoFallback(shows: Show[]) {
  for (const show of shows) if (show.concert.photos[0]) return { photo: show.concert.photos[0], show };
  return null;
}

function listControls(search: string, total: number, noun: string): string {
  return `<div class="filters filters--list">
  <label class="search"><span class="vh">${esc(search)}</span><input data-list-search type="search" placeholder="${esc(search)}" autocomplete="off"></label>
  <div class="chips" role="group" aria-label="Sort" data-sort-group><button data-sort="seen" aria-pressed="true">Most seen</button><button data-sort="name" aria-pressed="false">A–Z</button></div>
  <span class="count" data-list-count aria-live="polite" data-noun="${esc(noun)}">${plural(total, noun)}</span>
</div>`;
}

/* ---------- Artists ---------- */

const artistImage = (artist: ArtistEntry, ctx: Ctx, loading: 'lazy' | 'eager') => {
  if (artist.image_url) {
    return `<img src="${esc(artist.image_url)}" alt="" loading="${loading}" decoding="async" referrerpolicy="no-referrer">`;
  }
  const own = photoFallback(artist.appearances.filter((a) => a.role === 'headliner').map((a) => a.show));
  if (own) return `<img src="${photoSrc(own.photo.asset, ctx)}" alt="" loading="${loading}" decoding="async">`;
  return monogram(artist.name);
};

const seenSummary = (artist: ArtistEntry) => {
  const headlined = artist.appearances.filter((a) => a.role === 'headliner').length;
  const billed = artist.appearances.length - headlined;
  return [headlined ? `${headlined} as headliner` : '', billed ? `${billed} billed` : ''].filter(Boolean).join(', ');
};

export function artistsIndex(site: Site): string {
  const ctx = ctxAt(1);
  const sorted = site.artists.toSorted(
    (a, b) => b.appearances.length - a.appearances.length || a.name.localeCompare(b.name),
  );
  const cards = sorted
    .map(
      (artist) =>
        `<li data-search="${esc(`${artist.name} ${artist.aliases.join(' ')}`.toLowerCase())}" data-seen="${artist.appearances.length}" data-name="${esc(normalizeName(artist.name))}">` +
        `<a class="acard" href="${artistHref(artist, ctx)}"><span class="acard__art">${artistImage(artist, ctx, 'lazy')}</span>` +
        `<strong>${esc(artist.name)}</strong><span>${plural(artist.appearances.length, 'show')}</span></a></li>`,
    )
    .join('');
  const body = `
<header class="head"><h1 class="neon neon--lg">Artists</h1><p>Everyone on a bill Tal has a record of. A billing doesn’t prove the set was seen, so those are marked on each artist’s page.</p></header>
${listControls('Find an artist', sorted.length, 'artist')}
<ul class="grid grid--artists" data-list>${cards}</ul>`;
  return page({
    title: 'Artists · Tal’s Concert History',
    description: `${sorted.length} artists from Tal’s concert history.`,
    ctx,
    nav: 'artists',
    map: 'no_map',
    body,
  });
}

function pointsFor(shows: Show[], ctx: Ctx): MapPoint[] {
  const counts = new Map<VenueEntry, number>();
  for (const show of shows) counts.set(show.venue, (counts.get(show.venue) ?? 0) + 1);
  return [...counts.entries()].flatMap(([venue, count]) => venuePoint(venue, ctx, count) ?? []);
}

export function artistPage(site: Site, artist: ArtistEntry): string {
  const ctx = ctxAt(2);
  const shows = artist.appearances.map((a) => a.show);
  const first = shows[shows.length - 1]!;
  const last = shows[0]!;
  const links = [
    artist.spotify_id ? out(`https://open.spotify.com/artist/${artist.spotify_id}`, 'Open in Spotify ↗', 'btn btn--spotify') : '',
    artist.wikipedia ? out(artist.wikipedia, 'Wikipedia ↗', 'btn') : '',
  ].join('');
  const span = first === last ? longDate(first.date) : `${longDate(first.date)} to ${longDate(last.date)}`;
  const credit = artist.image_url ? '<p class="credit">Image via Spotify</p>' : '';
  const about = artist.description
    ? `<p class="lede">${esc(artist.description)}</p>${artist.wikipedia ? `<p class="credit">From ${out(artist.wikipedia, 'Wikipedia')}, CC BY-SA 4.0</p>` : ''}`
    : '';
  const points = pointsFor(shows, ctx);
  const body = `
<p class="crumb"><a data-back href="../">← Artists</a></p>
<header class="profile"><div class="profile__art">${artistImage(artist, ctx, 'eager')}${credit}</div>
<div class="profile__text"><h1 class="neon neon--lg">${esc(artist.name)}</h1>
<p class="facts">${plural(shows.length, 'show')} · ${esc(seenSummary(artist))}<br>${esc(span)}</p>${about}<div class="btns">${links}</div></div></header>
${points.length ? `<section class="block"><h2 class="block__title">Where Tal has seen them</h2>${mapBlock(points, `Venues where ${artist.name} played`)}</section>` : ''}
<section class="block"><h2 class="block__title">Shows</h2>${timeline(shows, ctx, { anchors: 'no_anchors', notes: 'no_notes', roleOf: appearanceRole(artist.appearances) })}</section>`;
  return page({
    title: `${artist.name} · Tal’s Concert History`,
    description: `${artist.name}: ${plural(shows.length, 'show')} in Tal’s concert history.`,
    ctx,
    nav: 'artists',
    map: points.length ? 'with_map' : 'no_map',
    body,
  });
}

/* ---------- Venues ---------- */

const venueImageSrc = (image: VenueImage, ctx: Ctx) =>
  image.asset ? `${ctx.root}assets/venues/${assetName(image.asset)}` : (image.url ?? '');

const hotlink = (image: VenueImage) => (image.asset ? '' : ' referrerpolicy="no-referrer"');

const VIEW_LABEL: Record<VenueImage['view'], string> = { exterior: 'Outside', interior: 'Inside' };

function venueCardArt(venue: VenueEntry, ctx: Ctx): string {
  const image = venue.images[0];
  if (image) return `<img src="${esc(venueImageSrc(image, ctx))}" alt="" loading="lazy" decoding="async"${hotlink(image)}>`;
  const own = photoFallback(venue.shows);
  if (own) return `<img src="${photoSrc(own.photo.asset, ctx)}" alt="" loading="lazy" decoding="async">`;
  return monogram(venue.name);
}

const closedTag = (venue: VenueEntry) =>
  venue.operating_status === 'closed' ? `<span class="pill pill--closed">Closed${venue.closed_year ? ` ${venue.closed_year}` : ''}</span>` : '';

export function venuesIndex(site: Site): string {
  const ctx = ctxAt(1);
  const sorted = site.venues.toSorted((a, b) => b.shows.length - a.shows.length || a.name.localeCompare(b.name));
  const points = sorted.flatMap((venue) => venuePoint(venue, ctx, venue.shows.length) ?? []);
  const cards = sorted
    .map(
      (venue) =>
        `<li data-search="${esc(`${venue.name} ${venue.city ?? ''} ${venue.neighborhood ?? ''}`.toLowerCase())}" data-seen="${venue.shows.length}" data-name="${esc(normalizeName(venue.name))}">` +
        `<a class="vcard" href="${venueHref(venue, ctx)}"><span class="vcard__art">${venueCardArt(venue, ctx)}</span>` +
        `<span class="vcard__text"><strong>${esc(venue.name)}</strong><span>${esc(venueWhere(venue))}</span><span>${plural(venue.shows.length, 'show')} ${closedTag(venue)}</span></span></a></li>`,
    )
    .join('');
  const body = `
<header class="head"><h1 class="neon neon--lg">Venues</h1><p>Every room, park and boat that made it into the archive.</p></header>
${mapBlock(points, 'Map of every venue', 'map--tall')}
${listControls('Find a venue', sorted.length, 'venue')}
<ul class="grid grid--venues" data-list>${cards}</ul>`;
  return page({
    title: 'Venues · Tal’s Concert History',
    description: `${sorted.length} venues from Tal’s concert history.`,
    ctx,
    nav: 'venues',
    map: 'with_map',
    body,
  });
}

export function venuePage(venue: VenueEntry): string {
  const ctx = ctxAt(2);
  const own = venue.shows.flatMap((show) => show.concert.photos.slice(0, 1).map((photo) => ({ photo, show }))).slice(0, 3);
  const gallery = venue.images.length
    ? venue.images
        .map(
          (image) =>
            `<figure><a href="${esc(venueImageSrc(image, ctx))}" data-lightbox="venue" data-caption="${esc(`${venue.name}, ${VIEW_LABEL[image.view].toLowerCase()}. ${image.credit}${image.license ? `, ${image.license}` : ''}`)}">` +
            `<img src="${esc(venueImageSrc(image, ctx))}" alt="${esc(`${venue.name}, ${VIEW_LABEL[image.view].toLowerCase()}`)}" decoding="async"${hotlink(image)}></a>` +
            `<figcaption>${VIEW_LABEL[image.view]} · ${out(image.source_url, image.credit + (image.license ? `, ${image.license}` : ''))}</figcaption></figure>`,
        )
        .join('')
    : own
        .map(
          ({ photo, show }) =>
            `<figure><a href="${photoSrc(photo.asset, ctx)}" data-lightbox="venue" data-caption="${esc(`${show.title}, ${longDate(show.date)}`)}"><img src="${photoSrc(photo.asset, ctx)}" alt="${esc(`${show.title} at ${venue.name}`)}" decoding="async"></a>` +
            `<figcaption>Tal’s photo, ${esc(show.title)}</figcaption></figure>`,
        )
        .join('');
  const place = [venue.address, venue.neighborhood, venue.city, venue.region].filter(Boolean).join(', ');
  const links = [venue.website ? out(venue.website, 'Official site ↗', 'btn') : '', venue.wikipedia ? out(venue.wikipedia, 'Wikipedia ↗', 'btn') : ''].join('');
  const source = venue.description_source ? `<p class="credit">Source: ${out(venue.description_source.url, venue.description_source.label)}</p>` : '';
  const point = venuePoint(venue, ctx, venue.shows.length);
  const body = `
<p class="crumb"><a data-back href="../">← Venues</a></p>
<header class="head"><h1 class="neon neon--lg">${esc(venue.name)}</h1><p class="facts">${esc(place)} ${closedTag(venue)}<br>${plural(venue.shows.length, 'show')}</p></header>
${gallery ? `<div class="vgallery vgallery--${Math.min(venue.images.length || own.length, 3)}">${gallery}</div>` : ''}
<div class="vinfo"><div>${venue.description ? `<p class="lede">${esc(venue.description)}</p>${source}` : ''}<div class="btns">${links}</div></div>${point ? mapBlock([point], `Map of ${venue.name}`) : ''}</div>
<section class="block"><h2 class="block__title">Shows here</h2>${timeline(venue.shows, ctx, { anchors: 'no_anchors', notes: 'no_notes' })}</section>`;
  return page({
    title: `${venue.name} · Tal’s Concert History`,
    description: `${venue.name}: ${plural(venue.shows.length, 'show')} in Tal’s concert history.`,
    ctx,
    nav: 'venues',
    map: point ? 'with_map' : 'no_map',
    body,
  });
}

/* ---------- Concert ---------- */

function setlistCard(setlist: Setlist, site: Site, ctx: Ctx): string {
  const artist = site.artistByName.get(normalizeName(setlist.artist));
  const name = artist?.appearances.length ? `<a href="${artistHref(artist, ctx)}">${esc(setlist.artist)}</a>` : esc(setlist.artist);
  const songs = setlist.songs
    .map((song, i) => `${i === setlist.encore_start_index ? '<li class="encore">Encore</li>' : ''}<li>${esc(song)}</li>`)
    .join('');
  return (
    `<article class="setlist"><h3>${name}</h3>${setlist.tour ? `<p class="setlist__tour">${esc(setlist.tour)}</p>` : ''}` +
    `<ol>${songs}</ol><p class="credit">${out(setlist.url, 'setlist.fm')}</p></article>`
  );
}

function setlistsBlock(sets: Setlist[], site: Site, ctx: Ctx): string {
  const full = sets.filter((s) => s.songs.length);
  const empty = sets.filter((s) => !s.songs.length);
  const note = empty.length
    ? `<p class="credit">setlist.fm lists this event with no songs for ${empty.map((s) => out(s.url, s.artist)).join(', ')}.</p>`
    : '';
  if (!full.length && !note) return '';
  return `${full.length ? `<div class="setlists">${full.map((s) => setlistCard(s, site, ctx)).join('')}</div>` : ''}${note}`;
}

const ATTENDANCE_LABELS: Record<FestivalDay['attendance'], string> = {
  attended: 'Tal was here',
  not_attended: 'Not attended',
  unknown: 'Attendance unknown',
};

function festivalDays(show: Show, site: Site, ctx: Ctx): { html: string; placed: Set<Setlist> } {
  const festival = show.festival!;
  const placed = new Set<Setlist>();
  const html = festival.days
    .map((day) => {
      const names = new Set(day.lineup.map(normalizeName));
      const seen = new Set(festival.seen.filter((s) => s.date === day.date).map((s) => normalizeName(s.artist)));
      const maybe = new Set(festival.seen.filter((s) => !s.date && s.possible_dates?.includes(day.date)).map((s) => normalizeName(s.artist)));
      const sets = (show.concert.setlists ?? []).filter((s) => names.has(normalizeName(s.artist)));
      for (const set of sets) placed.add(set);
      const chips = day.lineup
        .map((name) => {
          const key = normalizeName(name);
          const artist = site.artistByName.get(key);
          const label = artist?.appearances.length ? `<a href="${artistHref(artist, ctx)}">${esc(name)}</a>` : esc(name);
          if (maybe.has(key)) return `<li class="is-maybe" title="Seen on one of the days they played">${label}</li>`;
          return `<li${seen.has(key) ? ' class="is-seen"' : ''}>${label}</li>`;
        })
        .join('');
      const inner =
        `<p class="fday__basis">${esc(day.attendance_basis)}</p>` +
        (chips ? `<ul class="lineup">${chips}</ul>` : '<p class="fday__basis">No lineup found for this day.</p>') +
        (day.lineup_status === 'partial' ? '<p class="credit">Partial lineup.</p>' : '') +
        (day.not_on_final_schedule?.length ? `<p class="credit">Announced, but not on the final schedule: ${esc(day.not_on_final_schedule.join(', '))}</p>` : '') +
        (day.lineup_source ? `<p class="credit">${out(day.lineup_source, 'Lineup source')}</p>` : '') +
        setlistsBlock(sets, site, ctx);
      const cancelled = day.event_status === 'cancelled' ? '<span class="pill pill--closed">Cancelled</span>' : '';
      const pill = `<span class="pill pill--day-${day.attendance}">${ATTENDANCE_LABELS[day.attendance]}</span>`;
      const heading = `<h3>${esc(dayHeading(day.date))}</h3>${cancelled || pill}`;
      if (day.attendance === 'not_attended' || day.event_status === 'cancelled') {
        return `<details class="fday fday--not_attended"><summary>${heading}</summary>${inner}</details>`;
      }
      return `<section class="fday fday--${day.attendance}"><header>${heading}</header>${inner}</section>`;
    })
    .join('');
  return { html, placed };
}

function posterBlock(show: Show, ctx: Ctx): string {
  const { poster } = show.concert;
  if (!poster) return `<figure class="poster">${generatedPoster(show)}<figcaption>Generated from the bill. No poster found.</figcaption></figure>`;
  const src = posterSrc(poster.asset, ctx);
  const host = new URL(poster.page_url).hostname.replace(/^www\./, '');
  const kinds = { show_poster: 'Show poster', tour_admat: 'Tour admat', festival_lineup: 'Festival lineup' };
  return (
    `<figure class="poster"><a href="${src}" data-lightbox="poster" data-caption="${esc(`${kinds[poster.kind]}, via ${host}`)}"><img src="${src}" alt="${esc(`Poster for ${show.title}`)}" decoding="async"></a>` +
    `<figcaption>${kinds[poster.kind]}, via ${out(poster.page_url, host)}</figcaption></figure>`
  );
}

/** `2025-09-24T20:42:53-04:00` becomes `September 24, 2025, 8:42 PM`; anything else passes through. */
function capturedLabel(captured: string): string {
  const match = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}):(\d{2})/.exec(captured);
  if (!match) return captured;
  const hour = Number(match[2]);
  return `${longDate(match[1]!)}, ${hour % 12 || 12}:${match[3]} ${hour < 12 ? 'AM' : 'PM'}`;
}

function photosBlock(show: Show, ctx: Ctx): string {
  const { photos } = show.concert;
  if (!photos.length) return '';
  const items = photos
    .map((photo) => {
      const src = photoSrc(photo.asset, ctx);
      const caption = `Tal’s ${photo.kind.toLowerCase()}, ${capturedLabel(photo.captured)}`;
      const source = photo.url ? ` data-source="${esc(photo.url)}"` : '';
      return `<a href="${src}" data-lightbox="photos" data-caption="${esc(caption)}"${source}><img loading="lazy" decoding="async" src="${src}" alt="${esc(`${show.title}, ${photo.captured}`)}"></a>`;
    })
    .join('');
  return `<section class="block"><h2 class="block__title">Tal’s photos <span>${photos.length}</span></h2><div class="photos">${items}</div></section>`;
}

const SOURCE_KINDS: Record<Source['type'], string> = {
  email: 'Email',
  calendar: 'Calendar',
  checkin: 'Check-in',
  research: 'Research',
  web: 'Web',
  photo_catalog: 'Photos',
  attendee: 'Tal',
};

function evidenceBlock(show: Show, ctx: Ctx): string {
  const { concert } = show;
  const sources = concert.sources
    .map((source) => {
      const url = publicSourceUrl(source.url);
      const href = url && !EXTERNAL.test(url) ? `${ctx.root}${url}` : url;
      const label = href ? out(href, source.label) : esc(source.label);
      const statement = source.statement ? `<blockquote>${esc(source.statement)} <cite>Confirmed ${esc(source.confirmed_on)}</cite></blockquote>` : '';
      return `<li><span class="kind">${SOURCE_KINDS[source.type]}</span><div>${label}${statement}</div></li>`;
    })
    .join('');
  const research = concert.web_research?.notes ? `<p><strong>Research notes.</strong> ${esc(concert.web_research.notes)}</p>` : '';
  const previous = concert.previous_status ? `<p>Previously classified as ${esc(concert.previous_status)}.</p>` : '';
  const photoNote = concert.photo_match ? `<p><strong>Photo match.</strong> ${esc(concert.photo_match)}</p>` : '';
  return `<section class="block"><h2 class="block__title">How this night is known</h2>
<div class="evidence"><p class="evidence__status">${evidencePill(show)} <span>${esc(concert.status)}</span></p>
${concert.notes ? `<p>${esc(concert.notes)}</p>` : ''}${previous}${photoNote}${research}<ul class="sources">${sources}</ul></div></section>`;
}

export function concertPage(site: Site, show: Show): string {
  const ctx = ctxAt(2);
  const where = [show.venue.neighborhood, show.venue.city, show.venue.region].filter(Boolean).join(', ');
  const headliners = show.headliners
    .map((h) => `<a href="${artistHref(h.artist, ctx)}">${esc(h.label)}</a>`)
    .join('<span aria-hidden="true"> / </span>');
  const supports = show.supports.length
    ? `<h2 class="block__title">On the bill</h2><ul class="lineup">${show.supports.map((s) => `<li><a href="${artistHref(s.artist, ctx)}">${esc(s.label)}</a></li>`).join('')}</ul><p class="credit">Billed acts aren’t proof each set was seen.</p>`
    : '';
  const days = show.festival ? festivalDays(show, site, ctx) : null;
  const rest = (show.concert.setlists ?? []).filter((s) => !days?.placed.has(s));
  const sets = setlistsBlock(rest, site, ctx);
  const dateLine = show.festival && show.festival.start_date !== show.festival.end_date
    ? `${longDate(show.festival.start_date)} to ${longDate(show.festival.end_date)}`
    : longDate(show.date);
  const titleIsBill = show.headliners.length > 0 && show.title === show.headliners.map((h) => h.label).join(' / ');
  const body = `
<p class="crumb"><a data-back href="${ctx.root || './'}#y${show.year}">← ${show.year}</a></p>
<header class="gig">
  ${posterBlock(show, ctx)}
  <div class="gig__text">
    <p class="gig__pills">${typePill(show.type)}${evidencePill(show)}</p>
    <p class="gig__date">${esc(dateLine)}</p>
    <h1 class="neon neon--lg">${titleIsBill ? headliners : esc(show.title)}</h1>
    ${headliners && !titleIsBill ? `<p class="gig__heads">${headliners}</p>` : ''}
    <p class="gig__venue"><a href="${venueHref(show.venue, ctx)}">${esc(show.venue.name)}</a>${where ? ` <span>${esc(where)}</span>` : ''}</p>
    ${show.festival ? '' : supports}
    ${!days && sets ? `<h2 class="block__title">Setlists</h2>${sets}` : ''}
  </div>
</header>
${days ? `<section class="block"><h2 class="block__title">Day by day</h2><div class="fdays">${days.html}</div>${show.festival!.lineup_note ? `<p class="credit">${esc(show.festival!.lineup_note)}</p>` : ''}${show.festival!.unplaced?.length ? `<p class="credit">Billed, day unknown: ${esc(show.festival!.unplaced.join(', '))}${show.festival!.unplaced_note ? `. ${esc(show.festival!.unplaced_note)}` : ''}</p>` : ''}</section>` : ''}
${days && sets ? `<section class="block"><h2 class="block__title">Other setlists</h2>${sets}</section>` : ''}
${photosBlock(show, ctx)}
${evidenceBlock(show, ctx)}`;
  return page({
    title: `${show.title}, ${longDate(show.date)} · Tal’s Concert History`,
    description: `${show.title} at ${show.venue.name}, ${longDate(show.date)}.`,
    ctx,
    nav: 'none',
    map: 'no_map',
    body,
  });
}

/* ---------- About ---------- */

export function aboutPage(site: Site): string {
  const ctx = ctxAt(1);
  const counts = (Object.keys(STATUS_LABELS) as (keyof typeof STATUS_LABELS)[]).flatMap((status) => {
    const n = site.shows.filter((s) => s.concert.status === status).length;
    return n ? [`<li><strong>${esc(status)}</strong> <span>${n}</span></li>`] : [];
  });
  const body = `
<header class="head"><h1 class="neon neon--lg">About this archive</h1></header>
<div class="prose">
<p>This is a reconstruction from receipts, check-ins, calendars and photos, researched through ${esc(site.data.researched_on)}. It doesn’t claim complete lifetime coverage.</p>
<h2>How to read it</h2>
<p><strong>Check-in confirmed</strong> means Swarm names the artist, or a venue and date visit matches a named event in another source. <strong>Photo corroborated</strong> means inspected concert imagery matches the date and venue. <strong>Attendee confirmed</strong> means Tal remembers attending, and its notes record any evidence that conflicts. Tickets and calendar events alone establish a booking or a plan, not attendance, so those shows are drawn hollow on the timeline.</p>
<p>Supporting acts are billed performers. A listing doesn’t establish that every set was seen. Festivals and multi-act showcases count as one event.</p>
<ul class="tally">${counts.join('')}</ul>
<h2>What was reviewed</h2>
<p>Gmail ticket receipts, transfers, sales, refunds and cancellations; Swarm’s music-venue history; personal, family and shared calendars; named concert albums and selected date and location matches in Apple Photos, Google Photos and iCloud. Some dates remain unmatched, and this wasn’t a review of every asset in those libraries. Generic music-venue visits and unknown festival sets remain unresolved.</p>
<h2>Pitfalls kept on the record</h2>
<p>Sold Strokes tickets; the Yeah Yeah Yeahs July 28 / July 30 swap; cancelled DIIV and Alex Winston shows; the DIIV wrong-day visit; Jungle’s October 2014 date and venue conflict; Flogging Molly’s 2012 receipt versus the actual check-in; and Sleigh Bells’ 2022 postponement.</p>
<p><a href="${ctx.root}concert-history.md">Plain Markdown list</a> · <a href="${ctx.root}concerts.json">JSON export</a></p>
</div>`;
  return page({
    title: 'About · Tal’s Concert History',
    description: 'How this concert archive was reconstructed and how to read its evidence.',
    ctx,
    nav: 'about',
    map: 'no_map',
    body,
  });
}
