// @requirements REQ-PRODUCT-SERVICE-DETECTION REQ-PRODUCT-SERVICE-CATALOG
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,mkdir,symlink,stat,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {scanProjectServices} from '@notabenda/core/catalog/project';
import {serviceCatalogSeed} from '@notabenda/core/catalog/seed';
const cli=new URL('../dist/cli.js',import.meta.url).pathname;
const scan=dir=>scanProjectServices(dir,serviceCatalogSeed);
async function project(run){const dir=await mkdtemp(join(tmpdir(),'notabenda-python-project-'));try{await run(dir);}finally{await rm(dir,{recursive:true,force:true});}}
const evidence=(r,id)=>r.findings.find(f=>f.productId===id)?.evidence;

test('pyproject separates project, optional, group and build requirements and minimizes direct-reference evidence',async()=>project(async dir=>{
 const source=`[project]
name = "PRIVATE_PROJECT"
dependencies = [
 "stripe[async]>=11; python_version >= '3.10'",
 'Sentry_SDK @ https://PRIVATE_HOST/PRIVATE_FILE.whl',
 "google.cloud.storage>=2",
]
[project.optional-dependencies]
PRIVATE_EXTRA = ["twilio>=9"]
[dependency-groups]
PRIVATE_GROUP = ["redis>=5", {include-group = "Private_Base"}]
Private-Base = ["pymongo"]
[build-system]
requires = ["boto3>=1"]
build-backend = "PRIVATE_BACKEND"
`;
 await writeFile(join(dir,'pyproject.toml'),source);const r=await scan(dir);
 assert.equal(r.coverage.limited,false);assert.deepEqual(r.findings.map(f=>f.productId),['aws-sdk','google-cloud','mongodb-client','redis-client','sentry-monitoring','stripe-payments','twilio-messaging']);
 for(const [id,context] of [['aws-sdk','build-dependency'],['twilio-messaging','optional-dependency'],['redis-client','dependency-group'],['stripe-payments','dependency']])assert.equal(evidence(r,id)[0].context,context);
 assert.doesNotMatch(JSON.stringify(r),/PRIVATE_|python_version|>=|\.whl|async/);assert.equal(await readFile(join(dir,'pyproject.toml'),'utf8'),source);
}));
test('TOML comments, prose, package identity, tools and lock entries do not become declared dependencies',async()=>project(async dir=>{
 await writeFile(join(dir,'pyproject.toml'),`[project]\nname = "stripe"\ndescription = '''dependencies = ["twilio"]'''\n# dependencies = ["boto3"]\n[tool.example]\ndependencies = ["resend"]\n[project.urls]\nstripe = "https://example.test"\n`);
 await writeFile(join(dir,'uv.lock'),'[[package]]\nname = "sentry-sdk"\n');assert.deepEqual((await scan(dir)).findings,[]);
}));
test('quoted/dotted TOML keys, multiline arrays and decoded names use the same normalized Python identifiers',async()=>project(async dir=>{
 await writeFile(join(dir,'pyproject.toml'),String.raw`project.dependencies = ["SeNtRy\u002dSdk", 'azure_storage_blob', "stripe-attacker", "twilio_fake"]
project."optional-dependencies"."optional.extra" = [
 'sendgrid', # provider declared only as optional
]
`);const r=await scan(dir);assert.equal(r.coverage.limited,false);assert.deepEqual(r.findings.map(f=>f.productId),['azure-sdk','sendgrid-email','sentry-monitoring']);
}));
test('dependency groups are not expanded recursively or assumed to be runtime/dev environments',async()=>project(async dir=>{
 await writeFile(join(dir,'pyproject.toml'),'[dependency-groups]\nworker=["stripe", {include-group="shared"}]\nshared=["stripe", "redis"]\n');
 const r=await scan(dir);assert.equal(r.coverage.limited,false);assert.equal(evidence(r,'stripe-payments').length,1);assert.equal(evidence(r,'stripe-payments')[0].context,'dependency-group');
}));
test('broken includes, cycles, normalized collisions and unknown group items report limited coverage',async()=>project(async dir=>{
 for(const groups of ['a=["stripe",{include-group="missing"}]','a=["stripe",{include-group="b"}]\nb=[{include-group="a"}]','a_b=["stripe"]\na-b=["redis"]','a=["stripe", {include-group="a", PRIVATE_FIELD="PRIVATE_VALUE"}]']){
  await writeFile(join(dir,'pyproject.toml'),'[dependency-groups]\n'+groups+'\n');const r=await scan(dir);assert.equal(r.coverage.limited,true);assert.ok(evidence(r,'stripe-payments'));assert.doesNotMatch(JSON.stringify(r),/PRIVATE_VALUE/);
 }
}));
test('dynamic and unsupported tool dependency selection is limited while named standard requirements remain candidates',async()=>project(async dir=>{
 for(const suffix of ['dynamic=["dependencies"]','[tool.poetry.dependencies]\nredis="*"','[tool.pdm.dev-dependencies]\ntest=["redis"]','[tool.uv.sources]\nstripe={path="../PRIVATE_PATH"}','[tool.uv.workspace]\nmembers=["PRIVATE_MEMBER"]']){
  await writeFile(join(dir,'pyproject.toml'),'[project]\ndependencies=["stripe"]\n'+suffix+'\n');const r=await scan(dir);assert.equal(r.coverage.limited,true);assert.deepEqual(r.findings.map(f=>f.productId),['stripe-payments']);assert.doesNotMatch(JSON.stringify(r),/PRIVATE_PATH|PRIVATE_MEMBER/);
 }
}));
test('malformed TOML and requirement fields produce limited evidence without source text or parser diagnostics',async()=>project(async dir=>{
 for(const source of ['[project]\ndependencies=["stripe"]\ndependencies=["twilio"]','[project]\ndependencies=["stripe",','[project]\ndependencies="PRIVATE_VALUE"','[project]\ndependencies=[42,"stripe???", "https://PRIVATE_VALUE"]','[dependency-groups]\na=[{path="PRIVATE_VALUE"}]','[build-system]\nrequires=42']){
  await writeFile(join(dir,'pyproject.toml'),source);const r=await scan(dir);assert.equal(r.coverage.limited,true);assert.deepEqual(r.findings,[]);assert.doesNotMatch(JSON.stringify(r),/PRIVATE_VALUE|TOML parse|line \d/);
 }
}));
test('TOML nesting and group graph work are bounded and cannot expand into project execution',async()=>project(async dir=>{
 for(const source of ['[tool.example]\nx='+ '['.repeat(40)+'"stripe"'+']'.repeat(40),'[dependency-groups]\n'+Array.from({length:300},(_,i)=>'a'+i+'=[{include-group="a'+(i+1)+'"}]').join('\n')]){
  await writeFile(join(dir,'pyproject.toml'),source);const r=await scan(dir);assert.equal(r.coverage.limited,true);assert.deepEqual(r.findings,[]);
 }
}));
test('large declared requirement lists stop at the entry budget rather than claiming complete coverage',async()=>project(async dir=>{
 await writeFile(join(dir,'pyproject.toml'),'[project]\ndependencies=['+'"unknown",'.repeat(10000)+'"stripe"]\n');
 const r=await scan(dir);assert.equal(r.coverage.limited,true);assert.deepEqual(r.findings,[]);
}));
test('Python discovery keeps ignore, secret, symlink, no-execution and private CLI export boundaries',async()=>project(async dir=>{
 spawnSync('git',['init','--quiet'],{cwd:dir});await writeFile(join(dir,'.gitignore'),'ignored/\n');
 await writeFile(join(dir,'pyproject.toml'),'[project]\ndependencies=["stripe"]\n[build-system]\nrequires=[]\nbuild-backend="PRIVATE_BACKEND"\n');
 for(const folder of ['ignored','credentials','.venv']){await mkdir(join(dir,folder));await writeFile(join(dir,folder,'pyproject.toml'),'[project]\ndependencies=["twilio"]\n');}
 await symlink(join(dir,'pyproject.toml'),join(dir,'linked.toml'));await writeFile(join(dir,'PRIVATE_BACKEND.py'),'raise Exception("DO_NOT_EXECUTE")');
 const out=join(dir,'review'),args=[cli,'discover','--project',dir,'--out-dir',out,'--json'],r=spawnSync(process.execPath,args,{encoding:'utf8'});assert.equal(r.status,0,r.stderr);
 const report=JSON.parse(r.stdout);assert.equal(report.coverage.selection,'git-ignore-aware');assert.deepEqual(report.findings.map(f=>f.productId),['stripe-payments']);assert.equal(evidence(report,'stripe-payments')[0].file,'pyproject.toml');assert.doesNotMatch(r.stdout,/DO_NOT_EXECUTE|PRIVATE_BACKEND/);
 assert.equal((await stat(out)).mode&0o777,0o700);assert.equal((await stat(join(out,'discovery.private.json'))).mode&0o777,0o600);assert.notEqual(spawnSync(process.execPath,args,{encoding:'utf8'}).status,0);
}));
