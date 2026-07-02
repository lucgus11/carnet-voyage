import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import { useTrip } from '@/contexts/TripContext';
import EntryForm from './EntryForm';
import EntryCard from './EntryCard';
import ChecklistPanel from './ChecklistPanel';
import type { JournalEntry } from '@/types';

export default function JournalTab() {
  const { tripId } = useTrip();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<JournalEntry | null>(null);
  const [view, setView] = useState<'journal' | 'checklist'>('journal');

  const entries = useLiveQuery(
    () => db.journalEntries.where('tripId').equals(tripId).reverse().sortBy('date'),
    [tripId]
  );

  return (
    <div>
      <div className="section-title">
        <div style={{ display: 'flex', gap: 6 }}>
          <button className={`btn btn-sm ${view === 'journal' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('journal')}>
            Entrées ({entries?.length ?? 0})
          </button>
          <button className={`btn btn-sm ${view === 'checklist' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('checklist')}>
            Checklist de préparation
          </button>
        </div>
        {view === 'journal' && (
          <button className="btn btn-primary btn-sm" onClick={() => { setEditing(null); setShowForm(true); }}>
            + Nouvelle entrée
          </button>
        )}
      </div>

      {view === 'checklist' ? (
        <ChecklistPanel />
      ) : (
        <>
          {(showForm || editing) && (
            <EntryForm
              tripId={tripId}
              entry={editing}
              onClose={() => { setShowForm(false); setEditing(null); }}
            />
          )}

          {entries === undefined ? null : entries.length === 0 ? (
            <div className="empty-state">
              <p>Aucune entrée pour l'instant.</p>
              <p className="muted">Chaque moment fort mérite sa page — crée-en autant que tu veux.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {entries.map((entry) => (
                <EntryCard key={entry.id} entry={entry} onEdit={() => setEditing(entry)} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
