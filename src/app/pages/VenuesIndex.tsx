/** @jsxImportSource preact */
import { memo } from 'preact/compat';
import { useMemo } from 'preact/hooks';
import { Link } from 'wouter-preact';
import { compareText, normalizeName, type VenueEntry } from '../../model';
import { ListControls, Monogram, photoFallback, useDirectory, type DirectoryEntry } from '../components/ListControls';
import { MapBlock, venuePoint } from '../components/MapBlock';
import type { RowVisibility } from '../components/ShowRow';
import { useSite, useUrls } from '../context';
import { plural, venueWhere } from '../lib/format';
import { venuePath } from '../lib/paths';

export function ClosedTag({ venue }: { venue: VenueEntry }) {
  if (venue.operating_status !== 'closed') return null;
  return <span class="pill pill--closed">{`Closed${venue.closed_year ? ` ${venue.closed_year}` : ''}`}</span>;
}

function VenueCardArt({ venue }: { venue: VenueEntry }) {
  const urls = useUrls();
  const image = venue.images[0];
  if (image) return <img src={urls.venueImage(image)} alt="" loading="lazy" decoding="async" referrerpolicy={image.asset ? undefined : 'no-referrer'} />;
  const own = photoFallback(venue.shows);
  if (own) return <img src={urls.photo(own.photo.asset)} alt="" loading="lazy" decoding="async" />;
  return <Monogram name={venue.name} />;
}

const VenueCard = memo(function VenueCard({ venue, visibility }: { venue: VenueEntry; visibility: RowVisibility }) {
  return (
    <li hidden={visibility === 'hidden'}>
      <Link class="vcard" href={venuePath(venue)}>
        <span class="vcard__art">
          <VenueCardArt venue={venue} />
        </span>
        <span class="vcard__text">
          <strong>{venue.name}</strong>
          <span>{venueWhere(venue)}</span>
          <span>
            {`${plural(venue.shows.length, 'show')} `}
            <ClosedTag venue={venue} />
          </span>
        </span>
      </Link>
    </li>
  );
});

export function VenuesIndex() {
  const site = useSite();
  const sorted = useMemo(() => site.venues.toSorted((a, b) => b.shows.length - a.shows.length || compareText(a.name, b.name)), [site]);
  const points = useMemo(() => sorted.flatMap((venue) => venuePoint(venue, venue.shows.length) ?? []), [sorted]);
  const entries = useMemo(
    (): DirectoryEntry<VenueEntry>[] =>
      sorted.map((venue) => ({
        item: venue,
        search: `${venue.name} ${venue.city ?? ''} ${venue.neighborhood ?? ''}`.toLowerCase(),
        name: normalizeName(venue.name),
      })),
    [sorted],
  );
  const { rows, controls } = useDirectory('venues', entries);
  return (
    <>
      <header class="head">
        <h1 class="neon neon--lg">Venues</h1>
        <p>Every room, park and boat that made it into the archive.</p>
      </header>
      <MapBlock points={points} label="Map of every venue" size="map--tall" />
      <ListControls search="Find a venue" noun="venue" controls={controls} />
      <ul class="grid grid--venues" data-list="">
        {rows.map((row) => (
          <VenueCard key={row.item.slug} venue={row.item} visibility={row.visibility} />
        ))}
      </ul>
    </>
  );
}
