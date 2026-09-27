import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { copyFile, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const script = join(dirname(fileURLToPath(import.meta.url)), '..', 'scripts', 'build-atomic.mjs');

async function makeProject(t, withPublished = true) {
  const root = await mkdtemp(join(tmpdir(), 'malina-atomic-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, 'site', 'scripts'), { recursive: true });
  await copyFile(script, join(root, 'site', 'scripts', 'build-atomic.mjs'));
  await writeFile(join(root, 'site', 'scripts', 'build.mjs'), `
import { writeFile } from 'node:fs/promises';
await new Promise(resolve => setTimeout(resolve, Number(process.env.BUILD_DELAY_MS || 0)));
if (process.env.BUILD_FAIL) process.exit(19);
await writeFile(process.env.MALINA_BUILD_OUT + '/index.html', process.env.BUILD_MARKER || 'new');
`);
  if (withPublished) {
    await mkdir(join(root, 'dist'));
    await writeFile(join(root, 'dist', 'index.html'), 'old');
  }
  return root;
}

function runBuild(root, extraEnv = {}) {
  const child = spawn(process.execPath, [join(root, 'site', 'scripts', 'build-atomic.mjs')], {
    cwd: root,
    env: { ...process.env, ...extraEnv },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  const output = [];
  child.stdout.on('data', chunk => output.push(chunk.toString()));
  child.stderr.on('data', chunk => output.push(chunk.toString()));
  return new Promise(resolve => {
    child.on('close', code => resolve({ code, output: output.join('') }));
  });
}

test('local server keeps serving dist while a new build is published', async t => {
  if (!['darwin', 'linux'].includes(process.platform)) return t.skip('Atomic exchange requires macOS or Linux');
  const root = await makeProject(t);
  const server = createServer(async (_request, response) => {
    try {
      response.end(await readFile(join(root, 'dist', 'index.html')));
    } catch (error) {
      response.writeHead(error.code === 'ENOENT' ? 404 : 500);
      response.end(error.message);
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const url = `http://127.0.0.1:${server.address().port}/`;
  const seen = [];
  let probing = true;
  const probes = (async () => {
    while (probing) {
      const response = await fetch(url);
      seen.push([response.status, await response.text()]);
      await new Promise(resolve => setTimeout(resolve, 1));
    }
  })();
  const result = await runBuild(root, { BUILD_DELAY_MS: '180', BUILD_MARKER: 'new' });
  probing = false;
  await probes;
  const after = await fetch(url);

  assert.equal(result.code, 0, result.output);
  assert.ok(seen.length > 10, `Only ${seen.length} requests reached the server`);
  assert.ok(seen.every(([status, body]) => status === 200 && ['old', 'new'].includes(body)));
  assert.equal(await after.text(), 'new');
  assert.deepEqual((await readdir(root)).filter(name => name.startsWith('.dist-build-')), []);
});

test('failed generation keeps the previous dist and removes staging', async t => {
  const root = await makeProject(t);
  const result = await runBuild(root, { BUILD_FAIL: '1' });
  assert.notEqual(result.code, 0);
  assert.equal(await readFile(join(root, 'dist', 'index.html'), 'utf8'), 'old');
  assert.deepEqual((await readdir(root)).filter(name => name.startsWith('.dist-build-')), []);
});

test('first build publishes when dist does not exist yet', async t => {
  const root = await makeProject(t, false);
  const result = await runBuild(root, { BUILD_MARKER: 'first' });
  assert.equal(result.code, 0, result.output);
  assert.equal(await readFile(join(root, 'dist', 'index.html'), 'utf8'), 'first');
});
