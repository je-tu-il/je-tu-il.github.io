const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const windowData = {};
vm.runInNewContext(read('data/projects.js'), {window: windowData});
vm.runInNewContext(read('data/demo-scenes.js'), {window: windowData});
const projects = windowData.PROJECTS_DATA;
const code = new vm.Script(read('projects/demo.js'));

function openDemo(id) {
  const nodes = new Map();
  const create = () => ({
    hidden: true,
    children: [],
    events: {},
    focus() {},
    append(child) { this.children.push(child); },
    addEventListener(name, listener) { this.events[name] = listener; },
  });
  function get(name) {
    if (!nodes.has(name)) nodes.set(name, create());
    return nodes.get(name);
  }
  code.runInNewContext({
    window: {...windowData, location: {search: '?id=' + encodeURIComponent(id)}},
    document: {getElementById: get, createElement: create},
    URLSearchParams,
  });
  return get;
}

test('the static catalogue and scenario catalogue cover the same 128 projects', () => {
  const json = require('../data/projects.json');
  const ids = projects.map(project => project.id);
  assert.equal(ids.length, 128);
  assert.equal(new Set(ids).size, 128);
  assert.deepEqual(JSON.parse(JSON.stringify(projects)), json);
  assert.deepEqual(Object.keys(windowData.PORTFOLIO_DEMOS).sort(), Array.from(ids).sort());
  assert.ok(ids.includes('wavedrop') && ids.includes('chatverdict'));
});

test('every project opens, runs a distinct scenario, resets, and links to existing pages', () => {
  const outputs = new Set();
  for (const project of projects) {
    const get = openDemo(project.id);
    const run = get('run');
    const result = get('result');
    const controls = get('controls');
    assert.equal(get('scenario').hidden, false, project.id);
    assert.equal(get('title').textContent, project.title);
    const expected = windowData.PORTFOLIO_DEMOS[project.id];
    assert.equal(run.textContent, expected.action);
    for (const field of get('inputs').children) {
      const input = field.children[0];
      input.value = input.defaultValue;
      input.valueAsNumber = Number(input.defaultValue);
    }
    controls.events.submit({preventDefault() {}});
    assert.ok(result.textContent && result.textContent !== 'Prêt à démarrer.', project.id);
    outputs.add(result.textContent);
    controls.events.reset();
    assert.equal(result.textContent, 'Prêt à démarrer.');
    assert.equal(run.textContent, expected.action);
  }
  assert.equal(outputs.size, 128);
});

test('an unknown demo offers a return to the catalogue', () => {
  const get = openDemo('__proto__');
  assert.equal(get('scenario').hidden, true);
  assert.equal(get('unavailable').hidden, false);
  assert.match(read('projects/demo.html'), /href="\.\.\/index\.html#catalogue"/);
});

test('NousDeux reveals both answers only after the second response', () => {
  const get = openDemo('nousdeux-application-mobile-couple-intimit');
  const submit = () => get('controls').events.submit({preventDefault() {}});
  submit();
  assert.match(get('run').textContent, /Alex/);
  assert.doesNotMatch(get('result').textContent, /pique-nique/);
  submit();
  assert.match(get('result').textContent, /Camille.+Alex/);
  assert.equal(get('run').disabled, true);
  get('controls').events.reset();
  assert.equal(get('run').disabled, false);
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
