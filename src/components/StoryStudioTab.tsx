import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import { useTrip } from '@/contexts/TripContext';
import { generateStoryImage } from '@/utils/canvasStory';
import { useObjectUrl } from '@/components/Gallery/GalleryTab';
import type { MediaItem } from '@/types';

export default function StoryStudioTab() {
  const { trip, tripId } = useTrip();
  const media = useLiveQuery(
    () => db.media.where('tripId').equals(tripId).and((m) => m.kind === 'photo').reverse().sortBy('takenAt'),
    [tripId]
  );
  const entries = useLiveQuery(() => db.journalEntries.where('tripId').equals(tripId).sortBy('date'), [tripId]);

  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [dateText, setDateText] = useState('');
  const [placeText, setPlaceText] = useState('');
  const [quoteText, setQuoteText] = useState('');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (media && media.length > 0 && !selectedMedia) setSelectedMedia(media[0]);
  }, [media, selectedMedia]);

  useEffect(() => {
    if (selectedMedia?.entryId) {
      const linked = entries?.find((e) => e.id === selectedMedia.entryId);
      if (linked) {
        setPlaceText((prev) => prev || linked.placeName);
        setQuoteText((prev) => prev || linked.text.slice(0, 140));
        setDateText((prev) => prev || new Date(linked.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }));
      }
    }
  }, [selectedMedia, entries]);

  const previewUrl = useObjectUrl(selectedMedia?.blob ?? null);

  const accentColor = trip?.coverColor ?? '#6B8F71';

  async function handleGenerate() {
    if (!selectedMedia) return;
    setGenerating(true);
    try {
      const blob = await generateStoryImage({
        photoBlob: selectedMedia.blob,
        dateText: dateText || new Date().toLocaleDateString('fr-FR'),
        placeText: placeText || trip?.destination || '',
        quoteText: quoteText || trip?.title || '',
        accentColor
      });
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultUrl(URL.createObjectURL(blob));
    } finally {
      setGenerating(false);
    }
  }

  if (media === undefined) return null;

  if (media.length === 0) {
    return (
      <div className="empty-state">
        <p>Ajoute d'abord des photos dans la Galerie pour créer une Story.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.1fr) minmax(220px, 0.9fr)', gap: 24, alignItems: 'start' }}>
      <div className="card">
        <h3 style={{ fontSize: '1rem', marginBottom: 12 }}>1. Choisis une photo</h3>
        <div className="grid media-grid" style={{ marginBottom: 20 }}>
          {media.map((m) => (
            <StoryThumb key={m.id} item={m} selected={m.id === selectedMedia?.id} onClick={() => setSelectedMedia(m)} />
          ))}
        </div>

        <h3 style={{ fontSize: '1rem', marginBottom: 12 }}>2. Personnalise le texte</h3>
        <div className="field-row">
          <div className="field">
            <label htmlFor="story-date">Date</label>
            <input id="story-date" value={dateText} onChange={(e) => setDateText(e.target.value)} placeholder="12 juillet 2026" />
          </div>
          <div className="field">
            <label htmlFor="story-place">Lieu</label>
            <input id="story-place" value={placeText} onChange={(e) => setPlaceText(e.target.value)} placeholder="Vík í Mýrdal" />
          </div>
        </div>
        <div className="field">
          <label htmlFor="story-quote">Citation</label>
          <textarea id="story-quote" value={quoteText} onChange={(e) => setQuoteText(e.target.value)} placeholder="Une phrase marquante de ton journal…" />
        </div>

        <button className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
          {generating ? 'Génération…' : '✨ Générer la Story'}
        </button>
      </div>

      <div className="card" style={{ position: 'sticky', top: 16 }}>
        <h3 style={{ fontSize: '1rem', marginBottom: 12 }}>Aperçu</h3>
        <div style={{ aspectRatio: '9/16', background: '#000', borderRadius: 'var(--radius-sm)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {resultUrl ? (
            <img src={resultUrl} alt="Story générée" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : previewUrl ? (
            <img src={previewUrl} alt="Aperçu photo" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} />
          ) : null}
        </div>
        {resultUrl && (
          <a className="btn btn-primary" style={{ marginTop: 12, width: '100%', justifyContent: 'center' }} href={resultUrl} download={`story-${Date.now()}.png`}>
            ⬇ Télécharger
          </a>
        )}
      </div>
    </div>
  );
}

function StoryThumb({ item, selected, onClick }: { item: MediaItem; selected: boolean; onClick: () => void }) {
  const url = useObjectUrl(item.thumbnailBlob ?? item.blob);
  return (
    <div
      className="media-tile"
      onClick={onClick}
      style={{ outline: selected ? '3px solid var(--color-sage)' : 'none' }}
    >
      <img src={url ?? undefined} alt="" />
    </div>
  );
}
