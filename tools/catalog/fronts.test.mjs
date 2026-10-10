import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');
const internalReviewWording=/\b(?:untested|unverified|not\s+(?:(?:independently|yet)\s+)?(?:tested|verified)|(?:runtime|hosting|availability)\s+(?:has\s+)?not\s+been\s+verified)\b/i;
test('builder catalog fronts use reader-facing type and availability, keeping full details',()=>{
 const catalog=JSON.parse(read('apps/remix-ide/src/app/plugins/ootle/ecosystem-resources.json'));
 for(const entry of [...catalog.records,...catalog.opportunities]){
  assert.ok(entry.cardSummary?.trim()&&entry.cardSummary.length<=160,`${entry.title}: short summary required`);
  assert.ok(entry.summary?.trim(),`${entry.title}: preserve full description`);
  for(const field of ['title','cardSummary','cardStatus']) assert.doesNotMatch(entry[field]||'',internalReviewWording,`${entry.title}: ${field} must describe the resource, not internal testing`);
 }
 assert.match(catalog.records.find(r=>r.key==='caravel-faucet').cardStatus,/Testnet only/);
 assert.match(catalog.records.find(r=>r.key==='caravel-burn-wallet').cardStatus,/Testnet.*Irreversible deposits/);
 assert.match(catalog.records.find(r=>r.key==='veil').cardStatus,/Paused/);
 assert.doesNotMatch(read('apps/remix-ide/src/app/plugins/ootle/ecosystem-resources.tsx'),internalReviewWording);
});
