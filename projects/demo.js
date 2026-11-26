(() => {
  const get = id => document.getElementById(id);
  const id = new URLSearchParams(window.location.search).get('id');
  const project = window.PROJECTS_DATA?.find(item => item.id === id);
  if (!project) {
    get('unavailable').hidden = false;
    return;
  }

  document.title = project.title + ' | Démo';
  get('title').textContent = project.title;
  get('description').textContent = project.tagline;
  const workflow = window.PORTFOLIO_WORKFLOWS?.[id] || window.PROJECT_DEMOS?.[id];
  if (workflow) {
    const stage = get('workflow');
    workflow(stage);
    stage.hidden = false;
  }

  const live = get('demoLive');
  if (project.runnableUrl) {
    const url = new URL(project.runnableUrl, new URL('../', window.location.href));
    url.searchParams.set('utm_source', 'portfolio');
    if (!workflow) {
      window.location.replace(url.href);
      return;
    }
    live.href = url.href;
    live.hidden = false;
  } else if (!workflow) {
    get('demoPending').hidden = false;
    get('demoSheet').href = 'project.html?id=' + encodeURIComponent(id);
  }
})();
