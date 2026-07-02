import Dexie, { type Table } from 'dexie';
import type {
  Trip,
  JournalEntry,
  ChecklistItem,
  MediaItem,
  Expense,
  ItineraryPoint
} from '@/types';

/**
 * Base de données locale unique (IndexedDB via Dexie).
 * Toutes les tables portent un index `tripId` pour isoler les données
 * par carnet de voyage. Aucune donnée ne quitte jamais l'appareil :
 * il n'y a ni backend, ni synchronisation réseau.
 */
class TravelJournalDB extends Dexie {
  trips!: Table<Trip, string>;
  journalEntries!: Table<JournalEntry, string>;
  checklist!: Table<ChecklistItem, string>;
  media!: Table<MediaItem, string>;
  expenses!: Table<Expense, string>;
  itinerary!: Table<ItineraryPoint, string>;

  constructor() {
    super('carnet-de-voyage-db');

    this.version(1).stores({
      trips: 'id, title, startDate, updatedAt',
      journalEntries: 'id, tripId, date',
      checklist: 'id, tripId, order',
      media: 'id, tripId, entryId, takenAt',
      expenses: 'id, tripId, date, category',
      itinerary: 'id, tripId, order, visitedAt'
    });
  }
}

export const db = new TravelJournalDB();

/** Supprime intégralement un voyage et toutes ses données rattachées. */
export async function deleteTripCascade(tripId: string): Promise<void> {
  await db.transaction(
    'rw',
    [db.trips, db.journalEntries, db.checklist, db.media, db.expenses, db.itinerary],
    async () => {
      await db.trips.delete(tripId);
      await db.journalEntries.where('tripId').equals(tripId).delete();
      await db.checklist.where('tripId').equals(tripId).delete();
      await db.media.where('tripId').equals(tripId).delete();
      await db.expenses.where('tripId').equals(tripId).delete();
      await db.itinerary.where('tripId').equals(tripId).delete();
    }
  );
}
