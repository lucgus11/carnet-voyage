/**
 * Compression et redimensionnement d'images entièrement côté client
 * (Canvas API), sans aucun appel réseau. Utilisé à l'import dans la
 * galerie pour limiter le poids stocké dans IndexedDB et générer des
 * miniatures rapides à afficher dans la grille.
 */

export async function fileToImageBitmap(file: Blob): Promise<ImageBitmap> {
  return await createImageBitmap(file);
}

function drawScaled(bitmap: ImageBitmap, maxSize: number): HTMLCanvasElement {
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D non disponible');
  ctx.drawImage(bitmap, 0, 0, w, h);
  return canvas;
}

export async function compressImage(
  file: Blob,
  { maxSize = 1600, quality = 0.82 }: { maxSize?: number; quality?: number } = {}
): Promise<Blob> {
  const bitmap = await fileToImageBitmap(file);
  const canvas = drawScaled(bitmap, maxSize);
  bitmap.close();
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Échec de compression'))),
      'image/jpeg',
      quality
    );
  });
}

export async function makeThumbnail(file: Blob): Promise<Blob> {
  return compressImage(file, { maxSize: 360, quality: 0.75 });
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
