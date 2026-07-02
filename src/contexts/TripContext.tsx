import { createContext, useContext, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useParams } from 'react-router-dom';
import { db } from '@/db/db';
import type { Trip } from '@/types';

interface TripContextValue {
  trip: Trip | undefined;
  tripId: string;
  loading: boolean;
}

const TripContext = createContext<TripContextValue | null>(null);

export function TripProvider({ children }: { children: ReactNode }) {
  const { tripId = '' } = useParams<{ tripId: string }>();
  const trip = useLiveQuery(() => (tripId ? db.trips.get(tripId) : undefined), [tripId]);

  return (
    <TripContext.Provider value={{ trip, tripId, loading: trip === undefined }}>
      {children}
    </TripContext.Provider>
  );
}

export function useTrip(): TripContextValue {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error('useTrip doit être utilisé dans un TripProvider');
  return ctx;
}
