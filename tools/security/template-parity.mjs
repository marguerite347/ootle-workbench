import { readFile, readdir } from 'node:fs/promises'
import assert from 'node:assert/strict'
const embedded = JSON.parse(await readFile('libs/remix-ws-templates/src/templates/tariCounter/files.json', 'utf8'))
const required = []
async function walk(dir = '') {
  for (const entry of await readdir(`templates/tari-counter/${dir}`, { withFileTypes: true })) {
    if (entry.name === 'target') continue
    const name = dir + entry.name
    if (entry.isDirectory()) await walk(name + '/')
    else if (/\.(rs|toml)$|(^|\/)Cargo.lock$/.test(name)) required.push(name)
  }
}
await walk()
assert.deepEqual(Object.keys(embedded).filter(name => /\.(rs|toml)$|(^|\/)Cargo.lock$/.test(name)).sort(), required.sort(), 'Embedded Counter build-input file set drift')
for (const name of Object.keys(embedded).filter(name => name !== 'README.md')) assert.equal(embedded[name], await readFile(`templates/tari-counter/${name}`, 'utf8'), `Embedded Counter drift: ${name}`)
console.log('Embedded Counter Cargo/source/tests match the canonical template, including vendored build inputs.')
