import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import type { JournalEntry } from '@/types';
import { blobToDataUrl } from '@/utils/image';

const MOOD_EMOJI: Record<string, string> = {
  radieux: '🤩',
  content: '🙂',
  neutre: '😐',
  fatigue: '😴',
  difficile: '😞'
};

export default function EntryCard({ entry, onEdit }: { entry: JournalEntry; onEdit: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const media = useLiveQuery(() => db.media.where('entryId').equals(entry.id).toArray(), [entry.id]);

  return (
    <article className="card torn-edge">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div>
          <p className="muted mono" style={{ fontSize: '0.78rem', margin: 0 }}>
            {new Date(entry.date).toLocaleString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}
          </p>
          <h3 style={{ fontSize: '1.25rem', margin: '4px 0' }}>{entry.title}</h3>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-ghost btn-sm" onClick={onEdit}>Modifier</button>
          {confirming ? (
            <button className="btn btn-danger btn-sm" onClick={() => db.journalEntries.delete(entry.id)}>Confirmer</button>
          ) : (
            <button className="btn btn-ghost btn-sm" onClick={() => setConfirming(true)}>Suppr.</button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '6px 0 12px' }}>
        {entry.mood && <span className="chip">{MOOD_EMOJI[entry.mood]} {entry.mood}</span>}
        {entry.weatherText && <span className="chip brass">{entry.weatherSource === 'api' ? '📡 ' : ''}{entry.weatherText}</span>}
        {entry.placeName && <span className="chip">📍 {entry.placeName}</span>}
      </div>

      {entry.text && (
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
          {entry.text}
        </p>
      )}

      {media && media.length > 0 && (
        <div className="grid media-grid" style={{ marginTop: 12 }}>
          {media.map((m) => (
            <MediaThumb key={m.id} blob={m.thumbnailBlob ?? m.blob} />
          ))}
        </div>
      )}
    </article>
  );
}

function MediaThumb({ blob }: { blob: Blob }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    blobToDataUrl(blob).then((u) => { if (active) setUrl(u); });
    return () => { active = false; };
  }, [blob]);
  if (!url) return <div className="media-tile" />;
  return (
    <div className="media-tile">
      <img src={url} alt="" />
    </div>
  );
}
