/** @jsxImportSource preact */
// One concert on a timeline.
import { Fragment } from 'preact';
import { memo } from 'preact/compat';
import { Link } from 'wouter-preact';
import type { Role, Show } from '../../model';
import { useUrls } from '../context';
import { dateLabel, ROLE_LABELS, venueWhere } from '../lib/format';
import { artistPath, showPath, venuePath } from '../lib/paths';
import { EvidencePill, TypePill } from './Pills';

export type RowVisibility = 'visible' | 'hidden';

function Pin() {
  return (
    <svg class="pin" viewBox="0 0 12 16" aria-hidden="true">
      <path
        d="M6 0a6 6 0 0 0-6 6c0 4.2 6 10 6 10s6-5.800 6-10a6 6 0 0 0-6-6Zm0 8.200A2.200 2.200 0 1 1 6 3.800a2.200 2.200 0 0 1 0 4.400Z"
        fill="currentColor"
      />
    </svg>
  );
}

function PhotoStrip({ show }: { show: Show }) {
  const urls = useUrls();
  const { photos, poster, coverage_photos = [] } = show.concert;
  if (!photos.length && !poster && !coverage_photos.length) return null;
  const coverage = coverage_photos[0];
  return (
    <div class="strip">
      {poster && <img class="is-poster" loading="lazy" decoding="async" src={urls.poster(poster.asset)} alt="" />}
      {photos.slice(0, 3).map((photo) => (
        <img key={photo.asset} loading="lazy" decoding="async" src={urls.photo(photo.asset)} alt="" />
      ))}
      {photos.length > 3 && <span class="strip__more">{`+${photos.length - 3}`}</span>}
      {coverage && (
        <span class="strip__coverage" title={`Coverage photo: ${coverage.credit} / ${coverage.publication}`}>
          <img loading="lazy" decoding="async" src={coverage.image_url} alt={coverage.caption} referrerpolicy="no-referrer" />
          <span>Coverage</span>
        </span>
      )}
    </div>
  );
}

function BillLine({ show }: { show: Show }) {
  if (!show.supports.length) return null;
  const limit = show.type === 'festival' ? 6 : 5;
  const extra = show.supports.length - limit;
  return (
    <p class="show__bill">
      {'w/ '}
      {show.supports.slice(0, limit).map((support, i) => (
        <Fragment key={support.artist.slug}>
          {i > 0 && ', '}
          <Link href={artistPath(support.artist)}>{support.label}</Link>
        </Fragment>
      ))}
      {extra > 0 && ' '}
      {extra > 0 && <span>{`+${extra} more`}</span>}
    </p>
  );
}

export interface ShowRowProps {
  show: Show;
  /** Shown on artist pages, where a billing is not proof the set was seen. */
  role?: Role;
  visibility?: RowVisibility;
}

function ShowRowView({ show, role, visibility = 'visible' }: ShowRowProps) {
  const where = venueWhere(show.venue);
  return (
    <li class={`show show--${show.type} show--${show.evidence}`} hidden={visibility === 'hidden'}>
      <span class="show__dot" aria-hidden="true"></span>
      <div class="show__body">
        <div class="show__meta">
          <time datetime={show.date}>{dateLabel(show)}</time>
          <span class="show__pills">
            {role && <span class="pill pill--role">{ROLE_LABELS[role]}</span>}
            {show.evidence === 'unconfirmed' && <EvidencePill show={show} />}
            <TypePill type={show.type} />
          </span>
        </div>
        <h3 class="show__title">
          <Link href={showPath(show)}>{show.title}</Link>
        </h3>
        <p class="show__venue">
          <Pin />
          <Link href={venuePath(show.venue)}>{show.venue.name}</Link>
          {where ? <span>{where}</span> : null}
        </p>
        <BillLine show={show} />
        <PhotoStrip show={show} />
      </div>
    </li>
  );
}

export const ShowRow = memo(ShowRowView);
