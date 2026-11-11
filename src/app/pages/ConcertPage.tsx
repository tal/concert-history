/** @jsxImportSource preact */
// One concert: the bill, setlists, festival days, poster, photos and how the night is known.
import { Fragment } from 'preact';
import { Link } from 'wouter-preact';
import { normalizeName, type Show } from '../../model';
import type { DayAttendance, Festival, FestivalDay, PosterKind, Setlist, Source, SourceType } from '../../types';
import { GeneratedPoster } from '../components/Art';
import { BackLink } from '../components/BackLink';
import { GalleryLink, type LightboxItem } from '../components/Lightbox';
import { Out } from '../components/Out';
import { EvidencePill, TypePill } from '../components/Pills';
import { useHomeFilters, usePersistentState, useSite, useUrls } from '../context';
import { NO_FILTERS, yearMatches } from '../lib/filters';
import { dayHeading, EXTERNAL, longDate, setTimeLabel } from '../lib/format';
import { artistPath, venuePath } from '../lib/paths';
import { publicSourceUrl } from '../lib/sources';

/** Links a plain-text name to its artist page, when that artist has one. */
function ArtistName({ name }: { name: string }) {
  const site = useSite();
  const artist = site.artistByName.get(normalizeName(name));
  return artist?.appearances.length ? <Link href={artistPath(artist)}>{name}</Link> : <>{name}</>;
}

function SetlistCard({ setlist }: { setlist: Setlist }) {
  return (
    <article class="setlist">
      <h3>
        <ArtistName name={setlist.artist} />
      </h3>
      {setlist.tour ? <p class="setlist__tour">{setlist.tour}</p> : null}
      <ol>
        {setlist.songs.map((song, i) => (
          <Fragment key={i}>
            {i === setlist.encore_start_index ? <li class="encore">Encore</li> : null}
            <li>{song}</li>
          </Fragment>
        ))}
      </ol>
      <p class="credit">
        <Out href={setlist.url}>setlist.fm</Out>
      </p>
    </article>
  );
}

function SetlistsBlock({ sets }: { sets: Setlist[] }) {
  const full = sets.filter((s) => s.songs.length);
  const empty = sets.filter((s) => !s.songs.length);
  return (
    <>
      {full.length > 0 ? (
        <div class="setlists">
          {full.map((setlist, i) => (
            <SetlistCard key={i} setlist={setlist} />
          ))}
        </div>
      ) : null}
      {empty.length > 0 ? (
        <p class="credit">
          {'setlist.fm lists this event with no songs for '}
          {empty.map((setlist, i) => (
            <Fragment key={i}>
              {i > 0 ? ', ' : null}
              <Out href={setlist.url}>{setlist.artist}</Out>
            </Fragment>
          ))}
          {'.'}
        </p>
      ) : null}
    </>
  );
}

const ATTENDANCE_LABELS: Record<DayAttendance, string> = {
  attended: 'Tal was here',
  not_attended: 'Not attended',
  unknown: 'Attendance unknown',
};

function daySetlists(show: Show, day: FestivalDay): Setlist[] {
  const names = new Set(day.lineup.map(normalizeName));
  return (show.concert.setlists ?? []).filter((s) => names.has(normalizeName(s.artist)));
}

