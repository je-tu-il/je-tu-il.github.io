(() => {
  'use strict';
  const get = id => document.getElementById(id);
  const back = document.querySelector?.('.btn-back-portfolio');
  if (back && document.referrer) {
    const previous = new URL(document.referrer);
    const catalogue = new URL(back.href);
    const homepage = new URL('./', catalogue);
    if (previous.origin === catalogue.origin && [catalogue.pathname, homepage.pathname].includes(previous.pathname)) {
      catalogue.search = previous.search;
      back.href = catalogue.href;
    }
  }


  const id = new URLSearchParams(window.location.search).get('id');
  const project = window.PROJECTS_DATA?.find(item => item.id === id);
  const scene = project && window.PORTFOLIO_DEMOS?.[project.id];
  if (!scene) {
    const unav = get('unavailable');
    if (unav) unav.hidden = false;
    return;
  }

  document.title = project.title + ' | Démo';
  get('title').textContent = project.title;
  get('description').textContent = project.tagline;
  const workflow = window.PORTFOLIO_WORKFLOWS?.[id];
  if (workflow) {
    const wfNode = get('workflow');
    if (wfNode) {
      workflow(wfNode);
      wfNode.hidden = false;
      return;
    }
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
    const inputs = get('inputs');
    if (inputs) inputs.append(label);
    return input;
  }

  let showResult = () => scene.result;
  if (id === 'ddd-hugo-decrypte') {
    const day = addField('Jour de décembre', 'number', '7', {min: '1', max: '31', step: '1', required: true});
    showResult = () => {
      const n = day.valueAsNumber;
      const videos = n === 1 ? 'vidéo' : 'vidéos';
      return 'Le ' + n + ' décembre : ' + n + ' ' + videos + ', ' + (n * (n + 1) / 2) + ' au total.';
    };
  } else if (id === 'nousdeux-application-mobile-couple-intimit') {
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
    if (run) {
      run.textContent = scene.action;
      run.disabled = false;
    }
    if (output) output.textContent = 'Prêt à démarrer.';
  }

  const controls = get('controls');
  if (controls) {
    controls.addEventListener('submit', event => {
      if (event && event.preventDefault) event.preventDefault();
      if (output) output.textContent = showResult();
      if (run && run.disabled) {
        const rst = get('reset');
        if (rst && rst.focus) rst.focus();
      }
    });
    controls.addEventListener('reset', reset);
  }
  reset();
  const scen = get('scenario');
  if (scen) scen.hidden = false;
})();
