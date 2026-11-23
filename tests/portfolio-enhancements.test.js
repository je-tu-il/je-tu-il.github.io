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

test('all 127 projects have valid githubUrl and downloadUrl', () => {
  assert.equal(projects.length, 127);
  for (const p of projects) {
    assert.ok(p.githubUrl && p.githubUrl.startsWith('https://github.com/je-tu-il/'), `Project ${p.id} missing githubUrl`);
    assert.ok(p.downloadUrl && p.downloadUrl.endsWith('/archive/refs/heads/main.zip'), `Project ${p.id} missing downloadUrl`);
    assert.equal(p.downloadUrl, p.githubUrl + '/archive/refs/heads/main.zip');
  }
});

test('all 127 projects have complete markdown README.md', () => {
  const ids = Object.keys(readmes);
  assert.equal(ids.length, 127);
  for (const p of projects) {
    const md = readmes[p.id];
    assert.ok(md && md.length > 30, `Project ${p.id} has empty or missing README`);
    const html = renderMarkdown(md);
    assert.ok(html && html.includes('<h'), `Project ${p.id} README failed to render valid HTML`);
  }
});

test('demo.html includes readmes.js and markdown-renderer.js', () => {
  const demoHtml = read('projects/demo.html');
  assert.ok(demoHtml.includes('data/readmes.js'), 'demo.html must load readmes.js');
  assert.ok(demoHtml.includes('data/markdown-renderer.js'), 'demo.html must load markdown-renderer.js');
  assert.ok(demoHtml.includes('id="githubRepoBtn"'), 'demo.html must have githubRepoBtn');
  assert.ok(demoHtml.includes('id="downloadZipBtn"'), 'demo.html must have downloadZipBtn');
  assert.ok(demoHtml.includes('id="readmeContent"'), 'demo.html must have readmeContent');
});

test('project.html includes direct repo, download, and rendered readme', () => {
  const projectHtml = read('projects/project.html');
  assert.ok(projectHtml.includes('id="downloadZipBtn"'), 'project.html must have downloadZipBtn');
  assert.ok(projectHtml.includes('id="readmeRendered"'), 'project.html must have readmeRendered');
  assert.ok(projectHtml.includes('data/readmes.js'), 'project.html must load readmes.js');
});
