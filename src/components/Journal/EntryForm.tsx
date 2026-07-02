import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import { db } from '@/db/db';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { getCurrentPosition } from '@/utils/geolocation';
import { fetchWeatherText } from '@/utils/weather';
import type { JournalEntry, Mood } from '@/types';

const MOODS: { value: Mood; emoji: string; label: string }[] = [
  { value: 'radieux', emoji: '🤩', label: 'Radieux' },
  { value: 'content', emoji: '🙂', label: 'Content' },
  { value: 'neutre', emoji: '😐', label: 'Neutre' },
  { value: 'fatigue', emoji: '😴', label: 'Fatigué' },
  { value: 'difficile', emoji: '😞', label: 'Difficile' }
];

function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EntryForm({
  tripId,
  entry,
  onClose
}: {
  tripId: string;
  entry: JournalEntry | null;
  onClose: () => void;
}) {
  const online = useOnlineStatus();
  const [title, setTitle] = useState(entry?.title ?? '');
  const [date, setDate] = useState(entry ? toLocalInputValue(entry.date) : toLocalInputValue(new Date().toISOString()));
  const [text, setText] = useState(entry?.text ?? '');
  const [mood, setMood] = useState<Mood | null>(entry?.mood ?? null);
  const [weatherText, setWeatherText] = useState(entry?.weatherText ?? '');
  const [placeName, setPlaceName] = useState(entry?.placeName ?? '');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    entry?.lat != null && entry?.lng != null ? { lat: entry.lat, lng: entry.lng } : null
  );
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherSource, setWeatherSource] = useState<'manual' | 'api'>(entry?.weatherSource ?? 'manual');
  const [error, setError] = useState('');

  async function handleAutoWeather() {
    setError('');
    setWeatherLoading(true);
    try {
      let point = coords;
      if (!point) {
        const pos = await getCurrentPosition();
        point = { lat: pos.lat, lng: pos.lng };
        setCoords(point);
      }
      const text = await fetchWeatherText(point.lat, point.lng);
      setWeatherText(text);
      setWeatherSource('api');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de récupérer la météo.');
    } finally {
      setWeatherLoading(false);
    }
  }

  async function handleUseLocation() {
    setError('');
    try {
      const pos = await getCurrentPosition();
      setCoords({ lat: pos.lat, lng: pos.lng });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Géolocalisation impossible.');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const now = new Date().toISOString();
    const payload: JournalEntry = {
      id: entry?.id ?? uuid(),
      tripId,
      date: new Date(date).toISOString(),
      title: title.trim() || 'Sans titre',
      text,
      mood,
      weatherText,
      weatherSource,
      placeName,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      createdAt: entry?.createdAt ?? now,
      updatedAt: now
    };
    await db.journalEntries.put(payload);
    onClose();
  }

  return (
    <form className="card" style={{ marginBottom: 24 }} onSubmit={handleSubmit}>
      <div className="field-row">
        <div className="field" style={{ flex: 2 }}>
          <label htmlFor="entry-title">Titre du moment</label>
          <input id="entry-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Le lever de soleil sur le fjord" autoFocus />
        </div>
        <div className="field">
          <label htmlFor="entry-date">Date &amp; heure</label>
          <input id="entry-date" type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
      </div>

      <div className="field">
        <label htmlFor="entry-text">Récit</label>
        <textarea id="entry-text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Raconte ce moment…" />
      </div>

      <div className="field">
        <label>Humeur</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {MOODS.map((m) => (
            <button
              type="button"
              key={m.value}
              className="btn btn-sm"
              onClick={() => setMood(mood === m.value ? null : m.value)}
              style={{
                background: mood === m.value ? 'var(--color-sage-soft)' : 'transparent',
                border: '1px solid var(--color-paper-line)'
              }}
            >
              {m.emoji} {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="entry-weather">Météo</label>
          <input
            id="entry-weather"
            value={weatherText}
            onChange={(e) => { setWeatherText(e.target.value); setWeatherSource('manual'); }}
            placeholder="Ensoleillé, 22°C"
          />
        </div>
        <div style={{ alignSelf: 'flex-end', marginBottom: 16 }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleAutoWeather} disabled={!online || weatherLoading}>
            {weatherLoading ? '…' : online ? '📡 Récupérer via API' : '📡 Indisponible hors-ligne'}
          </button>
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="entry-place">Lieu</label>
          <input id="entry-place" value={placeName} onChange={(e) => setPlaceName(e.target.value)} placeholder="Vík í Mýrdal" />
        </div>
        <div style={{ alignSelf: 'flex-end', marginBottom: 16 }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleUseLocation}>
            📍 {coords ? 'Position enregistrée' : 'Utiliser ma position'}
          </button>
        </div>
      </div>
      {coords && (
        <p className="muted mono" style={{ fontSize: '0.78rem', marginTop: -8 }}>
          {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
        </p>
      )}

      {error && <p style={{ color: 'var(--color-rust)', fontSize: '0.85rem' }}>{error}</p>}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
        <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
        <button type="submit" className="btn btn-primary">{entry ? 'Enregistrer' : 'Ajouter l\'entrée'}</button>
      </div>
    </form>
  );
}
