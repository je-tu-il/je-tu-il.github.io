(() => {
  'use strict';
  const get = id => document.getElementById(id);
  const id = new URLSearchParams(window.location.search).get('id');
  const project = window.PROJECTS_DATA?.find(item => item.id === id);
  const scene = project && window.PORTFOLIO_DEMOS?.[project.id];
  if (!scene) {
    get('unavailable').hidden = false;
    return;
  }

  document.title = project.title + ' | Démo';
  get('title').textContent = project.title;
  get('category').textContent = project.categoryLabel || project.category;
  get('description').textContent = project.tagline;
  const details = get('details');
  details.href = 'project.html?id=' + encodeURIComponent(project.id);
  details.hidden = false;
  if (project.isRunnable && project.runnableUrl) {
    get('live').href = '../' + project.runnableUrl;
    get('live').hidden = false;
  }

  const output = get('result');
  const run = get('run');
  let step = 0;
  function addField(labelText, type, value, attrs = {}) {
    const label = document.createElement('label');
    const input = document.createElement('input');
    label.textContent = labelText;
    Object.assign(input, { type, defaultValue: value, ...attrs });
    label.append(input);
    get('inputs').append(label);
    return input;
  }

  let showResult = () => scene.result;
  if (id === 'nousdeux-application-mobile-couple-intimit') {
    get('description').textContent = 'Question du jour : quel souvenir de nous te fait sourire ?';
    showResult = () => {
      if (step++ === 0) {
        run.textContent = 'Partager la réponse d’Alex';
        return scene.result;
      }
      run.disabled = true;
      return 'Camille : notre premier pique-nique. Alex : la fois où on a dansé sous la pluie.';
    };
  } else if (id === 'securepdf-redactor-caviardage-anonymisation-locale') {
    const sample = addField('Nom fictif', 'text', 'Camille Test', { maxLength: 80, required: true });
    showResult = () => 'Nom ' + '█'.repeat(Array.from(sample.value.trim()).length) + ' · Référence 4521';
  } else if (id === 'optideal-moteur-d-optimisation-des-cumuls-remboursements') {
    const amount = addField('Prix fictif (€)', 'number', '50', {min: '0', max: '1000000', step: '0.01', required: true});
    const discount = addField('Remise (%)', 'number', '10', {min: '0', max: '100', step: '0.01', required: true});
    const euros = new Intl.NumberFormat('fr-FR', {style:'currency', currency:'EUR'});
    showResult = () => 'Prix remisé : ' + euros.format(amount.valueAsNumber * (1 - discount.valueAsNumber / 100));
  } else if (id === 'wavedrop') {
    const message = addField('Message fictif à envoyer', 'text', 'Bonjour', {maxLength: 120, required: true});
    showResult = () => 'Réception virtuelle : « ' + message.value + ' ». Aucun capteur n’est sollicité.';
  }

  function reset() {
    step = 0;
    run.textContent = scene.action;
    run.disabled = false;
    output.textContent = 'Prêt à démarrer.';
  }
  get('controls').addEventListener('submit', event => {
    event.preventDefault();
    output.textContent = showResult();
    if (run.disabled) get('reset').focus();
  });
  get('controls').addEventListener('reset', reset);
  reset();
  get('scenario').hidden = false;
})();
