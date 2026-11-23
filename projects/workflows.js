(() => {
  'use strict';

  function workshop(root, heading, description) {
    const panel = document.createElement('section');
    const title = document.createElement('h2');
    const intro = document.createElement('p');
    const controls = document.createElement('div');
    const result = document.createElement('div');
    const status = document.createElement('p');
    title.textContent = heading;
    intro.textContent = description;
    intro.className = 'muted';
    controls.className = 'workflow-controls';
    result.className = 'workflow-result';
    status.className = 'workflow-status';
    status.setAttribute('role', 'status');
    panel.append(title, intro, controls, result, status);
    root.append(panel);
    return {controls, result, status};
  }

  function button(parent, text, run) {
    const element = document.createElement('button');
    element.type = 'button';
    element.textContent = text;
    element.addEventListener('click', run);
    parent.append(element);
    return element;
  }

  function field(parent, title, options, change) {
    const label = document.createElement('label');
    const input = document.createElement('input');
    Object.assign(input, options);
    label.append(title, input);
    parent.append(label);
    if (change) input.addEventListener('input', change);
    return input;
  }

  function table(parent, columns, rows) {
    const element = document.createElement('table');
    const header = element.createTHead().insertRow();
    for (const column of columns) {
      const cell = document.createElement('th');
      cell.scope = 'col';
      cell.textContent = column;
      header.append(cell);
    }
    const body = element.createTBody();
    for (const row of rows) {
      const next = body.insertRow();
      for (const value of row) next.insertCell().textContent = value;
    }
    parent.replaceChildren(element);
  }

  function backup(root) {
    const {controls, result, status} = workshop(root, 'Comparer, sauvegarder et restaurer',
      'Trois fichiers fictifs représentent le dossier source et sa dernière sauvegarde.');
    const source = new Map([['cours.pdf', 2], ['budget.csv', 1], ['photo.jpg', 1]]);
    const baseline = [['cours.pdf', 1], ['budget.csv', 1]];
    let snapshot = new Map(baseline);
    const render = () => table(result, ['Fichier', 'Source', 'Sauvegarde', 'État'],
      [...source].map(([name, version]) => [name, version, snapshot.get(name) ?? '—',
        snapshot.get(name) === version ? 'Identique' : snapshot.has(name) ? 'Modifié' : 'Nouveau']));
    const select = document.createElement('select');
    select.setAttribute('aria-label', 'Fichier à restaurer');
    for (const name of source.keys()) select.add(new Option(name, name));
    button(controls, 'Sauvegarder les changements', () => {
      const changes = [...source].filter(([name, version]) => snapshot.get(name) !== version);
      snapshot = new Map(source);
      status.textContent = changes.length + ' fichier(s) copié(s) dans la sauvegarde simulée.';
      render();
    });
    controls.append(select);
    button(controls, 'Restaurer ce fichier', () => {
      const name = select.value;
      const version = snapshot.get(name);
      if (version === undefined) {
        status.textContent = name + ' ne figure pas dans la sauvegarde.';
        return;
      }
      source.set(name, version);
      status.textContent = name + ' restauré en version ' + version + '.';
      render();
    });
    button(controls, 'Réinitialiser', () => {
      snapshot = new Map(baseline);
      source.set('cours.pdf', 2);
      status.textContent = '';
      render();
    });
    render();
  }

  function badminton(root) {
    const {controls, result, status} = workshop(root, 'Arbitrer un simple',
      'Jouez les points. Une manche se gagne à 21 points avec deux points d’écart, ou au premier qui atteint 30.');
    const players = ['Camille', 'Alex'];
    let points = [0, 0];
    let games = [0, 0];
    let server = 0;
    let winner = null;
    const render = () => table(result, ['Joueur', 'Points', 'Manches', 'Service'],
      players.map((name, i) => [name, points[i], games[i], winner === null && server === i ? '●' : '—']));
    const actions = players.map((name, i) => button(controls, 'Point pour ' + name, () => {
      points[i]++;
      server = i;
      if (points[i] === 30 || (points[i] >= 21 && points[i] - points[1 - i] >= 2)) {
        games[i]++;
        if (games[i] === 2) {
          winner = i;
          actions.forEach(action => { action.disabled = true; });
          status.textContent = name + ' remporte le match.';
        } else {
          points = [0, 0];
          status.textContent = name + ' remporte la manche. La suivante commence.';
        }
      } else status.textContent = 'Service : ' + name + '.';
      render();
    }));
    button(controls, 'Nouvelle partie', () => {
      points = [0, 0]; games = [0, 0]; server = 0; winner = null;
      actions.forEach(action => { action.disabled = false; });
      status.textContent = '';
      render();
    });
    render();
  }

  function library(root) {
    const {controls, result, status} = workshop(root, 'Gérer les prêts',
      'Recherchez un jeu fictif, sélectionnez sa ligne, puis enregistrez un prêt ou un retour.');
    const games = [{name:'Azur', state:'Disponible'}, {name:'Prairie', state:'Prêté'}, {name:'Verger', state:'Disponible'}];
    const search = field(controls, 'Rechercher', {type:'search'}, () => render());
    const render = () => {
      const visible = games.filter(game => game.name.toLowerCase().includes(search.value.trim().toLowerCase()));
      table(result, ['Jeu', 'État', 'Action'], visible.map(game => [game.name, game.state, '']));
      visible.forEach((game, i) => {
        button(result.querySelector('tbody').rows[i].cells[2], game.state === 'Prêté' ? 'Retour' : 'Prêter', () => {
          game.state = game.state === 'Prêté' ? 'Disponible' : 'Prêté';
          status.textContent = game.name + ' : ' + game.state.toLowerCase() + '.';
          render();
        });
      });
      if (!visible.length) status.textContent = 'Aucun jeu correspondant.';
    };
    render();
  }

  function network(root) {
    const {controls, result, status} = workshop(root, 'Observer les effets d’une connexion dégradée',
      'Ce modèle utilise des requêtes fictives. Les réglages du réseau restent intacts.');
    const chart = document.createElement('meter');
    chart.min = 0; chart.max = 2000;
    chart.setAttribute('aria-label', 'Délai simulé en millisecondes');
    const requests = document.createElement('div');
    result.append(chart, requests);
    const update = () => {
      const delay = 40 + Number(latency.value);
      chart.value = delay;
      status.textContent = delay + ' ms par requête · ' + loss.value + ' % de pertes simulées.';
    };
    const latency = field(controls, 'Latence ajoutée', {type:'range', min:0, max:1960, value:100, step:10}, update);
    const loss = field(controls, 'Paquets perdus (%)', {type:'range', min:0, max:100, value:10}, update);
    button(controls, 'Simuler 10 requêtes', () => {
      const lost = Math.round(Number(loss.value) / 10);
      table(requests, ['Requête', 'Résultat'], Array.from({length:10}, (_, i) =>
        [i + 1, i < lost ? 'Perdue' : (40 + Number(latency.value)) + ' ms']));
      status.textContent = (10 - lost) + ' réponses reçues sur 10.';
    });
    update();
  }

  function maintenance(root) {
    const {controls, result, status} = workshop(root, 'Retrouver une procédure de maintenance',
      'Recherchez dans trois notices fictives. Comparez les versions et ouvrez la source avant d’utiliser la consigne.');
    const docs = [
      {id:'CTA-04', topic:'Ventilation · Filtre', rev:'B', state:'Archivée', text:'Ancienne fiche de contrôle trimestriel.'},
      {id:'CTA-04', topic:'Ventilation · Filtre', rev:'C', state:'En vigueur', text:'Contrôler le filtre lors de la ronde mensuelle et enregistrer le résultat dans le registre fictif.'},
      {id:'MAT-02', topic:'Inventaire · Capteurs', rev:'A', state:'En vigueur', text:'Vérifier que la fiche correspond au numéro de série fictif indiqué.'},
    ];
    const query = field(controls, 'Mots-clés', {type:'search', value:'filtre'}, () => render());
    const archived = field(controls, 'Inclure les archives', {type:'checkbox'}, () => render());
    const render = () => {
      const words = query.value.trim().toLowerCase().split(/\s+/);
      const found = docs.filter(doc => (archived.checked || doc.state !== 'Archivée') &&
        words.every(word => (doc.id + ' ' + doc.topic + ' ' + doc.text).toLowerCase().includes(word)));
      table(result, ['Référence', 'Sujet', 'Révision', 'État', 'Source'],
        found.map(doc => [doc.id, doc.topic, doc.rev, doc.state, '']));
      found.forEach((doc, i) => button(result.querySelector('tbody').rows[i].cells[4], 'Lire', () => {
        status.textContent = doc.id + ' rév. ' + doc.rev + ' — ' + doc.text;
      }));
      status.textContent = found.length + ' notice(s) trouvée(s).';
    };
    render();
  }

  function habit(root) {
    const {controls, result, status} = workshop(root, 'Suivre une semaine de routine',
      'Cochez les habitudes terminées. Le bilan se recalcule par jour et par habitude.');
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const names = ['Lire 10 min', 'Marcher', 'Préparer demain'];
    const checks = [];
    const update = () => {
      const count = checks.filter(input => input.checked).length;
      status.textContent = count + ' / ' + checks.length + ' objectifs validés.';
    };
    table(result, ['Habitude', ...days], names.map(name => [name, ...days.map(() => '')]));
    Array.from(result.querySelector('tbody').rows).forEach((row, i) => {
      days.forEach((day, j) => {
        const check = document.createElement('input');
        check.type = 'checkbox';
        check.setAttribute('aria-label', names[i] + ' – ' + day);
        check.addEventListener('change', update);
        checks.push(check);
        row.cells[j + 1].append(check);
      });
    });
    button(controls, 'Réinitialiser la semaine', () => {
      checks.forEach(check => { check.checked = false; });
      update();
    });
    update();
  }

  window.PORTFOLIO_WORKFLOWS = {
    'autobackup': backup,
    'champibad-plateforme-comp-tition-club-badminton': badminton,
    'biblijeu-online': library,
    'connexionbug-simulateur-de-fake-lag-mauvaise-connexion': network,
    'maintai-syst-me-d-ia-souverain-pour-la-maintenance-industrielle-4-0': maintenance,
    'minimalist-offline-first-habit-tracker': habit,
    'visual-habit-routine-master-checklist': habit,
  };
})();
