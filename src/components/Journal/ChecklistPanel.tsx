import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { v4 as uuid } from 'uuid';
import { db } from '@/db/db';
import { useTrip } from '@/contexts/TripContext';

export default function ChecklistPanel() {
  const { tripId } = useTrip();
  const [label, setLabel] = useState('');
  const items = useLiveQuery(() => db.checklist.where('tripId').equals(tripId).sortBy('order'), [tripId]);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    const count = items?.length ?? 0;
    await db.checklist.add({ id: uuid(), tripId, label: label.trim(), done: false, order: count });
    setLabel('');
  }

  const done = items?.filter((i) => i.done).length ?? 0;
  const total = items?.length ?? 0;

  return (
    <div className="card">
      <div className="section-title">
        <h3 style={{ fontSize: '1.05rem' }}>Checklist de préparation</h3>
        <span className="chip">{done}/{total} fait{done > 1 ? 's' : ''}</span>
      </div>

      <form onSubmit={addItem} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Passeport, adaptateur secteur, assurance voyage…"
          style={{ flex: 1, padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-paper-line)', background: 'var(--color-paper)' }}
        />
        <button className="btn btn-primary" type="submit">Ajouter</button>
      </form>

      {items === undefined || items.length === 0 ? (
        <p className="muted">Ajoute les éléments à ne pas oublier avant le départ.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {items.map((item) => (
            <li key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px', borderBottom: '1px solid var(--color-paper-line)' }}>
              <input
                type="checkbox"
                checked={item.done}
                onChange={(e) => db.checklist.update(item.id, { done: e.target.checked })}
              />
              <span style={{ flex: 1, textDecoration: item.done ? 'line-through' : 'none', opacity: item.done ? 0.55 : 1 }}>
                {item.label}
              </span>
              <button className="btn btn-ghost btn-sm" onClick={() => db.checklist.delete(item.id)}>✕</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