function FestivalDayBlock({ show, festival, day }: { show: Show; festival: Festival; day: FestivalDay }) {
  const seen = new Set(festival.seen.filter((s) => s.date === day.date).map((s) => normalizeName(s.artist)));
  const maybe = new Set(festival.seen.filter((s) => !s.date && s.possible_dates?.includes(day.date)).map((s) => normalizeName(s.artist)));
  const cancelled = day.event_status === 'cancelled';
  const sets = new Map((day.schedule ?? []).map((set) => [normalizeName(set.artist), set]));
  const setTime = (key: string) => {
    const set = sets.get(key);
    return set ? <span class="lineup__time">{setTimeLabel(set)}</span> : null;
  };
  const [expanded, setExpanded] = usePersistentState<'open' | 'closed'>(`concert:${show.id}:${day.date}`, 'closed');
  const heading = (
    <>
      <h3>{dayHeading(day.date)}</h3>
      {cancelled ? <span class="pill pill--closed">Cancelled</span> : <span class={`pill pill--day-${day.attendance}`}>{ATTENDANCE_LABELS[day.attendance]}</span>}
    </>
  );
  const inner = (
    <>
      <p class="fday__basis">{day.attendance_basis}</p>
      {day.lineup.length > 0 ? (
        <ul class="lineup">
          {day.lineup.map((name, i) => {
            const key = normalizeName(name);
            if (maybe.has(key)) {
              return (
                <li key={i} class="is-maybe" title="Seen on one of the days they played">
                  <ArtistName name={name} />
                  {setTime(key)}
                </li>
              );
            }
            return (
              <li key={i} class={seen.has(key) ? 'is-seen' : undefined}>
                <ArtistName name={name} />
                {setTime(key)}
              </li>
            );
          })}
        </ul>
      ) : (
        <p class="fday__basis">No lineup found for this day.</p>
      )}
      {day.lineup_status === 'partial' ? <p class="credit">Partial lineup.</p> : null}
      {day.not_on_final_schedule?.length ? <p class="credit">{`Announced, but not on the final schedule: ${day.not_on_final_schedule.join(', ')}`}</p> : null}
      {day.lineup_source ? (
        <p class="credit">
          <Out href={day.lineup_source}>Lineup source</Out>
        </p>
      ) : null}
      {day.schedule_source ? (
        <p class="credit">
          <Out href={day.schedule_source}>Set times source</Out>
        </p>
      ) : null}
      <SetlistsBlock sets={daySetlists(show, day)} />
    </>
  );
  if (day.attendance === 'not_attended' || cancelled) {
    return (
      <details class="fday fday--not_attended" open={expanded === 'open'} onToggle={(event) => setExpanded(event.currentTarget.open ? 'open' : 'closed')}>
        <summary>{heading}</summary>
        {inner}
      </details>
    );
  }
  return (
    <section class={`fday fday--${day.attendance}`}>
      <header>{heading}</header>
      {inner}
    </section>
  );
}

function FestivalDays({ show, festival }: { show: Show; festival: Festival }) {
  return (
    <section class="block">
      <h2 class="block__title">Day by day</h2>
      <div class="fdays">
        {festival.days.map((day) => (
          <FestivalDayBlock key={day.date} show={show} festival={festival} day={day} />
        ))}
      </div>
      {festival.lineup_note ? <p class="credit">{festival.lineup_note}</p> : null}
      {festival.unplaced?.length ? (
        <p class="credit">{`Billed, day unknown: ${festival.unplaced.join(', ')}${festival.unplaced_note ? `. ${festival.unplaced_note}` : ''}`}</p>
      ) : null}
    </section>
  );
}

const POSTER_KINDS: Record<PosterKind, string> = {
  show_poster: 'Show poster',
  tour_admat: 'Tour admat',
  festival_lineup: 'Festival lineup',
};

function PosterBlock({ show }: { show: Show }) {
  const urls = useUrls();
  const { poster } = show.concert;
  if (!poster) {
    return (
      <figure class="poster">
        <GeneratedPoster show={show} />
        <figcaption>Generated from the bill. No poster found.</figcaption>
      </figure>
    );
  }
  const src = urls.poster(poster.asset);
  const host = new URL(poster.page_url).hostname.replace(/^www\./, '');
  const kind = POSTER_KINDS[poster.kind];
  const alt = `Poster for ${show.title}`;
  const items: LightboxItem[] = [{ src, alt, caption: `${kind}, via ${host}` }];
  return (
    <figure class="poster">
      <GalleryLink items={items} index={0}>
        <img src={src} alt={alt} decoding="async" />
      </GalleryLink>
      <figcaption>
        {`${kind}, via `}
        <Out href={poster.page_url}>{host}</Out>
      </figcaption>
    </figure>
  );
}

