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
  for(const field of ['title','cardSummary','cardStatus']) {assert.doesNotMatch(entry[field]||'',internalReviewWording,`${entry.title}: ${field} must describe the resource, not internal testing`);assert.doesNotMatch(entry[field]||'',/no playable demo|not deployed|skill links unavailable/i,`${entry.title}: keep absence findings dated in Details`);}
 }
 assert.match(catalog.records.find(r=>r.key==='caravel-faucet').cardStatus,/Testnet only/);
 assert.match(catalog.records.find(r=>r.key==='caravel-burn-wallet').cardStatus,/Testnet.*Irreversible deposits/);
 for(const entry of catalog.records) if(/paused/i.test(entry.cardStatus||'')) assert.match(entry.cardStatus,/review/i,`${entry.title}: date volatile outage findings`);
 assert.doesNotMatch(read('apps/remix-ide/src/app/plugins/ootle/ecosystem-resources.tsx'),internalReviewWording);
});

const privateEvidenceLocation = /(?:https?:\/\/)?(?:\w+\.)?discord(?:app)?\.(?:com|net)\/(?:channels|attachments)|(?:cdn|media)\.discordapp\.(?:com|net)|(?:^|[\s"'])\/(?:Users|private\/var|var\/folders)\//i;
test('public maintenance exports exclude private channel links and workstation paths', () => {
  for (const name of ['docs/ootle/ecosystem-source-registry.json', 'docs/ootle/resource-provenance.json', 'docs/ootle/resource-captures.json', 'apps/remix-ide/src/app/plugins/ootle/ecosystem-resources.json']) {
    const body = read(name);
    assert.equal(privateEvidenceLocation.test(body), false, `${name}: keep private evidence in the maintenance workspace`);
    assert.doesNotMatch(body, /"visibility"\s*:\s*"(?:private|restricted|internal)"/i);
  }
});

test("privacy guard distinguishes public user profiles from workstation paths", () => {
  assert.equal(privateEvidenceLocation.test("https://content.luanti.org/users/Wuzzy"), false);
  assert.equal(privateEvidenceLocation.test(JSON.stringify({path: "/Users/example/private.json"})), true);
  assert.equal(privateEvidenceLocation.test("https://discord.com/channels/1/2/3"), true);
});
