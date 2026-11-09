/** @jsxImportSource preact */
import type { ComponentChildren } from 'preact';
import type { VenueEntry } from '../../model';
import type { VenueImage } from '../../types';
import { BackLink } from '../components/BackLink';
import { GalleryLink, type LightboxItem } from '../components/Lightbox';
import { MapBlock, venuePoint } from '../components/MapBlock';
import { Out } from '../components/Out';
import { Timeline } from '../components/Timeline';
import { useUrls, type Urls } from '../context';
import { longDate, plural } from '../lib/format';
import { ClosedTag } from './VenuesIndex';

const VIEW_LABEL: Record<VenueImage['view'], string> = { exterior: 'Outside', interior: 'Inside' };

interface Figure {
  item: LightboxItem;
  referrerpolicy?: 'no-referrer';
  caption: ComponentChildren;
}

const imageCredit = (image: VenueImage) => image.credit + (image.license ? `, ${image.license}` : '');

function officialFigures(venue: VenueEntry, urls: Urls): Figure[] {
  return venue.images.map((image) => {
    const view = VIEW_LABEL[image.view];
    const alt = `${venue.name}, ${view.toLowerCase()}`;
    return {
      item: { src: urls.venueImage(image), alt, caption: `${alt}. ${imageCredit(image)}` },
      referrerpolicy: image.asset ? undefined : 'no-referrer',
      caption: (
        <>
          {`${view} · `}
          <Out href={image.source_url}>{imageCredit(image)}</Out>
        </>
      ),
    };
  });
}

function ownFigures(venue: VenueEntry, urls: Urls): Figure[] {
  return venue.shows
    .flatMap((show) => show.concert.photos.slice(0, 1).map((photo) => ({ photo, show })))
    .slice(0, 3)
    .map(({ photo, show }) => ({
      item: { src: urls.photo(photo.asset), alt: `${show.title} at ${venue.name}`, caption: `${show.title}, ${longDate(show.date)}` },
      caption: `Tal’s photo, ${show.title}`,
    }));
}

function VenueGallery({ venue }: { venue: VenueEntry }) {
  const urls = useUrls();
  const figures = venue.images.length ? officialFigures(venue, urls) : ownFigures(venue, urls);
  if (!figures.length) return null;
  const items = figures.map((figure) => figure.item);
  return (
    <div class={`vgallery vgallery--${Math.min(figures.length, 3)}`}>
      {figures.map((figure, index) => (
        <figure key={index}>
          <GalleryLink items={items} index={index}>
            <img src={figure.item.src} alt={figure.item.alt} decoding="async" referrerpolicy={figure.referrerpolicy} />
          </GalleryLink>
          <figcaption>{figure.caption}</figcaption>
        </figure>
      ))}
    </div>
  );
}

export function VenuePage({ venue }: { venue: VenueEntry }) {
  const place = [venue.address, venue.neighborhood, venue.city, venue.region].filter(Boolean).join(', ');
  const point = venuePoint(venue, venue.shows.length);
  return (
    <>
      <p class="crumb">
        <BackLink href="/venues/">← Venues</BackLink>
      </p>
      <header class="head">
        <h1 class="neon neon--lg">{venue.name}</h1>
        <p class="facts">
          {`${place} `}
          <ClosedTag venue={venue} />
          <br />
          {plural(venue.shows.length, 'show')}
        </p>
      </header>
      <VenueGallery venue={venue} />
      <div class="vinfo">
        <div>
          {venue.description ? <p class="lede">{venue.description}</p> : null}
          {venue.description && venue.description_source ? (
            <p class="credit">
              {'Source: '}
              <Out href={venue.description_source.url}>{venue.description_source.label}</Out>
            </p>
          ) : null}
          <div class="btns">
            {venue.website ? (
              <Out href={venue.website} cls="btn">
                Official site ↗
              </Out>
            ) : null}
            {venue.wikipedia ? (
              <Out href={venue.wikipedia} cls="btn">
                Wikipedia ↗
              </Out>
            ) : null}
          </div>
        </div>
        {point ? <MapBlock key={venue.slug} points={[point]} label={`Map of ${venue.name}`} /> : null}
      </div>
      <section class="block">
        <h2 class="block__title">Shows here</h2>
        <Timeline shows={venue.shows} anchors="no_anchors" notes="no_notes" />
      </section>
    </>
  );
}
