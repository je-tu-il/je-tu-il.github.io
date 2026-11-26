const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const projects = require('../data/projects.json');
const readmes = require('../data/readmes.json');
const renderMarkdown = require('../data/markdown-renderer.js');

test('all 128 projects have valid githubUrl and downloadUrl', () => {
  assert.equal(projects.length, 128);
  for (const p of projects) {
    assert.ok(p.githubUrl && p.githubUrl.startsWith('https://github.com/je-tu-il/'), `Project ${p.id} missing githubUrl`);
    assert.ok(p.downloadUrl && p.downloadUrl.endsWith('/archive/refs/heads/main.zip'), `Project ${p.id} missing downloadUrl`);
    assert.equal(p.downloadUrl, p.githubUrl + '/archive/refs/heads/main.zip');
  }
});

test('all 128 projects have complete markdown README.md', () => {
  const ids = Object.keys(readmes);
  assert.equal(ids.length, 128);
  for (const p of projects) {
    const md = readmes[p.id];
    assert.ok(md && md.length > 30, `Project ${p.id} has empty or missing README`);
    const html = renderMarkdown(md);
    assert.ok(html && html.includes('<h'), `Project ${p.id} README failed to render valid HTML`);
  }
});

test('the full-page demo exposes one return link and loads only the interactive content', () => {
  const html = read('projects/demo.html');
  assert.match(html, /class="fullscreen-demo"/);
  assert.match(html, /aria-label="Retour au portfolio"/);
  assert.doesNotMatch(html, /<iframe|readmes\.js|readmeContent|githubRepoBtn/);
});

test('project.html includes direct repo, download, and rendered readme', () => {
  const projectHtml = read('projects/project.html');
  assert.ok(projectHtml.includes('id="downloadZipBtn"'), 'project.html must have downloadZipBtn');
  assert.ok(projectHtml.includes('id="readmeRendered"'), 'project.html must have readmeRendered');
  assert.ok(projectHtml.includes('data/readmes.js'), 'project.html must load readmes.js');
});

test('web apps offer a return link only for a portfolio visit', () => {
  const script = read('assets/portfolio-back.js');
  const entries = new Map();
  function visit(pathname, search, referrer = '', bundled = true) {
    const links = [];
    const site = 'https://portfolio.test/';
    vm.runInNewContext(script, {
      URL, URLSearchParams,
      window: {location: {pathname, search}},
      sessionStorage: {
        setItem: (key, value) => entries.set(key, value),
        getItem: key => entries.get(key),
        removeItem: key => entries.delete(key),
      },
      document: {
        currentScript: {src: bundled ? site + 'assets/portfolio-back.js' : 'https://nousdeux.app/portfolio-back.js'},
        referrer,
        createElement: () => ({setAttribute() {}}),
        head: {append() {}},
        body: {append: link => links.push(link)},
      },
    });
    return links[0]?.href;
  }
  assert.equal(visit('/projects/laps/index.html', ''), undefined);
  assert.equal(visit('/projects/laps/index.html', '?utm_source=portfolio', 'https://portfolio.test/?q=laps'), 'https://portfolio.test/index.html?q=laps#catalogue');
  assert.equal(visit('/projects/laps/index.html', ''), 'https://portfolio.test/index.html#catalogue');
  assert.equal(visit('/projects/lostcall/index.html', ''), undefined);
  assert.equal(visit('/projects/laps/index.html', '?utm_source=autre'), undefined);
  assert.equal(visit('/onboarding/login', '?utm_source=portfolio', '', false), 'https://je-tu-il.github.io/#catalogue');
  assert.equal(visit('/dashboard', '', '', false), 'https://je-tu-il.github.io/#catalogue');
});

test('catalogue groups the projects and combines category and accent-insensitive search', () => {
  function element() {
    return {
      children: [], events: {}, attrs: {}, style: {setProperty() {}},
      append(...items) { this.children.push(...items); },
      setAttribute(key, value) { this.attrs[key] = value; },
      addEventListener(key, handler) { this.events[key] = handler; },
    };
  }
  const nodes = new Map(['mainSearchInput', 'countDisplay', 'categoryTabs', 'projectsGrid'].map(key => [key, element()]));
  const total = element();
  const location = {href: 'https://portfolio.test/', search: ''};
  vm.runInNewContext(read('main.js'), {
    URL, URLSearchParams, window: {PROJECTS_DATA: projects, location},
    history: {replaceState(_, __, url) { location.href = url.href; location.search = url.search; }},
    document: {
      baseURI: location.href, createElement: element,
      getElementById: id => nodes.get(id), querySelector: () => total,
    },
  });
  const tabs = nodes.get('categoryTabs');
  const grid = nodes.get('projectsGrid');
  const search = nodes.get('mainSearchInput');
  const visible = () => grid.children.flatMap(section => section.children[1].children.filter(card => !card.hidden));
  assert.equal(total.textContent, projects.length);
  assert.equal(grid.children.length, new Set(projects.map(project => project.category)).size);
  assert.equal(visible().length, projects.length);
  search.value = 'decembre decrypte';
  search.events.input();
  assert.deepEqual(visible().map(card => card.children[0].textContent), ['Décembre Décrypte Défi']);
  tabs.children.find(button => button.textContent === 'Versions web').events.click();
  assert.equal(visible().length, 0);
  search.value = '';
  search.events.input();
  assert.equal(visible().length, projects.filter(project => project.runnableUrl).length);
});
