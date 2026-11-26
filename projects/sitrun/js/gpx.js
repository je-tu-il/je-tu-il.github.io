/**
 * SitRun - Générateur et parseur de fichiers GPX 1.1 compatibles Strava & Garmin
 */

const GPXManager = (() => {
  /**
   * Formate une date en ISO 8601 UTC stricte (ex: 2026-10-21T07:30:00Z)
   */
  function formatISOUtc(date) {
    return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
  }

  /**
   * Échappement XML
   */
  function escapeXml(unsafe) {
    if (!unsafe) return '';
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
      }
    });
  }

  /**
   * Génère le document XML GPX 1.1 complet
   * 
   * @param {Object} simulationResult - Résultat produit par Simulator.simulateActivity
   * @param {Object} metadata - Informations complémentaires { name, sport, deviceName }
   * @returns {string} Fichier GPX au format texte XML
   */
  function buildGPX(simulationResult, metadata = {}) {
    const { trackpoints, stats } = simulationResult;
    const activityName = metadata.name || 'Sortie SitRun';
    const sport = metadata.sport || 'running';
    const device = metadata.deviceName || stats.deviceName || 'Garmin Forerunner 965';

    const startTimeUtc = formatISOUtc(stats.startTime);

    // Mappage sport pour balise type Strava / GPX
    let typeTag = 'running';
    if (sport === 'cycling') typeTag = 'cycling';
    else if (sport === 'walking') typeTag = 'walking';

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      `<gpx creator="${escapeXml(device)}" version="1.1"`,
      '  xmlns="http://www.topografix.com/GPX/1/1"',
      '  xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1"',
      '  xmlns:gpxx="http://www.garmin.com/xmlschemas/GpxExtensions/v3"',
      '  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"',
      '  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd http://www.garmin.com/xmlschemas/TrackPointExtension/v1 http://www.garmin.com/xmlschemas/TrackPointExtensionv1.xsd">',
      '  <metadata>',
      `    <name>${escapeXml(activityName)}</name>`,
      `    <time>${startTimeUtc}</time>`,
      '  </metadata>',
      '  <trk>',
      `    <name>${escapeXml(activityName)}</name>`,
      `    <type>${typeTag}</type>`,
      '    <trkseg>'
    ];

    for (let i = 0; i < trackpoints.length; i++) {
      const pt = trackpoints[i];
      const timeStr = formatISOUtc(pt.time);
      const ele = pt.ele !== undefined ? pt.ele : 30;

      xml.push(`      <trkpt lat="${pt.lat.toFixed(7)}" lon="${pt.lon.toFixed(7)}">`);
      xml.push(`        <ele>${ele.toFixed(1)}</ele>`);
      xml.push(`        <time>${timeStr}</time>`);

      // Extensions Garmin (Fréquence cardiaque et Cadence reconnues nativement par Strava)
      const hasHR = pt.hr !== null && pt.hr !== undefined && pt.hr > 0;
      const hasCad = pt.cad !== null && pt.cad !== undefined && pt.cad > 0;

      if (hasHR || hasCad) {
        xml.push('        <extensions>');
        xml.push('          <gpxtpx:TrackPointExtension>');
        if (hasHR) {
          xml.push(`            <gpxtpx:hr>${pt.hr}</gpxtpx:hr>`);
        }
        if (hasCad) {
          xml.push(`            <gpxtpx:cad>${pt.cad}</gpxtpx:cad>`);
        }
        xml.push('          </gpxtpx:TrackPointExtension>');
        xml.push('        </extensions>');
      }

      xml.push('      </trkpt>');
    }

    xml.push('    </trkseg>');
    xml.push('  </trk>');
    xml.push('</gpx>');

    return xml.join('\n');
  }

  /**
   * Déclenche le téléchargement du fichier GPX dans le navigateur
   */
  function downloadGPX(gpxContent, filename = 'activite_sitrun.gpx') {
    const blob = new Blob([gpxContent], { type: 'application/gpx+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  /**
   * Parse un fichier GPX existant pour en extraire la trace géographique [{lat, lon, ele}]
   */
  function parseGPX(xmlText) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'application/xml');

    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      throw new Error("Format GPX invalide ou fichier corrompu.");
    }

    const trkpts = doc.querySelectorAll('trkpt');
    if (!trkpts || trkpts.length === 0) {
      // Fallback: chercher les rtept (route points)
      const rtepts = doc.querySelectorAll('rtept');
      if (rtepts && rtepts.length > 0) {
        return Array.from(rtepts).map(pt => ({
          lat: parseFloat(pt.getAttribute('lat')),
          lon: parseFloat(pt.getAttribute('lon')),
          ele: pt.querySelector('ele') ? parseFloat(pt.querySelector('ele').textContent) : 30
        }));
      }
      throw new Error("Aucun point de trace (<trkpt>) trouvé dans ce fichier GPX.");
    }

    const points = [];
    for (let i = 0; i < trkpts.length; i++) {
      const pt = trkpts[i];
      const lat = parseFloat(pt.getAttribute('lat'));
      const lon = parseFloat(pt.getAttribute('lon'));
      const eleNode = pt.querySelector('ele');
      const ele = eleNode ? parseFloat(eleNode.textContent) : 30;

      if (!isNaN(lat) && !isNaN(lon)) {
        points.push({ lat, lon, ele });
      }
    }

    // Récupérer le nom s'il existe
    const nameNode = doc.querySelector('trk > name') || doc.querySelector('metadata > name');
    const activityName = nameNode ? nameNode.textContent.trim() : 'Trace importée';

    return {
      points,
      activityName
    };
  }

  return {
    buildGPX,
    downloadGPX,
    parseGPX
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = GPXManager;
}
