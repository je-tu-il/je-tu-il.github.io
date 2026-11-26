/**
 * SitRun - Gestionnaire de la carte interactive Leaflet
 */

const MapManager = (() => {
  let map = null;
  let baseLayers = {};
  let currentLayer = null;

  // Waypoints définis par l'utilisateur (points de contrôle) : [[lat, lon], ...]
  let waypoints = [];
  // Historique pour Undo / Redo
  let historyStack = [];
  let redoStack = [];

  // Tracé complet interpolé/routé : [{lat, lon, ele?}]
  let currentTrack = [];

  // Couches graphiques Leaflet
  let routeLayer = null;
  let shadowLayer = null;
  let waypointMarkersLayer = null;
  let kmMarkersLayer = null;
  let startMarker = null;
  let endMarker = null;
  let hoverMarker = null;

  // Configuration
  let snapToRoads = true;
  let currentSport = 'running';

  // Callbacks
  let onRouteUpdatedCallback = null;

  /**
   * Initialisation de la carte
   */
  function init(mapElementId, onRouteUpdated) {
    onRouteUpdatedCallback = onRouteUpdated;

    // Fond de carte CartoDB Positron par défaut
    const positron = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
      maxZoom: 19
    });

    const darkMatter = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
      maxZoom: 19
    });

    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    });

    const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy; Esri, Maxar, Earthstar Geographics',
      maxZoom: 19
    });

    const topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenTopoMap &copy; OpenStreetMap',
      maxZoom: 17
    });

    baseLayers = {
      'Voyager (Clair)': positron,
      'Dark (Sombre)': darkMatter,
      'OpenStreetMap': osm,
      'Satellite': satellite,
      'Topographique (Relief)': topo
    };

    // Coordonnées initiales (Paris centre par défaut)
    map = L.map(mapElementId, {
      center: [48.8566, 2.3522],
      zoom: 13,
      layers: [positron],
      zoomControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Initialiser les groupes de couches
    shadowLayer = L.polyline([], { color: '#000000', weight: 8, opacity: 0.25, lineCap: 'round', lineJoin: 'round' }).addTo(map);
    routeLayer = L.polyline([], { color: '#fc5200', weight: 5, opacity: 0.95, lineCap: 'round', lineJoin: 'round' }).addTo(map);
    waypointMarkersLayer = L.layerGroup().addTo(map);
    kmMarkersLayer = L.layerGroup().addTo(map);

    // Curseur de survol interactif
    const hoverIcon = L.divIcon({
      className: 'hover-pulse-marker',
      html: '<div class="pulse-ring"></div><div class="pulse-dot"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
    hoverMarker = L.marker([0, 0], { icon: hoverIcon, interactive: false });

    // Clic sur la carte = ajout de waypoint
    map.on('click', handleMapClick);

    // Tenter de centrer sur la position de l'utilisateur si disponible
    tryGeolocateUser();

    return map;
  }

  function tryGeolocateUser() {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          if (waypoints.length === 0) {
            map.setView([pos.coords.latitude, pos.coords.longitude], 14);
          }
        },
        () => {
          // Localisation refusée ou indisponible : reste sur Paris
        },
        { timeout: 4000 }
      );
    }
  }

  /**
   * Clic utilisateur sur la carte
   */
  async function handleMapClick(e) {
    const lat = Number(e.latlng.lat.toFixed(6));
    const lon = Number(e.latlng.lng.toFixed(6));

    saveStateForUndo();
    waypoints.push([lat, lon]);
    redoStack = []; // Vider le redo

    await updateRouteAndUI();
  }

  /**
   * Sauvegarde l'état pour le Undo
   */
  function saveStateForUndo() {
    historyStack.push(JSON.parse(JSON.stringify(waypoints)));
    if (historyStack.length > 50) historyStack.shift();
  }

  /**
   * Annuler (Undo)
   */
  async function undo() {
    if (historyStack.length === 0) return false;
    redoStack.push(JSON.parse(JSON.stringify(waypoints)));
    waypoints = historyStack.pop();
    await updateRouteAndUI();
    return true;
  }

  /**
   * Rétablir (Redo)
   */
  async function redo() {
    if (redoStack.length === 0) return false;
    historyStack.push(JSON.parse(JSON.stringify(waypoints)));
    waypoints = redoStack.pop();
    await updateRouteAndUI();
    return true;
  }

  /**
   * Boucler le parcours vers le point de départ
   */
  async function loopRoute() {
    if (waypoints.length < 2) return;
    saveStateForUndo();
    const firstPt = waypoints[0];
    waypoints.push([firstPt[0], firstPt[1]]);
    await updateRouteAndUI();
  }

  /**
   * Inverser le sens du parcours
   */
  async function reverseRoute() {
    if (waypoints.length < 2) return;
    saveStateForUndo();
    waypoints.reverse();
    await updateRouteAndUI();
  }

  /**
   * Effacer tout le tracé
   */
  function clearRoute() {
    saveStateForUndo();
    waypoints = [];
    currentTrack = [];
    redoStack = [];
    renderMapElements();
    if (onRouteUpdatedCallback) {
      onRouteUpdatedCallback([], []);
    }
  }

  /**
   * Charge une trace externe (ex: GPX importé)
   */
  async function loadImportedTrack(points) {
    if (!points || points.length === 0) return;
    saveStateForUndo();

    currentTrack = points;
    // Sélectionner des waypoints représentatifs pour l'édition
    waypoints = [];
    const step = Math.max(1, Math.floor(points.length / 25));
    for (let i = 0; i < points.length; i += step) {
      waypoints.push([points[i].lat, points[i].lon]);
    }
    const last = points[points.length - 1];
    if (waypoints[waypoints.length - 1][0] !== last.lat) {
      waypoints.push([last.lat, last.lon]);
    }

    renderMapElements();
    fitRouteBounds();

    if (onRouteUpdatedCallback) {
      onRouteUpdatedCallback(currentTrack, waypoints);
    }
  }

  /**
   * Recalcule l'itinéraire et met à jour l'affichage
   */
  async function updateRouteAndUI() {
    if (waypoints.length < 2) {
      currentTrack = waypoints.map(w => ({ lat: w[0], lon: w[1] }));
      renderMapElements();
      if (onRouteUpdatedCallback) {
        onRouteUpdatedCallback(currentTrack, waypoints);
      }
      return;
    }

    // Calcul du tracé complet
    currentTrack = await RoutingService.computeFullRoute(waypoints, snapToRoads, currentSport);

    // Enrichir avec l'altitude Open-Meteo
    currentTrack = await ElevationService.enrichWithElevation(currentTrack);

    renderMapElements();

    if (onRouteUpdatedCallback) {
      onRouteUpdatedCallback(currentTrack, waypoints);
    }
  }

  /**
   * Rendu visuel de la trace, waypoints, marqueurs km sur Leaflet
   */
  function renderMapElements() {
    // 1. Tracé polyline
    const latlngs = currentTrack.map(p => [p.lat, p.lon]);
    routeLayer.setLatLngs(latlngs);
    shadowLayer.setLatLngs(latlngs);

    // 2. Nettoyer les marqueurs
    waypointMarkersLayer.clearLayers();
    kmMarkersLayer.clearLayers();

    if (startMarker) {
      map.removeLayer(startMarker);
      startMarker = null;
    }
    if (endMarker) {
      map.removeLayer(endMarker);
      endMarker = null;
    }

    if (waypoints.length === 0) return;

    // Marqueur de DÉPART (Vert)
    const startCoord = waypoints[0];
    const startIcon = L.divIcon({
      className: 'sitrun-marker-start',
      html: '<div class="marker-badge start-badge"><span>🏁 DÉPART</span></div>',
      iconSize: [80, 30],
      iconAnchor: [40, 32]
    });
    startMarker = L.marker(startCoord, { icon: startIcon, zIndexOffset: 1000 }).addTo(map);

    // Marqueur d'ARRIVÉE (Orange Strava) si plus d'un point
    if (waypoints.length > 1) {
      const endCoord = waypoints[waypoints.length - 1];
      const endIcon = L.divIcon({
        className: 'sitrun-marker-end',
        html: '<div class="marker-badge end-badge"><span>🏆 ARRIVÉE</span></div>',
        iconSize: [80, 30],
        iconAnchor: [40, 32]
      });
      endMarker = L.marker(endCoord, { icon: endIcon, zIndexOffset: 1000 }).addTo(map);
    }

    // Points de contrôle manipulables (draggables)
    waypoints.forEach((wp, index) => {
      const isStartOrEnd = index === 0 || index === waypoints.length - 1;

      const wpIcon = L.divIcon({
        className: 'sitrun-control-point',
        html: `<div class="control-dot ${isStartOrEnd ? 'endpoint' : ''}">${index + 1}</div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      const marker = L.marker(wp, {
        icon: wpIcon,
        draggable: true
      });

      // Drag waypoint
      marker.on('dragend', async (e) => {
        saveStateForUndo();
        const newPos = e.target.getLatLng();
        waypoints[index] = [Number(newPos.lat.toFixed(6)), Number(newPos.lng.toFixed(6))];
        await updateRouteAndUI();
      });

      // Clic pour supprimer le waypoint
      marker.bindPopup(`
        <div style="font-family: Inter, sans-serif; text-align: center; padding: 4px;">
          <div style="font-weight: 600; margin-bottom: 6px;">Point #${index + 1}</div>
          <button id="del-wp-${index}" style="background: #ef4444; color: white; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 11px;">
            Supprimer ce point
          </button>
        </div>
      `);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`del-wp-${index}`);
        if (btn) {
          btn.onclick = async () => {
            saveStateForUndo();
            waypoints.splice(index, 1);
            await updateRouteAndUI();
          };
        }
      });

      waypointMarkersLayer.addLayer(marker);
    });

    // 3. Marqueurs de kilomètres (KM Badges)
    renderKmBadges();
  }

  /**
   * Place des pastilles élégantes "1 km", "2 km", etc. le long du parcours
   */
  function renderKmBadges() {
    if (currentTrack.length < 2) return;

    let totalDist = 0;
    let nextKm = 1000;

    for (let i = 0; i < currentTrack.length - 1; i++) {
      const p1 = currentTrack[i];
      const p2 = currentTrack[i + 1];
      const d = Simulator.haversineDistance(p1.lat, p1.lon, p2.lat, p2.lon);

      if (totalDist + d >= nextKm) {
        const ratio = (nextKm - totalDist) / d;
        const kmLat = p1.lat + (p2.lat - p1.lat) * ratio;
        const kmLon = p1.lon + (p2.lon - p1.lon) * ratio;
        const kmNumber = Math.round(nextKm / 1000);

        const kmIcon = L.divIcon({
          className: 'sitrun-km-badge',
          html: `<div class="km-bubble">${kmNumber}</div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        const kmMarker = L.marker([kmLat, kmLon], { icon: kmIcon, interactive: false });
        kmMarkersLayer.addLayer(kmMarker);

        nextKm += 1000;
      }
      totalDist += d;
    }
  }

  /**
   * Centre la vue sur l'ensemble de la trace
   */
  function fitRouteBounds() {
    if (currentTrack.length > 1) {
      const bounds = L.latLngBounds(currentTrack.map(p => [p.lat, p.lon]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }

  /**
   * Curseur synchronisé avec le graphique d'altitude
   */
  function setHoverPoint(point) {
    if (!point) {
      if (map.hasLayer(hoverMarker)) {
        map.removeLayer(hoverMarker);
      }
      return;
    }

    hoverMarker.setLatLng([point.lat, point.lon]);
    if (!map.hasLayer(hoverMarker)) {
      hoverMarker.addTo(map);
    }
  }

  /**
   * Changement de fond de carte
   */
  function switchBaseLayer(layerName) {
    if (baseLayers[layerName]) {
      Object.values(baseLayers).forEach(layer => {
        if (map.hasLayer(layer)) map.removeLayer(layer);
      });
      map.addLayer(baseLayers[layerName]);
    }
  }

  /**
   * Recherche et centrage par adresse / ville (Nominatim)
   */
  async function searchLocation(query) {
    if (!query || query.trim().length < 2) return [];

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`;
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'SitRun-Web/1.0' }
      });
      if (!response.ok) return [];
      const results = await response.json();
      return results.map(r => ({
        label: r.display_name,
        lat: parseFloat(r.lat),
        lon: parseFloat(r.lon)
      }));
    } catch (err) {
      console.warn('Erreur géocodage Nominatim:', err);
      return [];
    }
  }

  function goToLocation(lat, lon, zoom = 14) {
    map.flyTo([lat, lon], zoom, { duration: 1.2 });
  }

  return {
    init,
    undo,
    redo,
    loopRoute,
    reverseRoute,
    clearRoute,
    loadImportedTrack,
    setHoverPoint,
    switchBaseLayer,
    searchLocation,
    goToLocation,
    fitRouteBounds,
    getWaypoints: () => waypoints,
    getCurrentTrack: () => currentTrack,
    setSnapToRoads: (val) => {
      snapToRoads = val;
      updateRouteAndUI();
    },
    setSport: (sport) => {
      currentSport = sport;
      updateRouteAndUI();
    }
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MapManager;
}
