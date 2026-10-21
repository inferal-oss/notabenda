// @requirements REQ-PRODUCT-CONSENT-NOTICE-FILES
// @requirements REQ-PRODUCT-CONSENT-EVIDENCE REQ-PRODUCT-RETAINED-RELEASES REQ-PRODUCT-CONFIG-SOURCES REQ-PRODUCT-SAFE-CONTENT
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,rm,access,symlink} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {compileLegalDocuments,createConsentNoticeFiles,canonicalJson} from '@notabenda/core/content';
import {formatConfigSource} from '@notabenda/core/config/document';
import {fixture} from './helpers.mjs';
const cli=new URL('../dist/cli.js',import.meta.url).pathname;
const run=(cwd,...args)=>spawnSync(process.execPath,[cli,...args],{cwd,encoding:'utf8',timeout:15000});
const pinned=n=>`artifacts/${n.artifactId}/consent/${n.noticeId}.json`;
async function setup(){const c=await fixture({reviewed:true});c.storage=[];c.services=[{id:'metrics',name:'Usage counts',provider:'Example provider',purposeIds:[c.purposes[0].id],location:'This browser'}];c.consent={purposes:[{id:c.purposes[0].id,scope:'purpose-one'}],services:[{id:'metrics',scope:'service-one'}],grantLifetimeDays:30,refusalLifetimeDays:180,dismissalMinutes:15};c.private={sentinel:'PRIVATE_CONFIG_SENTINEL'};return c;}
async function temporary(fn){const cwd=await mkdtemp(join(tmpdir(),'notabenda-notice-cli-'));try{await fn(cwd);}finally{await rm(cwd,{recursive:true,force:true});}}

test('CLI native notices from JSON, YAML and Markdown match the final release and immutable factory output',()=>temporary(async cwd=>{
 const config=await setup(),build=compileLegalDocuments(config),expected=createConsentNoticeFiles(build.artifact,{scopeId:'cookie-choices'});
 for(const [format,extension] of [['json','json'],['yaml','yaml'],['yaml','yml'],['markdown','md']]){
  await writeFile(join(cwd,'site.'+extension),await formatConfigSource(config,format,'\nPRIVATE_BODY_SENTINEL\n'));
  const result=run(cwd,'build','--config','site.'+extension,'--consent-runtime','required','--consent-scope','cookie-choices','--out-dir',extension);assert.equal(result.status,0,result.stderr);assert.match(result.stdout,/Publishing does not register or activate/);
  for(const [path,body] of Object.entries(expected.files))assert.equal(await readFile(join(cwd,extension,path),'utf8'),body);
  const notice=JSON.parse(await readFile(join(cwd,extension,'consent-notice.json'),'utf8'));assert.equal(notice.artifactId,build.manifest.artifactId);assert.doesNotMatch(canonicalJson(notice),/PRIVATE_CONFIG_SENTINEL|PRIVATE_BODY_SENTINEL/);assert.equal(JSON.parse(await readFile(join(cwd,extension,'consent-runtime.json'),'utf8')).evidence,'required');
 }
}));

