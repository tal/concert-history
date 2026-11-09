// Draws every `.map[data-points]` block using Leaflet and OpenStreetMap tiles.
import L from 'leaflet';

interface MapPoint {
  lat: number;
  lon: number;
  label: string;
  href: string;
  count: number;
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

for (const element of document.querySelectorAll<HTMLElement>('.map[data-points]')) {
  const points = JSON.parse(element.dataset.points!) as MapPoint[];
  const map = L.map(element, { scrollWheelZoom: false, attributionControl: true });
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
    marker.on('click', () => {
      window.location.href = point.href;
    });
  }

  if (points.length === 1) {
    map.setView([points[0]!.lat, points[0]!.lon], 14);
  } else {
    const cluster = mainCluster(points);
    map.fitBounds(L.latLngBounds(cluster.map((p) => [p.lat, p.lon] as [number, number])), { padding: [36, 36], maxZoom: 14 });
  }
}
