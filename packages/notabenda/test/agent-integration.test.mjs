// @requirements REQ-PRODUCT-AGENT-INTEGRATION
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm,realpath} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {parse} from 'yaml';
const root=fileURLToPath(new URL('../../../',import.meta.url));
const cli=fileURLToPath(new URL('../dist/cli.js',import.meta.url));
const run=(cwd,command,args)=>{const result=spawnSync(command,args,{cwd,encoding:'utf8',env:{...process.env,npm_config_cache:cwd===root?join(root,'.local/npm-cache'):join(cwd,'.npm-cache')},timeout:30000});assert.equal(result.status,0,result.stderr||result.error?.message);return result.stdout;};

test('package contains the versioned skill and its commands work after offline local installation',async()=>{
 const cwd=await mkdtemp(join(tmpdir(),'notabenda-agent-'));
 try{
  const packed=JSON.parse(run(root,'npm',['pack','--workspace','notabenda','--ignore-scripts','--json','--pack-destination',cwd]));
  for(const path of ['dist/skill/SKILL.md','dist/skill/agents/openai.yaml'])assert.ok(packed[0].files.some(file=>file.path===path),path);
  await writeFile(join(cwd,'package.json'),JSON.stringify({name:'agent-smoke-test',private:true,type:'module'}));
  run(cwd,'npm',['install','--offline','--ignore-scripts','--no-audit','--no-fund','--omit=optional',join(cwd,packed[0].filename)]);
  const skill=await readFile(join(cwd,'node_modules/notabenda/dist/skill/SKILL.md'),'utf8');
  assert.equal(skill,await readFile(new URL('../../../skills/notabenda/SKILL.md',import.meta.url),'utf8'));
  const metadata=parse(/^---\n([\s\S]+?)\n---/u.exec(skill)[1]);assert.equal(metadata.name,'notabenda');assert.ok(metadata.description.length<1024);assert.deepEqual(Object.keys(metadata).sort(),['description','name']);
  const ui=parse(await readFile(join(cwd,'node_modules/notabenda/dist/skill/agents/openai.yaml'),'utf8'));assert.ok(ui.interface.default_prompt.includes('$notabenda'));
  assert.equal(run(cwd,process.execPath,['--input-type=module','-e',"console.log(import.meta.resolve('notabenda/skill/SKILL.md'))"]).trim(),new URL('file://'+await realpath(join(cwd,'node_modules/notabenda/dist/skill/SKILL.md'))).href);
  // Extract the documented commands, rather than maintaining a second recipe.
  const commands=skill.split('\n').filter(line=>line.startsWith('npx --no-install notabenda '));
  run(cwd,process.execPath,[cli,'init']);
  const original=await readFile(join(cwd,'notabenda.config.json'),'utf8');
  await writeFile(join(cwd,'backend.mjs'),"import {createClient} from '@supabase/supabase-js';\nthrow Error('Discovery must not execute this module');\n");
  for(const command of commands){
   const args=command.split(' ').slice(3);
   if(args[0]==='wizard'){
    await writeFile(join(cwd,'answers.json'),JSON.stringify({schemaVersion:1,publicFacts:{siteId:'agent-test',siteName:'Agent Test',siteUrl:'https://agent.example.test'},answers:{},markets:[],storageJustifications:{}}));
    args.push('--answers','answers.json');
   }
   run(cwd,'npx',['--no-install','notabenda',...args]);
  }
  const report=JSON.parse(await readFile(join(cwd,'service-review/discovery.private.json'),'utf8'));assert.equal(report.kind,'project-service-discovery');assert.ok(report.findings.length>0);
  assert.equal(await readFile(join(cwd,'notabenda.config.json'),'utf8'),original);
  const plan=JSON.parse(await readFile(join(cwd,'setup-review/setup.private.json'),'utf8'));assert.equal(plan.kind,'private-setup-report');
  assert.match(await readFile(join(cwd,'legal-preview/privacy/index.html'),'utf8'),/Draft/u);
  const production=spawnSync('npx',['--no-install','notabenda','check'],{cwd,encoding:'utf8',env:{...process.env,npm_config_cache:join(cwd,'.npm-cache')}});assert.equal(production.status,1);
 }finally{await rm(cwd,{recursive:true,force:true});}
});