test('clean builds retain exact old notice and document URLs, including duplicate retained inputs',()=>temporary(async cwd=>{
 const config=await setup();await writeFile(join(cwd,'site.json'),JSON.stringify(config));const args=['build','--config','site.json','--consent-runtime','required','--consent-scope','cookie-choices'];let result=run(cwd,...args,'--out-dir','old');assert.equal(result.status,0,result.stderr);const oldBody=await readFile(join(cwd,'old','consent-notice.json'),'utf8'),old=JSON.parse(oldBody),oldArtifact=join('old','artifacts',old.artifactId+'.json');
 config.documents.cookies.version='next';config.documents.cookies.effectiveDate='2026-10-20';await writeFile(join(cwd,'site.json'),JSON.stringify(config));
 const retention=['--retain-artifact',oldArtifact,'--retain-consent-notice','old/consent-notice.json','--retain-consent-notice','old/consent-notice.json'];result=run(cwd,...args,...retention,'--out-dir','new');assert.equal(result.status,0,result.stderr);assert.equal(await readFile(join(cwd,'new',pinned(old)),'utf8'),oldBody);const current=JSON.parse(await readFile(join(cwd,'new','consent-notice.json'),'utf8'));assert.notEqual(current.noticeId,old.noticeId);assert.equal(await readFile(join(cwd,'new',pinned(current)),'utf8'),canonicalJson(current)+'\n');for(const kind of ['privacy','cookies','terms'])assert.equal(await readFile(join(cwd,'new','artifacts',old.artifactId,kind+'.html'),'utf8'),await readFile(join(cwd,'old','artifacts',old.artifactId,kind+'.html'),'utf8'));
 result=run(cwd,'build','--config','site.json',...retention,'--out-dir','historical-only');assert.equal(result.status,0,result.stderr);assert.equal(await readFile(join(cwd,'historical-only',pinned(old)),'utf8'),oldBody);await assert.rejects(access(join(cwd,'historical-only','consent-notice.json')));
 result=run(cwd,...args,'--retain-consent-notice','old/consent-notice.json','--out-dir','missing-release');assert.equal(result.status,1);await assert.rejects(access(join(cwd,'missing-release')));
}));

test('an old current notice cannot survive a rebuild that omits its scope',()=>temporary(async cwd=>{
 const config=await setup();await writeFile(join(cwd,'site.json'),JSON.stringify(config));let result=run(cwd,'build','--config','site.json','--consent-runtime','required','--consent-scope','cookie-choices','--out-dir','existing');assert.equal(result.status,0,result.stderr);const before=await readFile(join(cwd,'existing','consent-notice.json'),'utf8'),runtime=await readFile(join(cwd,'existing','consent-runtime.json'),'utf8'),legal=await readFile(join(cwd,'existing','notabenda.public.json'),'utf8');config.site.name='Changed';await writeFile(join(cwd,'site.json'),JSON.stringify(config));result=run(cwd,'build','--config','site.json','--consent-runtime','required','--out-dir','existing');assert.equal(result.status,1);assert.match(result.stderr,/already contains consent-notice.json/);for(const [path,body] of [['consent-notice.json',before],['consent-runtime.json',runtime],['notabenda.public.json',legal]])assert.equal(await readFile(join(cwd,'existing',path),'utf8'),body);
}));

test('scope/mode errors and unsafe retained files fail before output; preview remains explicit',()=>temporary(async cwd=>{
 const config=await setup();await writeFile(join(cwd,'site.json'),JSON.stringify(config));
 for(const args of [['build','--consent-scope','choices'],['build','--consent-runtime','local','--consent-scope','choices'],['build','--consent-runtime','required','--consent-scope','../private'],['build','--consent-runtime','required','--consent-scope','A'],['check','--consent-scope','choices'],['check','--retain-consent-notice','unused.json']]){const result=run(cwd,...args,'--config','site.json',...(args[0]==='build'?['--out-dir','failed']:[]));assert.equal(result.status,1);await assert.rejects(access(join(cwd,'failed')));}
 await writeFile(join(cwd,'bad.json'),'PRIVATE_INVALID_NOTICE');await writeFile(join(cwd,'large.json'),'x'.repeat(32769));await symlink(join(cwd,'bad.json'),join(cwd,'link.json'));for(const file of ['bad.json','large.json','link.json','.']){const result=run(cwd,'build','--config','site.json','--retain-consent-notice',file,'--out-dir','failed');assert.equal(result.status,1);assert.doesNotMatch(result.stderr,/PRIVATE_INVALID_NOTICE/);await assert.rejects(access(join(cwd,'failed')));}
 config.documents.cookies.review.status='draft';await writeFile(join(cwd,'site.json'),JSON.stringify(config));const args=['build','--config','site.json','--consent-runtime','required','--consent-scope','choices'];assert.equal(run(cwd,...args,'--out-dir','production').status,1);await assert.rejects(access(join(cwd,'production')));const result=run(cwd,...args,'--preview','--out-dir','preview');assert.equal(result.status,0,result.stderr);assert.equal(JSON.parse(await readFile(join(cwd,'preview','consent-notice.json'),'utf8')).mode,'preview');
}));
