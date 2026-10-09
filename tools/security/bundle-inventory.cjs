// Record package versions in emitted chunks without serializing source or loader paths.
const fs = require('node:fs')
const path = require('node:path')
class SecurityBundleInventoryPlugin {
  constructor(output = path.resolve(__dirname, '../../reports/security/browser-stats.json')) { this.output = output }
  apply(compiler) {
    compiler.hooks.done.tap('SecurityBundleInventory', stats => {
      const compilation = stats.compilation, packages = new Map(), owners = new Map()
      let emittedModuleCount = 0
      const owner = resource => {
        let dir = path.dirname(resource.split('?')[0])
        if (owners.has(dir)) return owners.get(dir)
        const original = dir
        while (dir.includes(`${path.sep}node_modules${path.sep}`)) {
          const file = path.join(dir, 'package.json')
          if (fs.existsSync(file)) {
            const pkg = JSON.parse(fs.readFileSync(file, 'utf8'))
            if (typeof pkg.name === 'string' && typeof pkg.version === 'string') { const value = { name: pkg.name, version: pkg.version }; owners.set(original, value); return value }
          }
          dir = path.dirname(dir)
        }
        owners.set(original, null)
        return null
      }
      const visit = (module, inherited = false) => {
        if (!inherited && !compilation.chunkGraph.getNumberOfModuleChunks(module)) return
        emittedModuleCount++
        if (module.resource?.includes(`${path.sep}node_modules${path.sep}`)) {
          const pkg = owner(module.resource)
          if (pkg) packages.set(`${pkg.name}@${pkg.version}`, pkg)
        }
        for (const child of module.modules || []) visit(child, true)
      }
      for (const module of compilation.modules) visit(module)
      if (!emittedModuleCount) throw new Error('No emitted modules available for security inventory')
      fs.mkdirSync(path.dirname(this.output), { recursive: true })
      // Synchronous completion is intentional: Nx can exit as soon as webpack completes.
      fs.writeFileSync(this.output, JSON.stringify({ schemaVersion: 1, emittedModuleCount, packages: [...packages.values()].sort((a, b) => `${a.name}@${a.version}`.localeCompare(`${b.name}@${b.version}`)) }, null, 2) + '\n')
    })
  }
}
module.exports = { SecurityBundleInventoryPlugin }
