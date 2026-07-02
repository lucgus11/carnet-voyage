import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { v4 as uuid } from 'uuid';
import { db } from '@/db/db';
import { useTrip } from '@/contexts/TripContext';
import { compressImage, makeThumbnail } from '@/utils/image';
import type { MediaItem } from '@/types';
import MediaLightbox from './MediaLightbox';

export default function GalleryTab() {
  const { tripId } = useTrip();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [selected, setSelected] = useState<MediaItem | null>(null);

  const media = useLiveQuery(
    () => db.media.where('tripId').equals(tripId).reverse().sortBy('takenAt'),
    [tripId]
  );
  const entries = useLiveQuery(() => db.journalEntries.where('tripId').equals(tripId).toArray(), [tripId]);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    setUploading(true);
    setProgress({ done: 0, total: files.length });

    for (const file of files) {
      const isVideo = file.type.startsWith('video/');
      const now = new Date().toISOString();
      let blob: Blob = file;
      let thumbnailBlob: Blob | null = null;

      try {
        if (!isVideo) {
          blob = await compressImage(file);
          thumbnailBlob = await makeThumbnail(file);
        }
        const item: MediaItem = {
          id: uuid(),
          tripId,
          entryId: null,
          kind: isVideo ? 'video' : 'photo',
          blob,
          thumbnailBlob,
          mimeType: isVideo ? file.type : 'image/jpeg',
          fileName: file.name,
          caption: '',
          takenAt: now,
          createdAt: now
        };
        await db.media.add(item);
      } catch (err) {
        console.error("Échec d'import du média", file.name, err);
      }
      setProgress((p) => ({ ...p, done: p.done + 1 }));
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <div>
      <div className="section-title">
        <h3 style={{ fontSize: '1.05rem' }}>Galerie ({media?.length ?? 0})</h3>
        <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer' }}>
          {uploading ? `Import ${progress.done}/${progress.total}…` : '+ Ajouter des médias'}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            hidden
            onChange={(e) => handleFiles(e.target.files)}
          />
        </label>
      </div>

      {media === undefined || media.length === 0 ? (
        <div className="empty-state">
          <p>Aucun média pour l'instant.</p>
          <p className="muted">Les photos et vidéos sont stockées directement sur ton appareil.</p>
        </div>
      ) : (
        <div className="grid media-grid">
          {media.map((m) => (
            <MediaTile key={m.id} item={m} onOpen={() => setSelected(m)} />
          ))}
        </div>
      )}

      {selected && (
        <MediaLightbox
          item={selected}
          entries={entries ?? []}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function MediaTile({ item, onOpen }: { item: MediaItem; onOpen: () => void }) {
  const url = useObjectUrl(item.thumbnailBlob ?? item.blob);
  return (
    <div className="media-tile" onClick={onOpen}>
      {item.kind === 'video' ? (
        <video src={url ?? undefined} muted />
      ) : (
        <img src={url ?? undefined} alt={item.caption || item.fileName} loading="lazy" />
      )}
      {item.kind === 'video' && (
        <span style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 11, padding: '2px 6px', borderRadius: 4 }}>
          ▶ vidéo
        </span>
      )}
    </div>
  );
}

export function useObjectUrl(blob: Blob | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffectOnBlob(blob, setUrl);

  return url;
}

function useEffectOnBlob(blob: Blob | null, setUrl: (u: string | null) => void) {
  // Regroupé ici pour garder l'import useEffect localisé à cet unique usage.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!blob) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [blob]);
}
