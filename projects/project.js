(() => {
  const get = id => document.getElementById(id);
  const projectId = new URLSearchParams(location.search).get('id');
  const project = window.PROJECTS_DATA?.find(item => item.id === projectId);
  if (!project) {
    get('projectMissing').hidden = false;
    return;
  }

  document.title = project.title + ' | Je-tu-il';
  get('projectName').textContent = project.title;
  get('projectCategory').textContent = project.categoryLabel;
  get('projectTagline').textContent = project.tagline;
  get('projectDesc').textContent = project.description;

  const listItem = value => {
    const item = document.createElement('li');
    item.textContent = value;
    return item;
  };
  get('featureList').append(...(project.features || []).flat(Infinity).map(listItem));
  get('techStack').append(...(project.techStack || []).map(listItem));

  const primary = get('liveDemoBtn');
  const launch = project.runnableUrl
    ? new URL(project.runnableUrl, new URL('../', location.href))
    : new URL('demo.html?id=' + encodeURIComponent(project.id), location.href);
  if (project.runnableUrl) launch.searchParams.set('utm_source', 'portfolio');
  primary.href = launch.href;
  primary.textContent = project.runnableUrl ? 'Ouvrir sur le web ↗' : 'Voir la démo →';
  for (const [id, href] of [['githubBtn', project.githubUrl], ['downloadZipBtn', project.downloadUrl]]) {
    if (!href) continue;
    const anchor = get(id);
    anchor.href = href;
    anchor.hidden = false;
  }

  const markdown = window.PROJECTS_READMES?.[project.id];
  if (markdown && window.renderMarkdown) {
    get('readmeRendered').innerHTML = window.renderMarkdown(markdown);
    get('readmeSection').hidden = false;
  }
  get('projectSheet').hidden = false;
})();

