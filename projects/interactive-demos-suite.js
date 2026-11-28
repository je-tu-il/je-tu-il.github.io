(() => {
  const demos = (window.PROJECT_DEMOS = window.PROJECT_DEMOS || Object.create(null));

  function el(tag, content, className) {
    const node = document.createElement(tag);
    if (content !== undefined && content !== null) node.textContent = content;
    if (className) node.className = className;
    return node;
  }

  function panel(root, title, summary) {
    const section = el('section');
    const controls = el('div', undefined, 'workflow-controls demo-fields');
    const result = el('div', undefined, 'workflow-result');
    const status = el('p', '', 'workflow-status');
    status.setAttribute('role', 'status');
    section.append(el('h2', title), el('p', summary), controls, result, status);
    root.append(section);
    return {section, controls, result, status};
  }

  function field(parent, label, type, value, attributes = {}) {
    const wrapper = el('label', label);
    const control = el(type === 'textarea' ? 'textarea' : 'input');
    if (type !== 'textarea') control.type = type;
    Object.assign(control, {value}, attributes);
    wrapper.append(control);
    parent.append(wrapper);
    return control;
  }

  function selectField(parent, label, options, value) {
    const wrapper = el('label', label);
    const select = el('select');
    for (const opt of options) {
      const o = el('option', typeof opt === 'string' ? opt : opt.label);
      o.value = typeof opt === 'string' ? opt : opt.value;
      select.append(o);
    }
    if (value !== undefined) select.value = value;
    wrapper.append(select);
    parent.append(wrapper);
    return select;
  }

  function action(parent, label, run) {
    const button = el('button', label);
    button.type = 'button';
    button.addEventListener('click', run);
    parent.append(button);
    return button;
  }

  function rows(result, headings, entries) {
    const table = el('table');
    const header = el('tr');
    for (const label of headings) {
      const th = el('th', label);
      th.scope = 'col';
      header.append(th);
    }
    const head = el('thead');
    const body = el('tbody');
    head.append(header);
    for (const values of entries) {
      const tr = el('tr');
      for (const value of values) tr.append(el('td', String(value)));
      body.append(tr);
    }
    table.append(head, body);
    result.replaceChildren(table);
  }

  const num = (input, min, max) => Math.min(max, Math.max(min, Number(input.value) || 0));

  // 1. AURA Nutraceutics
  demos['aura-nutraceutics'] = root => {
    const {controls, result, status} = panel(root, 'Diagnostic Micronutritionnel', 'Renseignez le profil clinique pour générer un protocole sur-mesure.');
    const age = field(controls, 'Âge', 'number', '34', {min: 18, max: 95});
    const goal = selectField(controls, 'Objectif clinique', ['Énergie & Mitochondries', 'Sommeil & Récupération', 'Immunité & Stress oxydatif', 'Focus cognitif']);
    const stress = selectField(controls, 'Niveau de stress', ['Modéré', 'Élevé', 'Critique']);
    const render = () => {
      const a = num(age, 18, 95);
      const protocols = {
        'Énergie & Mitochondries': [['CoQ10 Ubiquinol', '100 mg', 'Matin avec lipides'], ['Magnésium Bisglycinate', '300 mg', 'Soir'], ['Vitamine B12 Méthyl', '500 µg', 'Matin']],
        'Sommeil & Récupération': [['L-Théanine', '200 mg', '30 min avant coucher'], ['Magnésium Thrëonate', '144 mg', 'Soir'], ['Glycine', '3 g', 'Soir']],
        'Immunité & Stress oxydatif': [['Vitamine D3 + K2', '2000 UI', 'Midi'], ['Zinc Picolinate', '15 mg', 'Soir'], ['NAC', '600 mg', 'Matin']],
        'Focus cognitif': [['Oméga-3 DHA/EPA', '1000 mg', 'Midi'], ['Citicoline CDP', '250 mg', 'Matin'], ['Rhodiola Rosea', '300 mg', 'Matin']],
      };
      const score = Math.max(62, 94 - (stress.value === 'Critique' ? 14 : stress.value === 'Élevé' ? 7 : 0) - Math.floor((a - 25) / 10));
      rows(result, ['Actif', 'Dosage', 'Fenêtre de prise'], protocols[goal.value]);
      status.textContent = `Indice d'assimilation estimé : ${score}/100 · Protocole ${goal.value}.`;
    };
    [age, goal, stress].forEach(c => c.addEventListener('input', render));
    render();
  };

  // 2. BestCam
  demos['bestcam-cam-ra-ios-mains-libres-d-clenchement-vocal'] = root => {
    const {controls, result, status} = panel(root, 'Viseur Vocal iOS (On-Device)', 'Simulez le déclenchement vocal sans toucher l’écran.');
    const keyword = selectField(controls, 'Mot-clé vocal', ['"Capture"', '"Action"', '"Photo"', '"Stop"']);
    const mode = selectField(controls, 'Mode', ['Photo HDR', 'Vidéo 4K 60fps', 'Rafale 10x']);
    const timer = selectField(controls, 'Retardateur', ['0s (Instantané)', '3s', '5s']);
    const shots = [];
    const shoot = () => {
      const ts = new Date().toLocaleTimeString('fr-FR');
      shots.unshift([`IMG_${String(shots.length + 1).padStart(3, '0')}`, mode.value, keyword.value, timer.value, ts]);
      rows(result, ['Fichier', 'Mode', 'Déclencheur', 'Délai', 'Horodatage'], shots.slice(0, 6));
      status.textContent = `Déclenchement vocal ${keyword.value} reconnu on-device (${shots.length} capture${shots.length > 1 ? 's' : ''}).`;
    };
    action(controls, 'Simuler commande vocale', shoot);
    shoot();
  };

  // 3. VéloMoove
  demos['v-lomoove-audit-financier-contractuel-comptable-vls'] = root => {
    const {controls, result, status} = panel(root, 'Audit Contractuel VLS (Grand Nancy / Fifteen)', 'Calculez les pénalités de disponibilité et l’écart de flotte.');
    const fleet = field(controls, 'Flotte contractuelle', 'number', '450', {min: 50, max: 5000});
    const avail = field(controls, 'Disponibilité constatée (%)', 'number', '87', {min: 0, max: 100});
    const target = field(controls, 'Seuil contractuel (%)', 'number', '95', {min: 50, max: 100});
    const render = () => {
      const f = num(fleet, 50, 5000);
      const a = num(avail, 0, 100);
      const t = num(target, 50, 100);
      const gap = Math.max(0, t - a);
      const missingBikes = Math.round((f * gap) / 100);
      const penalty = missingBikes * 35 * 30;
      rows(result, ['Indicateur', 'Valeur'], [
        ['Flotte théorique', `${f} vélos`],
        ['Déficit constaté', `${gap.toFixed(1)} % (${missingBikes} vélos)`],
        ['Pénalité mensuelle estimée', `${penalty.toLocaleString('fr-FR')} €`],
      ]);
      status.textContent = gap > 0 ? `Non-conformité détectée : ${penalty.toLocaleString('fr-FR')} € de pénalités applicables.` : 'Conformité contractuelle respectée.';
    };
    [fleet, avail, target].forEach(c => c.addEventListener('input', render));
    render();
  };

  // 4. OptiContrat AI
  demos['opticontrat-ai-audit-intelligent-de-contrats-paie'] = root => {
    const {controls, result, status} = panel(root, 'Audit Juridique & Paie IA', 'Sélectionnez un document et testez la détection d’anomalies.');
    const docType = selectField(controls, 'Type de document', ['CDI Cadre — Forfait Jours', 'Bulletin de paie — Heures Sup', 'Devis Prestataire SaaS']);
    const brut = field(controls, 'Montant Brut / HT (€)', 'number', '3400', {min: 500, max: 50000});
    const render = () => {
      const b = num(brut, 500, 50000);
      const findings = {
        'CDI Cadre — Forfait Jours': [['Clause de non-concurrence', 'Risque élevé', 'Contrepartie financière absente'], ['Forfait 218 jours', 'Conforme', 'Plafond légal respecté'], ['Période d’essai', 'Attention', 'Renouvellement non précisé']],
        'Bulletin de paie — Heures Sup': [['Majoration 25% (35h-43h)', 'Écart -42,50 €', 'Taux horaire sous-évalué'], ['Cotisation prévoyance', 'Conforme', 'Taux conventionnel OK'], ['Net à payer estimé', `${Math.round(b * 0.78)} €`, 'Avant PAS']],
        'Devis Prestataire SaaS': [['Clause de réversibilité', 'Risque moyen', 'Export données non garanti'], ['Pénalités de retard', 'Conforme', 'Taux BCE + 10 pts'], ['TVA 20%', `${Math.round(b * 0.2)} €`, `Total TTC : ${Math.round(b * 1.2)} €`]],
      };
      rows(result, ['Point contrôlé', 'Statut', 'Détail IA'], findings[docType.value]);
      status.textContent = `Audit terminé sur "${docType.value}" (${b.toLocaleString('fr-FR')} €).`;
    };
    [docType, brut].forEach(c => c.addEventListener('input', render));
    render();
  };

  // 5. PatchGuard
  demos['patchguard-d-tecteur-d-exploits-cve-navigateur'] = root => {
    const {controls, result, status} = panel(root, 'Inspecteur Manifest V3 & CVE', 'Testez une charge utile ou une URL pour évaluer les heuristiques.');
    const payload = field(controls, 'Script / URL à inspecter', 'text', 'https://cdn.example.test/eval(atob("YWxlcnQoMSk="))');
    const scan = () => {
      const txt = payload.value;
      const rules = [
        ['eval() / Function()', /eval\(|new Function/i.test(txt) ? 'BLOQUÉ' : 'OK', 'Exécution dynamique'],
        ['Obfuscation Base64', /atob\(|fromCharCode/i.test(txt) ? 'ALERTE' : 'OK', 'Décodage suspect'],
        ['Prototype Pollution', /__proto__|constructor\.prototype/i.test(txt) ? 'CRITIQUE' : 'OK', 'CVE-2024-XXXX'],
      ];
      const alerts = rules.filter(r => r[1] !== 'OK').length;
      rows(result, ['Règle heuristique', 'Verdict', 'Vecteur'], rules);
      status.textContent = alerts ? `${alerts} comportement(s) d'exploit intercepté(s) par PatchGuard.` : 'Aucune signature d’exploit détectée.';
    };
    action(controls, 'Analyser', scan);
    scan();
  };

  // 6. ScanAll
  demos['scanall-scanner-r-seau-audit-logiciel-windows'] = root => {
    const {controls, result, status} = panel(root, 'Scanner Réseau & Audit Logiciel', 'Lancez une découverte LAN simulée sur votre sous-réseau.');
    const subnet = field(controls, 'Sous-réseau CIDR', 'text', '192.168.1.0/24');
    const scan = () => {
      rows(result, ['IP', 'Hôte', 'Ports ouverts', 'Logiciel critique', 'État'], [
        ['192.168.1.1', 'Gateway-ISP', '80, 443', 'Firmware 4.2.1', 'À jour'],
        ['192.168.1.24', 'DESKTOP-JULES', '22, 445, 3389', 'OpenSSL 3.0.8', 'Mise à jour requise'],
        ['192.168.1.42', 'NAS-SYNOLOGY', '5000, 5001, 445', 'DSM 7.2', 'À jour'],
        ['192.168.1.88', 'ESP32-NODE', '80', 'SDK 2.0.14', 'À jour'],
      ]);
      status.textContent = `4 hôtes actifs détectés sur ${subnet.value} · 1 correctif recommandé.`;
    };
    action(controls, 'Scanner le réseau', scan);
    scan();
  };

  // 7. LedCheat Pro
  demos['ledcheat-pro-contr-leur-clavier-led-polyvalent'] = root => {
    const {controls, result, status} = panel(root, 'Contrôleur LED Clavier (Caps / Num / Scroll)', 'Testez les modes visuels et le télégraphe Morse sur les 3 LED.');
    const mode = selectField(controls, 'Mode', ['Télégraphe Morse', 'Chenillard', 'VU-Mètre Audio']);
    const msg = field(controls, 'Texte Morse', 'text', 'SOS');
    const leds = [false, false, false];
    const render = () => {
      const m = mode.value;
      if (m === 'Télégraphe Morse') {
        const len = msg.value.trim().length;
        leds[0] = len % 2 === 1;
        leds[1] = len > 0;
        leds[2] = len > 2;
      } else if (m === 'Chenillard') {
        leds[0] = !leds[0]; leds[1] = !leds[0]; leds[2] = leds[0];
      } else {
        leds[0] = true; leds[1] = true; leds[2] = false;
      }
      rows(result, ['LED Clavier', 'État', 'Signal'], [
        ['Caps Lock', leds[0] ? '● ALLUMÉE' : '○ ÉTEINTE', m],
        ['Num Lock', leds[1] ? '● ALLUMÉE' : '○ ÉTEINTE', m],
        ['Scroll Lock', leds[2] ? '● ALLUMÉE' : '○ ÉTEINTE', m],
      ]);
      status.textContent = `Mode actif : ${m} (${msg.value || '—'}).`;
    };
    action(controls, 'Impulsion suivante', render);
    [mode, msg].forEach(c => c.addEventListener('input', render));
    render();
  };

  // 8. SyncVault & AirSync
  demos['syncvault-airsync'] = root => {
    const {controls, result, status} = panel(root, 'Synchronisation P2P & Lecteur Hors-Ligne', 'Gérez les nœuds locaux et la file de synchronisation chiffrée.');
    const peer = selectField(controls, 'Pair local', ['iPhone 15 Pro (Wi-Fi)', 'PC Bureau (LAN)', 'MacBook Air (mDNS)']);
    const folder = selectField(controls, 'Dossier', ['Musique FLAC (4.2 Go)', 'Photos Terrain (1.8 Go)', 'Notes Obsidian (42 Mo)']);
    const sync = () => {
      rows(result, ['Pair', 'Dossier', 'Protocole', 'Débit', 'Statut'], [
        [peer.value, folder.value, 'QUIC / TLS 1.3', '48.4 Mo/s', 'Synchronisé (0 conflit)'],
      ]);
      status.textContent = `${folder.value} synchronisé en P2P local avec ${peer.value}.`;
    };
    action(controls, 'Lancer Sync P2P', sync);
    sync();
  };

  // 9. Pipeline Avatars IA
  demos['pipeline-d-automatisation-mon-tisation-avatars-ia'] = root => {
    const {controls, result, status} = panel(root, 'Pipeline Vidéo & Monétisation Avatars IA', 'Configurez un lot de vidéos courtes et estimez le RPM.');
    const vids = field(controls, 'Vidéos / mois', 'number', '30', {min: 1, max: 300});
    const rpm = field(controls, 'RPM estimé (€ / 1000 vues)', 'number', '0.85', {min: 0.1, max: 10, step: 0.05});
    const render = () => {
      const v = num(vids, 1, 300);
      const r = Number(rpm.value) || 0.85;
      const views = v * 18000;
      const rev = Math.round((views / 1000) * r);
      rows(result, ['Étape pipeline', 'Volume', 'Estimation'], [
        ['Génération Script + TTS', `${v} scripts`, 'Automatisé'],
        ['Rendu Avatar + Sous-titres', `${v} clips 9:16`, 'File GPU prête'],
        ['Revenus estimés', `${views.toLocaleString('fr-FR')} vues`, `${rev.toLocaleString('fr-FR')} € / mois`],
      ]);
      status.textContent = `Projection : ${rev.toLocaleString('fr-FR')} €/mois pour ${v} vidéos.`;
    };
    [vids, rpm].forEach(c => c.addEventListener('input', render));
    render();
  };

  // 10. Suite AHK Windows
  demos['suite-d-automatisation-raccourcis-windows-ahk'] = root => {
    const {controls, result, status} = panel(root, 'Éditeur de Raccourcis Windows (AHK)', 'Testez et activez les profils de macros système.');
    const profile = selectField(controls, 'Profil actif', ['Productivité & Fenêtres', 'Contrôle Multimédia', 'Snippets IA']);
    const render = () => {
      const map = {
        'Productivité & Fenêtres': [['Win + Alt + G', 'Grille 2×2 fenêtres'], ['Ctrl + Shift + V', 'Coller texte brut'], ['CapsLock + J/K', 'Défilement rapide']],
        'Contrôle Multimédia': [['Win + F7', 'Piste précédente'], ['Win + F8', 'Lecture / Pause'], ['Molette + Alt', 'Volume système ±2%']],
        'Snippets IA': [[';resume', 'Prompt synthèse structurée'], [';fix', 'Correction orthographe'], [';code', 'Revue diff rapide']],
      };
      rows(result, ['Raccourci', 'Action AutoHotkey'], map[profile.value]);
      status.textContent = `Profil "${profile.value}" chargé (3 macros actives).`;
    };
    profile.addEventListener('input', render);
    render();
  };

  // 11. REA Climatisation
  demos['rea-climatisation-reverse-engineering-iot-daikin-lg'] = root => {
    const {controls, result, status} = panel(root, 'Contrôleur Local IoT Daikin / LG ThinQ', 'Pilotez la climatisation sans cloud et inspectez la trame.');
    const brand = selectField(controls, 'Unité', ['Daikin Stylish (LAN HTTP)', 'LG ThinQ (MQTT Local)']);
    const temp = field(controls, 'Consigne (°C)', 'number', '21', {min: 16, max: 30});
    const mode = selectField(controls, 'Mode', ['Froid', 'Chaud', 'Ventilation', 'Éco']);
    const render = () => {
      const t = num(temp, 16, 30);
      const hex = `0x${t.toString(16).toUpperCase()} 0x${mode.selectedIndex + 1} 0xA4`;
      rows(result, ['Paramètre', 'Valeur'], [
        ['Équipement', brand.value],
        ['Consigne / Mode', `${t} °C · ${mode.value}`],
        ['Trame locale générée', hex],
      ]);
      status.textContent = `Commande locale envoyée à ${brand.value} : ${t} °C (${mode.value}).`;
    };
    [brand, temp, mode].forEach(c => c.addEventListener('input', render));
    render();
  };

  // 12. LILYGO T-Dongle-S3
  demos['lilygo-t-dongle-s3-esp32-s3-hardware-sdk'] = root => {
    const {controls, result, status} = panel(root, 'Simulateur LILYGO T-Dongle-S3 (ESP32-S3)', 'Prévisualisez l’écran ST7735 80×160 et la charge utile USB.');
    const payload = selectField(controls, 'Mode Firmware', ['Moniteur Système USB', 'Clavier HID / Macro', 'Passerelle Wi-Fi / BLE']);
    const led = selectField(controls, 'LED APA102', ['Vert (Prêt)', 'Bleu (BLE Scan)', 'Rouge (Alerte)']);
    const render = () => {
      rows(result, ['Composant', 'État simulé'], [
        ['MCU', 'ESP32-S3R8 (240 MHz · PSRAM 8 Mo)'],
        ['Écran ST7735', `80×160 px — [${payload.value}]`],
        ['LED RGB APA102', led.value],
      ]);
      status.textContent = `Firmware "${payload.value}" actif sur T-Dongle-S3.`;
    };
    [payload, led].forEach(c => c.addEventListener('input', render));
    render();
  };

  // 13. Zwift Offline
  demos['zwift-offline-zoffline-mulateur-serveur-cyclisme'] = root => {
    const {controls, result, status} = panel(root, 'Serveur Local Zwift Offline (zoffline)', 'Simulez une session home-trainer ANT+/BLE sans abonnement.');
    const watts = field(controls, 'Puissance (W)', 'number', '225', {min: 50, max: 600});
    const grade = field(controls, 'Pente (%)', 'number', '4', {min: -10, max: 20});
    const render = () => {
      const w = num(watts, 50, 600);
      const g = num(grade, -10, 20);
      const speed = Math.max(8, Math.round((w / (7 + Math.max(0, g) * 1.4)) * 10) / 10);
      rows(result, ['Télémétrie', 'Valeur'], [
        ['Puissance instantanée', `${w} W`],
        ['Pente Watopia', `${g} %`],
        ['Vitesse calculée', `${speed} km/h`],
        ['Export', 'activity_local.fit prêt'],
      ]);
      status.textContent = `Serveur zoffline actif : ${w} W à ${speed} km/h.`;
    };
    [watts, grade].forEach(c => c.addEventListener('input', render));
    render();
  };

  // 14. Tesla Video Streamer
  demos['tesla-video-streamer-serveur-de-streaming-embarqu'] = root => {
    const {controls, result, status} = panel(root, 'Serveur de Streaming Embarqué Tesla', 'Sélectionnez un média local et adaptez le flux au navigateur MCU.');
    const media = selectField(controls, 'Média local', ['Documentaire_4K.mp4', 'Concert_Live.mkv', 'Animation_1080p.mp4']);
    const quality = selectField(controls, 'Profil MCU', ['1080p H.264 (Park)', '720p Éco (Wi-Fi)']);
    const render = () => {
      rows(result, ['Flux', 'Résolution', 'Serveur LAN', 'Statut'], [
        [media.value, quality.value, 'http://192.168.4.1:8080/stream', 'Prêt pour navigateur Tesla'],
      ]);
      status.textContent = `Flux ${media.value} prêt (${quality.value}).`;
    };
    [media, quality].forEach(c => c.addEventListener('input', render));
    render();
  };
})();

(() => {
  const demos = (window.PROJECT_DEMOS = window.PROJECT_DEMOS || Object.create(null));
  const el = (t, c, k) => { const n = document.createElement(t); if (c != null) n.textContent = c; if (k) n.className = k; return n; };
  const panel = (root, title, summary) => {
    const s = el('section'), c = el('div', null, 'workflow-controls demo-fields'), r = el('div', null, 'workflow-result'), st = el('p', '', 'workflow-status');
    st.setAttribute('role', 'status'); s.append(el('h2', title), el('p', summary), c, r, st); root.append(s); return {controls: c, result: r, status: st};
  };
  const field = (p, l, t, v, a = {}) => { const w = el('label', l), i = el(t === 'textarea' ? 'textarea' : 'input'); if (t !== 'textarea') i.type = t; Object.assign(i, {value: v}, a); w.append(i); p.append(w); return i; };
  const selectField = (p, l, opts) => { const w = el('label', l), s = el('select'); opts.forEach(o => s.append(el('option', o))); w.append(s); p.append(w); return s; };
  const action = (p, l, fn) => { const b = el('button', l); b.type = 'button'; b.addEventListener('click', fn); p.append(b); return b; };
  const rows = (r, h, e) => {
    const t = el('table'), tr = el('tr'); h.forEach(x => { const th = el('th', x); th.scope = 'col'; tr.append(th); });
    const hd = el('thead'), bd = el('tbody'); hd.append(tr);
    e.forEach(v => { const row = el('tr'); v.forEach(x => row.append(el('td', String(x)))); bd.append(row); });
    t.append(hd, bd); r.replaceChildren(t);
  };
  const num = (i, mn, mx) => Math.min(mx, Math.max(mn, Number(i.value) || 0));

  // 15. MoneyTrain
  demos['moneytrain-hub-saas-facturation-r-forme-2026'] = root => {
    const {controls, result, status} = panel(root, 'Simulateur Facturation Électronique 2026', 'Estimez le MRR et la conformité Factur-X pour cabinets et TPE.');
    const clients = field(controls, 'Clients TPE actifs', 'number', '120', {min: 10, max: 5000});
    const plan = field(controls, 'Abonnement (€/mois)', 'number', '29', {min: 9, max: 199});
    const render = () => {
      const c = num(clients, 10, 5000), p = num(plan, 9, 199);
      rows(result, ['Indicateur', 'Valeur'], [
        ['MRR récurrent', `${(c * p).toLocaleString('fr-FR')} € / mois`],
        ['ARR annuel', `${(c * p * 12).toLocaleString('fr-FR')} € / an`],
        ['Format PDP / PPF', 'Factur-X EN16931 + UBL 2.1'],
      ]);
      status.textContent = `${c} TPE conformes Réforme 2026 · MRR ${(c * p).toLocaleString('fr-FR')} €.`;
    };
    [clients, plan].forEach(x => x.addEventListener('input', render));
    render();
  };

  // 16. Objectif 10K
  demos['objectif-10k-plan-de-mon-tisation-app-couple'] = root => {
    const {controls, result, status} = panel(root, 'Simulateur Funnel 10K€/mois (App Couple)', 'Ajustez le trafic et la conversion paywall pour atteindre 10 000 €/mois.');
    const downloads = field(controls, 'Téléchargements / mois', 'number', '12000', {min: 500, max: 200000});
    const conv = field(controls, 'Conversion Paywall (%)', 'number', '4.2', {min: 0.5, max: 25, step: 0.1});
    const render = () => {
      const d = num(downloads, 500, 200000), cv = Number(conv.value) || 4.2;
      const subs = Math.round((d * cv) / 100);
      const mrr = Math.round(subs * 19.99);
      rows(result, ['Étape Funnel', 'Volume'], [
        ['Téléchargements organiques (TikTok/Reels)', d.toLocaleString('fr-FR')],
        ['Nouveaux abonnés (19,99 €/mois)', subs.toLocaleString('fr-FR')],
        ['Revenu mensuel estimé', `${mrr.toLocaleString('fr-FR')} €`],
      ]);
      status.textContent = mrr >= 10000 ? `Objectif 10K atteint (${mrr.toLocaleString('fr-FR')} €).` : `Écart restant : ${(10000 - mrr).toLocaleString('fr-FR')} €.`;
    };
    [downloads, conv].forEach(x => x.addEventListener('input', render));
    render();
  };

  // 17. Steam Manifest Tool
  demos['steam-manifest-tool-manager'] = root => {
    const {controls, result, status} = panel(root, 'Gestionnaire de Manifests Steam (.acf)', 'Inspectez et générez un manifest appmanifest_<id>.acf.');
    const appid = field(controls, 'Steam AppID', 'text', '1091500');
    const drive = selectField(controls, 'Disque cible', ['D:\\SteamLibrary', 'E:\\Games\\Steam']);
    const gen = () => {
      rows(result, ['Champ ACF', 'Valeur'], [
        ['appid', appid.value || '1091500'],
        ['StateFlags', '4 (Fully Installed)'],
        ['installdir', drive.value],
      ]);
      status.textContent = `appmanifest_${appid.value || '1091500'}.acf prêt sur ${drive.value}.`;
    };
    action(controls, 'Générer Manifest', gen);
    gen();
  };

  // 18. Dossier Contentieux Étudiant
  demos['dossier-contentieux-tudiant-actes-juridiques'] = root => {
    const {controls, result, status} = panel(root, 'Générateur de Mise en Demeure (Vacataire)', 'Calculez les rappels de salaire et intérêts légaux.');
    const hours = field(controls, 'Heures impayées', 'number', '42', {min: 1, max: 500});
    const rate = field(controls, 'Taux horaire brut (€)', 'number', '43.5', {min: 11, max: 150, step: 0.5});
    const render = () => {
      const h = num(hours, 1, 500), r = Number(rate.value) || 43.5;
      const total = Math.round(h * r * 100) / 100;
      rows(result, ['Poste', 'Montant / Référence'], [
        ['Principal dû', `${total.toLocaleString('fr-FR')} € brut`],
        ['Fondement', 'Art. L.3242-1 Code du travail / Décret 87-889'],
        ['Délai mise en demeure', '8 jours ouvrés (LRAR)'],
      ]);
      status.textContent = `Acte prêt pour ${total.toLocaleString('fr-FR')} € brut (${h}h).`;
    };
    [hours, rate].forEach(x => x.addEventListener('input', render));
    render();
  };

  // 19. je-tu-il.github.io
  demos['je-tu-il-github-io-portfolio-hub-officiel'] = root => {
    const {controls, result, status} = panel(root, 'Architecture du Hub Portfolio', 'Explorez les métriques en direct du catalogue Je-tu-il.');
    const cat = selectField(controls, 'Vue', ['Catalogue complet (128 projets)', 'Versions Web & Démos', 'Tests automatisés']);
    const render = () => {
      rows(result, ['Composant', 'État'], [
        ['Vue sélectionnée', cat.value],
        ['Couverture interactive', '128 / 128 projets'],
        ['Hébergement', 'GitHub Pages · Zéro dépendance'],
      ]);
      status.textContent = `Portfolio actif : ${cat.value}.`;
    };
    cat.addEventListener('input', render);
    render();
  };

  // 20. OpenCore EFI
  demos['opencore-efi-bootloader-macos-hackintosh'] = root => {
    const {controls, result, status} = panel(root, 'Inspecteur OpenCore EFI & Kexts', 'Vérifiez la configuration ACPI/Kexts pour macOS.');
    const smbios = selectField(controls, 'SMBIOS', ['MacBookPro16,1', 'MacBookAir9,1', 'iMac20,1']);
    const render = () => {
      rows(result, ['Module EFI', 'Version', 'Statut'], [
        ['OpenCore.efi', '1.0.2', 'Chargé'],
        ['Lilu + WhateverGreen', '1.6.9 / 1.6.7', 'Actif'],
        ['SMBIOS cible', smbios.value, 'NVRAM validée'],
      ]);
      status.textContent = `Configuration OpenCore prête pour ${smbios.value}.`;
    };
    smbios.addEventListener('input', render);
    render();
  };

  // 21. Pack Firmware PSA NAC
  demos['pack-firmware-cartographie-psa-nac-citro-n-c4'] = root => {
    const {controls, result, status} = panel(root, 'Vérificateur Firmware PSA NAC Wave 4', 'Préparez la clé USB FAT32 et le fichier licence.');
    const wave = selectField(controls, 'Système', ['NAC Wave 4 (Citroën C4)', 'NAC Wave 2']);
    const render = () => {
      rows(result, ['Fichier requis', 'Destination USB'], [
        ['SWL/ (Firmware 44.07.05.22)', '/SWL/'],
        ['license_<VIN>.key', '/license/'],
        ['Formatage', 'FAT32 (MBR · 32 Go max)'],
      ]);
      status.textContent = `Pack ${wave.value} prêt pour mise à jour véhicule.`;
    };
    wave.addEventListener('input', render);
    render();
  };

  // 22. Manipule (Cognitive Breach)
  demos['manipule-cognitive-breach-lab-de-rh-torique-ia'] = root => {
    const {controls, result, status} = panel(root, 'Détecteur de Sophismes & Rhétorique', 'Analysez un argument pour identifier les biais cognitifs.');
    const arg = field(controls, 'Argument à analyser', 'textarea', 'Tout le monde utilise cette méthode, donc c’est forcément la meilleure.', {rows: 2});
    const analyze = () => {
      const txt = arg.value.toLowerCase();
      const found = [];
      if (/tout le monde|majorité/.test(txt)) found.push(['Argumentum ad populum', 'Élevé', 'Appel à la popularité']);
      if (/forcément|toujours|jamais/.test(txt)) found.push(['Faux dilemme / Généralisation', 'Moyen', 'Absence de nuance']);
      if (!found.length) found.push(['Structure logique', 'Neutre', 'Aucun sophisme évident']);
      rows(result, ['Biais / Sophisme', 'Sévérité', 'Diagnostic'], found);
      status.textContent = `${found.length} marqueur(s) rhétorique(s) identifié(s).`;
    };
    action(controls, 'Analyser l’argument', analyze);
    analyze();
  };

  // 23. PULSE
  demos['pulse-r-seau-social-gamifi-authentique'] = root => {
    const {controls, result, status} = panel(root, 'Défis Quotidiens PULSE', 'Validez un défi réel pour gagner des points d’authenticité.');
    const challenge = selectField(controls, 'Défi du jour', ['Photo sans filtre à 18h', 'Café IRL avec un proche', '30 min sans écran']);
    let xp = 120;
    const complete = () => {
      xp += 50;
      rows(result, ['Défi validé', 'XP gagnés', 'Série (Streak)'], [[challenge.value, '+50 XP', `${xp} XP · 5 jours`]]);
      status.textContent = `Défi "${challenge.value}" validé ! Total : ${xp} XP.`;
    };
    action(controls, 'Valider le défi', complete);
    rows(result, ['Défi actif', 'Récompense', 'Série'], [[challenge.value, '+50 XP', '120 XP · 4 jours']]);
  };

  // 24. ENTREPRISE
  demos['entreprise-p-le-e-commerce-3d-investissement'] = root => {
    const {controls, result, status} = panel(root, 'Calculateur Marge E-Commerce & Impression 3D', 'Simulez le coût de revient et la marge nette par unité.');
    const price = field(controls, 'Prix de vente (€)', 'number', '39', {min: 5, max: 500});
    const cost = field(controls, 'Coût matière + port (€)', 'number', '11', {min: 1, max: 200});
    const render = () => {
      const p = num(price, 5, 500), c = num(cost, 1, 200);
      const margin = p - c;
      const pct = Math.round((margin / p) * 100);
      rows(result, ['Poste', 'Montant'], [
        ['Prix public', `${p} €`],
        ['Coût unitaire', `${c} €`],
        ['Marge nette', `${margin} € (${pct} %)`],
      ]);
      status.textContent = `Marge unitaire : ${margin} € (${pct}%).`;
    };
    [price, cost].forEach(x => x.addEventListener('input', render));
    render();
  };

  // 25. Suite USB Loader Wii/GameCube
  demos['suite-usb-loader-homebrew-nintendo-wii-gamecube'] = root => {
    const {controls, result, status} = panel(root, 'Gestionnaire Homebrew Wii / GameCube', 'Préparez l’arborescence SD/USB et les jaquettes Wiitdb.');
    const loader = selectField(controls, 'Loader', ['USB Loader GX', 'Nintendont (GameCube)']);
    const render = () => {
      rows(result, ['Dossier', 'Contenu'], [
        ['/apps/usbloader_gx/', 'boot.dol · meta.xml · icon.png'],
        ['/wbfs/', 'Jeux Wii au format .wbfs'],
        ['/games/', 'ISO GameCube (game.iso)'],
      ]);
      status.textContent = `Arborescence prête pour ${loader.value}.`;
    };
    loader.addEventListener('input', render);
    render();
  };

  // 26. AI Obsidian Vault
  demos['ai-obsidian-vault-deuxi-me-cerveau-base-interconnect-e'] = root => {
    const {controls, result, status} = panel(root, 'Graphe de Connaissances Obsidian', 'Filtrez les notes interconnectées par domaine.');
    const tag = selectField(controls, 'Tag', ['#ia-agents', '#architecture', '#business', '#philosophie']);
    const render = () => {
      const notes = {
        '#ia-agents': [['[[Agents Autonomes]]', '14 liens', 'Note permanente'], ['[[Prompt Engineering]]', '9 liens', 'Méthode']],
        '#architecture': [['[[Clean Architecture]]', '11 liens', 'Référence'], ['[[Local-First Sync]]', '7 liens', 'Pattern']],
        '#business': [['[[Pricing SaaS]]', '8 liens', 'Playbook'], ['[[Acquisition B2B]]', '6 liens', 'Stratégie']],
        '#philosophie': [['[[Éthique Technique]]', '5 liens', 'Essai'], ['[[Attention & Temps]]', '10 liens', 'Note']],
      };
      rows(result, ['Note', 'Connexions', 'Type'], notes[tag.value]);
      status.textContent = `Graphe filtré sur ${tag.value}.`;
    };
    tag.addEventListener('input', render);
    render();
  };

  // 27. SpyKlavier
  demos['spyklavier-analyse-de-frappe-clavier-t-l-m-trie'] = root => {
    const {controls, result, status} = panel(root, 'Télémétrie Ergonomique de Frappe', 'Tapez ci-dessous pour mesurer la cadence (WPM) et la latence.');
    const box = field(controls, 'Zone de test', 'textarea', '', {rows: 2, placeholder: 'Tapez quelques mots...'});
    let start = 0;
    box.addEventListener('input', () => {
      if (!start) start = Date.now();
      const elapsed = Math.max(1, (Date.now() - start) / 1000);
      const chars = box.value.length;
      const wpm = Math.round((chars / 5) / (elapsed / 60));
      rows(result, ['Métrique', 'Valeur'], [
        ['Caractères saisis', String(chars)],
        ['Vitesse estimée', `${wpm} MPM (WPM)`],
        ['Temps écoulé', `${elapsed.toFixed(1)} s`],
      ]);
      status.textContent = `Cadence mesurée : ${wpm} mots/min.`;
    });
    rows(result, ['Métrique', 'Valeur'], [['En attente', 'Commencez à taper']]);
  };

  // 28. Atlas Urbex Grand Est
  demos['atlas-urbex-grand-est'] = root => {
    const {controls, result, status} = panel(root, 'Atlas Urbex Grand Est — Fiches & Notes /20', 'Filtrez les sites patrimoniaux par département et niveau de sécurité.');
    const dept = selectField(controls, 'Département', ['54 — Meurthe-et-Moselle', '57 — Moselle', '67 — Bas-Rhin', '88 — Vosges']);
    const render = () => {
      rows(result, ['Site', 'Note /20', 'Accès / Sécurité'], [
        [`Site industriel (${dept.value.slice(0, 2)})`, '17/20', 'Structure saine · Vigilance'],
        [`Sanatorium boisé (${dept.value.slice(0, 2)})`, '15/20', 'Accès discret · Plancher fragile'],
      ]);
      status.textContent = `Fiches affichées pour ${dept.value}.`;
    };
    dept.addEventListener('input', render);
    render();
  };
})();

(() => {
  const demos = (window.PROJECT_DEMOS = window.PROJECT_DEMOS || Object.create(null));
  const el = (t, c, k) => { const n = document.createElement(t); if (c != null) n.textContent = c; if (k) n.className = k; return n; };
  const panel = (root, title, summary) => {
    const s = el('section'), c = el('div', null, 'workflow-controls demo-fields'), r = el('div', null, 'workflow-result'), st = el('p', '', 'workflow-status');
    st.setAttribute('role', 'status'); s.append(el('h2', title), el('p', summary), c, r, st); root.append(s); return {controls: c, result: r, status: st};
  };
  const field = (p, l, t, v, a = {}) => { const w = el('label', l), i = el(t === 'textarea' ? 'textarea' : 'input'); if (t !== 'textarea') i.type = t; Object.assign(i, {value: v}, a); w.append(i); p.append(w); return i; };
  const selectField = (p, l, opts) => { const w = el('label', l), s = el('select'); opts.forEach(o => s.append(el('option', o))); w.append(s); p.append(w); return s; };
  const action = (p, l, fn) => { const b = el('button', l); b.type = 'button'; b.addEventListener('click', fn); p.append(b); return b; };
  const rows = (r, h, e) => {
    const t = el('table'), tr = el('tr'); h.forEach(x => { const th = el('th', x); th.scope = 'col'; tr.append(th); });
    const hd = el('thead'), bd = el('tbody'); hd.append(tr);
    e.forEach(v => { const row = el('tr'); v.forEach(x => row.append(el('td', String(x)))); bd.append(row); });
    t.append(hd, bd); r.replaceChildren(t);
  };
  const num = (i, mn, mx) => Math.min(mx, Math.max(mn, Number(i.value) || 0));

  // 29. IpScanConnect
  demos['ipscanconnect-scanner-audit-r-seau-windows-professionnel'] = root => {
    const {controls, result, status} = panel(root, 'Audit & Connexion Rapide LAN', 'Sélectionnez une plage IP et lancez une connexion RDP/SSH.');
    const range = field(controls, 'Plage IP', 'text', '10.0.0.1-10.0.0.50');
    const proto = selectField(controls, 'Protocole', ['RDP (3389)', 'SSH (22)', 'SMB (445)']);
    const scan = () => {
      rows(result, ['IP', 'MAC', 'Latence', 'Action'], [
        ['10.0.0.12', 'A4:83:E7:11:20:09', '1.2 ms', `Prêt (${proto.value})`],
        ['10.0.0.19', '00:1A:2B:3C:4D:5E', '2.8 ms', `Prêt (${proto.value})`],
      ]);
      status.textContent = `Audit ${range.value} terminé · Connexion ${proto.value} prête.`;
    };
    action(controls, 'Scanner & Connecter', scan);
    scan();
  };

  // 30. Torrent-Studio
  demos['torrent-studio-moteur-dashboard-d-centralis-bittorrent-l-ger'] = root => {
    const {controls, result, status} = panel(root, 'Dashboard BitTorrent FastAPI & PyQt6', 'Pilotez les transferts P2P et le streaming séquentiel.');
    const mode = selectField(controls, 'Mode de lecture', ['Streaming séquentiel', 'Téléchargement complet']);
    const limit = field(controls, 'Limite débit (Mo/s)', 'number', '25', {min: 1, max: 100});
    const render = () => {
      rows(result, ['Torrent', 'Pairs', 'Débit', 'Mode'], [
        ['Ubuntu-24.04-Desktop.iso', '48 seeds', `${num(limit, 1, 100)} Mo/s`, mode.value],
        ['Blender-Open-Movie-4K.mkv', '22 seeds', '14.2 Mo/s', mode.value],
      ]);
      status.textContent = `Moteur actif : ${mode.value} (plafond ${num(limit, 1, 100)} Mo/s).`;
    };
    [mode, limit].forEach(x => x.addEventListener('input', render));
    render();
  };

  // 31. YouDlp-Dashboard
  demos['youdlp-dashboard-suite-compl-te-de-t-l-chargement-m-dia-yt-dlp-gui'] = root => {
    const {controls, result, status} = panel(root, 'Suite yt-dlp GUI & SponsorBlock', 'Configurez l’extraction 4K/8K et le saut automatique des sponsors.');
    const url = field(controls, 'URL Vidéo', 'text', 'https://youtube.com/watch?v=dQw4w9WgXcQ');
    const format = selectField(controls, 'Format', ['MP4 4K (H.264 + AAC)', 'MKV 8K VP9', 'MP3 Audio 320kbps']);
    const start = () => {
      rows(result, ['Paramètre', 'Valeur'], [
        ['Source', url.value || '—'],
        ['Profil', format.value],
        ['SponsorBlock', 'Actif (intro + sponsor coupés)'],
      ]);
      status.textContent = `File yt-dlp prête : ${format.value}.`;
    };
    action(controls, 'Ajouter à la file', start);
    start();
  };

  // 32. Guardian-Phone (OffGrid)
  demos['guardian-phone-offgrid-assistant-de-survie-s-curit-hors-ligne-ios'] = root => {
    const {controls, result, status} = panel(root, 'Console OffGrid — Survie & SOS Hors-Ligne', 'Activez la balise SOS, la boussole et la fiche médicale.');
    const mode = selectField(controls, 'Outil OffGrid', ['Balise SOS Morse (Flash)', 'Boussole & Coordonnées GPS', 'Fiche Médicale d’Urgence']);
    const render = () => {
      const data = {
        'Balise SOS Morse (Flash)': [['Signal', '··· --- ··· (SOS)'], ['Batterie estimée', '18h en mode éco']],
        'Boussole & Coordonnées GPS': [['Azimut', '312° NO'], ['Position', '48.6921° N, 6.1844° E (Hors-ligne)']],
        'Fiche Médicale d’Urgence': [['Groupe sanguin', 'O+'], ['Allergies', 'Aucune connue · Contact ICE prêt']],
      };
      rows(result, ['Module', 'État'], data[mode.value]);
      status.textContent = `Module OffGrid actif : ${mode.value}.`;
    };
    mode.addEventListener('input', render);
    render();
  };

  // 33. HideCam
  demos['hidecam-stealthrecorder-cam-ra-furtive-coffre-fort-s-curis-ios'] = root => {
    const {controls, result, status} = panel(root, 'Écran Camouflage 2048 & Coffre-Fort', 'Basculez entre le faux jeu 2048 et l’enregistrement furtif.');
    let recording = false;
    const toggle = () => {
      recording = !recording;
      rows(result, ['Couche', 'État'], [
        ['Façade affichée', 'Jeu 2048 (Score : 1024)'],
        ['Capture arrière-plan', recording ? '● Enregistrement HEVC chiffré' : '○ En veille'],
        ['Coffre-fort', 'Verrouillé (FaceID + AES-256)'],
      ]);
      status.textContent = recording ? 'Enregistrement furtif actif sous façade 2048.' : 'Mode veille sécurisé.';
    };
    action(controls, 'Basculer Capture Furtive', toggle);
    toggle();
  };

  // 34. NumPlay TI
  demos['numplay-ti-lecteur-multim-dia-mulateur-pour-ti-83-premium-ce'] = root => {
    const {controls, result, status} = panel(root, 'Émulateur TI-83 Premium CE (BALATRO.8xp)', 'Lancez un programme .8xp sur l’écran 320×240 de la calculatrice.');
    const prog = selectField(controls, 'Programme .8xp', ['BALATRO.8xp (Jeu de cartes)', 'NUMPLAY.8xp (Lecteur Vidéo)', 'ASM_DEMO.8xp']);
    const render = () => {
      rows(result, ['Spécification TI-83 CE', 'Valeur'], [
        ['Programme chargé', prog.value],
        ['CPU / RAM', 'eZ80 @ 48 MHz · 256 Ko RAM'],
        ['Affichage', '320×240 px · 16-bit RGB565'],
      ]);
      status.textContent = `${prog.value} exécuté sur TI-83 Premium CE.`;
    };
    prog.addEventListener('input', render);
    render();
  };

  // 35. Minecraft Serveur Archive
  demos['minecraft-serveur-modding-archive'] = root => {
    const {controls, result, status} = panel(root, 'Console Serveur Minecraft Moddé', 'Inspectez les mods, la RAM allouée et les joueurs en ligne.');
    const ram = field(controls, 'RAM JVM (Go)', 'number', '8', {min: 2, max: 32});
    const render = () => {
      rows(result, ['Paramètre', 'Valeur'], [
        ['Version', 'Forge 1.20.1 · 42 mods actifs'],
        ['Mémoire JVM', `-Xmx${num(ram, 2, 32)}G -Xms${num(ram, 2, 32)}G`],
        ['TPS', '20.0 TPS (Stable)'],
      ]);
      status.textContent = `Serveur prêt avec ${num(ram, 2, 32)} Go de RAM.`;
    };
    ram.addEventListener('input', render);
    render();
  };

  // 36. AgentTube Studio
  demos['agenttube-studio'] = root => {
    const {controls, result, status} = panel(root, 'AgentTube Studio — CTR & Timeline 85 SFX', 'Optimisez le titre, la miniature et le rythme sonore.');
    const title = field(controls, 'Titre YouTube', 'text', 'J’ai automatisé mon PC avec 12 agents IA');
    const sfx = field(controls, 'Densité SFX (effets/min)', 'number', '8', {min: 1, max: 20});
    const render = () => {
      const score = Math.min(98, 72 + (title.value.length > 20 ? 12 : 4) + num(sfx, 1, 20));
      rows(result, ['Agent', 'Sortie'], [
        ['Agent CTR', `Score estimé : ${score}/100`],
        ['Agent Montage', `${num(sfx, 1, 20)} SFX/min · Banque 85 SFX`],
      ]);
      status.textContent = `CTR prédit : ${score}/100 pour "${title.value}".`;
    };
    [title, sfx].forEach(x => x.addEventListener('input', render));
    render();
  };

  // 37. InstaGrowth AgentSkill
  demos['instagrowth-agentskill'] = root => {
    const {controls, result, status} = panel(root, 'Suite 13 Compétences Instagram', 'Générez un carrousel et une séquence d’outreach marques.');
    const niche = selectField(controls, 'Niche', ['Tech & IA', 'Design & UI', 'Sport & Nutrition']);
    const render = () => {
      rows(result, ['Skill activé', 'Livrable'], [
        ['Carousel Architect', `7 slides optimisées (${niche.value})`],
        ['Brand Outreach', 'Email + DM personnalisé taux rép. 18%'],
      ]);
      status.textContent = `Campagne InstaGrowth prête pour ${niche.value}.`;
    };
    niche.addEventListener('input', render);
    render();
  };

  // 38. MapLead Prospector
  demos['maplead-prospector'] = root => {
    const {controls, result, status} = panel(root, 'Scanner B2B Google Maps & Audits 490€', 'Détectez les fiches sans site web ou à faible note SEO.');
    const city = field(controls, 'Ville cible', 'text', 'Nancy');
    const sector = selectField(controls, 'Secteur', ['Artisans / BTP', 'Restaurants', 'Cabinets médicaux']);
    const scan = () => {
      rows(result, ['Entreprise', 'Anomalie détectée', 'Offre'], [
        [`${sector.value} (${city.value} #1)`, 'Pas de site HTTPS', 'Audit + Refonte 490 €'],
        [`${sector.value} (${city.value} #2)`, 'Note 3.4★ · 0 réponse avis', 'Pack SEO Local 490 €'],
      ]);
      status.textContent = `2 prospects qualifiés détectés à ${city.value}.`;
    };
    action(controls, 'Scanner Google Maps', scan);
    scan();
  };

  // 39. MemePOD Automator
  demos['memepod-automator'] = root => {
    const {controls, result, status} = panel(root, 'Studio Print-On-Demand TikTok & n8n', 'Simulez la détection de tendance et la génération de mockup.');
    const trend = selectField(controls, 'Tendance TikTok', ['Dev Tired Club', 'Cat Coding 24/7', 'Retro Terminal 1984']);
    const render = () => {
      rows(result, ['Étape n8n', 'Résultat'], [
        ['Design Vectoriel', `${trend.value} (300 DPI PNG)`],
        ['Mockup Hoodie / T-Shirt', 'Prêt · Prix conseillé 34,90 €'],
      ]);
      status.textContent = `Produit POD "${trend.value}" prêt à publier.`;
    };
    trend.addEventListener('input', render);
    render();
  };

  // 40. AcousticKey Spy
  demos['acoustickey-spy'] = root => {
    const {controls, result, status} = panel(root, 'Démonstrateur Attaque Acoustique Clavier', 'Visualisez la classification spectrale des touches mécaniques.');
    const switchType = selectField(controls, 'Type de switch', ['Cherry MX Blue (Clic)', 'Cherry MX Red (Linéaire)', 'Laptop Chiclet']);
    const render = () => {
      const acc = switchType.value.includes('Blue') ? '94.2 %' : switchType.value.includes('Red') ? '88.5 %' : '81.0 %';
      rows(result, ['Paramètre spectral', 'Mesure'], [
        ['Profil acoustique', switchType.value],
        ['Précision classifieur MFCC', acc],
        ['Fenêtre FFT', '44.1 kHz · 2048 pts'],
      ]);
      status.textContent = `Précision estimée sur ${switchType.value} : ${acc}.`;
    };
    switchType.addEventListener('input', render);
    render();
  };

  // 41. NutriTikTok Extractor
  demos['nutritiktok-extractor'] = root => {
    const {controls, result, status} = panel(root, 'Extracteur Recette & Macros TikTok', 'Extrayez les ingrédients d’une vidéo et rééquilibrez les macros.');
    const recipe = selectField(controls, 'Recette extraite', ['Bowl Poulet Avocat', 'Pancakes Protéinés', 'Pâtes Carbonara Fit']);
    const render = () => {
      const macros = {
        'Bowl Poulet Avocat': [['Poulet 180g + Riz 150g + Avocat', '540 kcal', '46g P · 52g G · 16g L']],
        'Pancakes Protéinés': [['Avoine 60g + 2 Œufs + Whey 30g', '410 kcal', '38g P · 42g G · 9g L']],
        'Pâtes Carbonara Fit': [['Pâtes 120g + Skyr + Bacon volaille', '485 kcal', '34g P · 64g G · 10g L']],
      };
      rows(result, ['Ingrédients', 'Énergie', 'Macros (P/G/L)'], macros[recipe.value]);
      status.textContent = `Macros calculées pour "${recipe.value}".`;
    };
    recipe.addEventListener('input', render);
    render();
  };

  // 42. RestoVision AI
  demos['restovision-ai'] = root => {
    const {controls, result, status} = panel(root, 'Surveillance Tables & Prédiction Effectif', 'Visualisez le taux d’occupation en salle et le besoin en serveurs.');
    const tables = field(controls, 'Tables occupées (/24)', 'number', '18', {min: 0, max: 24});
    const render = () => {
      const t = num(tables, 0, 24);
      const staff = Math.max(1, Math.ceil(t / 6));
      rows(result, ['Indicateur salle', 'Valeur'], [
        ['Occupation', `${t} / 24 tables (${Math.round((t / 24) * 100)} %)`],
        ['Effectif recommandé', `${staff} serveur${staff > 1 ? 's' : ''}`],
        ['Temps d’attente moyen', `${Math.max(2, Math.round(t * 0.6))} min`],
      ]);
      status.textContent = `${t}/24 tables occupées · ${staff} serveur(s) recommandé(s).`;
    };
    tables.addEventListener('input', render);
    render();
  };
})();

(() => {
  const demos = (window.PROJECT_DEMOS = window.PROJECT_DEMOS || Object.create(null));
  const el = (t, c, k) => { const n = document.createElement(t); if (c != null) n.textContent = c; if (k) n.className = k; return n; };
  const panel = (root, title, summary) => {
    const s = el('section'), c = el('div', null, 'workflow-controls demo-fields'), r = el('div', null, 'workflow-result'), st = el('p', '', 'workflow-status');
    st.setAttribute('role', 'status'); s.append(el('h2', title), el('p', summary), c, r, st); root.append(s); return {controls: c, result: r, status: st};
  };
  const field = (p, l, t, v, a = {}) => { const w = el('label', l), i = el(t === 'textarea' ? 'textarea' : 'input'); if (t !== 'textarea') i.type = t; Object.assign(i, {value: v}, a); w.append(i); p.append(w); return i; };
  const selectField = (p, l, opts) => { const w = el('label', l), s = el('select'); opts.forEach(o => s.append(el('option', o))); w.append(s); p.append(w); return s; };
  const action = (p, l, fn) => { const b = el('button', l); b.type = 'button'; b.addEventListener('click', fn); p.append(b); return b; };
  const rows = (r, h, e) => {
    const t = el('table'), tr = el('tr'); h.forEach(x => { const th = el('th', x); th.scope = 'col'; tr.append(th); });
    const hd = el('thead'), bd = el('tbody'); hd.append(tr);
    e.forEach(v => { const row = el('tr'); v.forEach(x => row.append(el('td', String(x)))); bd.append(row); });
    t.append(hd, bd); r.replaceChildren(t);
  };
  const num = (i, mn, mx) => Math.min(mx, Math.max(mn, Number(i.value) || 0));

  // 43. RayBan VoiceNod
  demos['rayban-voicenod'] = root => {
    const {controls, result, status} = panel(root, 'Contrôle Gestuel Ray-Ban Meta', 'Simulez un hochement de tête IMU pour déclencher dictée et envoi WhatsApp.');
    const gesture = selectField(controls, 'Geste IMU', ['Hochement bas (Confirmer / Envoyer)', 'Secousse latérale (Annuler)', 'Double hochement (Dictée)']);
    const msg = field(controls, 'Message dicté', 'text', 'J’arrive dans 10 minutes.');
    const trigger = () => {
      rows(result, ['Capteur', 'Geste', 'Action WhatsApp'], [
        ['IMU 6-axes', gesture.value, gesture.value.includes('Annuler') ? 'Envoi annulé' : `Envoyé : "${msg.value}"`],
      ]);
      status.textContent = `Geste "${gesture.value}" traité.`;
    };
    action(controls, 'Simuler Geste', trigger);
    trigger();
  };

  // 44. SmartTV CrackerUI
  demos['smarttv-crackerui'] = root => {
    const {controls, result, status} = panel(root, 'Lanceur 10-Foot Sans Pub (Smart TV)', 'Configurez les tuiles du launcher Android TV / Tizen rooté.');
    const app = selectField(controls, 'Tuile principale', ['Plex / Jellyfin Local', 'YouTube (AdFree)', 'Moonlight 4K GameStream', 'RetroArch']);
    const render = () => {
      rows(result, ['Paramètre Launcher', 'État'], [
        ['Tuile sélectionnée', app.value],
        ['Télémétrie & Pubs OEM', 'Bloquées (hosts + ADB)'],
        ['Interface', '10-Foot 4K @ 60fps'],
      ]);
      status.textContent = `Launcher prêt · Focus sur ${app.value}.`;
    };
    app.addEventListener('input', render);
    render();
  };

  // 45. SyncTrain OfflineMusic
  demos['synctrain-offlinemusic'] = root => {
    const {controls, result, status} = panel(root, 'Lecteur Musical P2P Hors-Ligne', 'Lancez une lecture aléatoire depuis votre bibliothèque synchronisée.');
    const tracks = ['Nujabes — Aruarian Dance.flac', 'Daft Punk — Veridis Quo.flac', 'Boards of Canada — Roygbiv.flac', 'Kavinsky — Nightcall.flac'];
    let idx = 0;
    const next = () => {
      idx = (idx + 1) % tracks.length;
      rows(result, ['Piste en cours', 'Source SyncTrain', 'Format'], [[tracks[idx], 'Dossier local P2P', 'FLAC 24-bit']]);
      status.textContent = `Lecture : ${tracks[idx]}`;
    };
    action(controls, 'Piste aléatoire suivante', next);
    next();
  };

  // 46. FruityTag FindMy
  demos['fruitytag-findmy'] = root => {
    const {controls, result, status} = panel(root, 'AirTag DIY nRF52840 & Apple Find My', 'Simulez la rotation de clé publique BLE et la balise Zephyr RTOS.');
    const interval = field(controls, 'Intervalle ADV (ms)', 'number', '2000', {min: 500, max: 5000});
    const render = () => {
      rows(result, ['Paramètre BLE', 'Valeur'], [
        ['SoC', 'SuperMini nRF52840 (Zephyr RTOS)'],
        ['Intervalle publicitaire', `${num(interval, 500, 5000)} ms`],
        ['Autonomie CR2032', `~${Math.round((num(interval, 500, 5000) / 2000) * 11)} mois`],
      ]);
      status.textContent = `Balise Find My active (${num(interval, 500, 5000)} ms).`;
    };
    interval.addEventListener('input', render);
    render();
  };

  // 47. MetaChess
  demos['metachess-ia-chiqu-enne-raccourcis-ray-ban-meta'] = root => {
    const {controls, result, status} = panel(root, 'MetaChess — Vision POV & Stockfish', 'Analysez une position d’échecs capturée par lunettes Ray-Ban Meta.');
    const fen = selectField(controls, 'Position détectée', ['Ouverture Italienne (e4 e5 Cf3 Cc6 Fc4)', 'Défense Sicilienne (e4 c5)', 'Finale Tour + Pion']);
    const render = () => {
      const best = fen.value.includes('Italienne') ? ['O-O (Roque)', '+0.35'] : fen.value.includes('Sicilienne') ? ['Cf3', '+0.28'] : ['Td7+', '+1.40'];
      rows(result, ['Position POV', 'Meilleur coup Stockfish', 'Évaluation'], [[fen.value, best[0], best[1]]]);
      status.textContent = `Audio TTS vers lunettes : "Joue ${best[0]} (${best[1]})".`;
    };
    fen.addEventListener('input', render);
    render();
  };

  // 48. MineMesh
  demos['minemesh-r-seau-distribu-sync-p2p-minecraft-offline'] = root => {
    const {controls, result, status} = panel(root, 'Réseau P2P Minecraft LAN (MineMesh)', 'Reliez des joueurs sans serveur dédié via relais distribué.');
    const peers = field(controls, 'Pairs connectés', 'number', '4', {min: 1, max: 16});
    const render = () => {
      rows(result, ['Nœud Mesh', 'Ping P2P', 'Chunks sync'], [
        ['Hôte (Jules)', '0 ms (Local)', '100 %'],
        [`${num(peers, 1, 16) - 1} pair(s) distant(s)`, '18 ms', 'Delta compressé'],
      ]);
      status.textContent = `Mesh LAN actif avec ${num(peers, 1, 16)} joueur(s).`;
    };
    peers.addEventListener('input', render);
    render();
  };

  // 49. SwitchHorizon
  demos['switchhorizon-port-natif-minecraft-rust-sur-nintendo-switch'] = root => {
    const {controls, result, status} = panel(root, 'Port Natif Rust/Zig — Nintendo Switch ARM64', 'Inspectez la télémétrie moteur Horizon OS (libnx).');
    const chunks = field(controls, 'Distance d’affichage (chunks)', 'number', '10', {min: 4, max: 16});
    const render = () => {
      const c = num(chunks, 4, 16);
      const fps = Math.max(30, 60 - Math.max(0, c - 10) * 4);
      rows(result, ['Métrique Switch', 'Valeur'], [
        ['Architecture', 'ARM64 Cortex-A57 (Rust + Zig)'],
        ['Distance chunks', `${c} chunks`],
        ['Framerate cible', `${fps} FPS (720p Portable / 1080p Dock)`],
      ]);
      status.textContent = `Moteur ARM64 : ${fps} FPS à ${c} chunks.`;
    };
    chunks.addEventListener('input', render);
    render();
  };

  // 50. iOS 18 Security Lab
  demos['ios-18-security-lab-recherche-vuln-rabilit-s-patch-diffing'] = root => {
    const {controls, result, status} = panel(root, 'iOS 18 Patch Diffing & Dyld Lab', 'Comparez deux builds IPSW pour repérer les correctifs noyau.');
    const target = selectField(controls, 'Cible d’analyse', ['kernelcache.release.iphone14,2', 'dyld_shared_cache_arm64e', 'WebKit.framework']);
    const render = () => {
      rows(result, ['Binaire', 'Fonctions modifiées', 'Statut CNA'], [
        [target.value, '14 symboles diffés', 'Analyse statique prête'],
      ]);
      status.textContent = `Patch diffing terminé sur ${target.value}.`;
    };
    target.addEventListener('input', render);
    render();
  };

  // 51. DNS Jumper
  demos['dns-jumper-optimiseur-benchmark-dns-windows'] = root => {
    const {controls, result, status} = panel(root, 'Benchmark Résolveurs DNS Windows', 'Comparez la latence de 6 résolveurs et basculez sur le plus rapide.');
    const run = () => {
      rows(result, ['Résolveur', 'IP', 'Latence'], [
        ['Cloudflare', '1.1.1.1', '9 ms (Recommandé)'],
        ['Quad9', '9.9.9.9', '14 ms'],
        ['Google', '8.8.8.8', '16 ms'],
        ['AdGuard DNS', '94.140.14.14', '19 ms'],
      ]);
      status.textContent = 'Benchmark terminé : Cloudflare 1.1.1.1 est le plus rapide (9 ms).';
    };
    action(controls, 'Lancer Benchmark DNS', run);
    run();
  };

  // 52. TiWeb
  demos['tiweb-passerelle-webusb-calculatrices-ti'] = root => {
    const {controls, result, status} = panel(root, 'Passerelle WebUSB Calculatrices TI', 'Simulez la détection USB et le transfert de fichiers .8xp.');
    const model = selectField(controls, 'Modèle TI', ['TI-83 Premium CE', 'TI-84 Plus CE', 'TI-82 Advanced']);
    const file = selectField(controls, 'Fichier .8xp', ['BALATRO.8xp (48 Ko)', 'MATH_SOLVER.8xp (12 Ko)']);
    const send = () => {
      rows(result, ['Périphérique WebUSB', 'Fichier', 'Transfert'], [
        [model.value, file.value, '100 % — Stocké en Archive RAM'],
      ]);
      status.textContent = `${file.value} transféré vers ${model.value} via WebUSB.`;
    };
    action(controls, 'Envoyer vers TI', send);
    send();
  };

  // 53. WinPE SAM Bypass
  demos['winpe-sam-bypass-kit-maintenance-hors-ligne-windows'] = root => {
    const {controls, result, status} = panel(root, 'Kit Maintenance WinPE (Ruche SAM)', 'Simulez la détection de partition Windows et la sauvegarde SAM.');
    const drive = selectField(controls, 'Partition détectée', ['C:\\Windows\\System32\\config\\SAM', 'D:\\Windows\\System32\\config\\SAM']);
    const backup = () => {
      rows(result, ['Étape WinPE', 'Résultat'], [
        ['Ruche ciblée', drive.value],
        ['Sauvegarde', 'SAM.bak + SYSTEM.bak créés'],
        ['Statut', 'Prêt pour récupération compte local'],
      ]);
      status.textContent = `Sauvegarde SAM effectuée sur ${drive.value}.`;
    };
    action(controls, 'Sauvegarder Ruche SAM', backup);
    backup();
  };

  // 54. Me2
  demos['me2-mod-lisation-cognitive-clone-prompt-priv'] = root => {
    const {controls, result, status} = panel(root, 'Modélisation Cognitive & Clone Prompt', 'Testez l’arbre décisionnel selon le contexte de décision.');
    const ctx = selectField(controls, 'Contexte', ['Arbitrage Technique', 'Négociation / Vente', 'Priorisation Temps']);
    const render = () => {
      rows(result, ['Dimension', 'Règle Me2'], [
        ['Contexte', ctx.value],
        ['Heuristique', 'Impact long terme > Gain court terme'],
        ['Sortie', 'Décision directe en 3 points max'],
      ]);
      status.textContent = `Profil cognitif calibré sur "${ctx.value}".`;
    };
    ctx.addEventListener('input', render);
    render();
  };

  // 55. MultiServ
  demos['multiserv'] = root => {
    const {controls, result, status} = panel(root, 'Flasheur Debian & Cloud-Init (MultiServ)', 'Générez une configuration Cloud-Init prête à déployer.');
    const host = field(controls, 'Hostname', 'text', 'debian-prod-01');
    const role = selectField(controls, 'Profil serveur', ['Docker + Traefik', 'PostgreSQL + Redis', 'Node.js + Nginx']);
    const render = () => {
      rows(result, ['Champ Cloud-Init', 'Valeur'], [
        ['hostname', host.value || 'debian-prod-01'],
        ['packages', role.value],
        ['SSH', 'Clé Ed25519 · PasswordAuth: false'],
      ]);
      status.textContent = `Image Debian Cloud-Init prête pour ${host.value || 'debian-prod-01'}.`;
    };
    [host, role].forEach(x => x.addEventListener('input', render));
    render();
  };

  // 56. GambleServeur
  demos['gambleserveur'] = root => {
    const {controls, result, status} = panel(root, 'GambleServeur — Lucky Blocks & Arène PvP', 'Ouvrez un Lucky Block simulé et consultez votre profil joueur.');
    const tier = selectField(controls, 'Type de Lucky Block', ['Lucky Block Or', 'Lucky Block Diamant', 'Lucky Block Chaos']);
    const loots = ['Épée Tranchant V', 'Armure Diamant P4', 'Pluie de TNT (Piège !)', '32× Lingots d’Or', 'Arc Flamme II'];
    const open = () => {
      const loot = loots[Math.floor(Math.random() * loots.length)];
      rows(result, ['Bloc ouvert', 'Récompense', 'Arène'], [[tier.value, loot, 'Forge 1.20.1 · PvP Actif']]);
      status.textContent = `${tier.value} ouvert : ${loot} !`;
    };
    action(controls, 'Ouvrir Lucky Block', open);
    open();
  };
})();
