export interface StoryData {
  photoBlob: Blob;
  dateText: string;
  placeText: string;
  quoteText: string;
  accentColor: string;
}

const WIDTH = 1080;
const HEIGHT = 1920;

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Génère, entièrement côté client via Canvas 2D (aucun réseau requis),
 * un visuel vertical 9:16 prêt à partager sur les réseaux sociaux :
 * photo + date + lieu + citation extraite du journal.
 */
export async function generateStoryImage(data: StoryData): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D non disponible');

  // --- Photo de fond, recadrée en "cover" ---
  const bitmap = await createImageBitmap(data.photoBlob);
  const photoHeight = HEIGHT * 0.62;
  const scale = Math.max(WIDTH / bitmap.width, photoHeight / bitmap.height);
  const drawW = bitmap.width * scale;
  const drawH = bitmap.height * scale;
  ctx.drawImage(bitmap, (WIDTH - drawW) / 2, (photoHeight - drawH) / 2, drawW, drawH);
  bitmap.close();

  // --- Fondu dégradé entre la photo et le bas texte ---
  const fade = ctx.createLinearGradient(0, photoHeight - 260, 0, photoHeight);
  fade.addColorStop(0, 'rgba(27,42,61,0)');
  fade.addColorStop(1, 'rgba(27,42,61,1)');
  ctx.fillStyle = fade;
  ctx.fillRect(0, photoHeight - 260, WIDTH, 260);

  // --- Bandeau bas "papier" ---
  ctx.fillStyle = '#1b2a3d';
  ctx.fillRect(0, photoHeight, WIDTH, HEIGHT - photoHeight);

  // Liseré d'accent
  ctx.fillStyle = data.accentColor;
  ctx.fillRect(0, photoHeight, WIDTH, 8);

  // --- Date + lieu ---
  ctx.fillStyle = data.accentColor;
  ctx.font = '600 34px "JetBrains Mono", monospace';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(data.dateText.toUpperCase(), 64, photoHeight + 90);

  ctx.fillStyle = '#ede6d6';
  ctx.font = '600 44px Inter, sans-serif';
  ctx.fillText(`📍 ${data.placeText}`, 64, photoHeight + 150);

  // --- Citation ---
  ctx.fillStyle = '#f7f2e7';
  ctx.font = 'italic 46px Fraunces, Georgia, serif';
  const lines = wrapText(ctx, `“${data.quoteText}”`, WIDTH - 128);
  let y = photoHeight + 230;
  for (const line of lines.slice(0, 6)) {
    ctx.fillText(line, 64, y);
    y += 58;
  }

  // --- Filigrane discret ---
  ctx.fillStyle = 'rgba(237,230,214,0.55)';
  ctx.font = '600 26px "JetBrains Mono", monospace';
  ctx.fillText('CARNET DE VOYAGE', 64, HEIGHT - 48);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Échec de génération'))), 'image/png', 0.95);
  });
}
