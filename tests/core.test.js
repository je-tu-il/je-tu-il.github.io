const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const windowData = {};
vm.runInNewContext(read('data/projects.js'), {window: windowData});
const projects = windowData.PROJECTS_DATA;
const code = new vm.Script(read('projects/demo.js'));

function element(tag) {
  return {
    tag, children: [], events: {}, hidden: true, value: '', rows: [], cells: [], style: {},
    addEventListener(name, listener) { this.events[name] = listener; },
    setAttribute() {},
    removeAttribute() {},
    append(...children) { this.children.push(...children); },
    replaceChildren(...children) { this.children = children; },
    load() {},
    getContext() { return {fillRect() {}, clearRect() {}}; },
    querySelector(selector) { return this.children.flatMap(child => child.children).find(child => child.tag === selector); },
    add(option) { if (!this.value) this.value = option.value; },
    createTHead() { const head = element('thead'); this.append(head); return head; },
    createTBody() { const body = element('tbody'); this.append(body); return body; },
    insertRow() { const row = element('tr'); this.rows.push(row); return row; },
    insertCell() { const cell = element('td'); this.cells.push(cell); return cell; },
  };
}

function openDemo(id) {
  const nodes = new Map();
  const get = name => {
    if (!nodes.has(name)) nodes.set(name, element(name));
    return nodes.get(name);
  };
  const href = 'https://portfolio.test/projects/demo.html?id=' + encodeURIComponent(id);
  const location = new URL(href);
  let redirected;
  location.replace = target => { redirected = target; };
  const document = {getElementById: get, createElement: element};
  const window = {...windowData, location, setInterval() {}, crypto: require('node:crypto').webcrypto};
  const context = vm.createContext({window, document, URL, URLSearchParams, TextEncoder, TextDecoder, Option: function Option(text, value) { this.text = text; this.value = value; }});
  for (const script of ['projects/workflows.js', 'projects/interactive-demos.js']) vm.runInContext(read(script), context);
  code.runInContext(context);
  return {get, window, redirected};
}

test('the static and JSON catalogues contain the same 128 projects', () => {
  const json = require('../data/projects.json');
  assert.equal(projects.length, 128);
  assert.equal(new Set(projects.map(project => project.id)).size, projects.length);
  assert.deepEqual(JSON.parse(JSON.stringify(projects)), json);
});

test('each project exposes an interactive workflow, real web entry or an explicit pending state', () => {
  for (const project of projects) {
    const {get, window, redirected} = openDemo(project.id);
    assert.equal(get('title').textContent, project.title);
    const hasWorkflow = Boolean(window.PROJECT_DEMOS[project.id] || window.PORTFOLIO_WORKFLOWS[project.id]);
    assert.equal(get('workflow').hidden, !hasWorkflow, project.id);
    assert.equal(get('demoPending').hidden, Boolean(hasWorkflow || project.runnableUrl), project.id);
    if (project.runnableUrl) {
      const url = new URL(redirected || get('demoLive').href);
      assert.equal(url.searchParams.get('utm_source'), 'portfolio');
    } else if (!hasWorkflow) {
      assert.equal(get('demoSheet').href, 'project.html?id=' + project.id);
    }
  }
  const {window} = openDemo('ddd-hugo-decrypte');
  for (const id of Object.keys(window.PROJECT_DEMOS)) assert.ok(projects.some(project => project.id === id), id);
});

test('an unknown demo offers a return to the catalogue', () => {
  const {get} = openDemo('__proto__');
  assert.equal(get('workflow').hidden, true);
  assert.equal(get('unavailable').hidden, false);
  assert.match(read('projects/demo.html'), /href="\.\.\/index\.html#catalogue"/);
});

test('NousDeux reveals live input only after both responses', () => {
  const {get} = openDemo('nousdeux-application-mobile-couple-intimit');
  const [, , controls, result] = get('workflow').children[0].children;
  const [field, submit, reset] = controls.children;
  const [input] = field.children;
  input.value = 'Un pique-nique';
  submit.events.click();
  assert.match(submit.textContent, /Alex/);
  assert.equal(result.children.length, 0);
  input.value = 'Le bal';
  submit.events.click();
  const [table] = result.children;
  const tableRows = table.children[1].children;
  assert.equal(tableRows[0].children[1].textContent, 'Un pique-nique');
  assert.equal(tableRows[1].children[1].textContent, 'Le bal');
  reset.events.click();
  assert.equal(submit.disabled, false);
});

test('IndexCite strips only the expected markers from visitor input', () => {
  const {get} = openDemo('indexcite-nettoyeur-de-citations-ia-pour-obsidian');
  const [, , controls, result, status] = get('workflow').children[0].children;
  const [field, submit] = controls.children;
  field.children[0].value = 'Un [lien](doc.md) [cite_search: 8]. Valeurs [0, 1].';
  submit.events.click();
  assert.equal(result.children[0].children[0].value, 'Un [lien](doc.md). Valeurs [0, 1].');
  assert.match(status.textContent, /^1 /);
});

