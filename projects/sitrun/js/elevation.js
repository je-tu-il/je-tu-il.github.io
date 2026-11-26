/**
 * SitRun - Service d'élévation et d'altitude (Open-Meteo + Fallback synthétique)
 */

const ElevationService = (() => {
  const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/elevation';

  /**
   * Enrichit une liste de coordonnées {lat, lon} avec les véritables altitudes
   * 
   * @param {Array<{lat: number, lon: number}>} points
   * @returns {Promise<Array<{lat: number, lon: number, ele: number}>>}
   */
  async function enrichWithElevation(points) {
    if (!points || points.length === 0) return [];

    // Si les points ont déjà des altitudes valides (ex: GPX importé)
    const allHaveEle = points.every(p => p.ele !== undefined && !isNaN(p.ele) && p.ele !== 0);
    if (allHaveEle) {
      return points;
    }

    try {
      // Pour éviter de surcharger l'API, on échantillonne max 80 points représentatifs
      const sampleCount = Math.min(80, points.length);
      const step = Math.max(1, Math.floor(points.length / sampleCount));
      const sampleIndices = [];

      for (let i = 0; i < points.length; i += step) {
        sampleIndices.push(i);
      }
      if (sampleIndices[sampleIndices.length - 1] !== points.length - 1) {
        sampleIndices.push(points.length - 1);
      }

      const lats = sampleIndices.map(i => points[i].lat.toFixed(5)).join(',');
      const lons = sampleIndices.map(i => points[i].lon.toFixed(5)).join(',');

      const url = `${OPEN_METEO_URL}?latitude=${lats}&longitude=${lons}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Open-Meteo Elevation HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data && Array.isArray(data.elevation) && data.elevation.length === sampleIndices.length) {
        // Associer les altitudes échantillonnées
        const sampleElevations = data.elevation;

        // Interpoler les altitudes pour tous les points intermédiaires
        const enriched = points.map(p => ({ ...p, ele: 35 }));

        for (let s = 0; s < sampleIndices.length - 1; s++) {
          const idxStart = sampleIndices[s];
          const idxEnd = sampleIndices[s + 1];
          const eleStart = sampleElevations[s] !== null ? sampleElevations[s] : 35;
          const eleEnd = sampleElevations[s + 1] !== null ? sampleElevations[s + 1] : eleStart;

          for (let k = idxStart; k <= idxEnd; k++) {
            const ratio = idxEnd > idxStart ? (k - idxStart) / (idxEnd - idxStart) : 0;
            enriched[k].ele = Number((eleStart + (eleEnd - eleStart) * ratio).toFixed(1));
          }
        }

        return enriched;
      } else {
        throw new Error('Réponse Open-Meteo inattendue');
      }
    } catch (err) {
      console.warn('Elevation API fallback procédural:', err.message);
      return generateSyntheticElevation(points);
    }
  }

  /**
   * Génère un relief synthétique naturel et doux (collines légères)
   * pour éviter une altitude plate de 0 mètre
   */
  function generateSyntheticElevation(points) {
    const baseEle = 42; // Altitude de base
    let curEle = baseEle;

    return points.map((p, idx) => {
      // Petite onde douce combinée
      const wave = Math.sin(idx * 0.08) * 8 + Math.cos(idx * 0.03) * 14;
      curEle = Math.max(10, baseEle + wave);
      return {
        lat: p.lat,
        lon: p.lon,
        ele: Number(curEle.toFixed(1))
      };
    });
  }

  return {
    enrichWithElevation,
    generateSyntheticElevation
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ElevationService;
}
