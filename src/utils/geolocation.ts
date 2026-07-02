export interface GeoPosition {
  lat: number;
  lng: number;
  accuracy: number;
}

/**
 * Récupère la position actuelle via l'API Geolocation native du navigateur.
 * Fonctionne hors-ligne (GPS/puce de localisation), contrairement à la météo
 * ou au fond de carte qui nécessitent une connexion.
 */
export function getCurrentPosition(): Promise<GeoPosition> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error("La géolocalisation n'est pas disponible sur cet appareil."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        });
      },
      (err) => reject(new Error(mapGeoError(err))),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  });
}

function mapGeoError(err: GeolocationPositionError): string {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return 'Accès à la localisation refusé. Autorise-le dans les réglages du navigateur.';
    case err.POSITION_UNAVAILABLE:
      return 'Position indisponible pour le moment.';
    case err.TIMEOUT:
      return "La récupération de la position a expiré, réessaie.";
    default:
      return 'Erreur de géolocalisation inconnue.';
  }
}
