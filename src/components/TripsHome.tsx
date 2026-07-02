import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import { db, deleteTripCascade } from '@/db/db';
import type { Trip } from '@/types';
import OnlineStatusPill from '@/components/Layout/OnlineStatusPill';
import ImportTripButton from '@/components/ExportImport/ImportTripButton';

const ACCENTS = ['#6B8F71', '#C9A24B', '#B5563F', '#3B6E8F', '#8A5FA6'];

export default function TripsHome() {
  const trips = useLiveQuery(() => db.trips.orderBy('updatedAt').reverse().toArray(), []);
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="brand">
          <div className="stamp">CV</div>
          <div>
            <h1 style={{ fontSize: '1.4rem' }}>Carnets de voyage</h1>
            <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>
              Tout est stocké sur cet appareil — aucune donnée n'est envoyée en ligne.
            </p>
          </div>
        </div>
        <OnlineStatusPill />
      </header>

      <div className="section-title">
        <h2 style={{ fontSize: '1.05rem' }}>Mes voyages</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <ImportTripButton />
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Nouveau voyage
          </button>
        </div>
      </div>

      {showForm && <NewTripForm onClose={() => setShowForm(false)} />}

      {trips === undefined ? null : trips.length === 0 ? (
        <div className="empty-state">
          <p>Aucun carnet pour l'instant.</p>
          <p className="muted">Crée ton premier voyage pour commencer à écrire.</p>
        </div>
      ) : (
        <div className="grid">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} onOpen={() => navigate(`/trip/${trip.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}

function TripCard({ trip, onOpen }: { trip: Trip; onOpen: () => void }) {
  const [confirming, setConfirming] = useState(false);

  const days = Math.max(
    1,
    Math.round((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / 86400000) + 1
  );

  return (
    <div className="card" style={{ borderTop: `4px solid ${trip.coverColor}`, cursor: 'pointer' }}>
      <div onClick={onOpen}>
        <p className="chip" style={{ background: `${trip.coverColor}22`, color: trip.coverColor }}>
          {trip.destination || 'Destination libre'}
        </p>
        <h3 style={{ margin: '10px 0 4px', fontSize: '1.2rem' }}>{trip.title}</h3>
        <p className="muted mono" style={{ fontSize: '0.82rem', margin: 0 }}>
          {formatDate(trip.startDate)} → {formatDate(trip.endDate)} · {days} j
        </p>
      </div>
      <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        {confirming ? (
          <>
            <span className="muted" style={{ fontSize: '0.8rem', alignSelf: 'center' }}>
              Supprimer définitivement ?
            </span>
            <button
              className="btn btn-danger btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                deleteTripCascade(trip.id);
              }}
            >
              Oui, supprimer
            </button>
            <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); setConfirming(false); }}>
              Annuler
            </button>
          </>
        ) : (
          <button
            className="btn btn-ghost btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              setConfirming(true);
            }}
          >
            Supprimer
          </button>
        )}
      </div>
    </div>
  );
}

function NewTripForm({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [budgetTotal, setBudgetTotal] = useState('');
  const [currency, setCurrency] = useState('EUR');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const now = new Date().toISOString();
    const trip: Trip = {
      id: uuid(),
      title: title.trim(),
      destination: destination.trim(),
      startDate,
      endDate,
      coverColor: ACCENTS[Math.floor(Math.random() * ACCENTS.length)],
      budgetTotal: Number(budgetTotal) || 0,
      currency,
      createdAt: now,
      updatedAt: now
    };
    await db.trips.add(trip);
    navigate(`/trip/${trip.id}`);
  }

  return (
    <form className="card" style={{ marginBottom: 24 }} onSubmit={handleSubmit}>
      <div className="field-row">
        <div className="field">
          <label htmlFor="title">Titre du carnet</label>
          <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Road trip en Islande" autoFocus required />
        </div>
        <div className="field">
          <label htmlFor="destination">Destination</label>
          <input id="destination" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Islande" />
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor="start">Départ</label>
          <input id="start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="end">Retour</label>
          <input id="end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor="budget">Budget prévisionnel</label>
          <input id="budget" type="number" min="0" step="1" value={budgetTotal} onChange={(e) => setBudgetTotal(e.target.value)} placeholder="0 = illimité" />
        </div>
        <div className="field">
          <label htmlFor="currency">Devise</label>
          <select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option value="EUR">EUR (€)</option>
            <option value="USD">USD ($)</option>
            <option value="GBP">GBP (£)</option>
            <option value="CHF">CHF</option>
          </select>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
        <button type="submit" className="btn btn-primary">Créer le carnet</button>
      </div>
    </form>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}
