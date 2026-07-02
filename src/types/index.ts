// Modèle de données de l'application. Toutes les entités sont rattachées
// à un `tripId` afin d'isoler complètement les données de chaque voyage.

export type UUID = string;

export interface Trip {
  id: UUID;
  title: string;
  destination: string;
  startDate: string; // ISO date (yyyy-mm-dd)
  endDate: string; // ISO date (yyyy-mm-dd)
  coverColor: string; // couleur d'accent choisie pour ce carnet
  budgetTotal: number; // budget prévisionnel, 0 = illimité
  currency: string; // ex: "EUR"
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

export type Mood = 'radieux' | 'content' | 'neutre' | 'fatigue' | 'difficile';

export interface JournalEntry {
  id: UUID;
  tripId: UUID;
  date: string; // ISO datetime complète (une entrée = un moment précis)
  title: string;
  text: string;
  mood: Mood | null;
  weatherText: string; // saisie manuelle ("Ensoleillé, 24°C") ou renseignée par l'API météo
  weatherSource: 'manual' | 'api';
  placeName: string;
  lat: number | null;
  lng: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistItem {
  id: UUID;
  tripId: UUID;
  label: string;
  done: boolean;
  order: number;
}

export type MediaKind = 'photo' | 'video';

export interface MediaItem {
  id: UUID;
  tripId: UUID;
  entryId: UUID | null; // rattachement optionnel à une entrée de journal
  kind: MediaKind;
  blob: Blob; // stockage binaire natif IndexedDB (Dexie gère les Blobs nativement)
  thumbnailBlob: Blob | null; // miniature compressée pour un affichage rapide en grille
  mimeType: string;
  fileName: string;
  caption: string;
  takenAt: string; // ISO datetime utilisée pour trier/associer à un jour
  createdAt: string;
}

export type ExpenseCategory = 'Transport' | 'Logement' | 'Repas' | 'Loisirs' | 'Autre';

export interface Expense {
  id: UUID;
  tripId: UUID;
  label: string;
  amount: number;
  category: ExpenseCategory;
  date: string; // ISO date
  createdAt: string;
}

export interface ItineraryPoint {
  id: UUID;
  tripId: UUID;
  placeName: string;
  lat: number;
  lng: number;
  note: string;
  visitedAt: string; // ISO datetime
  order: number;
  createdAt: string;
}

// Format du fichier d'export/import global d'un voyage (JSON + médias en base64)
export interface TripExportBundle {
  formatVersion: 1;
  exportedAt: string;
  trip: Trip;
  journalEntries: JournalEntry[];
  checklist: ChecklistItem[];
  expenses: Expense[];
  itinerary: ItineraryPoint[];
  media: {
    id: UUID;
    entryId: UUID | null;
    kind: MediaKind;
    mimeType: string;
    fileName: string;
    caption: string;
    takenAt: string;
    createdAt: string;
    fileRef: string; // chemin dans le zip, ex: "media/<id>.jpg"
    thumbnailRef: string | null;
  }[];
}
