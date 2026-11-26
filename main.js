const categories = new Map([
  ['desktop', ['Applications desktop', '#a14630']],
  ['mobile', ['Applications mobiles', '#386441']],
  ['games', ['Web et jeux', '#315e79']],
  ['web', ['Applications web', '#3d6265']],
  ['3d-hardware', ['Entreprise et 3D', '#914e26']],
  ['hardware', ['Électronique et calculatrices', '#565482']],
  ['security', ['Sécurité et scripts', '#545c31']],
  ['docs', ['Documentation', '#7d465e']],
  ['concepts', ['Laboratoire et R&D', '#5d5146']],
]);

const grid = document.getElementById('projectsGrid');
const search = document.getElementById('mainSearchInput');
const status = document.getElementById('countDisplay');
const tabs = document.getElementById('categoryTabs');
const projects = window.PROJECTS_DATA || [];

function demoUrl(project) {
  return project.runnableUrl || 'projects/demo.html?id=' + encodeURIComponent(project.id);
}

function plainText(value) {
  return String(value || '').normalize('NFD').replace(/\p{Mark}/gu, '').toLowerCase();
}

function launchUrl(project) {
  const url = new URL(demoUrl(project), document.baseURI);
  if (project.runnableUrl) url.searchParams.set('utm_source', 'portfolio');
  return url.href;
}

function link(label, href, className) {
  const anchor = document.createElement('a');
  anchor.textContent = label;
  anchor.href = href;
  if (className) anchor.className = className;
  return anchor;
}

function createProject(project) {
  const card = document.createElement('article');
  card.className = 'project';
  const title = document.createElement('h3');
  title.textContent = project.title;
  const description = document.createElement('p');
  description.textContent = project.tagline;
  const actions = document.createElement('div');
  actions.className = 'project-actions';
  const hasDemo = window.PORTFOLIO_WORKFLOWS?.[project.id] || window.PROJECT_DEMOS?.[project.id];
  const label = project.runnableUrl ? 'Ouvrir sur le web ↗' : hasDemo ? 'Voir la démo →' : 'Voir le projet →';
  const sheet = 'projects/project.html?id=' + encodeURIComponent(project.id);
  const primary = link(label, project.runnableUrl || hasDemo ? launchUrl(project) : sheet, 'project-launch');
  primary.setAttribute('aria-label', primary.textContent + ' · ' + project.title);
  const resources = document.createElement('div');
  resources.className = 'project-resources';
  if (project.downloadUrl) resources.append(link('ZIP', project.downloadUrl));
  if (project.githubUrl) resources.append(link('GitHub', project.githubUrl));
  if (project.runnableUrl || hasDemo) resources.append(link('Fiche', sheet));
  for (const resource of resources.children) {
    resource.setAttribute('aria-label', resource.textContent + ' · ' + project.title);
  }
  actions.append(primary, resources);
  card.append(title, description, actions);
  return card;
}

function initCatalogue() {
  const total = document.querySelector('[data-project-total]');
  total.textContent = projects.length;
  const sections = new Map();
  const params = new URLSearchParams(window.location.search);
  let selected = params.get('categorie') || 'all';
  search.value = params.get('q') || '';

  for (const [id, [label, color]] of categories) {
    const section = document.createElement('section');
    section.id = 'categorie-' + id;
    section.style.setProperty('--ink-color', color);
    const heading = document.createElement('h2');
    heading.textContent = label;
    const list = document.createElement('div');
    list.className = 'project-list';
    section.append(heading, list);
    grid.append(section);
    sections.set(id, {section, list});
  }

  const entries = projects.slice().sort((a, b) => a.title.localeCompare(b.title, 'fr')).map(project => {
    const {list} = sections.get(project.category);
    const card = createProject(project);
    list.append(card);
    const keywords = plainText([project.title, project.tagline, project.description, project.categoryLabel, ...project.techStack].join(' '));
    return {project, card, keywords};
  });

  const filters = new Map();
  for (const [id, label] of [['all', 'Tous'], ['runnable', 'Versions web'], ...Array.from(categories, ([id, [label]]) => [id, label])]) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    filters.set(id, button);
    tabs.append(button);
    button.addEventListener('click', () => {
      selected = id;
      filterProjects();
    });
  }
  if (!filters.has(selected)) selected = 'all';

  function filterProjects() {
    const terms = plainText(search.value).trim().split(/\s+/);
    const visible = new Set();
    let count = 0;
    for (const {project, card, keywords} of entries) {
      const inCategory = selected === 'all' || selected === project.category || (selected === 'runnable' && Boolean(project.runnableUrl));
      card.hidden = !(inCategory && terms.every(term => keywords.includes(term)));
      if (!card.hidden) {
        visible.add(project.category);
        count++;
      }
    }
    for (const [id, {section}] of sections) section.hidden = !visible.has(id);
    for (const [id, button] of filters) button.setAttribute('aria-pressed', String(id === selected));
    status.textContent = count === 0 ? 'Aucun projet trouvé.' : '';

    const url = new URL(window.location.href);
    if (selected === 'all') url.searchParams.delete('categorie');
    else url.searchParams.set('categorie', selected);
    if (search.value.trim()) url.searchParams.set('q', search.value.trim());
    else url.searchParams.delete('q');
    if (url.href !== window.location.href && url.protocol !== 'file:') history.replaceState(null, '', url);
  }

  search.addEventListener('input', filterProjects);
  filterProjects();
}

if (grid) initCatalogue();
