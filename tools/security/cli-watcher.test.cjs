const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const { once } = require('node:events');
const commander = require('commander');
const chokidar = require('chokidar');

test('actual simulator CLI passes explicit options and defaults to its server', async () => {
  const source = await fs.readFile(path.resolve(__dirname, '../../libs/remix-simulator/bin/ethsim'), 'utf8');
  let constructed, started;
  vm.runInNewContext(source, {
    console: { log() {} },
    process: { argv: ['node', 'ethsim', 'start', '--port', '18545', '--stateDb', 'fixture-state', '--fork', 'cancun', '-bn', '123', '-bs', '4'], exit() { throw Error('Unexpected exit'); } },
    require(id) {
      if (id === 'commander') return { Command: class extends commander.Command { constructor() { super(); this.configureOutput({ writeOut() {}, writeErr() {} }); } } };
      if (id === '../package.json') return { version: 'fixture' };
      if (id === '../src/server') return { Server: class { constructor(options) { constructed = options; } start(options) { started = options; } } };
      throw Error(`Unexpected module ${id}`);
    }
  });
  assert.equal(constructed, started);
  assert.equal(started.port, '18545');
  assert.equal(started.ip, '127.0.0.1');
  assert.equal(started.rpc, true);
  assert.equal(started.details, false);
  assert.equal(started.stateDb, 'fixture-state');
  assert.equal(started.fork, 'cancun');
  assert.equal(started.blockNumber, '123');
  assert.equal(started.blocks, '4');
});

test('file watcher reports create, change and delete with existing service options', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'ootle-watch-'));
  const file = path.join(dir, 'fixture.txt');
  const watcher = chokidar.watch(dir, { depth: 2, ignorePermissionErrors: true, ignoreInitial: true });
  try {
    await once(watcher, 'ready');
    const created = once(watcher, 'add', { signal: AbortSignal.timeout(5000) });
    await fs.writeFile(file, 'first');
    assert.equal((await created)[0], file);
    const changed = once(watcher, 'change', { signal: AbortSignal.timeout(5000) });
    await fs.writeFile(file, 'second');
    assert.equal((await changed)[0], file);
    const removed = once(watcher, 'unlink', { signal: AbortSignal.timeout(5000) });
    await fs.unlink(file);
    assert.equal((await removed)[0], file);
  } finally {
    await watcher.close();
    await fs.rm(dir, { recursive: true, force: true });
  }
});
