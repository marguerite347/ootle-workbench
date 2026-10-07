import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
const embedded = JSON.parse(await readFile('libs/remix-ws-templates/src/templates/tariCounter/files.json', 'utf8'))
for (const name of Object.keys(embedded).filter(name => name !== 'README.md')) assert.equal(embedded[name], await readFile(`templates/tari-counter/${name}`, 'utf8'), `Embedded Counter drift: ${name}`)
console.log('Embedded Counter Cargo/source/tests match the canonical template.')
