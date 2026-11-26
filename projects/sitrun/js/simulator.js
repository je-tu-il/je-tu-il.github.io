/**
 * SitRun - Moteur de simulation physiologique et génération de points GPS
 * Simule de façon ultra-réaliste :
 * - Horodatages seconde par seconde (1 Hz standard Garmin/Apple)
 * - Micro-variations d'allure (respiration humaine)
 * - Profils d'allure (Régulier, Negative Split, Fractionné, Adapté au relief)
 * - Fréquence cardiaque (montée en échauffement, corrélation pente/vitesse, variabilité HRV)
 * - Cadence (foulée / pédalage)
 * - Bruit GPS naturel (jitter sub-métrique des puces GNSS réelles)
 */

const Simulator = (() => {
  // Constante rayon terrestre moyen (mètres)
  const EARTH_RADIUS = 6371000;

  /**
   * Distance haversine entre deux coordonnées en mètres
   */
  function haversineDistance(lat1, lon1, lat2, lon2) {
    const toRad = x => (x * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS * c;
  }

  /**
   * Générateur de bruit pseudo-gaussien (Box-Muller)
   */
  function gaussianRandom(mean = 0, stdev = 1) {
    const u = 1 - Math.random();
    const v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * stdev + mean;
  }

  /**
   * Interpolation linéaire de coordonnées et d'élévation le long d'un segment
   */
  function interpolatePoint(p1, p2, ratio) {
    return {
      lat: p1.lat + (p2.lat - p1.lat) * ratio,
      lon: p1.lon + (p2.lon - p1.lon) * ratio,
      ele: (p1.ele !== undefined && p2.ele !== undefined) 
        ? p1.ele + (p2.ele - p1.ele) * ratio 
        : (p1.ele || p2.ele || 25)
    };
  }

  /**
   * Calcul du profil d'allure à une distance donnée
   * Renvoie un multiplicateur de vitesse (1.0 = allure moyenne cible)
   */
  function getPacingMultiplier(distanceCovered, totalDistance, profile, grade) {
    const progress = totalDistance > 0 ? distanceCovered / totalDistance : 0;
    let multiplier = 1.0;

    switch (profile) {
      case 'negative_split':
        // Démarre 6% plus lent, accélère progressivement pour finir 8% plus rapide, avec sprint final (+14%)
        if (progress < 0.9) {
          multiplier = 0.94 + 0.14 * (progress / 0.9);
        } else {
          // Sprint sur les derniers 10%
          multiplier = 1.08 + 0.08 * ((progress - 0.9) / 0.1);
        }
        break;

      case 'positive_split':
        // Démarre vite (+7%) puis faiblit progressivement jusqu'à -8%
        multiplier = 1.07 - 0.15 * progress;
        break;

      case 'intervals':
        // Échauffement premier km (ou 15% du parcours)
        const warmupDist = Math.min(1000, totalDistance * 0.15);
        const cooldownDist = Math.min(800, totalDistance * 0.15);
        if (distanceCovered < warmupDist) {
          multiplier = 0.88; // Allure tranquille
        } else if (distanceCovered > totalDistance - cooldownDist) {
          multiplier = 0.85; // Récupération finale
        } else {
          // Blocs de 400m rapide / 200m lent
          const intervalCycle = (distanceCovered - warmupDist) % 600;
          if (intervalCycle < 400) {
            multiplier = 1.22; // Intervalle rapide (+22%)
          } else {
            multiplier = 0.78; // Récupération (-22%)
          }
        }
        break;

      case 'gap':
      default:
        // Même en profil "régulier", la pente influe naturellement sur la vitesse
        multiplier = 1.0;
        break;
    }

    // Impact de la pente (Grade Adjusted Pace)
    // grade = dénivelé / distance horizontale (-0.10 à +0.10 typique)
    if (grade !== 0 && !isNaN(grade)) {
      if (grade > 0) {
        // Montée : réduction de vitesse (~3.5% par 1% de pente)
        multiplier *= Math.max(0.45, 1 - grade * 3.5);
      } else {
        // Descente : accélération modérée jusqu'à -5%, puis freinage naturel si trop raide
        if (grade >= -0.06) {
          multiplier *= Math.min(1.20, 1 - grade * 1.8);
        } else {
          multiplier *= Math.max(0.70, 1 + grade * 1.2);
        }
      }
    }

    return multiplier;
  }

  /**
   * Simulation complète de la trace
   * 
   * @param {Array} rawPoints - Liste de {lat, lon, ele} (extraits de la carte ou OSRM)
   * @param {Object} options - Paramètres utilisateur
   *   - sport: 'running' | 'cycling' | 'walking'
   *   - startTime: Date object
   *   - targetPaceSecPerKm: Allure moyenne en secondes/km (ex: 300 pour 5:00 min/km)
   *   - pacingProfile: 'even' | 'negative_split' | 'positive_split' | 'intervals' | 'gap'
   *   - heartRateEnabled: boolean
   *   - avgHeartRate: BPM moyen cible (ex: 155)
   *   - warmupEnabled: boolean
   *   - cadence: SPM (steps per min) ou RPM pour le vélo
   *   - gpsNoise: boolean (micro-gigue GPS réaliste)
   *   - deviceName: string (ex: 'Garmin Forerunner 965')
   */
  function simulateActivity(rawPoints, options) {
    if (!rawPoints || rawPoints.length < 2) {
      return null;
    }

    const {
      sport = 'running',
      startTime = new Date(),
      targetPaceSecPerKm = 300, // 5:00 min/km
      pacingProfile = 'even',
      heartRateEnabled = true,
      avgHeartRate = 152,
      warmupEnabled = true,
      cadence = sport === 'cycling' ? 85 : 170,
      gpsNoise = true,
      deviceName = 'Garmin Forerunner 965'
    } = options;

    // Vitesse moyenne de référence en m/s
    const baseSpeedMps = 1000 / Math.max(30, targetPaceSecPerKm);

    // 1. Calculer les distances et élévations cumulées des points de base
    const segments = [];
    let totalInputDistance = 0;
    let totalDPlus = 0;
    let totalDMinus = 0;

    for (let i = 0; i < rawPoints.length - 1; i++) {
      const p1 = rawPoints[i];
      const p2 = rawPoints[i + 1];
      const d = haversineDistance(p1.lat, p1.lon, p2.lat, p2.lon);
      const ele1 = p1.ele !== undefined ? p1.ele : 30;
      const ele2 = p2.ele !== undefined ? p2.ele : 30;
      const dEle = ele2 - ele1;

      if (dEle > 0) totalDPlus += dEle;
      else totalDMinus += Math.abs(dEle);

      segments.push({
        p1,
        p2,
        dist: d,
        startDist: totalInputDistance,
        endDist: totalInputDistance + d,
        grade: d > 1 ? dEle / d : 0
      });
      totalInputDistance += d;
    }

    if (totalInputDistance < 10) {
      return null; // Parcours trop court (< 10m)
    }

    // 2. Génération point par point à fréquence 1 seconde (1 Hz)
    const trackpoints = [];
    let currentDistance = 0;
    let currentTime = new Date(startTime.getTime());
    let currentSegIdx = 0;

    // Variables pour lisser les micro-variations (Random Walk)
    let paceJitter = 1.0;
    let hrSmooth = warmupEnabled ? Math.max(95, avgHeartRate * 0.68) : avgHeartRate;
    let hrJitter = 0;
    let cadJitter = 0;

    // GPS noise smoothing
    let gpsLatOffset = 0;
    let gpsLonOffset = 0;

    let totalPoints = 0;
    // Sécurité boucle infinie : max 100 000 points (~27 heures)
    const MAX_POINTS = 100000;

    while (currentDistance <= totalInputDistance && totalPoints < MAX_POINTS) {
      // Trouver le segment actuel
      while (currentSegIdx < segments.length - 1 && currentDistance > segments[currentSegIdx].endDist) {
        currentSegIdx++;
      }
      const seg = segments[currentSegIdx];

      // Ratio le long du segment
      const segRatio = seg.dist > 0 ? Math.min(1, Math.max(0, (currentDistance - seg.startDist) / seg.dist)) : 0;
      const interp = interpolatePoint(seg.p1, seg.p2, segRatio);

      // Calcul de la vitesse instantanée
      const profileMultiplier = getPacingMultiplier(currentDistance, totalInputDistance, pacingProfile, seg.grade);
      
      // Random walk léger sur l'allure (±3% pour simuler la foulée et le souffle humain)
      paceJitter += gaussianRandom(0, 0.015);
      // Rapprochement vers 1.0 (mean reversion)
      paceJitter = 0.92 * paceJitter + 0.08 * 1.0;
      paceJitter = Math.max(0.85, Math.min(1.15, paceJitter));

      const instantSpeed = baseSpeedMps * profileMultiplier * paceJitter;

      // Calcul de la fréquence cardiaque réaliste
      let instantHR = null;
      if (heartRateEnabled) {
        // Courbe d'échauffement sur les premiers 800m
        let warmupFactor = 1.0;
        if (warmupEnabled) {
          const warmupProgress = Math.min(1.0, currentDistance / 800);
          warmupFactor = 0.70 + 0.30 * Math.sin((warmupProgress * Math.PI) / 2);
        }

        // Effet de la vitesse (sprint vs trot)
        const speedRatio = instantSpeed / baseSpeedMps;
        const speedHREffect = (speedRatio - 1.0) * 18;

        // Effet de la pente (+2.5 bpm par 1% de pente en montée, -1 bpm en descente)
        const gradeHREffect = seg.grade > 0 ? seg.grade * 220 : seg.grade * 100;

        // Cible instantanée
        const targetHR = (avgHeartRate * warmupFactor) + speedHREffect + gradeHREffect;

        // Lissage physiologique (le coeur ne réagit pas instantanément, inertie cardiovasculaire)
        hrSmooth = hrSmooth * 0.96 + targetHR * 0.04;

        // Variabilité cardiaque naturelle (HRV jitter ±1.5 bpm)
        hrJitter += gaussianRandom(0, 0.4);
        hrJitter = hrJitter * 0.85;

        instantHR = Math.round(Math.max(65, Math.min(205, hrSmooth + hrJitter)));
      }

      // Calcul de la cadence
      let instantCad = null;
      if (cadence > 0) {
        cadJitter += gaussianRandom(0, 0.5);
        cadJitter = cadJitter * 0.85;
        // Légère hausse de cadence avec la vitesse
        const speedCadEffect = (instantSpeed / baseSpeedMps - 1.0) * 6;
        instantCad = Math.round(Math.max(40, cadence + speedCadEffect + cadJitter));
      }

      // Micro-bruit GPS réaliste (sub-métrique)
      let outLat = interp.lat;
      let outLon = interp.lon;

      if (gpsNoise) {
        // Dérive lente (drift) du signal GPS : marche aléatoire très lissée
        gpsLatOffset = gpsLatOffset * 0.95 + gaussianRandom(0, 0.000003) * 0.05;
        gpsLonOffset = gpsLonOffset * 0.95 + gaussianRandom(0, 0.000004) * 0.05;

        // 0.00001 degré ≈ 1.1 mètre
        outLat += gpsLatOffset;
        outLon += gpsLonOffset;
      }

      // Enregistrement du point
      trackpoints.push({
        lat: Number(outLat.toFixed(7)),
        lon: Number(outLon.toFixed(7)),
        ele: Number(interp.ele.toFixed(1)),
        time: new Date(currentTime.getTime()),
        hr: instantHR,
        cad: instantCad,
        speed: instantSpeed,
        dist: currentDistance
      });

      totalPoints++;

      // Avancement d'une seconde
      const stepSeconds = 1;
      const stepDistance = instantSpeed * stepSeconds;

      currentDistance += stepDistance;
      currentTime = new Date(currentTime.getTime() + stepSeconds * 1000);
    }

    // Assurer que le dernier point est bien inclus
    if (segments.length > 0) {
      const lastPt = rawPoints[rawPoints.length - 1];
      trackpoints.push({
        lat: Number(lastPt.lat.toFixed(7)),
        lon: Number(lastPt.lon.toFixed(7)),
        ele: Number((lastPt.ele || 30).toFixed(1)),
        time: new Date(currentTime.getTime()),
        hr: heartRateEnabled ? Math.round(hrSmooth) : null,
        cad: cadence,
        speed: baseSpeedMps,
        dist: totalInputDistance
      });
    }

    // 3. Calcul des statistiques finales et des splits kilométriques
    const totalTimeSec = Math.round((trackpoints[trackpoints.length - 1].time - trackpoints[0].time) / 1000);
    const totalDistanceKm = totalInputDistance / 1000;
    const avgSpeedKmH = totalTimeSec > 0 ? (totalDistanceKm / (totalTimeSec / 3600)) : 0;
    const avgPaceSecPerKm = totalDistanceKm > 0 ? (totalTimeSec / totalDistanceKm) : 0;

    // Splits kilométriques
    const splits = calculateKmSplits(trackpoints);

    // Calcul calories estimées (METs)
    // Running ~ 10 METs, Cycling ~ 8 METs, Walking ~ 4 METs
    const met = sport === 'cycling' ? 8 : sport === 'walking' ? 4 : 10;
    const assumedWeightKg = 70;
    const calories = Math.round(met * assumedWeightKg * (totalTimeSec / 3600));

    // FC moyenne et max réelles calculées
    let calculatedAvgHR = null;
    let maxHR = null;
    if (heartRateEnabled) {
      const hrValues = trackpoints.map(p => p.hr).filter(h => h !== null && h > 0);
      if (hrValues.length > 0) {
        calculatedAvgHR = Math.round(hrValues.reduce((a, b) => a + b, 0) / hrValues.length);
        maxHR = Math.max(...hrValues);
      }
    }

    return {
      trackpoints,
      stats: {
        totalDistance: totalInputDistance, // en mètres
        totalDistanceKm: Number(totalDistanceKm.toFixed(2)),
        totalTimeSec,
        durationFormatted: formatDuration(totalTimeSec),
        avgSpeedKmH: Number(avgSpeedKmH.toFixed(2)),
        avgPaceSecPerKm: Math.round(avgPaceSecPerKm),
        avgPaceFormatted: formatPace(avgPaceSecPerKm),
        dPlus: Math.round(totalDPlus),
        dMinus: Math.round(totalDMinus),
        avgHR: calculatedAvgHR,
        maxHR,
        avgCadence: cadence,
        calories,
        pointsCount: trackpoints.length,
        startTime: trackpoints[0].time,
        endTime: trackpoints[trackpoints.length - 1].time,
        deviceName
      },
      splits
    };
  }

  /**
   * Calcule les temps intermédiaires par kilomètre (Splits)
   */
  function calculateKmSplits(trackpoints) {
    const splits = [];
    let currentKm = 1;
    let kmStartIndex = 0;

    for (let i = 0; i < trackpoints.length; i++) {
      const pt = trackpoints[i];
      if (pt.dist >= currentKm * 1000 || i === trackpoints.length - 1) {
        const startPt = trackpoints[kmStartIndex];
        const distDelta = pt.dist - startPt.dist;
        const timeDeltaSec = Math.round((pt.time - startPt.time) / 1000);

        if (distDelta > 100) {
          const paceSecPerKm = (timeDeltaSec / distDelta) * 1000;
          const slicePoints = trackpoints.slice(kmStartIndex, i + 1);
          const hrPoints = slicePoints.map(p => p.hr).filter(h => h > 0);
          const avgHR = hrPoints.length > 0 ? Math.round(hrPoints.reduce((a, b) => a + b, 0) / hrPoints.length) : null;
          
          // Dénivelé du split
          let dPlusSplit = 0;
          for (let k = 1; k < slicePoints.length; k++) {
            const diff = slicePoints[k].ele - slicePoints[k - 1].ele;
            if (diff > 0) dPlusSplit += diff;
          }

          splits.push({
            km: currentKm,
            distance: distDelta,
            timeSec: timeDeltaSec,
            timeFormatted: formatDuration(timeDeltaSec),
            paceFormatted: formatPace(paceSecPerKm),
            avgHR,
            dPlus: Math.round(dPlusSplit)
          });
        }

        kmStartIndex = i;
        currentKm++;
      }
    }

    return splits;
  }

  /**
   * Formate des secondes en MM:SS ou HH:MM:SS
   */
  function formatDuration(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = n => String(n).padStart(2, '0');
    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  }

  /**
   * Formate des secondes/km en min/km (ex: 4:45 /km)
   */
  function formatPace(secondsPerKm) {
    if (!secondsPerKm || !isFinite(secondsPerKm) || secondsPerKm <= 0) return "--:--";
    const minutes = Math.floor(secondsPerKm / 60);
    const seconds = Math.round(secondsPerKm % 60);
    return `${minutes}:${String(seconds).padStart(2, '0')} /km`;
  }

  return {
    haversineDistance,
    simulateActivity,
    formatDuration,
    formatPace
  };
})();

// Export universel (Node + Navigateur)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Simulator;
}
