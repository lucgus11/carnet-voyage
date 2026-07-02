import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { v4 as uuid } from 'uuid';
import { db } from '@/db/db';
import { useTrip } from '@/contexts/TripContext';
import { getCurrentPosition } from '@/utils/geolocation';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import ItineraryMap from './ItineraryMap';
import type { ItineraryPoint } from '@/types';

export default function ItineraryTab() {
  const { tripId } = useTrip();
  const online = useOnlineStatus();
  const points = useLiveQuery(() => db.itinerary.where('tripId').equals(tripId).sortBy('order'), [tripId]);

  const [placeName, setPlaceName] = useState('');
  const [note, setNote] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');

  async function handleLocate() {
    setError('');
    setLocating(true);
    try {
      const pos = await getCurrentPosition();
      setCoords({ lat: pos.lat, lng: pos.lng });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Géolocalisation impossible.');
    } finally {
      setLocating(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!coords) {
      setError("Récupère d'abord ta position actuelle.");
      return;
    }
    const point: ItineraryPoint = {
      id: uuid(),
      tripId,
      placeName: placeName.trim() || 'Étape sans nom',
      lat: coords.lat,
      lng: coords.lng,
      note,
      visitedAt: new Date().toISOString(),
      order: points?.length ?? 0,
      createdAt: new Date().toISOString()
    };
    await db.itinerary.add(point);
    setPlaceName('');
    setNote('');
    setCoords(null);
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: '1rem', marginBottom: 4 }}>Ajouter une étape</h3>
        <p className="muted" style={{ fontSize: '0.85rem', marginTop: 0 }}>
          Enregistre ta position actuelle. La carte s'affiche avec le fond OpenStreetMap dès que tu es en ligne ;
          les points restent consultables hors-ligne.
        </p>
        <form onSubmit={handleAdd}>
          <div className="field-row">
            <div className="field" style={{ flex: 2 }}>
              <label htmlFor="place">Nom du lieu</label>
              <input id="place" value={placeName} onChange={(e) => setPlaceName(e.target.value)} placeholder="Réykjavik, camping du glacier…" />
            </div>
            <div style={{ alignSelf: 'flex-end', marginBottom: 16 }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleLocate} disabled={locating}>
                {locating ? 'Localisation…' : coords ? '📍 Position OK' : '📍 Ma position actuelle'}
              </button>
            </div>
          </div>
          <div className="field">
            <label htmlFor="note">Note (optionnel)</label>
            <input id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Étape marquante, anecdote…" />
          </div>
          {coords && (
            <p className="muted mono" style={{ fontSize: '0.78rem' }}>{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</p>
          )}
          {error && <p style={{ color: 'var(--color-rust)', fontSize: '0.85rem' }}>{error}</p>}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={!coords}>Ajouter au trajet</button>
          </div>
        </form>
      </div>

      {points && points.length > 0 && (
        <div className="card" style={{ marginBottom: 20, padding: 8 }}>
          <ItineraryMap points={points} online={online} />
        </div>
      )}

      {points === undefined || points.length === 0 ? (
        <div className="empty-state">Aucune étape enregistrée pour l'instant.</div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          {points.map((p, i) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--color-paper-line)' }}>
              <span className="chip">{i + 1}</span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 600 }}>{p.placeName}</p>
                {p.note && <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>{p.note}</p>}
              </div>
              <span className="muted mono" style={{ fontSize: '0.78rem' }}>
                {new Date(p.visitedAt).toLocaleDateString('fr-FR')}
              </span>
              <button className="btn btn-ghost btn-sm" onClick={() => db.itinerary.delete(p.id)}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
