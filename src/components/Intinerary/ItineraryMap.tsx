import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import type { ItineraryPoint } from '@/types';

// Icônes par défaut de Leaflet cassées par le bundler : on les redéfinit explicitement.
const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

export default function ItineraryMap({ points, online }: { points: ItineraryPoint[]; online: boolean }) {
  const positions = points.map((p) => [p.lat, p.lng]) as [number, number][];
  const center = positions[Math.floor(positions.length / 2)] ?? [0, 0];

  return (
    <div style={{ height: 340, borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
      <MapContainer center={center} zoom={6} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributeurs'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline positions={positions} pathOptions={{ color: '#6B8F71', weight: 3 }} />
        {points.map((p) => (
          <Marker key={p.id} position={[p.lat, p.lng]} icon={markerIcon}>
            <Popup>
              <strong>{p.placeName}</strong>
              <br />
              {new Date(p.visitedAt).toLocaleDateString('fr-FR')}
              {p.note && <><br />{p.note}</>}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {!online && (
        <p className="muted" style={{ fontSize: '0.75rem', margin: '6px 4px 0' }}>
          Fond de carte non chargé (hors-ligne) — seules les tuiles déjà visitées en ligne s'affichent depuis le cache.
        </p>
      )}
    </div>
  );
}
