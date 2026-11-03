import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
const require=createRequire(import.meta.url);
test('YAML formatter config preserves nested values and rejects malformed config',()=>{
 const yaml=require('js-yaml');
 assert.deepEqual(yaml.load('printWidth: 90\nsingleQuote: true\noverrides:\n  - files: "*.sol"\n    options:\n      tabWidth: 4\n'),{printWidth:90,singleQuote:true,overrides:[{files:'*.sol',options:{tabWidth:4}}]});
 assert.throws(()=>yaml.load('printWidth: [broken'));
 const special=yaml.load('__proto__:\n  polluted: true'); assert.equal({}.polluted,undefined); assert.equal(Object.hasOwn(special,'__proto__'),true);
});
test('dotenv parsing and CLI retain existing environment unless override is requested',()=>{
 const dotenv=require('dotenv'); assert.deepEqual(dotenv.parse('DEMO_A=hello\nDEMO_B="two words"\n'),{DEMO_A:'hello',DEMO_B:'two words'});
 const dir=mkdtempSync(join(tmpdir(),'ootle-dotenv-trial-'));try{
 const file=join(dir,'synthetic.env');writeFileSync(file,'OOTLE_TRIAL_A=from-file\nOOTLE_TRIAL_B="two words"\n');
 const command=[require.resolve('dotenv-cli/cli.js'),'-e',file,'--',process.execPath,'-e','process.stdout.write(JSON.stringify([process.env.OOTLE_TRIAL_A,process.env.OOTLE_TRIAL_B]))'];
 let run=spawnSync(process.execPath,command,{env:{PATH:process.env.PATH,OOTLE_TRIAL_A:'existing'},encoding:'utf8'}); assert.equal(run.status,0,run.stderr);assert.deepEqual(JSON.parse(run.stdout),['existing','two words']);
 command.splice(1,0,'-o');run=spawnSync(process.execPath,command,{env:{PATH:process.env.PATH,OOTLE_TRIAL_A:'existing'},encoding:'utf8'});assert.equal(run.status,0,run.stderr);assert.deepEqual(JSON.parse(run.stdout),['from-file','two words']);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
