import { jsPDF } from 'jspdf';
import { db } from '@/db/db';
import { blobToDataUrl } from './image';

const MARGIN = 44;
const PAGE_W = 595.28; // A4 pt
const PAGE_H = 841.89;
const INK = '#1b2a3d';
const SAGE = '#4c6b52';
const BRASS = '#8a6d1f';
const LINE = '#c9bfa4';

/**
 * Génère un PDF complet du carnet (étapes, journal, galerie, bilan budget)
 * entièrement côté client via jsPDF, sans connexion réseau requise.
 */
export async function generateTripPdf(tripId: string): Promise<Blob> {
  const trip = await db.trips.get(tripId);
  if (!trip) throw new Error('Voyage introuvable');
  const [entries, expenses, itinerary, media] = await Promise.all([
    db.journalEntries.where('tripId').equals(tripId).sortBy('date'),
    db.expenses.where('tripId').equals(tripId).sortBy('date'),
    db.itinerary.where('tripId').equals(tripId).sortBy('order'),
    db.media.where('tripId').equals(tripId).sortBy('takenAt')
  ]);

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  let y = MARGIN;

  function newPageIfNeeded(extra = 0) {
    if (y + extra > PAGE_H - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
  }

  function heading(text: string) {
    newPageIfNeeded(50);
    doc.setDrawColor(LINE);
    doc.setLineWidth(1);
    doc.line(MARGIN, y, PAGE_W - MARGIN, y);
    y += 22;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(INK);
    doc.text(text, MARGIN, y);
    y += 20;
  }

  // --- Page de couverture ---
  doc.setFillColor(INK);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
  doc.setTextColor('#ede6d6');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(30);
  doc.text(trip.title, MARGIN, 320, { maxWidth: PAGE_W - MARGIN * 2 });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.text(trip.destination || '', MARGIN, 356);
  doc.setFontSize(11);
  doc.text(`${formatDate(trip.startDate)} — ${formatDate(trip.endDate)}`, MARGIN, 380);
  doc.setFontSize(9);
  doc.text('Carnet de voyage généré hors-ligne', MARGIN, PAGE_H - 48);

  doc.addPage();
  y = MARGIN;

  // --- Itinéraire ---
  if (itinerary.length > 0) {
    heading('Itinéraire');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(INK);
    itinerary.forEach((p, i) => {
      newPageIfNeeded(18);
      doc.setTextColor(SAGE);
      doc.text(`${i + 1}.`, MARGIN, y);
      doc.setTextColor(INK);
      doc.text(`${p.placeName} — ${formatDate(p.visitedAt)}`, MARGIN + 20, y);
      y += 16;
      if (p.note) {
        doc.setTextColor('#555');
        doc.setFontSize(9.5);
        doc.text(p.note, MARGIN + 20, y, { maxWidth: PAGE_W - MARGIN * 2 - 20 });
        doc.setFontSize(11);
        y += 14;
      }
    });
    y += 10;
  }

  // --- Journal ---
  if (entries.length > 0) {
    heading('Journal de bord');
    for (const entry of entries) {
      newPageIfNeeded(70);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12.5);
      doc.setTextColor(INK);
      doc.text(entry.title, MARGIN, y);
      y += 15;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(BRASS);
      const meta = [
        formatDateTime(entry.date),
        entry.placeName,
        entry.weatherText,
        entry.mood ?? ''
      ].filter(Boolean).join('   ·   ');
      doc.text(meta, MARGIN, y);
      y += 16;
      doc.setFontSize(10.5);
      doc.setTextColor('#333');
      const lines = doc.splitTextToSize(entry.text || '—', PAGE_W - MARGIN * 2);
      for (const line of lines) {
        newPageIfNeeded(14);
        doc.text(line, MARGIN, y);
        y += 14;
      }
      y += 12;
    }
  }

  // --- Galerie ---
  const photos = media.filter((m) => m.kind === 'photo');
  if (photos.length > 0) {
    doc.addPage();
    y = MARGIN;
    heading('Galerie photo');
    const cols = 2;
    const gap = 12;
    const cellW = (PAGE_W - MARGIN * 2 - gap * (cols - 1)) / cols;
    const cellH = cellW * 0.75;
    let col = 0;
    for (const m of photos) {
      if (col === 0) newPageIfNeeded(cellH + 30);
      const x = MARGIN + col * (cellW + gap);
      try {
        const dataUrl = await blobToDataUrl(m.thumbnailBlob ?? m.blob);
        doc.addImage(dataUrl, 'JPEG', x, y, cellW, cellH, undefined, 'FAST');
      } catch {
        doc.setFillColor('#ddd');
        doc.rect(x, y, cellW, cellH, 'F');
      }
      if (m.caption) {
        doc.setFontSize(8.5);
        doc.setTextColor('#555');
        doc.text(m.caption, x, y + cellH + 12, { maxWidth: cellW });
      }
      col++;
      if (col === cols) {
        col = 0;
        y += cellH + 30;
      }
    }
    if (col !== 0) y += cellH + 30;
  }

  // --- Budget ---
  if (expenses.length > 0) {
    doc.addPage();
    y = MARGIN;
    heading('Bilan du budget');
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    doc.setFontSize(11);
    doc.setTextColor(INK);
    doc.text(`Total dépensé : ${total.toFixed(2)} ${trip.currency}`, MARGIN, y);
    if (trip.budgetTotal > 0) {
      doc.text(`Budget prévisionnel : ${trip.budgetTotal.toFixed(2)} ${trip.currency}`, MARGIN, y + 16);
      y += 16;
    }
    y += 30;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Date', MARGIN, y);
    doc.text('Libellé', MARGIN + 70, y);
    doc.text('Catégorie', MARGIN + 300, y);
    doc.text('Montant', PAGE_W - MARGIN - 60, y);
    y += 8;
    doc.setDrawColor(LINE);
    doc.line(MARGIN, y, PAGE_W - MARGIN, y);
    y += 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    for (const e of expenses) {
      newPageIfNeeded(16);
      doc.text(formatDate(e.date), MARGIN, y);
      doc.text(e.label, MARGIN + 70, y, { maxWidth: 220 });
      doc.text(e.category, MARGIN + 300, y);
      doc.text(`${e.amount.toFixed(2)} ${trip.currency}`, PAGE_W - MARGIN - 60, y);
      y += 16;
    }
  }

  return doc.output('blob');
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}
function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