/** `2025-09-24T20:42:53-04:00` becomes `September 24, 2025, 8:42 PM`; anything else passes through. */
function capturedLabel(captured: string): string {
  const match = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}):(\d{2})/.exec(captured);
  if (!match) return captured;
  const hour = Number(match[2]);
  return `${longDate(match[1]!)}, ${hour % 12 || 12}:${match[3]} ${hour < 12 ? 'AM' : 'PM'}`;
}

function PhotosBlock({ show }: { show: Show }) {
  const urls = useUrls();
  const { photos } = show.concert;
  if (!photos.length) return null;
  const items: LightboxItem[] = photos.map((photo) => ({
    src: urls.photo(photo.asset),
    alt: `${show.title}, ${photo.captured}`,
    caption: `Tal’s ${photo.kind.toLowerCase()}, ${capturedLabel(photo.captured)}`,
    source: photo.url || undefined,
  }));
  return (
    <section class="block">
      <h2 class="block__title">
        {'Tal’s photos '}
        <span>{photos.length}</span>
      </h2>
      <div class="photos">
        {items.map((item, i) => (
          <GalleryLink key={item.src} items={items} index={i}>
            <img loading="lazy" decoding="async" src={item.src} alt={item.alt} />
          </GalleryLink>
        ))}
      </div>
    </section>
  );
}

