import { useState } from 'react';
import { db } from '@/db/db';
import type { JournalEntry, MediaItem } from '@/types';
import { useObjectUrl } from './GalleryTab';

export default function MediaLightbox({
  item,
  entries,
  onClose
}: {
  item: MediaItem;
  entries: JournalEntry[];
  onClose: () => void;
}) {
  const url = useObjectUrl(item.blob);
  const [caption, setCaption] = useState(item.caption);
  const [entryId, setEntryId] = useState(item.entryId ?? '');
  const [confirming, setConfirming] = useState(false);

  async function save() {
    await db.media.update(item.id, { caption, entryId: entryId || null });
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed', inset: 0, background: 'rgba(27,42,61,0.82)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 50
      }}
      onClick={onClose}
    >
      <div className="card" style={{ maxWidth: 520, width: '100%', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: 14, background: '#000' }}>
          {item.kind === 'video' ? (
            <video src={url ?? undefined} controls style={{ width: '100%', display: 'block' }} />
          ) : (
            <img src={url ?? undefined} alt={item.caption} style={{ width: '100%', display: 'block' }} />
          )}
        </div>

        <div className="field">
          <label htmlFor="caption">Légende</label>
          <input id="caption" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Un souvenir en une phrase…" />
        </div>

        <div className="field">
          <label htmlFor="link-entry">Associer à une entrée du journal</label>
          <select id="link-entry" value={entryId} onChange={(e) => setEntryId(e.target.value)}>
            <option value="">— Aucune —</option>
            {entries.map((e) => (
              <option key={e.id} value={e.id}>
                {new Date(e.date).toLocaleDateString('fr-FR')} — {e.title}
              </option>
            ))}
          </select>
        </div>

        <p className="muted" style={{ fontSize: '0.8rem' }}>{item.fileName}</p>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
          {confirming ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-danger btn-sm" onClick={() => db.media.delete(item.id).then(onClose)}>Confirmer suppr.</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setConfirming(false)}>Annuler</button>
            </div>
          ) : (
            <button className="btn btn-ghost btn-sm" onClick={() => setConfirming(true)}>Supprimer</button>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={onClose}>Fermer</button>
            <button className="btn btn-primary" onClick={save}>Enregistrer</button>
          </div>
        </div>
      </div>
    </div>
  );
}
