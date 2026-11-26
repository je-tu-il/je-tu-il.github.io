/**
 * SitRun - Visualiseur de profil d'altitude et de fréquence cardiaque (Canvas interactif)
 * Supporte le survol (hover) avec indicateur synchronisé sur la carte
 */

const ProfileChart = (() => {
  let canvas = null;
  let ctx = null;
  let currentTrackpoints = [];
  let onHoverCallback = null;

  function init(canvasElement, onHover) {
    canvas = canvasElement;
    ctx = canvas.getContext('2d');
    onHoverCallback = onHover;

    // Gestion du survol de souris et tactile
    canvas.addEventListener('mousemove', handleHover);
    canvas.addEventListener('mouseleave', handleLeave);
    canvas.addEventListener('touchmove', handleTouch, { passive: false });
    canvas.addEventListener('touchend', handleLeave);

    window.addEventListener('resize', () => {
      if (currentTrackpoints.length > 0) {
        render(currentTrackpoints);
      }
    });
  }

  function handleHover(e) {
    if (!currentTrackpoints || currentTrackpoints.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    render(currentTrackpoints, x);
  }

  function handleTouch(e) {
    if (!currentTrackpoints || currentTrackpoints.length === 0) return;
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    render(currentTrackpoints, x);
  }

  function handleLeave() {
    if (!currentTrackpoints || currentTrackpoints.length === 0) return;
    render(currentTrackpoints, null);
    if (onHoverCallback) onHoverCallback(null);
  }

  function render(trackpoints, hoverX = null) {
    currentTrackpoints = trackpoints || [];
    if (!canvas || !ctx) return;

    // Ajuster résolution pour écran Retina / HiDPI
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 400;
    const height = rect.height || 160;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.resetTransform();
    ctx.scale(dpr, dpr);

    // Effacer
    ctx.clearRect(0, 0, width, height);

    if (currentTrackpoints.length < 2) {
      ctx.fillStyle = '#64748b';
      ctx.font = '13px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Tracez un parcours sur la carte pour voir le profil de relief', width / 2, height / 2);
      return;
    }

    const padding = { top: 20, right: 15, bottom: 25, left: 35 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    // Données d'élévation
    const totalDist = currentTrackpoints[currentTrackpoints.length - 1].dist;
    const eles = currentTrackpoints.map(p => p.ele);
    let minEle = Math.min(...eles);
    let maxEle = Math.max(...eles);

    if (maxEle - minEle < 15) {
      // Écart minimal de 15m pour éviter un graphique écrasé
      const mid = (maxEle + minEle) / 2;
      minEle = mid - 8;
      maxEle = mid + 8;
    }

    // Fonction de mapping coordonnées
    const getX = dist => padding.left + (dist / totalDist) * chartW;
    const getYEle = ele => padding.top + chartH - ((ele - minEle) / (maxEle - minEle)) * chartH;

    // 1. Grille et labels
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px Inter, system-ui, sans-serif';
    ctx.textAlign = 'right';

    // 3 lignes horizontales de relief
    const steps = 3;
    for (let i = 0; i <= steps; i++) {
      const val = minEle + (i / steps) * (maxEle - minEle);
      const y = getYEle(val);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      ctx.fillText(`${Math.round(val)}m`, padding.left - 5, y + 3);
    }

    // 2. Dégradé de remplissage du relief
    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    gradient.addColorStop(0, 'rgba(252, 82, 0, 0.40)'); // Strava orange transparent
    gradient.addColorStop(1, 'rgba(252, 82, 0, 0.02)');

    ctx.beginPath();
    ctx.moveTo(getX(0), getYEle(currentTrackpoints[0].ele));

    for (let i = 1; i < currentTrackpoints.length; i++) {
      const pt = currentTrackpoints[i];
      ctx.lineTo(getX(pt.dist), getYEle(pt.ele));
    }

    ctx.lineTo(getX(totalDist), height - padding.bottom);
    ctx.lineTo(getX(0), height - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // 3. Ligne de contour du relief
    ctx.beginPath();
    ctx.moveTo(getX(0), getYEle(currentTrackpoints[0].ele));
    for (let i = 1; i < currentTrackpoints.length; i++) {
      const pt = currentTrackpoints[i];
      ctx.lineTo(getX(pt.dist), getYEle(pt.ele));
    }
    ctx.strokeStyle = '#fc5200'; // Strava orange
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // 4. Ligne de Fréquence Cardiaque (si disponible)
    const hasHR = currentTrackpoints.some(p => p.hr !== null && p.hr > 0);
    if (hasHR) {
      const hrs = currentTrackpoints.map(p => p.hr || 0).filter(h => h > 0);
      let minHR = Math.min(...hrs) - 10;
      let maxHR = Math.max(...hrs) + 10;
      const getYHR = hr => padding.top + chartH - ((hr - minHR) / (maxHR - minHR)) * chartH;

      ctx.beginPath();
      let started = false;
      for (let i = 0; i < currentTrackpoints.length; i++) {
        const pt = currentTrackpoints[i];
        if (pt.hr > 0) {
          const x = getX(pt.dist);
          const y = getYHR(pt.hr);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.strokeStyle = '#ec4899'; // Rose / fuchsia vibrant pour FC
      ctx.lineWidth = 1.6;
      ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 5. Axe horizontal : distance
    ctx.textAlign = 'center';
    ctx.fillStyle = '#64748b';
    const distKm = totalDist / 1000;
    const kmStep = distKm > 10 ? 2 : 1;
    for (let k = 0; k <= distKm; k += kmStep) {
      const x = getX(k * 1000);
      if (x <= width - padding.right) {
        ctx.fillText(`${k} km`, x, height - padding.bottom + 15);
      }
    }

    // 6. Curseur de survol interactif
    if (hoverX !== null && hoverX >= padding.left && hoverX <= width - padding.right) {
      const ratio = (hoverX - padding.left) / chartW;
      const targetDist = ratio * totalDist;

      // Trouver le point le plus proche
      let closestPt = currentTrackpoints[0];
      let minDiff = Infinity;
      for (let i = 0; i < currentTrackpoints.length; i++) {
        const diff = Math.abs(currentTrackpoints[i].dist - targetDist);
        if (diff < minDiff) {
          minDiff = diff;
          closestPt = currentTrackpoints[i];
        }
      }

      const x = getX(closestPt.dist);
      const yEle = getYEle(closestPt.ele);

      // Ligne verticale curseur
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, height - padding.bottom);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Point sur le relief
      ctx.beginPath();
      ctx.arc(x, yEle, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#fc5200';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Tooltip flottant
      drawTooltip(ctx, x, yEle, closestPt, width);

      // Notification carte
      if (onHoverCallback) {
        onHoverCallback(closestPt);
      }
    }
  }

  function drawTooltip(ctx, x, y, pt, canvasW) {
    const km = (pt.dist / 1000).toFixed(2);
    const ele = Math.round(pt.ele);
    const hr = pt.hr ? `${pt.hr} bpm` : '';
    const speed = pt.speed ? `${(pt.speed * 3.6).toFixed(1)} km/h` : '';

    let text1 = `${km} km • ${ele} m`;
    let text2 = [speed, hr].filter(Boolean).join(' • ');

    ctx.font = '11px Inter, system-ui, sans-serif';
    const textWidth = Math.max(ctx.measureText(text1).width, ctx.measureText(text2).width) + 20;
    const tooltipH = text2 ? 40 : 25;

    let tipX = x - textWidth / 2;
    if (tipX < 10) tipX = 10;
    if (tipX + textWidth > canvasW - 10) tipX = canvasW - textWidth - 10;

    let tipY = y - tooltipH - 10;
    if (tipY < 5) tipY = y + 15;

    // Boîte tooltip arrondie
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(tipX, tipY, textWidth, tooltipH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(text1, tipX + textWidth / 2, tipY + 15);
    if (text2) {
      ctx.fillStyle = '#fc5200';
      ctx.fillText(text2, tipX + textWidth / 2, tipY + 31);
    }
  }

  return {
    init,
    render
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProfileChart;
}
