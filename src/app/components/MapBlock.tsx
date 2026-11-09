/** @jsxImportSource preact */
// Interactive map on Leaflet and OpenStreetMap tiles. Leaflet is its own chunk, loaded once a map mounts.
import type { Map as LeafletMap } from 'leaflet';
import { useEffect, useRef } from 'preact/hooks';
import { useLocation } from 'wouter-preact';
import type { VenueEntry } from '../../model';
import { useUrls } from '../context';
import { venuePath } from '../lib/paths';

export interface MapPoint {
  lat: number;
  lon: number;
  label: string;
  /** Router-relative path. */
  href: string;
  count: number;
}

export type MapSize = 'map--tall' | 'map--short';

export function venuePoint(venue: VenueEntry, count: number): MapPoint | null {
  if (venue.lat == null || venue.lon == null) return null;
  return { lat: venue.lat, lon: venue.lon, label: venue.name, href: venuePath(venue), count };
}

const median = (values: number[]) => values.toSorted((a, b) => a - b)[Math.floor(values.length / 2)]!;

/** A few far-flung venues shouldn't zoom the map out to the whole country, so frame the main cluster. */
function mainCluster(points: MapPoint[]): MapPoint[] {
  const lat = median(points.map((p) => p.lat));
  const lon = median(points.map((p) => p.lon));
  const near = points.filter((p) => Math.abs(p.lat - lat) < 1 && Math.abs(p.lon - lon) < 1);
  return near.length ? near : points;
}

const escapeHtml = (text: string) => {
  const span = document.createElement('span');
  span.textContent = text;
  return span.innerHTML;
};

/** The first map reached by client navigation can land on a page whose head didn't include Leaflet's stylesheet. */
function ensureStylesheet(href: string) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.append(link);
}

export interface MapBlockProps {
  points: MapPoint[];
  label: string;
  size?: MapSize;
}

/** Draws `points` from the first render. Give it a `key` where the points can change under a mounted page. */
export function MapBlock({ points, label, size = 'map--short' }: MapBlockProps) {
  const element = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();
  const urls = useUrls();

  useEffect(() => {
    const container = element.current;
    if (!container) return;
    ensureStylesheet(urls.asset('assets/leaflet.css'));
    let map: LeafletMap | undefined;
    let lifecycle: 'mounted' | 'unmounted' = 'mounted';

    import('leaflet')
      .then(({ default: L }) => {
        if (lifecycle === 'unmounted') return;
        map = L.map(container, { scrollWheelZoom: false, attributionControl: true });
        // Standard OSM tiles need no key; site.css turns them dark with a filter on the tile pane.
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        for (const point of points) {
          const marker = L.circleMarker([point.lat, point.lon], {
            radius: Math.min(16, 5 + Math.sqrt(point.count) * 2.4),
            color: '#ff2f92',
            weight: 2,
            fillColor: '#ff2f92',
            fillOpacity: 0.45,
          }).addTo(map);
          marker.bindTooltip(`${escapeHtml(point.label)} · ${point.count}`, { direction: 'top', className: 'map-tip' });
          marker.on('click', () => navigate(point.href));
        }

        if (points.length === 1) {
          map.setView([points[0]!.lat, points[0]!.lon], 14);
        } else {
          const cluster = mainCluster(points);
          map.fitBounds(L.latLngBounds(cluster.map((p) => [p.lat, p.lon] as [number, number])), { padding: [36, 36], maxZoom: 14 });
        }
      })
      .catch((error: unknown) => console.error('Map failed to load', error));

    return () => {
      lifecycle = 'unmounted';
      map?.remove();
    };
  }, []);

  if (!points.length) return null;
  return <div ref={element} class={`map ${size}`} role="region" aria-label={label}></div>;
}
