import { HashRouter, Routes, Route } from 'react-router-dom';
import TripsHome from '@/components/Trips/TripsHome';
import TripLayout from '@/components/Layout/TripLayout';
import JournalTab from '@/components/Journal/JournalTab';
import GalleryTab from '@/components/Gallery/GalleryTab';
import BudgetTab from '@/components/Budget/BudgetTab';
import ItineraryTab from '@/components/Itinerary/ItineraryTab';
import StoryStudioTab from '@/components/Story/StoryStudioTab';
import ExportTab from '@/components/ExportImport/ExportTab';
import { TripProvider } from '@/contexts/TripContext';

// HashRouter : indispensable pour un fonctionnement 100% statique/offline sur
// Vercel + PWA installée (pas de configuration serveur de réécriture requise,
// et les routes restent valides même servies depuis le cache du Service Worker).
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<TripsHome />} />
        <Route
          path="/trip/:tripId"
          element={
            <TripProvider>
              <TripLayout />
            </TripProvider>
          }
        >
          <Route index element={<JournalTab />} />
          <Route path="galerie" element={<GalleryTab />} />
          <Route path="budget" element={<BudgetTab />} />
          <Route path="itineraire" element={<ItineraryTab />} />
          <Route path="story" element={<StoryStudioTab />} />
          <Route path="export" element={<ExportTab />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
