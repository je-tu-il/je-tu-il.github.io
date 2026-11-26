(() => {
  const demos = Object.create(null);

  function element(tag, content) {
    const node = document.createElement(tag);
    if (content !== undefined) node.textContent = content;
    return node;
  }

  function panel(root, title, summary) {
    const section = element('section');
    const controls = element('div');
    controls.className = 'workflow-controls demo-fields';
    const result = element('div');
    result.className = 'workflow-result';
    const status = element('p', '');
    status.className = 'workflow-status';
    status.setAttribute('role', 'status');
    section.append(element('h2', title), element('p', summary), controls, result, status);
    root.append(section);
    return {controls, result, status};
  }

  function field(parent, label, type, value, attributes = {}) {
    const wrapper = element('label', label);
    const control = element(type === 'textarea' ? 'textarea' : 'input');
    if (type !== 'textarea') control.type = type;
    Object.assign(control, {value}, attributes);
    wrapper.append(control);
    parent.append(wrapper);
    return control;
  }

  function action(parent, label, run) {
    const button = element('button', label);
    button.type = 'button';
    button.addEventListener('click', run);
    parent.append(button);
    return button;
  }

  function rows(result, headings, entries) {
    const table = element('table');
    const header = element('tr');
    for (const label of headings) {
      const column = element('th', label);
      column.scope = 'col';
      header.append(column);
    }
    const head = element('thead');
    const body = element('tbody');
    head.append(header);
    for (const values of entries) {
      const row = element('tr');
      for (const value of values) row.append(element('td', value));
      body.append(row);
    }
    table.append(head, body);
    result.replaceChildren(table);
  }

  const lines = text => text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const number = (input, min, max) => Math.min(max, Math.max(min, Number(input.value) || 0));
  const count = new Intl.NumberFormat('fr-FR');
  const time = seconds => String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');

  demos['ddd-hugo-decrypte'] = root => {
    const {controls, result, status} = panel(root, 'Calendrier de décembre', 'Choisissez un jour et enregistrez vos visionnages dans ce calendrier d’essai.');
    const day = field(controls, 'Jour de décembre', 'number', '1', {min: 1, max: 31});
    const watched = Array(31).fill(0);
    const render = () => {
      const index = Math.trunc(number(day, 1, 31)) - 1;
      rows(result, ['Jour', 'Visionnages', 'Objectif'], watched.map((value, i) => [String(i + 1), String(value), String(i + 1)]));
      status.textContent = watched[index] + ' sur ' + (index + 1) + ' ce jour. Total de décembre : ' + watched.reduce((sum, value) => sum + value, 0) + ' sur 496.';
    };
    action(controls, 'Ajouter un visionnage', () => { watched[Math.trunc(number(day, 1, 31)) - 1]++; render(); });
    action(controls, 'Retirer un visionnage', () => {
      const i = Math.trunc(number(day, 1, 31)) - 1;
      watched[i] = Math.max(0, watched[i] - 1);
      render();
    });
    day.addEventListener('input', render);
    render();
  };

  demos['nousdeux-application-mobile-couple-intimit'] = root => {
    const {controls, result, status} = panel(root, 'Question du jour', 'Quel souvenir de nous te fait sourire ? Jouez les deux rôles sur cet écran.');
    const answers = [];
    const input = field(controls, 'Réponse', 'textarea', '', {maxLength: 280});
    const submit = action(controls, 'Enregistrer la réponse de Camille', () => {
      if (!input.value.trim()) { status.textContent = 'Écrivez une réponse pour continuer.'; return; }
      answers.push(input.value.trim());
      input.value = '';
      if (answers.length === 1) {
        submit.textContent = 'Enregistrer la réponse d’Alex';
        status.textContent = 'La réponse de Camille est enregistrée. Elle reste masquée jusqu’à celle d’Alex.';
      } else {
        rows(result, ['Participant', 'Souvenir'], [['Camille', answers[0]], ['Alex', answers[1]]]);
        status.textContent = 'Les deux réponses sont disponibles.';
        input.disabled = true;
        submit.disabled = true;
      }
    });
    action(controls, 'Recommencer', () => {
      answers.length = 0;
      input.value = '';
      input.disabled = false;
      submit.disabled = false;
      submit.textContent = 'Enregistrer la réponse de Camille';
      result.replaceChildren();
      status.textContent = '';
    });
  };

  demos['indexcite-nettoyeur-de-citations-ia-pour-obsidian'] = root => {
    const {controls, result, status} = panel(root, 'Nettoyer des citations', 'Collez du Markdown. Le nettoyage reprend la règle de détection d’IndexCite.');
    const input = field(controls, 'Markdown', 'textarea', 'Lire [la note](notes.md) [cite: 12].\nValeurs attendues : [0, 1].');
    const output = field(result, 'Texte nettoyé', 'textarea', '', {readOnly: true});
    action(controls, 'Nettoyer', () => {
      const citations = /`?\[(?:cite(?:_search|_source)?|citation|source)\s*:\s*[^\]]+\]`?/gi;
      const matches = input.value.match(citations) || [];
      output.value = input.value.replace(citations, '').replace(/ +([.,;:!?])/g, '$1');
      status.textContent = count.format(matches.length) + ' marqueur(s) supprimé(s).';
    });
  };

  demos['unfollowspy-audit-d-abonn-s-s-curit-instagram-sans-api'] = root => {
    const {controls, result, status} = panel(root, 'Comparer les deux listes', 'Modifiez les noms fictifs. La comparaison s’exécute dans le navigateur.');
    const following = field(controls, 'Abonnements', 'textarea', 'camille\nalex\nsam');
    const followers = field(controls, 'Abonnés', 'textarea', 'alex\nlou');
    const whitelist = field(controls, 'Ignorer ces noms', 'textarea', 'sam');
    action(controls, 'Comparer', () => {
      const users = input => new Set(lines(input.value).map(name => name.replace(/^@/, '').toLowerCase()));
      const a = users(following), b = users(followers), ignored = users(whitelist);
      const entries = [...new Set([...a, ...b])].filter(name => !ignored.has(name) && a.has(name) !== b.has(name));
      rows(result, ['Compte', 'Statut'], entries.map(name => ['@' + name, a.has(name) ? 'Ne vous suit pas' : 'Vous ne suivez pas']));
      status.textContent = entries.length ? entries.length + ' compte(s) sans abonnement réciproque.' : 'Tous les comptes retenus sont réciproques.';
    });
  };

  demos['notime-memento-mori-wallpaper-engine-pour-iphone'] = root => {
    const {controls, result, status} = panel(root, 'Prévisualiser le fond d’écran', 'Chaque ligne représente un an et chaque point une semaine. Utilisez une date fictive.');
    const birth = field(controls, 'Date de naissance', 'date', '2000-01-01');
    const years = field(controls, 'Années affichées', 'number', '80', {min: 1, max: 120});
    const canvas = element('canvas');
    canvas.setAttribute('role', 'img');
    result.append(canvas);
    const render = () => {
      const date = Date.parse(birth.value);
      if (!Number.isFinite(date) || date > Date.now()) { status.textContent = 'Indiquez une date passée.'; return; }
      const age = Math.floor((Date.now() - date) / 604800000);
      const horizon = Math.trunc(number(years, 1, 120));
      canvas.width = 424;
      canvas.height = horizon * 8 + 20;
      const context = canvas.getContext('2d');
      context.fillStyle = '#151814';
      context.fillRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < horizon * 52; i++) {
        context.fillStyle = i < age ? '#f8f1dc' : i === age ? '#eb8063' : '#5b6159';
        context.fillRect(6 + (i % 52) * 8, 12 + Math.floor(i / 52) * 8, 4, 4);
      }
      status.textContent = count.format(age) + ' semaines écoulées depuis cette date.';
      canvas.setAttribute('aria-label', status.textContent + ' Grille de ' + horizon + ' années.');
    };
    action(controls, 'Actualiser la grille', render);
    render();
  };

  demos['miniescape-syst-me-d-animation-d-escape-game-local'] = root => {
    const {controls, result, status} = panel(root, 'Poste du maître du jeu', 'Démarrez le chronomètre, publiez un indice et basculez vers le poste des joueurs pour essayer un code. Les deux postes sont représentés sur le même écran.');
    const seconds = field(controls, 'Durée en secondes', 'number', '120', {min: 10, max: 600});
    const hint = field(controls, 'Indice à envoyer', 'text', 'Le code est le nombre de jours d’une année ordinaire.');
    const code = field(controls, 'Code des joueurs', 'text', '', {maxLength: 12});
    let remaining = 120;
    let deadline = null;
    let clue = 'Aucun indice envoyé';
    let solved = false;
    let timer;
    const render = () => rows(result, ['Chronomètre', 'Écran des joueurs'], [[time(remaining), clue]]);
    const pause = () => { clearInterval(timer); deadline = null; };
    const tick = () => {
      remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      render();
      if (!remaining) { pause(); status.textContent = 'Le temps est écoulé.'; }
    };
    action(controls, 'Démarrer / reprendre', () => {
      if (deadline !== null || solved || !remaining) return;
      deadline = Date.now() + remaining * 1000;
      timer = setInterval(tick, 250);
    });
    action(controls, 'Pause', pause);
    action(controls, 'Envoyer l’indice', () => { clue = hint.value.trim() || 'Aucun indice envoyé'; render(); });
    action(controls, 'Vérifier le code', () => {
      if (!remaining || solved) return;
      if (code.value.trim() === '365') { solved = true; pause(); status.textContent = 'Énigme résolue.'; return; }
      if (deadline !== null) { deadline -= 10000; tick(); }
      else { remaining = Math.max(0, remaining - 10); render(); }
      status.textContent = remaining ? 'Code incorrect. Dix secondes retirées.' : 'Le temps est écoulé.';
    });
    action(controls, 'Nouvelle session', () => {
      pause(); remaining = Math.trunc(number(seconds, 10, 600)); solved = false;
      clue = 'Aucun indice envoyé'; code.value = ''; status.textContent = ''; render();
    });
    render();
  };

  demos['timebank-exchange'] = root => {
    const {controls, result, status} = panel(root, 'Demander du temps d’écran', 'Simulez le demandeur, puis la personne qui accepte ou refuse. Aucun réglage de l’appareil n’est modifié.');
    const minutes = field(controls, 'Minutes demandées', 'number', '10', {min: 1, max: 90});
    const reason = field(controls, 'Justification', 'text', 'Consulter les horaires du train');
    let budget = 30;
    let pending = null;
    const render = () => {
      rows(result, ['Réserve', 'Demande en attente'], [[budget + ' min', pending ? pending.minutes + ' min · ' + pending.reason : 'Aucune']]);
    };
    action(controls, 'Envoyer la demande', () => {
      if (pending) { status.textContent = 'Une demande attend déjà une décision.'; return; }
      if (!reason.value.trim()) { status.textContent = 'Renseignez la justification.'; return; }
      pending = {minutes: Math.trunc(number(minutes, 1, 90)), reason: reason.value.trim()};
      status.textContent = 'Demande envoyée au partenaire.';
      render();
    });
    action(controls, 'Accepter', () => {
      if (!pending) return;
      if (pending.minutes > budget) { status.textContent = 'La réserve est insuffisante.'; return; }
      budget -= pending.minutes; pending = null; status.textContent = 'Demande acceptée et réserve débitée.'; render();
    });
    action(controls, 'Refuser', () => {
      if (!pending) return;
      pending = null; status.textContent = 'Demande refusée.'; render();
    });
    render();
  };

  demos['fingerpick-compagnon-ios-pour-jeux-de-soci-t'] = root => {
    const {controls, result, status} = panel(root, 'Préparer une partie', 'Tirez le premier joueur et lancez les dés. Saisissez un nom par ligne.');
    const players = field(controls, 'Joueurs', 'textarea', 'Camille\nAlex\nLou');
    const dice = field(controls, 'Nombre de dés à six faces', 'number', '2', {min: 1, max: 10});
    const random = max => Math.floor(Math.random() * max);
    action(controls, 'Tirer le premier joueur', () => {
      const names = [...new Set(lines(players.value))];
      if (names.length < 2) { status.textContent = 'Ajoutez au moins deux joueurs.'; return; }
      status.textContent = names[random(names.length)] + ' commence.';
    });
    action(controls, 'Lancer les dés', () => {
      const scores = Array.from({length: Math.trunc(number(dice, 1, 10))}, () => 1 + random(6));
      rows(result, ['Dé', 'Valeur'], scores.map((score, i) => [String(i + 1), String(score)]));
      status.textContent = 'Total : ' + scores.reduce((sum, score) => sum + score, 0) + '.';
    });
  };

  demos['musictinder-tri-nettoyage-musical-gamifi-par-swipe'] = root => {
    const {controls, result, status} = panel(root, 'Trier une bibliothèque musicale', 'Ajoutez des fichiers audio pour les écouter sur cet appareil. Les décisions classent la session sans modifier vos fichiers.');
    const picker = field(controls, 'Fichiers audio', 'file', '', {multiple: true, accept: 'audio/*'});
    const player = element('audio');
    player.controls = true;
    player.hidden = true;
    const report = element('div');
    result.append(player, report);
    let files = [], decisions = [], url;
    const render = () => {
      if (url) URL.revokeObjectURL(url);
      const file = files[decisions.length];
      player.hidden = !file;
      if (file) {
        url = URL.createObjectURL(file);
        player.src = url;
      } else {
        url = undefined;
        player.removeAttribute('src');
        player.load();
      }
      rows(report, ['Fichier', 'Décision'], decisions);
      status.textContent = file ? 'À écouter : ' + file.name : files.length ? 'Tri terminé.' : 'Choisissez des fichiers audio.';
    };
    picker.addEventListener('change', () => {
      files = Array.from(picker.files);
      decisions = [];
      render();
    });
    for (const decision of ['Garder', 'Écarter']) {
      action(controls, decision, () => {
        const file = files[decisions.length];
        if (!file) return;
        decisions.push([file.name, decision]);
        render();
      });
    }
    action(controls, 'Annuler la dernière décision', () => { if (decisions.length) { decisions.pop(); render(); } });
    render();
  };

  demos['securepdf-redactor-caviardage-anonymisation-locale'] = root => {
    const {controls, result, status} = panel(root, 'Tester un caviardage sur un texte', 'Vérifiez le résultat sur le document d’essai. Cet atelier traite du texte et ne modifie pas de PDF.');
    const text = field(controls, 'Document fictif', 'textarea', 'Dossier : Camille Test\nRéférence interne 4521\nContact : camille@example.test');
    const terms = field(controls, 'Informations à retirer, une par ligne', 'textarea', 'Camille Test\ncamille@example.test');
    const output = field(result, 'Texte caviardé', 'textarea', '', {readOnly: true});
    action(controls, 'Caviarder', () => {
      const toRemove = [...new Set(lines(terms.value))].sort((a, b) => b.length - a.length);
      let filtered = text.value;
      for (const term of toRemove) filtered = filtered.replaceAll(term, '█'.repeat(Array.from(term).length));
      output.value = filtered;
      status.textContent = filtered === text.value ? 'Aucune correspondance.' : 'Le texte affiché contient les remplacements.';
    });
  };

  demos['nogpt-d-tecteur-heuristique-humaniseur-de-texte-ia'] = root => {
    const {controls, result, status} = panel(root, 'Observer la régularité d’un texte', 'Mesurez des indices de style sur votre texte. Ces mesures ne déterminent pas son auteur.');
    const text = field(controls, 'Texte à examiner', 'textarea', 'Je pars. Le soleil se lève derrière la colline. Je prends le premier train.');
    action(controls, 'Calculer les mesures', () => {
      const words = value => value.toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
      const all = words(text.value);
      const lengths = text.value.split(/[.!?]+/).map(value => words(value).length).filter(Boolean);
      if (!all.length) { status.textContent = 'Saisissez du texte.'; result.replaceChildren(); return; }
      const mean = all.length / lengths.length;
      const deviation = Math.sqrt(lengths.reduce((sum, length) => sum + (length - mean) ** 2, 0) / lengths.length);
      rows(result, ['Mesure', 'Valeur'], [['Mots', all.length], ['Phrases', lengths.length], ['Mots distincts', new Set(all).size], ['Écart type de longueur', deviation.toFixed(2)]]);
      status.textContent = 'Mesures recalculées.';
    });
  };

  demos['clock-of-hour-horloge-design-minimaliste-multi-os'] = root => {
    const {controls, result, status} = panel(root, 'Horloge et minuteur', 'Passez de l’heure locale à un minuteur de concentration.');
    const minutes = field(controls, 'Durée du minuteur en minutes', 'number', '25', {min: 1, max: 120});
    const face = element('p');
    face.className = 'demo-display';
    result.append(face);
    let deadline = null;
    const render = () => {
      const now = new Date();
      if (deadline === null) {
        face.textContent = now.toLocaleTimeString('fr-FR');
        return;
      }
      const remaining = Math.max(0, Math.ceil((deadline - now.getTime()) / 1000));
      face.textContent = time(remaining);
      if (!remaining) status.textContent = 'Minuteur terminé.';
    };
    action(controls, 'Démarrer le minuteur', () => { deadline = Date.now() + Math.trunc(number(minutes, 1, 120)) * 60000; status.textContent = ''; render(); });
    action(controls, 'Revenir à l’horloge', () => { deadline = null; status.textContent = ''; render(); });
    window.setInterval(render, 250);
    render();
  };

  demos['did-i-do-clone'] = root => {
    const {controls, result, status} = panel(root, 'Journal des vérifications', 'Validez un geste pour l’horodater, puis retrouvez-le dans l’historique de la session.');
    const events = [];
    const render = () => rows(result, ['Geste', 'Dernière validation'], events.map(entry => [entry.label, entry.time]));
    for (const label of ['Porte verrouillée', 'Plaques éteintes', 'Fenêtres fermées']) {
      action(controls, label, () => {
        events.unshift({label, time: new Date().toLocaleTimeString('fr-FR')});
        status.textContent = label + ' · enregistrée.';
        render();
      });
    }
    action(controls, 'Annuler la dernière vérification', () => { events.shift(); status.textContent = ''; render(); });
    render();
  };

  demos['stacklaunch-lanceur-widgets-d-applications-ios'] = root => {
    const {controls, result, status} = panel(root, 'Composer un groupe d’applications', 'Ajoutez des raccourcis au widget d’essai et réorganisez la liste. L’installation du widget se fait sur iOS.');
    const name = field(controls, 'Nom du raccourci', 'text', 'Calendrier', {maxLength: 40});
    const entries = ['Notes', 'Photos'];
    const render = () => {
      result.replaceChildren();
      for (const [i, text] of entries.entries()) {
        const row = element('div');
        row.className = 'demo-item';
        row.append(element('strong', text));
        const up = action(row, 'Monter', () => { [entries[i - 1], entries[i]] = [entries[i], entries[i - 1]]; render(); });
        up.disabled = i === 0;
        action(row, 'Retirer', () => { entries.splice(i, 1); render(); });
        result.append(row);
      }
      status.textContent = entries.length + ' raccourci(s) dans le groupe.';
    };
    action(controls, 'Ajouter', () => { const value = name.value.trim(); if (value && !entries.includes(value)) entries.push(value); render(); });
    render();
  };

  demos['autofiche-cheatsheet'] = root => {
    const {controls, result, status} = panel(root, 'Composer une fiche de révision', 'Séparez les notions par ligne, puis composez les deux faces.');
    const title = field(controls, 'Titre', 'text', 'Révision · Graphes');
    const content = field(controls, 'Notions', 'textarea', 'Sommet : élément d’un graphe\nArête : lien entre deux sommets\nDegré : nombre d’arêtes incidentes\nChemin : suite de sommets reliés');
    action(controls, 'Composer les deux faces', () => {
      const items = lines(content.value);
      result.replaceChildren(element('h3', title.value.trim() || 'Fiche de révision'));
      const split = Math.ceil(items.length / 2);
      for (const [label, entries] of [['Recto', items.slice(0, split)], ['Verso', items.slice(split)]]) {
        const section = element('section');
        section.className = 'demo-item';
        const list = element('ul');
        list.append(...entries.map(entry => element('li', entry)));
        section.append(element('h4', label), list);
        result.append(section);
      }
      status.textContent = items.length + ' notion(s) mises en page.';
    });
  };

  demos['clear-notifs-nettoyeur-d-empreinte-web-notifs'] = root => {
    const {controls, result, status} = panel(root, 'Gérer les données par site', 'Sélectionnez les données à retirer dans ce profil fictif. L’historique et les réglages du navigateur restent intacts.');
    const entries = [
      {name: 'media.example.test', cache: 18, cookies: 4, permission: true},
      {name: 'notes.example.test', cache: 3, cookies: 1, permission: false},
    ];
    const selected = element('select');
    selected.setAttribute('aria-label', 'Site à gérer');
    for (const [i, entry] of entries.entries()) {
      const option = element('option', entry.name);
      option.value = i;
      selected.append(option);
    }
    controls.append(selected);
    const render = () => rows(result, ['Site', 'Cache (Mo)', 'Cookies', 'Notifications'],
      entries.map(entry => [entry.name, entry.cache, entry.cookies, entry.permission ? 'Autorisées' : 'Bloquées']));
    action(controls, 'Vider cache et cookies', () => {
      const entry = entries[Number(selected.value)];
      entry.cache = 0; entry.cookies = 0; status.textContent = 'Données effacées dans le profil d’essai.'; render();
    });
    action(controls, 'Bloquer les notifications', () => {
      entries[Number(selected.value)].permission = false; status.textContent = 'Permission mise à jour.'; render();
    });
    render();
  };

  demos['ai-bookmark-assistant-extension-chrome-de-favoris'] = root => {
    const {controls, result, status} = panel(root, 'Dédupliquer les favoris', 'Saisissez une adresse par ligne. Les URL valides sont regroupées par site.');
    const input = field(controls, 'Adresses web', 'textarea', 'https://example.org/lecture\nhttps://example.org/lecture#sommaire\nhttps://example.net/recettes');
    action(controls, 'Analyser les favoris', () => {
      const links = new Map();
      let invalid = 0;
      let duplicates = 0;
      for (const line of lines(input.value)) {
        let url;
        try { url = new URL(line); } catch { invalid++; continue; }
        if (url.protocol !== 'http:' && url.protocol !== 'https:') { invalid++; continue; }
        url.hash = '';
        if (links.has(url.href)) duplicates++;
        else links.set(url.href, url.hostname);
      }
      rows(result, ['Site', 'Favori'], [...links].sort((a, b) => a[1].localeCompare(b[1])).map(([url, site]) => [site, url]));
      status.textContent = duplicates + ' doublon(s), ' + invalid + ' ligne(s) invalide(s).';
    });
  };

  demos['yggdex-moteur-d-indexation-catalogue-multim-dia-fts5'] = root => {
    const {controls, result, status} = panel(root, 'Rechercher dans un catalogue multimédia', 'Indexez les titres d’essai, puis combinez plusieurs mots-clés.');
    const titles = field(controls, 'Titres à indexer', 'textarea', 'Train de nuit\nVoyage en montagne\nTrain panoramique de montagne');
    const query = field(controls, 'Recherche', 'search', 'train montagne');
    let index = lines(titles.value);
    const render = () => {
      const words = query.value.toLowerCase().trim().split(/\s+/);
      const found = index.filter(title => words.every(word => title.toLowerCase().includes(word)));
      rows(result, ['Titre'], found.map(title => [title]));
      status.textContent = found.length + ' résultat(s) dans ' + index.length + ' titres indexés.';
    };
    action(controls, 'Réindexer le catalogue', () => { index = lines(titles.value); render(); });
    query.addEventListener('input', render);
    render();
  };

  demos['game-db'] = root => {
    const {controls, result, status} = panel(root, 'Rapprocher les fiches de jeux', 'Saisissez des titres, un par ligne dans chaque catalogue. Les titres identiques sont regroupés dans une seule fiche.');
    const first = field(controls, 'Catalogue A', 'textarea', 'Azul\nCarcassonne\nCascadia');
    const second = field(controls, 'Catalogue B', 'textarea', 'azul\nCascadia\nKingdomino');
    action(controls, 'Fusionner les catalogues', () => {
      const merged = new Map();
      for (const [i, input] of [first, second].entries()) {
        for (const name of lines(input.value)) {
          const key = name.normalize('NFC').toLocaleLowerCase('fr');
          if (!merged.has(key)) merged.set(key, {name, sources: new Set()});
          merged.get(key).sources.add(i ? 'B' : 'A');
        }
      }
      rows(result, ['Jeu', 'Catalogues'], [...merged.values()].map(entry => [entry.name, [...entry.sources].join(', ')]));
      status.textContent = merged.size + ' jeu(x) distinct(s).';
    });
  };


  demos['photometa-restorer'] = root => {
    const {controls, result, status} = panel(root, 'Identifier des dates candidates', 'Examinez une liste de noms de fichiers. Seules les dates explicites et valides sont proposées, sans modifier les photos.');
    const input = field(controls, 'Noms des fichiers', 'textarea', 'IMG_20240417_120000.jpg\nVacances_2023-07-22.png\nIMG_0148.jpg');
    action(controls, 'Rechercher les dates', () => {
      const entries = lines(input.value).map(name => {
        const match = name.match(/(?:^|\D)((?:19|20)\d{2})[-_]?([01]\d)[-_]?([0-3]\d)(?!\d)/);
        const value = match && match.slice(1).join('-');
        const day = value && new Date(value + 'T00:00:00Z');
        return [name, day && Number.isFinite(day.getTime()) && day.toISOString().startsWith(value) ? value : 'À vérifier'];
      });
      rows(result, ['Fichier', 'Date candidate'], entries);
      status.textContent = entries.filter(([, date]) => date !== 'À vérifier').length + ' date(s) retrouvée(s).';
    });
  };

  demos['coque-3d-hp-245-g8'] = root => {
    const {controls, result, status} = panel(root, 'Prévisualiser le contour et le jeu', 'Modifiez les cotes de l’exemple pour observer l’encombrement extérieur du contour. Les valeurs sont des cotes d’essai.');
    const width = field(controls, 'Largeur du châssis (mm)', 'number', '325', {min: 1, max: 450});
    const depth = field(controls, 'Profondeur du châssis (mm)', 'number', '225', {min: 1, max: 350});
    const gap = field(controls, 'Jeu par côté (mm)', 'number', '1', {min: 0, max: 10, step: '0.1'});
    const thickness = field(controls, 'Épaisseur du bord (mm)', 'number', '3', {min: 1, max: 20, step: '0.1'});
    const canvas = element('canvas');
    canvas.width = 520;
    canvas.height = 390;
    result.append(canvas);
    const render = () => {
      const w = number(width, 1, 450), d = number(depth, 1, 350);
      const extra = 2 * (number(gap, 0, 10) + number(thickness, 1, 20));
      const scale = Math.min(450 / (w + extra), 320 / (d + extra));
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, 520, 390);
      const outline = (x, y, color) => {
        ctx.fillStyle = color;
        ctx.fillRect((520 - x * scale) / 2, (390 - y * scale) / 2, x * scale, y * scale);
      };
      outline(w + extra, d + extra, '#315e79');
      outline(w + extra - 2 * number(thickness, 1, 20), d + extra - 2 * number(thickness, 1, 20), '#fffaf0');
      outline(w, d, '#ced4ac');
      status.textContent = 'Contour extérieur : ' + count.format(w + extra) + ' × ' + count.format(d + extra) + ' mm.';
      canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label', status.textContent);
    };
    action(controls, 'Recalculer', render);
    render();
  };

  demos['audio3d-studio-spatialisation-sonore-3d-binaural'] = root => {
    const {controls, result, status} = panel(root, 'Écouter le déplacement stéréo', 'Placez une tonalité à gauche ou à droite. Utilisez un casque pour distinguer les deux canaux.');
    const position = field(controls, 'Position de gauche à droite', 'range', '0', {min: -100, max: 100});
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) { status.textContent = 'Audio Web indisponible dans ce navigateur.'; return; }
    let context;
    action(controls, 'Écouter le signal', async () => {
      context ||= new Audio();
      try { await context.resume(); } catch { status.textContent = 'La lecture audio a été bloquée.'; return; }
      const oscillator = context.createOscillator();
      const stereo = context.createStereoPanner();
      const gain = context.createGain();
      const value = Number(position.value);
      const start = context.currentTime;
      stereo.pan.value = value / 100;
      oscillator.frequency.value = 440;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(.055, start + .04);
      gain.gain.linearRampToValueAtTime(0, start + .55);
      oscillator.connect(stereo).connect(gain).connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + .56);
      rows(result, ['Position', 'Signal'], [[value === 0 ? 'Centre' : (value < 0 ? 'Gauche ' : 'Droite ') + Math.abs(value) + ' %', '440 Hz']]);
      status.textContent = 'Signal joué.';
    });
  };

  demos['passapp-coffre-fort-d-centralis-local-first'] = root => {
    const {controls, result, status} = panel(root, 'Verrouiller et rouvrir un coffre local', 'Saisissez des identifiants fictifs. Le navigateur chiffre le coffre de cette session, qui disparaît en quittant la démo.');
    const phrase = field(controls, 'Phrase de déverrouillage fictive', 'password', '');
    const label = field(controls, 'Nom de la fiche', 'text', 'Compte exemple');
    const secret = field(controls, 'Secret fictif', 'text', '');
    const crypto = window.crypto;
    if (!crypto?.subtle) { status.textContent = 'Le chiffrement de cette démo nécessite un navigateur avec Web Crypto.'; return; }
    let entries = [], encrypted, salt, nonce, busy = false;
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    async function key(password) {
      const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']);
      return crypto.subtle.deriveKey({name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256'}, material,
        {name: 'AES-GCM', length: 256}, false, ['encrypt', 'decrypt']);
    }
    const render = () => {
      rows(result, ['Fiche', 'Secret (fictif)'], entries.map(item => [item.label, item.secret]));
    };
    action(controls, 'Ajouter la fiche', () => {
      if (busy || encrypted || !label.value.trim() || !secret.value.trim()) return;
      entries.push({label: label.value.trim(), secret: secret.value.trim()});
      secret.value = '';
      status.textContent = 'Fiche enregistrée.';
      render();
    });
    action(controls, 'Verrouiller', async () => {
      if (busy || encrypted || !entries.length) return;
      if (phrase.value.length < 8) { status.textContent = 'Utilisez au moins huit caractères dans la phrase fictive.'; return; }
      busy = true;
      salt = crypto.getRandomValues(new Uint8Array(16));
      nonce = crypto.getRandomValues(new Uint8Array(12));
      try {
        encrypted = await crypto.subtle.encrypt({name: 'AES-GCM', iv: nonce}, await key(phrase.value), encoder.encode(JSON.stringify(entries)));
        entries = [];
        phrase.value = ''; secret.value = '';
        status.textContent = 'Coffre verrouillé. Le contenu est chiffré en mémoire.';
        render();
      } catch { status.textContent = 'Le chiffrement a échoué.'; }
      finally { busy = false; }
    });
    action(controls, 'Déverrouiller', async () => {
      if (busy || !encrypted) return;
      busy = true;
      try {
        const decrypted = await crypto.subtle.decrypt({name: 'AES-GCM', iv: nonce}, await key(phrase.value), encrypted);
        entries = JSON.parse(decoder.decode(decrypted));
        encrypted = null;
        phrase.value = '';
        status.textContent = 'Coffre déverrouillé.';
        render();
      } catch { status.textContent = 'Phrase incorrecte. Le coffre reste verrouillé.'; }
      finally { busy = false; }
    });
    render();
  };

  demos['vlc-musique-controller-t-l-commande-de-bureau-osd-pour-vlc'] = root => {
    const {controls, result, status} = panel(root, 'Piloter la lecture dans un panneau flottant', 'Chargez un morceau local et testez les commandes. Le navigateur sert de lecteur pour la démo.');
    const file = field(controls, 'Fichier audio', 'file', '', {accept: 'audio/*'});
    const audio = element('audio');
    audio.controls = true;
    result.append(audio);
    const volume = field(controls, 'Volume', 'range', '80', {min: 0, max: 100});
    audio.volume = .8;
    let source;
    file.addEventListener('change', () => {
      if (source) URL.revokeObjectURL(source);
      const selected = file.files[0];
      if (selected) {
        source = URL.createObjectURL(selected);
        audio.src = source;
        status.textContent = selected.name;
      } else {
        source = null;
        audio.removeAttribute('src');
        audio.load();
        status.textContent = '';
      }
    });
    volume.addEventListener('input', () => { audio.volume = Number(volume.value) / 100; });
    action(controls, 'Lecture / pause', async () => {
      if (!source) { status.textContent = 'Sélectionnez un morceau.'; return; }
      try { if (audio.paused) await audio.play(); else audio.pause(); }
      catch { status.textContent = 'Le fichier n’a pas pu être lu.'; }
    });
    action(controls, 'Reculer de 10 secondes', () => { if (source) audio.currentTime = Math.max(0, audio.currentTime - 10); });
    action(controls, 'Avancer de 10 secondes', () => { if (Number.isFinite(audio.duration)) audio.currentTime = Math.min(audio.duration, audio.currentTime + 10); });
  };

  demos['lifetracker-gps'] = root => {
    const {controls, result, status} = panel(root, 'Construire un journal de lieux', 'Ajoutez des visites fictives par lieu. Le journal calcule la durée cumulée et le nombre de visites.');
    const place = field(controls, 'Lieu', 'text', 'Parc');
    const minutes = field(controls, 'Durée de visite (min)', 'number', '30', {min: 1, max: 1440});
    const visits = [];
    const render = () => {
      const summary = new Map();
      for (const visit of visits) {
        const existing = summary.get(visit.place) || {entries: 0, minutes: 0};
        existing.entries++;
        existing.minutes += visit.minutes;
        summary.set(visit.place, existing);
      }
      rows(result, ['Lieu', 'Visites', 'Temps cumulé'], [...summary].map(([name, data]) => [name, data.entries, data.minutes + ' min']));
      status.textContent = visits.length + ' visite(s) dans ' + summary.size + ' lieu(x).';
    };
    action(controls, 'Enregistrer la visite', () => {
      const name = place.value.trim();
      if (!name) return;
      visits.push({place: name, minutes: Math.trunc(number(minutes, 1, 1440))});
      render();
    });
    action(controls, 'Annuler la dernière visite', () => { visits.pop(); render(); });
    render();
  };

  demos['mp3-automatic-studio-tagging-id3-normalisation'] = root => {
    const {controls, result, status} = panel(root, 'Préparer les métadonnées d’un lot', 'Ajoutez des noms de fichiers sur le modèle « Artiste - Titre.mp3 », puis examinez les tags proposés avant toute modification.');
    const input = field(controls, 'Noms des morceaux', 'textarea', 'Camille - Premier morceau.mp3\nAlex - Route de nuit.mp3\ntrack04.mp3');
    const album = field(controls, 'Nom d’album pour le lot', 'text', 'Compilation');
    action(controls, 'Prévisualiser les tags', () => {
      const entries = lines(input.value).map(file => {
        const name = file.replace(/\.[a-z0-9]+$/i, '');
        const split = name.indexOf(' - ');
        return split === -1 ? [file, 'À compléter', name, album.value.trim()] :
          [file, name.slice(0, split), name.slice(split + 3), album.value.trim()];
      });
      rows(result, ['Fichier', 'Artiste', 'Titre', 'Album'], entries);
      status.textContent = entries.length + ' fichier(s) analysé(s). Les fichiers audio sont inchangés.';
    });
  };

  demos['p-le-graphisme-vectoriel-jeux-de-soci-t'] = root => {
    const {controls, result, status} = panel(root, 'Composer un aperçu de carte', 'Essayez un titre et une couleur pour prévisualiser la hiérarchie d’une carte de jeu.');
    const title = field(controls, 'Titre de la carte', 'text', 'Le Verger', {maxLength: 45});
    const color = field(controls, 'Couleur d’accent', 'color', '#315e79');
    const card = element('div');
    card.className = 'demo-graphic-card';
    const heading = element('strong');
    card.append(heading);
    result.append(card);
    const render = () => {
      heading.textContent = title.value.trim() || 'Carte sans titre';
      card.style.borderColor = color.value;
      status.textContent = 'Couleur appliquée à la bordure.';
    };
    title.addEventListener('input', render);
    color.addEventListener('input', render);
    render();
  };

  demos['antigravity-offline-studio'] = root => {
    const {controls, result, status} = panel(root, 'Rechercher dans les sessions', 'Parcourez cet échantillon fictif par titre ou par message.');
    const query = field(controls, 'Mots-clés', 'search', '');
    const sessions = [
      ['Prototype accueil', 'Réorganiser les cartes et tester la navigation au clavier.'],
      ['Vérification mobile', 'Revoir la connexion et le message de session expirée.'],
      ['Journal de publication', 'Construire l’archive et vérifier les fichiers livrés.'],
    ];
    const render = () => {
      const filtered = sessions.filter(session => session.join(' ').toLowerCase().includes(query.value.toLowerCase().trim()));
      result.replaceChildren();
      for (const [title, body] of filtered) {
        const detail = element('details');
        detail.append(element('summary', title), element('p', body));
        result.append(detail);
      }
      status.textContent = filtered.length + ' session(s) correspondant à la recherche.';
    };
    query.addEventListener('input', render);
    render();
  };

  demos['chess-tournaments-organisateur-d-centralis-de-tournois-d-checs'] = root => {
    const {controls, result, status} = panel(root, 'Arbitrer un tournoi à élimination directe', 'Inscrivez 2, 4 ou 8 joueurs. Validez un gagnant par match pour construire la ronde suivante.');
    const names = field(controls, 'Participants dans l’ordre de tête de série', 'textarea', 'Camille\nAlex\nLou\nSam');
    let matches = [];
    let round = 1;
    const render = () => {
      result.replaceChildren();
      for (const match of matches) {
        const row = element('div');
        row.className = 'demo-item';
        row.append(element('strong', match.players.join(' / ')));
        if (match.winner) row.append(element('span', 'Qualifié : ' + match.winner));
        else for (const player of match.players) {
          action(row, 'Victoire : ' + player, () => {
            match.winner = player;
            status.textContent = matches.length === 1 ? player + ' remporte le tournoi.' : 'Ronde ' + round + ' · résultat validé.';
            render();
          });
        }
        result.append(row);
      }
    };
    action(controls, 'Ouvrir le tournoi', () => {
      const players = [...new Set(lines(names.value))];
      if (![2, 4, 8].includes(players.length)) { status.textContent = 'Indiquez 2, 4 ou 8 noms distincts.'; return; }
      round = 1;
      matches = players.slice(0, players.length / 2).map((player, i) => ({players: [player, players[players.length - 1 - i]]}));
      status.textContent = 'Ronde 1 en cours.';
      render();
    });
    action(controls, 'Ouvrir la ronde suivante', () => {
      if (matches.length <= 1 || matches.some(match => !match.winner)) return;
      const qualifiers = matches.map(match => match.winner);
      matches = [];
      for (let i = 0; i < qualifiers.length; i += 2) matches.push({players: qualifiers.slice(i, i + 2)});
      status.textContent = 'Ronde ' + ++round + ' en cours.';
      render();
    });
  };

  demos['windrop-airapple'] = root => {
    const {controls, result, status} = panel(root, 'Essayer l’envoi et la réception d’un fichier', 'Cette séance représente un émetteur et un destinataire dans le même navigateur. Le destinataire choisit d’accepter ou de refuser.');
    const selection = field(controls, 'Fichier de test', 'file', '');
    let pending, downloadUrl;
    action(controls, 'Proposer au destinataire', () => {
      const file = selection.files[0];
      if (!file || pending) return;
      if (downloadUrl) { URL.revokeObjectURL(downloadUrl); downloadUrl = undefined; }
      pending = file;
      result.replaceChildren(element('p', file.name + ' · ' + count.format(file.size) + ' octets'));
      status.textContent = 'Demande en attente de validation.';
      accept.disabled = false;
      refuse.disabled = false;
    });
    const settle = message => {
      pending = undefined;
      accept.disabled = true;
      refuse.disabled = true;
      status.textContent = message;
    };
    const accept = action(controls, 'Accepter', () => {
      if (!pending) return;
      downloadUrl = URL.createObjectURL(pending);
      const download = element('a', 'Enregistrer le fichier reçu');
      download.href = downloadUrl;
      download.download = pending.name;
      result.append(download);
      settle('Fichier disponible côté destinataire.');
    });
    const refuse = action(controls, 'Refuser', () => { result.replaceChildren(); settle('Le destinataire a refusé.'); });
    settle('');
  };

  demos['allobsi-pont-unificateur-de-cours-pour-obsidian'] = root => {
    const {controls, result, status} = panel(root, 'Préparer l’index d’un cours', 'Indiquez les sujets importés. L’atelier produit un index Markdown avec les liens internes Obsidian.');
    const course = field(controls, 'Dossier du cours', 'text', 'Algorithmique');
    const lessons = field(controls, 'Notes à relier', 'textarea', 'Graphes\nTri rapide\nComplexité');
    const output = field(result, 'Index Markdown', 'textarea', '', {readOnly: true});
    action(controls, 'Générer l’index', () => {
      const name = course.value.replace(/[\r\n|\[\]]/g, '').trim() || 'Cours';
      const links = [...new Set(lines(lessons.value).map(lesson => lesson.replace(/[|\[\]]/g, '').trim()).filter(Boolean))];
      output.value = '# ' + name + '\n\n' + links.map(lesson => '- [[' + name + '/' + lesson + '|' + lesson + ']]').join('\n');
      status.textContent = links.length + ' note(s) référencée(s).';
    });
  };

  demos['simulateur-refonte-ergonomique-pda-hypermarch'] = root => {
    const {controls, result, status} = panel(root, 'Préparer une commande sur le PDA', 'Saisissez un code article puis validez la quantité. Cette commande utilise uniquement des références fictives.');
    const reference = field(controls, 'Code article', 'text', 'A102');
    const ordered = [{id:'A102', label:'Pommes bio', target:2, picked:0}, {id:'B315', label:'Riz', target:1, picked:0}, {id:'A118', label:'Poires', target:3, picked:0}];
    const quantity = field(controls, 'Quantité préparée', 'number', '1', {min: 1, max: 10});
    const render = () => rows(result, ['Code', 'Article', 'Préparé'], ordered.map(item => [item.id, item.label, item.picked + ' / ' + item.target]));
    action(controls, 'Vérifier et ajouter', () => {
      const line = ordered.find(item => item.id === reference.value.trim().toUpperCase());
      if (!line) { status.textContent = 'Le code ne figure pas sur cette commande.'; return; }
      const picked = Math.trunc(number(quantity, 1, 10));
      if (line.picked + picked > line.target) { status.textContent = 'La quantité dépasse celle à préparer.'; return; }
      line.picked += picked;
      status.textContent = ordered.every(item => item.picked === item.target) ? 'Commande complète.' : 'Quantité enregistrée.';
      render();
    });
    render();
  };

  window.PROJECT_DEMOS = demos;
})();
