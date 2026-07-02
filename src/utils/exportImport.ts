import JSZip from 'jszip';
import { v4 as uuid } from 'uuid';
import { db } from '@/db/db';
import type { TripExportBundle } from '@/types';

const MANIFEST_NAME = 'trip.json';

/**
 * Exporte un voyage complet (métadonnées, journal, checklist, budget,
 * itinéraire et médias) dans une unique archive .zip contenant :
 * - trip.json  : toutes les données structurées
 * - media/*    : les fichiers image/vidéo originaux (et leurs miniatures)
 * Ce fichier peut être conservé comme sauvegarde ou réimporté sur un
 * autre appareil, sans jamais transiter par un serveur.
 */
export async function exportTripToZip(tripId: string): Promise<Blob> {
  const trip = await db.trips.get(tripId);
  if (!trip) throw new Error('Voyage introuvable');

  const [journalEntries, checklist, expenses, itinerary, media] = await Promise.all([
    db.journalEntries.where('tripId').equals(tripId).toArray(),
    db.checklist.where('tripId').equals(tripId).toArray(),
    db.expenses.where('tripId').equals(tripId).toArray(),
    db.itinerary.where('tripId').equals(tripId).toArray(),
    db.media.where('tripId').equals(tripId).toArray()
  ]);

  const zip = new JSZip();
  const mediaFolder = zip.folder('media')!;

  const mediaManifest: TripExportBundle['media'] = [];
  for (const m of media) {
    const ext = m.mimeType.split('/')[1] ?? 'bin';
    const fileRef = `media/${m.id}.${ext}`;
    mediaFolder.file(`${m.id}.${ext}`, m.blob);

    let thumbnailRef: string | null = null;
    if (m.thumbnailBlob) {
      thumbnailRef = `media/${m.id}_thumb.jpg`;
      mediaFolder.file(`${m.id}_thumb.jpg`, m.thumbnailBlob);
    }

    mediaManifest.push({
      id: m.id,
      entryId: m.entryId,
      kind: m.kind,
      mimeType: m.mimeType,
      fileName: m.fileName,
      caption: m.caption,
      takenAt: m.takenAt,
      createdAt: m.createdAt,
      fileRef,
      thumbnailRef
    });
  }

  const bundle: TripExportBundle = {
    formatVersion: 1,
    exportedAt: new Date().toISOString(),
    trip,
    journalEntries,
    checklist,
    expenses,
    itinerary,
    media: mediaManifest
  };

  zip.file(MANIFEST_NAME, JSON.stringify(bundle, null, 2));

  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
}

/**
 * Importe un voyage depuis une archive générée par `exportTripToZip`.
 * Toutes les données sont réinsérées avec de nouveaux identifiants pour
 * éviter tout conflit avec des voyages déjà présents sur l'appareil.
 */
export async function importTripFromZip(file: Blob): Promise<string> {
  const zip = await JSZip.loadAsync(file);
  const manifestFile = zip.file(MANIFEST_NAME);
  if (!manifestFile) throw new Error("Archive invalide : fichier trip.json manquant.");

  const bundle: TripExportBundle = JSON.parse(await manifestFile.async('string'));

  const idMap = new Map<string, string>();
  const newTripId = uuid();
  idMap.set(bundle.trip.id, newTripId);

  const now = new Date().toISOString();

  await db.transaction('rw', [db.trips, db.journalEntries, db.checklist, db.expenses, db.itinerary, db.media], async () => {
    await db.trips.add({ ...bundle.trip, id: newTripId, createdAt: bundle.trip.createdAt, updatedAt: now });

    for (const entry of bundle.journalEntries) {
      const newId = uuid();
      idMap.set(entry.id, newId);
      await db.journalEntries.add({ ...entry, id: newId, tripId: newTripId });
    }
    for (const item of bundle.checklist) {
      await db.checklist.add({ ...item, id: uuid(), tripId: newTripId });
    }
    for (const expense of bundle.expenses) {
      await db.expenses.add({ ...expense, id: uuid(), tripId: newTripId });
    }
    for (const point of bundle.itinerary) {
      await db.itinerary.add({ ...point, id: uuid(), tripId: newTripId });
    }
    for (const m of bundle.media) {
      const fileEntry = zip.file(m.fileRef);
      if (!fileEntry) continue;
      const blob = await fileEntry.async('blob');
      let thumbnailBlob: Blob | null = null;
      if (m.thumbnailRef) {
        const thumbEntry = zip.file(m.thumbnailRef);
        if (thumbEntry) thumbnailBlob = await thumbEntry.async('blob');
      }
      await db.media.add({
        id: uuid(),
        tripId: newTripId,
        entryId: m.entryId ? idMap.get(m.entryId) ?? null : null,
        kind: m.kind,
        blob: blob.slice(0, blob.size, m.mimeType),
        thumbnailBlob,
        mimeType: m.mimeType,
        fileName: m.fileName,
        caption: m.caption,
        takenAt: m.takenAt,
        createdAt: m.createdAt
      });
    }
  });

  return newTripId;
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
