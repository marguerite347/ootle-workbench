const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const webpack = require('webpack')
const Checker = require('fork-ts-checker-webpack-plugin')
const { FailOnTypecheckErrorPlugin } = require('./typecheck-failure.cjs')

for (const crash of [false, true]) {
  test(crash ? 'checker worker failure makes webpack reject the build' : 'successful compilation remains successful', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'ootle-typecheck-'))
    await fs.writeFile(path.join(dir, 'entry.js'), 'export const answer = 42')
    const plugins = [new FailOnTypecheckErrorPlugin()]
    if (crash) plugins.push({ apply(compiler) {
      compiler.hooks.afterCompile.tap('InjectCheckerFailure', compilation => {
        Checker.getCompilerHooks(compiler).error.call(new Error('worker exited SIGABRT'), compilation)
      })
    } })
    const compiler = webpack({ mode: 'production', context: dir, entry: './entry.js', output: { path: path.join(dir, 'dist') }, plugins })
    try {
      const stats = await new Promise((resolve, reject) => compiler.run((error, result) => error ? reject(error) : resolve(result)))
      assert.equal(stats.hasErrors(), crash)
      if (crash) assert.match(stats.toString({ all: false, errors: true }), /TypeScript checker failed: worker exited SIGABRT/)
    } finally {
      await new Promise((resolve, reject) => compiler.close(error => error ? reject(error) : resolve()))
      await fs.rm(dir, { recursive: true, force: true })
    }
  })
}