test('the December demo accumulates and removes sessions on the selected day', () => {
  const {get} = openDemo('ddd-hugo-decrypte');
  const [, , controls, , status] = get('workflow').children[0].children;
  const [field, add, remove] = controls.children;
  field.children[0].value = '31';
  add.events.click();
  add.events.click();
  assert.match(status.textContent, /^2 sur 31 .*2 sur 496/);
  remove.events.click();
  assert.match(status.textContent, /^1 sur 31 .*1 sur 496/);
});


test('catalogue launches each web version directly and serves its entry assets', () => {
  const context = {URL, document: {baseURI: "https://portfolio.test/", getElementById() {}}, window: {}};
  vm.createContext(context);
  vm.runInContext(read('main.js'), context);
  for (const project of projects) {
    const expected = project.runnableUrl || 'projects/demo.html?id=' + project.id;
    assert.equal(context.demoUrl(project), expected);
    const launch = new URL(context.launchUrl(project));
    assert.equal(launch.searchParams.get('utm_source'), project.runnableUrl ? 'portfolio' : null);
    if (!project.isRunnable || /^https:\/\//.test(expected)) continue;
    const html = read(expected);
    for (const [, ref] of html.matchAll(/<(?:script|link)\b[^>]*?\b(?:src|href)=["']([^"'<>\s]+)["']/gi)) {
      if (/^(?:https?:|data:|\/\/|#)/i.test(ref)) continue;
      const local = new URL(ref, 'https://portfolio.test/' + expected).pathname;
      assert.ok(fs.existsSync(path.join(root, decodeURIComponent(local))), expected + ' → ' + ref);
    }
  }
});

test('workflow state changes with the controls and can be reset', () => {
  function node() {
    return {
      children: [], rows: [], cells: [], events: {}, value: '',
      append(...children) { this.children.push(...children); },
      replaceChildren(...children) { this.children = children; },
      addEventListener(name, handler) { this.events[name] = handler; },
      setAttribute() {},
      add(option) { if (!this.value) this.value = option.value; },
      createTHead() { const head = node(); this.append(head); return head; },
      createTBody() { const body = node(); this.append(body); return body; },
      insertRow() { const row = node(); this.rows.push(row); return row; },
      insertCell() { const cell = node(); this.cells.push(cell); return cell; },
    };
  }
  const window = {};
  vm.runInNewContext(read('projects/workflows.js'), {
    window, document: {createElement: node},
    Option: function Option(text, value) { this.text = text; this.value = value; },
  });
  const root = node();
  window.PORTFOLIO_WORKFLOWS.autobackup(root);
  const [, , backupControls, backupResult, backupStatus] = root.children[0].children;
  const statusOf = index => backupResult.children[0].children[1].rows[index].cells[3].textContent;
  assert.equal(statusOf(0), 'Modifié');
  assert.equal(statusOf(2), 'Nouveau');
  backupControls.children[0].events.click();
  assert.match(backupStatus.textContent, /^2 fichier/);
  assert.equal(statusOf(0), 'Identique');
  backupControls.children[3].events.click();
  backupControls.children[2].events.click();
  assert.match(backupStatus.textContent, /version 1/);
  assert.equal(statusOf(0), 'Identique');

  const court = node();
  window.PORTFOLIO_WORKFLOWS['champibad-plateforme-comp-tition-club-badminton'](court);
  const [, , controls, , status] = court.children[0].children;
  for (let i = 0; i < 20; i++) {
    controls.children[0].events.click();
    controls.children[1].events.click();
  }
  controls.children[0].events.click();
  assert.doesNotMatch(status.textContent, /remporte/);
  controls.children[0].events.click();
  assert.match(status.textContent, /remporte la manche/);
});

test('the PassApp demo encrypts the vault and requires the correct phrase to show the entry', async () => {
  const {get} = openDemo('passapp-coffre-fort-d-centralis-local-first');
  const [, , controls, result, status] = get('workflow').children[0].children;
  const [phrase, , secret, add, lock, unlock] = controls.children;
  phrase.children[0].value = 'phrase pour le test';
  secret.children[0].value = 'secret fictif';
  add.events.click();
  const values = () => result.children[0].children[1].children.map(row => row.children[1].textContent);
  assert.deepEqual(values(), ['secret fictif']);
  await lock.events.click();
  assert.deepEqual(values(), []);
  phrase.children[0].value = 'phrase erronée';
  await unlock.events.click();
  assert.match(status.textContent, /incorrecte/);
  assert.deepEqual(values(), []);
  phrase.children[0].value = 'phrase pour le test';
  await unlock.events.click();
  assert.deepEqual(values(), ['secret fictif']);
});
