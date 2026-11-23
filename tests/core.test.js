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

test('the static catalogue and scenario catalogue cover the same 127 projects', () => {
  const json = require('../data/projects.json');
  const ids = projects.map(project => project.id);
  assert.equal(ids.length, 127);
  assert.equal(new Set(ids).size, 127);
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
    assert.equal(get('details').href, 'project.html?id=' + project.id);
    const expected = windowData.PORTFOLIO_DEMOS[project.id];
    assert.equal(run.textContent, expected.action);
    assert.equal(get('live').hidden, !project.isRunnable);
    if (project.isRunnable) assert.ok(fs.existsSync(path.join(root, project.runnableUrl)));
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
  assert.equal(outputs.size, 127);
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
