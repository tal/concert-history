/** @jsxImportSource preact */
import { memo } from 'preact/compat';
import { useMemo } from 'preact/hooks';
import { Link } from 'wouter-preact';
import { compareText, normalizeName, type ArtistEntry } from '../../model';
import { ListControls, Monogram, photoFallback, useDirectory, type DirectoryEntry } from '../components/ListControls';
import type { RowVisibility } from '../components/ShowRow';
import { useSite, useUrls } from '../context';
import { plural } from '../lib/format';
import { artistPath } from '../lib/paths';

export function ArtistImage({ artist, loading }: { artist: ArtistEntry; loading: 'lazy' | 'eager' }) {
  const urls = useUrls();
  if (artist.image_url) return <img src={artist.image_url} alt="" loading={loading} decoding="async" referrerpolicy="no-referrer" />;
  const own = photoFallback(artist.appearances.filter((a) => a.role === 'headliner').map((a) => a.show));
  if (own) return <img src={urls.photo(own.photo.asset)} alt="" loading={loading} decoding="async" />;
  return <Monogram name={artist.name} />;
}

const ArtistCard = memo(function ArtistCard({ artist, visibility }: { artist: ArtistEntry; visibility: RowVisibility }) {
  return (
    <li hidden={visibility === 'hidden'}>
      <Link class="acard" href={artistPath(artist)}>
        <span class="acard__art">
          <ArtistImage artist={artist} loading="lazy" />
        </span>
        <strong>{artist.name}</strong>
        <span>{plural(artist.appearances.length, 'show')}</span>
      </Link>
    </li>
  );
});

export function ArtistsIndex() {
  const site = useSite();
  const entries = useMemo(
    (): DirectoryEntry<ArtistEntry>[] =>
      site.artists
        .toSorted((a, b) => b.appearances.length - a.appearances.length || compareText(a.name, b.name))
        .map((artist) => ({
          item: artist,
          search: `${artist.name} ${artist.aliases.join(' ')}`.toLowerCase(),
          name: normalizeName(artist.name),
        })),
    [site],
  );
  const { rows, controls } = useDirectory('artists', entries);
  return (
    <>
      <header class="head">
        <h1 class="neon neon--lg">Artists</h1>
        <p>Everyone on a bill Tal has a record of. A billing doesn’t prove the set was seen, so those are marked on each artist’s page.</p>
      </header>
      <ListControls search="Find an artist" noun="artist" controls={controls} />
      <ul class="grid grid--artists" data-list="">
        {rows.map((row) => (
          <ArtistCard key={row.item.slug} artist={row.item} visibility={row.visibility} />
        ))}
      </ul>
    </>
  );
}
