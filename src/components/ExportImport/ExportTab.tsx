import { useState } from 'react';
import { useTrip } from '@/contexts/TripContext';
import { exportTripToZip, downloadBlob } from '@/utils/exportImport';
import { generateTripPdf } from '@/utils/pdfGenerator';

function slugify(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function ExportTab() {
  const { trip, tripId } = useTrip();
  const [exportingZip, setExportingZip] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [message, setMessage] = useState('');

  async function handleExportZip() {
    setExportingZip(true);
    setMessage('');
    try {
      const blob = await exportTripToZip(tripId);
      downloadBlob(blob, `${slugify(trip?.title ?? 'voyage')}-sauvegarde.zip`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Échec de l'export.");
    } finally {
      setExportingZip(false);
    }
  }

  async function handleExportPdf() {
    setExportingPdf(true);
    setMessage('');
    try {
      const blob = await generateTripPdf(tripId);
      downloadBlob(blob, `${slugify(trip?.title ?? 'voyage')}-carnet.pdf`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Échec de la génération du PDF.");
    } finally {
      setExportingPdf(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(260px,1fr))' }}>
      <div className="card">
        <h3 style={{ fontSize: '1.05rem', marginBottom: 6 }}>💾 Sauvegarde complète (.zip)</h3>
        <p className="muted" style={{ fontSize: '0.88rem' }}>
          Exporte l'intégralité du voyage (journal, checklist, budget, itinéraire et médias en qualité originale)
          dans une archive à conserver ou à transférer sur un autre appareil.
        </p>
        <button className="btn btn-primary" onClick={handleExportZip} disabled={exportingZip}>
          {exportingZip ? 'Préparation…' : '⬇ Télécharger la sauvegarde'}
        </button>
      </div>

      <div className="card">
        <h3 style={{ fontSize: '1.05rem', marginBottom: 6 }}>📄 Carnet en PDF</h3>
        <p className="muted" style={{ fontSize: '0.88rem' }}>
          Génère un document mis en page avec les étapes de l'itinéraire, les textes du journal,
          la galerie photo et le bilan du budget — idéal à imprimer ou partager.
        </p>
        <button className="btn btn-primary" onClick={handleExportPdf} disabled={exportingPdf}>
          {exportingPdf ? 'Génération…' : '⬇ Générer le PDF'}
        </button>
      </div>

      {message && <p style={{ color: 'var(--color-rust)', gridColumn: '1 / -1' }}>{message}</p>}

      <div className="card" style={{ gridColumn: '1 / -1' }}>
        <h3 style={{ fontSize: '1.05rem', marginBottom: 6 }}>🔒 Confidentialité</h3>
        <p className="muted" style={{ fontSize: '0.88rem', margin: 0 }}>
          Aucune de ces opérations ne transmet de donnée sur un réseau : tout est calculé et
          assemblé localement dans ton navigateur, y compris hors-ligne.
        </p>
      </div>
    </div>
  );
}
