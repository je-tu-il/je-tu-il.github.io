/**
 * SitRun - Contrôleur principal de l'application
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- Éléments du DOM ---
  const mapElement = document.getElementById('map');
  const chartCanvas = document.getElementById('elevation-chart');
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');

  // Stats
  const statDistance = document.getElementById('stat-distance');
  const statDuration = document.getElementById('stat-duration');
  const statPace = document.getElementById('stat-pace');
  const statDPlus = document.getElementById('stat-dplus');
  const statSpeed = document.getElementById('stat-speed');
  const statCalories = document.getElementById('stat-calories');
  const statAvgHR = document.getElementById('stat-avghr');

  // Contrôles du parcours
  const btnSnapMode = document.getElementById('btn-snap-mode');
  const btnUndo = document.getElementById('btn-undo');
  const btnRedo = document.getElementById('btn-redo');
  const btnLoop = document.getElementById('btn-loop');
  const btnReverse = document.getElementById('btn-reverse');
  const btnClear = document.getElementById('btn-clear');
  const btnFit = document.getElementById('btn-fit');
  const fileInputGpx = document.getElementById('file-input-gpx');
  const btnImportGpx = document.getElementById('btn-import-gpx');

  // Sélecteur de sport
  const sportButtons = document.querySelectorAll('.sport-btn');

  // Paramètres de course
  const inputActivityName = document.getElementById('input-activity-name');
  const inputDate = document.getElementById('input-date');
  const inputTime = document.getElementById('input-time');
  const quickTimeButtons = document.querySelectorAll('.btn-quick-time');

  // Allure & Vitesse
  const sliderPaceMin = document.getElementById('slider-pace-min');
  const inputPaceMin = document.getElementById('input-pace-min');
  const inputPaceSec = document.getElementById('input-pace-sec');
  const inputSpeedKmH = document.getElementById('input-speed-kmh');
  const displayPaceLabel = document.getElementById('display-pace-label');

  // Profil & Cardiaque
  const selectPacingProfile = document.getElementById('select-pacing-profile');
  const checkHeartRate = document.getElementById('check-heart-rate');
  const hrContainer = document.getElementById('hr-settings-container');
  const sliderHeartRate = document.getElementById('slider-heart-rate');
  const valHeartRate = document.getElementById('val-heart-rate');
  const checkWarmup = document.getElementById('check-warmup');
  const sliderCadence = document.getElementById('slider-cadence');
  const valCadence = document.getElementById('val-cadence');
  const selectDevice = document.getElementById('select-device');
  const checkGpsNoise = document.getElementById('check-gps-noise');

  // Export
  const btnExportGpx = document.getElementById('btn-export-gpx');
  const tableSplitsBody = document.getElementById('table-splits-body');

  // Modals & Toasts
  const modalStravaGuide = document.getElementById('modal-strava-guide');
  const btnOpenGuide = document.getElementById('btn-open-guide');
  const btnCloseGuide = document.getElementById('btn-close-guide');
  const toastContainer = document.getElementById('toast-container');

  // Navigation onglets
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  // --- État de l'application ---
  let currentSport = 'running';
  let snapToRoads = true;
  let currentSimulation = null;
  let currentTrackPoints = [];

  // Préréglages par sport
  const sportPresets = {
    running: {
      paceSec: 300, // 5:00 min/km
      speedKmH: 12.0,
      hr: 155,
      cadence: 172,
      name: 'Course à pied matinale 🏃'
    },
    cycling: {
      paceSec: 138, // 2:18 min/km
      speedKmH: 26.0,
      hr: 145,
      cadence: 85,
      name: 'Sortie vélo sur route 🚴'
    },
    walking: {
      paceSec: 654, // 10:54 min/km
      speedKmH: 5.5,
      hr: 105,
      cadence: 110,
      name: 'Marche active 🚶'
    }
  };

  // --- Initialisations ---

  // 1. Horodatage par défaut (Aujourd'hui 08:30)
  initDefaultDateTime();

  // 2. Initialisation de la carte
  MapManager.init('map', onRouteUpdated);

  // 3. Initialisation du graphique de profil
  ProfileChart.init(chartCanvas, (hoverPt) => {
    MapManager.setHoverPoint(hoverPt);
  });

  // --- Événements & Bindings ---

  // Onglets
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const targetPane = document.getElementById(btn.dataset.tab);
      if (targetPane) targetPane.classList.add('active');
    });
  });

  // Changement de sport
  sportButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      sportButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSport = btn.dataset.sport;

      // Appliquer les préréglages
      applySportPreset(currentSport);
      MapManager.setSport(currentSport);
    });
  });

  // Mode de routage (Snap route vs Ligne droite)
  btnSnapMode.addEventListener('click', () => {
    snapToRoads = !snapToRoads;
    if (snapToRoads) {
      btnSnapMode.classList.add('active');
      btnSnapMode.innerHTML = '<span class="icon">🛣️</span> Suivi de route';
      showToast('Mode suivi automatique des sentiers et routes activé');
    } else {
      btnSnapMode.classList.remove('active');
      btnSnapMode.innerHTML = '<span class="icon">📐</span> Ligne droite';
      showToast('Mode ligne droite / vol d\'oiseau activé');
    }
    MapManager.setSnapToRoads(snapToRoads);
  });

  // Outils de tracé
  btnUndo.addEventListener('click', async () => {
    const ok = await MapManager.undo();
    if (ok) showToast('Dernier point annulé');
  });

  btnRedo.addEventListener('click', async () => {
    const ok = await MapManager.redo();
    if (ok) showToast('Point rétabli');
  });

  btnLoop.addEventListener('click', async () => {
    await MapManager.loopRoute();
    showToast('Parcours bouclé vers le point de départ');
  });

  btnReverse.addEventListener('click', async () => {
    await MapManager.reverseRoute();
    showToast('Sens du parcours inversé');
  });

  btnClear.addEventListener('click', () => {
    if (confirm('Effacer l\'intégralité du tracé actuel ?')) {
      MapManager.clearRoute();
      showToast('Tracé effacé');
    }
  });

  btnFit.addEventListener('click', () => {
    MapManager.fitRouteBounds();
  });

  // Boutons rapides de temps
  quickTimeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.timeMode;
      const now = new Date();

      if (mode === 'morning') {
        // Ce matin à 08:30
        inputDate.value = formatDateForInput(now);
        inputTime.value = '08:30';
      } else if (mode === 'evening') {
        // Hier soir à 18:45
        const yesterday = new Date(now.getTime() - 24 * 3600 * 1000);
        inputDate.value = formatDateForInput(yesterday);
        inputTime.value = '18:45';
      } else if (mode === 'now') {
        // Maintenant
        inputDate.value = formatDateForInput(now);
        inputTime.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      }
      recalculateSimulation();
    });
  });

  // Synchronisation Allure (min/km) <-> Vitesse (km/h)
  sliderPaceMin.addEventListener('input', () => {
    const totalSec = parseInt(sliderPaceMin.value, 10);
    setPaceFromSeconds(totalSec);
    recalculateSimulation();
  });

  inputPaceMin.addEventListener('change', updatePaceFromInputs);
  inputPaceSec.addEventListener('change', updatePaceFromInputs);

  inputSpeedKmH.addEventListener('change', () => {
    const speed = parseFloat(inputSpeedKmH.value);
    if (!isNaN(speed) && speed > 0) {
      const totalSec = Math.round(3600 / speed);
      setPaceFromSeconds(totalSec, false);
      recalculateSimulation();
    }
  });

  function setPaceFromSeconds(totalSec, updateSpeedInput = true) {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    inputPaceMin.value = m;
    inputPaceSec.value = String(s).padStart(2, '0');
    sliderPaceMin.value = totalSec;

    const speedKmH = (3600 / totalSec).toFixed(2);
    if (updateSpeedInput) {
      inputSpeedKmH.value = speedKmH;
    }

    displayPaceLabel.textContent = `${m}:${String(s).padStart(2, '0')} min/km (${speedKmH} km/h)`;
  }

  function updatePaceFromInputs() {
    const m = parseInt(inputPaceMin.value, 10) || 5;
    const s = parseInt(inputPaceSec.value, 10) || 0;
    const totalSec = m * 60 + s;
    setPaceFromSeconds(totalSec);
    recalculateSimulation();
  }

  // Fréquence cardiaque
  checkHeartRate.addEventListener('change', () => {
    hrContainer.style.display = checkHeartRate.checked ? 'block' : 'none';
    recalculateSimulation();
  });

  sliderHeartRate.addEventListener('input', () => {
    valHeartRate.textContent = `${sliderHeartRate.value} bpm`;
    recalculateSimulation();
  });

  sliderCadence.addEventListener('input', () => {
    const unit = currentSport === 'cycling' ? 'rpm' : 'spm';
    valCadence.textContent = `${sliderCadence.value} ${unit}`;
    recalculateSimulation();
  });

  selectPacingProfile.addEventListener('change', recalculateSimulation);
  checkWarmup.addEventListener('change', recalculateSimulation);
  checkGpsNoise.addEventListener('change', recalculateSimulation);
  selectDevice.addEventListener('change', recalculateSimulation);

  // Recherche d'adresses / villes (Nominatim avec debounce)
  let searchTimeout = null;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    const query = searchInput.value.trim();
    if (query.length < 2) {
      searchResults.style.display = 'none';
      return;
    }

    searchTimeout = setTimeout(async () => {
      const results = await MapManager.searchLocation(query);
      renderSearchResults(results);
    }, 350);
  });

  function renderSearchResults(results) {
    searchResults.innerHTML = '';
    if (!results || results.length === 0) {
      searchResults.style.display = 'none';
      return;
    }

    results.forEach(res => {
      const item = document.createElement('div');
      item.className = 'search-item';
      item.textContent = res.label;
      item.addEventListener('click', () => {
        MapManager.goToLocation(res.lat, res.lon, 15);
        searchResults.style.display = 'none';
        searchInput.value = '';
      });
      searchResults.appendChild(item);
    });

    searchResults.style.display = 'block';
  }

  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
      searchResults.style.display = 'none';
    }
  });

  // Changement de style de fond de carte
  const layerSelect = document.getElementById('select-map-layer');
  if (layerSelect) {
    layerSelect.addEventListener('change', (e) => {
      MapManager.switchBaseLayer(e.target.value);
    });
  }

  // Import GPX existant
  btnImportGpx.addEventListener('click', () => {
    fileInputGpx.click();
  });

  fileInputGpx.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const parsed = GPXManager.parseGPX(evt.target.result);
        if (parsed.activityName) {
          inputActivityName.value = parsed.activityName;
        }
        await MapManager.loadImportedTrack(parsed.points);
        showToast(`Trace GPX chargée (${parsed.points.length} points) !`);
      } catch (err) {
        alert("Erreur lors de l'import GPX : " + err.message);
      }
    };
    reader.readAsText(file);
    fileInputGpx.value = '';
  });

  // Export GPX pour Strava
  btnExportGpx.addEventListener('click', () => {
    if (!currentSimulation || currentSimulation.trackpoints.length < 2) {
      alert("Veuillez d'abord tracer un parcours sur la carte en cliquant dessus !");
      return;
    }

    const activityName = inputActivityName.value.trim() || 'Course SitRun';
    const deviceName = selectDevice.value;

    const gpxString = GPXManager.buildGPX(currentSimulation, {
      name: activityName,
      sport: currentSport,
      deviceName
    });

    // Générer un nom de fichier explicite et propre
    const dateStr = inputDate.value || 'date';
    const distStr = `${currentSimulation.stats.totalDistanceKm}km`;
    const cleanName = activityName.toLowerCase().replace(/[^a-z0-9]/gi, '_').slice(0, 20);
    const filename = `sitrun_${cleanName}_${distStr}_${dateStr}.gpx`;

    GPXManager.downloadGPX(gpxString, filename);
    showToast('Fichier GPX téléchargé avec succès ! Prêt pour Strava.');

    // Proposer d'ouvrir le guide Strava
    setTimeout(() => {
      openStravaGuideModal();
    }, 800);
  });

  // Modale Guide Strava
  btnOpenGuide.addEventListener('click', openStravaGuideModal);
  btnCloseGuide.addEventListener('click', closeStravaGuideModal);
  modalStravaGuide.addEventListener('click', (e) => {
    if (e.target === modalStravaGuide) closeStravaGuideModal();
  });

  function openStravaGuideModal() {
    modalStravaGuide.classList.add('active');
  }

  function closeStravaGuideModal() {
    modalStravaGuide.classList.remove('active');
  }

  // --- Fonctions Métier ---

  function initDefaultDateTime() {
    const now = new Date();
    inputDate.value = formatDateForInput(now);
    inputTime.value = '08:30';
  }

  function formatDateForInput(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function getSelectedStartDateTime() {
    const dateVal = inputDate.value;
    const timeVal = inputTime.value;
    if (!dateVal || !timeVal) return new Date();

    const [y, m, d] = dateVal.split('-').map(Number);
    const [hh, mm] = timeVal.split(':').map(Number);
    return new Date(y, m - 1, d, hh, mm, 0);
  }

  function applySportPreset(sport) {
    const preset = sportPresets[sport];
    if (!preset) return;

    inputActivityName.value = preset.name;
    setPaceFromSeconds(preset.paceSec);
    sliderHeartRate.value = preset.hr;
    valHeartRate.textContent = `${preset.hr} bpm`;
    sliderCadence.value = preset.cadence;
    const unit = sport === 'cycling' ? 'rpm' : 'spm';
    valCadence.textContent = `${preset.cadence} ${unit}`;

    // Appareil par défaut
    if (sport === 'cycling') {
      selectDevice.value = 'Garmin Edge 840';
    } else {
      selectDevice.value = 'Garmin Forerunner 965';
    }

    recalculateSimulation();
  }

  /**
   * Callback déclenché par MapManager lorsque le tracé change
   */
  function onRouteUpdated(track, waypoints) {
    const mapHint = document.getElementById('map-hint');
    if (mapHint) {
      mapHint.style.display = waypoints && waypoints.length > 0 ? 'none' : 'flex';
    }

    currentTrackPoints = track;
    recalculateSimulation();
  }

  // Raccourcis clavier globaux (Ctrl+Z: Annuler, Ctrl+Y / Ctrl+Shift+Z: Rétablir)
  document.addEventListener('keydown', async (e) => {
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      if (e.shiftKey) {
        e.preventDefault();
        const ok = await MapManager.redo();
        if (ok) showToast('Point rétabli');
      } else {
        e.preventDefault();
        const ok = await MapManager.undo();
        if (ok) showToast('Dernier point annulé');
      }
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      const ok = await MapManager.redo();
      if (ok) showToast('Point rétabli');
    }
  });

  /**
   * Recalcule la simulation physiologique et met à jour l'UI
   */
  function recalculateSimulation() {
    if (!currentTrackPoints || currentTrackPoints.length < 2) {
      currentSimulation = null;
      updateStatsUI(null);
      ProfileChart.render([]);
      renderSplitsTable([]);
      return;
    }

    const startDateTime = getSelectedStartDateTime();
    const targetPaceSec = parseInt(sliderPaceMin.value, 10);
    const profile = selectPacingProfile.value;
    const hrEnabled = checkHeartRate.checked;
    const avgHR = parseInt(sliderHeartRate.value, 10);
    const warmup = checkWarmup.checked;
    const cad = parseInt(sliderCadence.value, 10);
    const gpsNoise = checkGpsNoise.checked;
    const deviceName = selectDevice.value;

    currentSimulation = Simulator.simulateActivity(currentTrackPoints, {
      sport: currentSport,
      startTime: startDateTime,
      targetPaceSecPerKm: targetPaceSec,
      pacingProfile: profile,
      heartRateEnabled: hrEnabled,
      avgHeartRate: avgHR,
      warmupEnabled: warmup,
      cadence: cad,
      gpsNoise,
      deviceName
    });

    if (currentSimulation) {
      updateStatsUI(currentSimulation.stats);
      ProfileChart.render(currentSimulation.trackpoints);
      renderSplitsTable(currentSimulation.splits);
    }
  }

  /**
   * Met à jour les cartes de statistiques
   */
  function updateStatsUI(stats) {
    if (!stats) {
      statDistance.textContent = '0.00 km';
      statDuration.textContent = '00:00:00';
      statPace.textContent = '--:-- /km';
      statDPlus.textContent = '+0 m';
      statSpeed.textContent = '0.0 km/h';
      statCalories.textContent = '0 kcal';
      statAvgHR.textContent = '-- bpm';
      return;
    }

    statDistance.textContent = `${stats.totalDistanceKm} km`;
    statDuration.textContent = stats.durationFormatted;
    statPace.textContent = stats.avgPaceFormatted;
    statDPlus.textContent = `+${stats.dPlus} m`;
    statSpeed.textContent = `${stats.avgSpeedKmH} km/h`;
    statCalories.textContent = `${stats.calories} kcal`;
    statAvgHR.textContent = stats.avgHR ? `${stats.avgHR} bpm` : '-- bpm';
  }

  /**
   * Remplit le tableau des splits kilométriques
   */
  function renderSplitsTable(splits) {
    tableSplitsBody.innerHTML = '';
    if (!splits || splits.length === 0) {
      tableSplitsBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Aucun split disponible</td></tr>';
      return;
    }

    splits.forEach(s => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="font-bold">Km ${s.km}</td>
        <td>${s.paceFormatted}</td>
        <td>${s.timeFormatted}</td>
        <td>${s.avgHR ? s.avgHR + ' bpm' : '--'}</td>
      `;
      tableSplitsBody.appendChild(tr);
    });
  }

  /**
   * Notification Toast moderne
   */
  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-bubble';
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('visible');
    }, 10);

    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 400);
    }, 3000);
  }
});
