import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useTrip } from '@/contexts/TripContext';
import OnlineStatusPill from './OnlineStatusPill';

const TABS = [
  { to: '', label: 'Journal', end: true },
  { to: 'galerie', label: 'Galerie' },
  { to: 'budget', label: 'Budget' },
  { to: 'itineraire', label: 'Itinéraire' },
  { to: 'story', label: 'Studio Story' },
  { to: 'export', label: 'Export / PDF' }
];

export default function TripLayout() {
  const { trip, loading } = useTrip();
  const navigate = useNavigate();

  if (loading) return <div className="app-shell">Chargement…</div>;
  if (!trip) {
    return (
      <div className="app-shell">
        <div className="empty-state">
          <p>Ce voyage est introuvable.</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>Retour à l'accueil</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="brand">
          <button className="btn btn-ghost" onClick={() => navigate('/')} aria-label="Retour aux carnets" title="Retour aux carnets">
            ←
          </button>
          <div>
            <p className="chip" style={{ background: `${trip.coverColor}22`, color: trip.coverColor, marginBottom: 4 }}>
              {trip.destination || 'Voyage'}
            </p>
            <h1 style={{ fontSize: '1.3rem' }}>{trip.title}</h1>
          </div>
        </div>
        <OnlineStatusPill />
      </header>

      <nav className="tab-nav">
        {TABS.map((tab) => (
          <NavLink key={tab.to} to={tab.to} end={tab.end} className={({ isActive }) => (isActive ? 'active' : '')}>
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  );
}
