import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

test('packaged CI artifact retains response policies and deploys without rebuilding', async () => {
  const root = await mkdtemp(join(tmpdir(), 'ootle-static-deploy-'))
  try {
    const config = JSON.parse(await readFile(new URL('../../vercel.json', import.meta.url), 'utf8'))
    const out = join(root, 'dist/apps/remix-ide')
    await mkdir(out, { recursive: true })
    await Promise.all([
      writeFile(join(root, 'vercel.json'), JSON.stringify(config)),
      writeFile(join(root, 'LICENSE'), 'test fixture'),
      writeFile(join(root, 'yarn.lock'), 'test fixture'),
      writeFile(join(out, 'index.html'), '<script src="main.js"></script>'),
      writeFile(join(out, 'main.js'), '/* test fixture */')
    ])
    execFileSync(process.execPath, [fileURLToPath(new URL('../package-web.mjs', import.meta.url))], { cwd: root, env: { ...process.env, VERCEL_GIT_COMMIT_SHA: 'test-revision' }, stdio: 'pipe' })
    const packaged = JSON.parse(await readFile(join(out, 'vercel.json'), 'utf8'))
    assert.deepEqual(packaged.headers, config.headers)
    assert.equal(packaged.installCommand, '')
    assert.equal(packaged.buildCommand, '')
    assert.equal(packaged.outputDirectory, '.')
    const headers = packaged.headers.find(rule => rule.source === '/(.*)').headers
    const policy = headers.find(header => header.key === 'Content-Security-Policy').value
    assert.match(policy, /media-src 'self' https:\/\/ootle-lobby-preview\.vercel\.app https:\/\/lobby\.tari\.com;/)
    assert.match(policy, /frame-ancestors 'none'/)
    assert.equal(headers.find(header => header.key === 'X-Frame-Options').value, 'DENY')
    const manifest = JSON.parse(await readFile(join(out, 'assets/ootle/checksums.json'), 'utf8'))
    assert.ok(manifest.files.some(file => file.path === 'vercel.json'))
    execFileSync(process.execPath, [fileURLToPath(new URL('./verify-web-artifacts.mjs', import.meta.url)), out], { stdio: 'pipe' })
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
