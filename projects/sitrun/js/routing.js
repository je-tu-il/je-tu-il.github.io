/**
 * SitRun - Service de routage OSRM (OpenStreetMap) avec fallback ligne droite
 */

const RoutingService = (() => {
  const OSRM_PUBLIC_URL = 'https://router.project-osrm.org/route/v1';

  /**
   * Calcule le tracé routé entre deux points (ou via plusieurs waypoints)
   * 
   * @param {Array} coords - Tableau de [lat, lon]
   * @param {string} profile - 'foot' (course/marche) ou 'bike' / 'driving' (vélo)
   * @returns {Promise<Array<{lat: number, lon: number}>>}
   */
  async function getRouteBetweenPoints(coords, profile = 'foot') {
    if (!coords || coords.length < 2) return [];

    // OSRM attend les coordonnées sous la forme lon,lat séparées par des points-virgules
    const coordString = coords.map(c => `${c[1].toFixed(6)},${c[0].toFixed(6)}`).join(';');
    const osrmProfile = profile === 'bike' ? 'bike' : 'foot';
    const url = `${OSRM_PUBLIC_URL}/${osrmProfile}/${coordString}?overview=full&geometries=geojson&steps=false`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Erreur HTTP OSRM: ${response.status}`);
      }

      const data = await response.json();

      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const routeCoords = data.routes[0].geometry.coordinates; // [lon, lat]
        return routeCoords.map(c => ({
          lat: c[1],
          lon: c[0]
        }));
      } else {
        console.warn('OSRM: Aucun itinéraire trouvé, fallback en ligne droite.');
        return fallbackStraightLine(coords);
      }
    } catch (err) {
      console.warn('Erreur appel OSRM:', err.message, '- Utilisation de la ligne droite');
      return fallbackStraightLine(coords);
    }
  }

  /**
   * Fallback: ligne droite simple ou interpolée
   */
  function fallbackStraightLine(coords) {
    const points = [];
    for (let i = 0; i < coords.length; i++) {
      points.push({
        lat: coords[i][0],
        lon: coords[i][1]
      });
    }
    return points;
  }

  /**
   * Calcule le tracé complet à partir d'une liste de waypoints utilisateur
   * 
   * @param {Array<[number, number]>} waypoints - [[lat, lon], ...]
   * @param {boolean} snapToRoads - Si true, suit les sentiers/routes via OSRM
   * @param {string} sport - 'running' | 'cycling' | 'walking'
   */
  async function computeFullRoute(waypoints, snapToRoads = true, sport = 'running') {
    if (waypoints.length < 2) {
      return waypoints.map(w => ({ lat: w[0], lon: w[1] }));
    }

    if (!snapToRoads) {
      return fallbackStraightLine(waypoints);
    }

    const profile = sport === 'cycling' ? 'bike' : 'foot';
    const fullTrack = [];

    // On calcule segment par segment pour une granularité et réactivité optimales
    for (let i = 0; i < waypoints.length - 1; i++) {
      const p1 = waypoints[i];
      const p2 = waypoints[i + 1];

      const segmentCoords = await getRouteBetweenPoints([p1, p2], profile);

      if (segmentCoords.length > 0) {
        // Éviter de dupliquer le point de jonction
        if (fullTrack.length > 0) {
          fullTrack.push(...segmentCoords.slice(1));
        } else {
          fullTrack.push(...segmentCoords);
        }
      } else {
        if (fullTrack.length === 0) fullTrack.push({ lat: p1[0], lon: p1[1] });
        fullTrack.push({ lat: p2[0], lon: p2[1] });
      }
    }

    return fullTrack;
  }

  return {
    getRouteBetweenPoints,
    computeFullRoute,
    fallbackStraightLine
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = RoutingService;
}
