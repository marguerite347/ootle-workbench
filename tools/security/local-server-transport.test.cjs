const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const vm = require('node:vm');
const { once } = require('node:events');
const express = require('express');

test('Express 5 serves the real local-server routes and handles skills-proxy failure', async () => {
  const fixture = await fs.mkdtemp(path.join(os.tmpdir(), 'ootle-server-'));
  const web = path.join(fixture, 'dist/apps/remix-ide');
  await fs.mkdir(web, { recursive: true });
  await fs.writeFile(path.join(web, 'index.html'), '<title>fixture shell</title>');
  await fs.writeFile(path.join(web, 'fixture.js'), '/* fixture asset */');
  const upstream = http.createServer((req, res) => {
    assert.equal(req.url, '/skills');
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ skills: ['fixture'] }));
  }).listen(0, '127.0.0.1');
  await once(upstream, 'listening');
  const upstreamPort = upstream.address().port;
  let server;
  function trackedExpress() {
    const app = express();
    const listen = app.listen.bind(app);
    app.listen = (_port, _host, callback) => {
      server = listen(0, '127.0.0.1', callback);
      return server;
    };
    return app;
  }
  Object.assign(trackedExpress, express);
  try {
    const source = await fs.readFile(path.resolve(__dirname, '../../serve.js'), 'utf8');
    vm.runInNewContext(source, {
      __dirname: fixture,
      console: { log() {} },
      require(id) {
        if (id === 'express') return trackedExpress;
        if (id === 'http') return {
          request(options, callback) {
            assert.equal(options.hostname, '127.0.0.1');
            assert.equal(options.port, 9005);
            return http.request({ ...options, port: upstreamPort }, callback);
          }
        };
        return require(id);
      }
    });
    if (!server.listening) await once(server, 'listening');
    const base = `http://127.0.0.1:${server.address().port}`;
    for (const route of ['/', '/nested/route']) {
      const response = await fetch(base + route);
      assert.equal(response.status, 200);
      assert.equal(await response.text(), '<title>fixture shell</title>');
    }
    assert.equal(await (await fetch(base + '/fixture.js')).text(), '/* fixture asset */');
    const response = await fetch(base + '/api/skills');
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { skills: ['fixture'] });
    await new Promise(resolve => upstream.close(resolve));
    const failed = await fetch(base + '/api/skills');
    assert.equal(failed.status, 502);
    assert.equal((await failed.json()).error, 'Skills server unavailable');
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    if (upstream.listening) await new Promise(resolve => upstream.close(resolve));
    await fs.rm(fixture, { recursive: true, force: true });
  }
});
