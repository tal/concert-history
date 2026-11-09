/** @jsxImportSource preact */
import type { ArtistEntry, Show, VenueEntry } from '../../model';
import { BackLink } from '../components/BackLink';
import { MapBlock, venuePoint, type MapPoint } from '../components/MapBlock';
import { Out } from '../components/Out';
import { appearanceRole, Timeline } from '../components/Timeline';
import { longDate, plural } from '../lib/format';
import { ArtistImage } from './ArtistsIndex';

const seenSummary = (artist: ArtistEntry) => {
  const headlined = artist.appearances.filter((a) => a.role === 'headliner').length;
  const billed = artist.appearances.length - headlined;
  return [headlined ? `${headlined} as headliner` : '', billed ? `${billed} billed` : ''].filter(Boolean).join(', ');
};

function pointsFor(shows: Show[]): MapPoint[] {
  const counts = new Map<VenueEntry, number>();
  for (const show of shows) counts.set(show.venue, (counts.get(show.venue) ?? 0) + 1);
  return [...counts.entries()].flatMap(([venue, count]) => venuePoint(venue, count) ?? []);
}

export function ArtistPage({ artist }: { artist: ArtistEntry }) {
  const shows = artist.appearances.map((a) => a.show);
  const first = shows[shows.length - 1]!;
  const last = shows[0]!;
  const span = first === last ? longDate(first.date) : `${longDate(first.date)} to ${longDate(last.date)}`;
  const points = pointsFor(shows);
  return (
    <>
      <p class="crumb">
        <BackLink href="/artists/">← Artists</BackLink>
      </p>
      <header class="profile">
        <div class="profile__art">
          <ArtistImage artist={artist} loading="eager" />
          {artist.image_url ? <p class="credit">Image via Spotify</p> : null}
        </div>
        <div class="profile__text">
          <h1 class="neon neon--lg">{artist.name}</h1>
          <p class="facts">
            {`${plural(shows.length, 'show')} · ${seenSummary(artist)}`}
            <br />
            {span}
          </p>
          {artist.description ? <p class="lede">{artist.description}</p> : null}
          {artist.description && artist.wikipedia ? (
            <p class="credit">
              {'From '}
              <Out href={artist.wikipedia}>Wikipedia</Out>
              {', CC BY-SA 4.0'}
            </p>
          ) : null}
          <div class="btns">
            {artist.spotify_id ? (
              <Out href={`https://open.spotify.com/artist/${artist.spotify_id}`} cls="btn btn--spotify">
                Open in Spotify ↗
              </Out>
            ) : null}
            {artist.instagram ? (
              <Out href={`https://www.instagram.com/${artist.instagram}/`} cls="btn">
                Instagram ↗
              </Out>
            ) : null}
            {artist.wikipedia ? (
              <Out href={artist.wikipedia} cls="btn">
                Wikipedia ↗
              </Out>
            ) : null}
          </div>
        </div>
      </header>
      {points.length ? (
        <section class="block">
          <h2 class="block__title">Where Tal has seen them</h2>
          <MapBlock key={artist.slug} points={points} label={`Venues where ${artist.name} played`} />
        </section>
      ) : null}
      <section class="block">
        <h2 class="block__title">Shows</h2>
        <Timeline shows={shows} anchors="no_anchors" notes="no_notes" roleOf={appearanceRole(artist.appearances)} />
      </section>
    </>
  );
}
