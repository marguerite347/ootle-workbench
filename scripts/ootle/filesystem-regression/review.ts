import { IndexedDBStorage } from '../../../apps/remix-ide/src/app/files/filesystems/indexedDB';
const database = 'ootle-maintenance-filesystem-20261031';
const fs = new IndexedDBStorage(database);
const out = document.querySelector('pre')!;
const assert = (v: unknown, message: string) => { if (!v) throw new Error(message); };
document.querySelector('#write')!.addEventListener('click', async () => {
 try {
  if (!(await fs.extended.exists('review'))) await fs.extended.mkdir('review');
  await fs.extended.writeFile('review/source.txt', 'workspace persistence ✓', 'utf8');
  await fs.extended.writeFile('review/binary.dat', new Uint8Array([0,1,127,255]));
  await fs.extended.rename('review/source.txt', 'review/renamed.txt');
  assert(await fs.extended.readFile('review/renamed.txt', 'utf8') === 'workspace persistence ✓', 'UTF-8 round trip');
  const binary = await fs.extended.readFile('review/binary.dat');
  assert(binary instanceof Uint8Array && binary[3] === 255, 'binary round trip');
  assert((await fs.extended.readdir('review')).includes('renamed.txt'), 'directory entry');
  assert((await fs.extended.stat('review/renamed.txt')).isFile(), 'file stat');
  const callbackText = await new Promise((resolve,reject)=>fs.readFile('/review/renamed.txt', 'utf8', (err,data)=>err?reject(err):resolve(data)));
  assert(callbackText === 'workspace persistence ✓', 'callback API retained');
  out.textContent='PASS: text, binary, rename, list, stat and callback API. Reload and press Verify persistence.';
 } catch(e) { out.textContent='FAIL: '+String(e); }
});
document.querySelector('#read')!.addEventListener('click', async () => {
 try {
  assert(await fs.extended.readFile('review/renamed.txt', 'utf8') === 'workspace persistence ✓', 'persisted UTF-8');
  assert((await fs.extended.readFile('review/binary.dat'))[3] === 255, 'persisted bytes');
  assert(!(await fs.extended.exists('review/source.txt')), 'old path still exists');
  out.textContent='PASS: text and binary survived a page reload; renamed path preserved.';
 } catch(e) { out.textContent='FAIL: '+String(e); }
});