function CoverageBlock({ show }: { show: Show }) {
  const photos = show.concert.coverage_photos ?? [];
  if (!photos.length) return null;
  const items: LightboxItem[] = photos.map((photo) => ({
    src: photo.image_url,
    alt: photo.caption,
    caption: `${photo.caption} · ${longDate(photo.concert_date)} · Photo: ${photo.credit} / ${photo.publication}`,
    source: photo.page_url,
    sourceLabel: 'Read coverage',
  }));
  return (
    <section class="block">
      <h2 class="block__title">
        {'Coverage photos '}
        <span>{photos.length}</span>
      </h2>
      <p class="credit">From published reports and official galleries of this show. Photos belong to the credited photographers.</p>
      <div class="photos photos--coverage">
        {photos.map((photo, i) => (
          <figure key={photo.image_url}>
            <GalleryLink items={items} index={i}>
              <img loading="lazy" decoding="async" src={photo.image_url} alt={photo.caption} referrerpolicy="no-referrer" />
            </GalleryLink>
            <figcaption>
              <span class="coverage-label">Coverage</span>
              {` ${photo.credit} · `}
              <Out href={photo.page_url}>{photo.publication}</Out>
              <span class="coverage-caption">{`${photo.caption} · ${longDate(photo.concert_date)}`}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

const SOURCE_KINDS: Record<SourceType, string> = {
  email: 'Email',
  calendar: 'Calendar',
  checkin: 'Check-in',
  research: 'Research',
  web: 'Web',
  photo_catalog: 'Photos',
  attendee: 'Tal',
};

function SourceItem({ source }: { source: Source }) {
  const urls = useUrls();
  const url = publicSourceUrl(source.url);
  const href = url && !EXTERNAL.test(url) ? urls.asset(url) : url;
  return (
    <li>
      <span class="kind">{SOURCE_KINDS[source.type]}</span>
      <div>
        {href ? <Out href={href}>{source.label}</Out> : source.label}
        {source.statement ? (
          <blockquote>
            {`${source.statement} `}
            <cite>{`Confirmed ${source.confirmed_on ?? ''}`}</cite>
          </blockquote>
        ) : null}
      </div>
    </li>
  );
}

function EvidenceBlock({ show }: { show: Show }) {
  const { concert } = show;
  return (
    <section class="block">
      <h2 class="block__title">How this night is known</h2>
      <div class="evidence">
        <p class="evidence__status">
          <EvidencePill show={show} />
          {' '}
          <span>{concert.status}</span>
        </p>
        {concert.notes ? <p>{concert.notes}</p> : null}
        {concert.previous_status ? <p>{`Previously classified as ${concert.previous_status}.`}</p> : null}
        {concert.photo_match ? (
          <p>
            <strong>Photo match.</strong>
            {` ${concert.photo_match}`}
          </p>
        ) : null}
        {concert.web_research?.notes ? (
          <p>
            <strong>Research notes.</strong>
            {` ${concert.web_research.notes}`}
          </p>
        ) : null}
        <ul class="sources">
          {concert.sources.map((source, i) => (
            <SourceItem key={i} source={source} />
          ))}
        </ul>
      </div>
    </section>
  );
}

function Headliners({ show }: { show: Show }) {
  return (
    <>
      {show.headliners.map((headliner, i) => (
        <Fragment key={i}>
          {i > 0 ? <span aria-hidden="true"> / </span> : null}
          <Link href={artistPath(headliner.artist)}>{headliner.label}</Link>
        </Fragment>
      ))}
    </>
  );
}

/** Filters kept from an earlier visit to Home can hide the year named here, so they give way to it. */
function YearCrumb({ show }: { show: Show }) {
  const { shows } = useSite();
  const { filters, setFilters, query, setQuery } = useHomeFilters();
  const revealYear = () => {
    if (yearMatches(shows, show.year, filters, query) === 'match') return;
    setFilters(NO_FILTERS);
    setQuery('');
  };
  return (
    <BackLink href={`/#y${show.year}`} onOpen={revealYear}>
      {`← ${show.year}`}
    </BackLink>
  );
}

function ConcertView({ show }: { show: Show }) {
  const { festival, venue } = show;
  const where = [venue.neighborhood, venue.city, venue.region].filter(Boolean).join(', ');
  const placed = new Set(festival?.days.flatMap((day) => daySetlists(show, day)));
  const rest = (show.concert.setlists ?? []).filter((s) => !placed.has(s));
  const dateLine = festival && festival.start_date !== festival.end_date ? `${longDate(festival.start_date)} to ${longDate(festival.end_date)}` : longDate(show.date);
  const titleIsBill = show.headliners.length > 0 && show.title === show.headliners.map((h) => h.label).join(' / ');
  return (
    <>
      <p class="crumb">
        <YearCrumb show={show} />
      </p>
      <header class="gig">
        <PosterBlock show={show} />
        <div class="gig__text">
          <p class="gig__pills">
            <TypePill type={show.type} />
            <EvidencePill show={show} />
          </p>
          <p class="gig__date">{dateLine}</p>
          <h1 class="neon neon--lg">{titleIsBill ? <Headliners show={show} /> : show.title}</h1>
          {show.headliners.length > 0 && !titleIsBill ? (
            <p class="gig__heads">
              <Headliners show={show} />
            </p>
          ) : null}
          <p class="gig__venue">
            <Link href={venuePath(venue)}>{venue.name}</Link>
            {where ? ' ' : null}
            {where ? <span>{where}</span> : null}
          </p>
          {!festival && show.supports.length > 0 ? (
            <>
              <h2 class="block__title">On the bill</h2>
              <ul class="lineup">
                {show.supports.map((support, i) => (
                  <li key={i}>
                    <Link href={artistPath(support.artist)}>{support.label}</Link>
                  </li>
                ))}
              </ul>
              <p class="credit">Billed acts aren’t proof each set was seen.</p>
            </>
          ) : null}
          {!festival && rest.length > 0 ? (
            <>
              <h2 class="block__title">Setlists</h2>
              <SetlistsBlock sets={rest} />
            </>
          ) : null}
        </div>
      </header>
      {festival ? <FestivalDays show={show} festival={festival} /> : null}
      {festival && rest.length > 0 ? (
        <section class="block">
          <h2 class="block__title">Other setlists</h2>
          <SetlistsBlock sets={rest} />
        </section>
      ) : null}
      <PhotosBlock show={show} />
      <CoverageBlock show={show} />
      <EvidenceBlock show={show} />
    </>
  );
}

/** Keyed so moving between concerts starts fresh, with no open festival days or stale images carried over. */
export function ConcertPage({ show }: { show: Show }) {
  return <ConcertView key={show.id} show={show} />;
}
