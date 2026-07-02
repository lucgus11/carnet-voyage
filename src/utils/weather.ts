/**
 * Récupération météo optionnelle via Open-Meteo (gratuit, sans clé API).
 * N'est appelée que si l'utilisateur est en ligne ; en cas d'échec ou hors-ligne,
 * l'appelant doit proposer la saisie manuelle du champ météo.
 */

const WEATHER_CODES: Record<number, string> = {
  0: 'Ciel dégagé',
  1: 'Plutôt dégagé',
  2: 'Partiellement nuageux',
  3: 'Couvert',
  45: 'Brouillard',
  48: 'Brouillard givrant',
  51: 'Bruine légère',
  53: 'Bruine',
  55: 'Bruine forte',
  61: 'Pluie légère',
  63: 'Pluie',
  65: 'Pluie forte',
  71: 'Neige légère',
  73: 'Neige',
  75: 'Neige forte',
  80: 'Averses',
  81: 'Averses fortes',
  82: 'Averses violentes',
  95: 'Orage',
  96: 'Orage avec grêle'
};

export async function fetchWeatherText(lat: number, lng: number): Promise<string> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Service météo indisponible');
  const data = await res.json();
  const temp = Math.round(data?.current?.temperature_2m);
  const code = data?.current?.weather_code;
  const label = WEATHER_CODES[code] ?? 'Conditions inconnues';
  return `${label}, ${temp}°C`;
}
