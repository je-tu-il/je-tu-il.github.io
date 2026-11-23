(() => {
  'use strict';
  const get = id => document.getElementById(id);
  const id = new URLSearchParams(window.location.search).get('id');
  const project = window.PROJECTS_DATA?.find(item => item.id === id);
  const scene = project && window.PORTFOLIO_DEMOS?.[project.id];
  if (!scene) {
    const unav = get('unavailable');
    if (unav) unav.hidden = false;
    return;
  }

  document.title = project.title + ' | Démo & Documentation';
  get('title').textContent = project.title;
  get('category').textContent = project.categoryLabel || project.category;
  get('description').textContent = project.tagline;

  const topIcon = get('topIcon');
  if (topIcon) topIcon.textContent = project.icon || '🚀';
  const topTitle = get('topTitle');
  if (topTitle) topTitle.textContent = project.title;
  const catBadge = get('categoryBadge');
  if (catBadge) catBadge.textContent = project.categoryLabel || project.category;

  const details = get('details');
  if (details) {
    details.href = 'project.html?id=' + encodeURIComponent(project.id);
    details.hidden = false;
  }

  // Repository & Download URLs
  const ghBtn = get('githubRepoBtn');
  if (ghBtn) {
    if (project.githubUrl) {
      ghBtn.href = project.githubUrl;
      ghBtn.hidden = false;
    } else {
      ghBtn.hidden = true;
    }
  }

  const zipBtn = get('downloadZipBtn');
  if (zipBtn) {
    if (project.downloadUrl) {
      zipBtn.href = project.downloadUrl;
      zipBtn.hidden = false;
    } else if (project.githubUrl) {
      zipBtn.href = project.githubUrl + '/archive/refs/heads/main.zip';
      zipBtn.hidden = false;
    } else {
      zipBtn.hidden = true;
    }
  }

  // Live web version
  const live = get('live');
  if (project.isRunnable && project.runnableUrl) {
    const directWebUrl = /^https:\/\//.test(project.runnableUrl) ? project.runnableUrl : '../' + project.runnableUrl;
    if (live) {
      live.href = directWebUrl;
      live.hidden = false;
    }

    // Embed in iframe preview
    const iframeWrap = get('liveIframeWrapper');
    const iframe = get('projectIframe');
    const extBtn = get('iframeExternalBtn');
    if (iframeWrap && iframe) {
      iframe.src = directWebUrl;
      iframeWrap.hidden = false;
      if (extBtn) extBtn.href = directWebUrl;
    }
  }

  // Realistic Simulator Platform styling
  const platformFrame = get('platformFrame');
  const simTitle = get('simTitleBar');
  if (platformFrame && simTitle) {
    simTitle.textContent = project.title + ' — Simulateur';
    let frameClass = 'device-frame desktop-frame';
    if (project.category === 'mobile') {
      frameClass = 'device-frame mobile-frame';
    } else if (project.category === 'hardware') {
      frameClass = 'device-frame hardware-frame';
    } else if (project.category === 'security') {
      frameClass = 'device-frame terminal-frame';
    }
    platformFrame.className = frameClass;
  }

  // Render README Markdown
  const readmeBox = get('readmeContent');
  if (readmeBox) {
    const rawMarkdown = window.PROJECTS_READMES?.[project.id];
    if (rawMarkdown && typeof window.renderMarkdown === 'function') {
      readmeBox.innerHTML = window.renderMarkdown(rawMarkdown);
    } else if (rawMarkdown) {
      readmeBox.textContent = rawMarkdown;
    } else {
      // Fallback presentation
      const techList = (project.techStack || []).map(t => '`' + t + '`').join(', ');
      const featList = (project.features || []).map(f => '- ' + f).join('\n');
      const fallbackMd = '# ' + (project.icon || '🚀') + ' ' + project.title + '\n\n' +
        '> ' + project.tagline + '\n\n' +
        project.description + '\n\n' +
        '## ⚡ Spécifications\n\n' + featList + '\n\n' +
        '## 🛠️ Technologies\n\n' + techList + '\n\n' +
        '## 🐙 Dépôt & Téléchargement\n\n' +
        '- GitHub : [' + project.githubUrl + '](' + project.githubUrl + ')\n' +
        '- Télécharger ZIP : [' + project.downloadUrl + '](' + project.downloadUrl + ')\n';
      if (typeof window.renderMarkdown === 'function') {
        readmeBox.innerHTML = window.renderMarkdown(fallbackMd);
      } else {
        readmeBox.innerText = fallbackMd;
      }
    }
  }

  const workflow = window.PORTFOLIO_WORKFLOWS?.[id];
  if (workflow) {
    const wfNode = get('workflow');
    if (wfNode) {
      workflow(wfNode);
      wfNode.hidden = false;
      return;
    }
  }

  const scenTitle = get('scenario-title');
  if (scenTitle) scenTitle.textContent = 'Exemple guidé';

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
