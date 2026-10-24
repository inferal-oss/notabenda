// @requirements REQ-PRODUCT-AUTHORING REQ-PRODUCT-SAFE-CONTENT
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,mkdir,rm,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {readDocumentSource,MAX_SOURCE_BYTES} from '@notabenda/authoring';

const rejected=promise=>assert.rejects(promise,error=>error.name==='AuthoringError'&&error.code==='invalid-source'&&/regular UTF-8.*24 KiB/u.test(error.message)&&!error.message.includes('private-file'));

test('local sources enforce the UTF-8 byte boundary while retaining BOMs, line endings and import base URLs',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'notabenda-source-bytes-'));
 try{
  const file=join(directory,'private-file.mdx'),prefix='\uFEFF# Source\r\n',source=prefix+'é'.repeat((MAX_SOURCE_BYTES-Buffer.byteLength(prefix)-1)/2)+'x';
  assert.equal(Buffer.byteLength(source),MAX_SOURCE_BYTES);await writeFile(file,source);
  for(const input of [file,pathToFileURL(file)]){const result=await readDocumentSource(input,{componentsRevision:'components-1'});assert.equal(result.source,source);assert.equal(result.format,'mdx');assert.equal(result.baseUrl.href,pathToFileURL(file).href);assert.equal(result.componentsRevision,'components-1');}
  await writeFile(file,source+'x');await rejected(readDocumentSource(file));
  await writeFile(file,Buffer.from([0xff,0xfe]));await rejected(readDocumentSource(file));
  await writeFile(file,'');assert.equal((await readDocumentSource(file)).source,'');
  const folder=join(directory,'private-file.md');await mkdir(folder);await rejected(readDocumentSource(folder));
 }finally{await rm(directory,{recursive:true,force:true});}
});

test('local source symlinks are rejected before reading the target',{skip:process.platform==='win32'},async()=>{
 const directory=await mkdtemp(join(tmpdir(),'notabenda-source-link-'));
 try{
  const target=join(directory,'target.md'),link=join(directory,'private-file.md');await writeFile(target,'PRIVATE TARGET CONTENT');await symlink(target,link);await rejected(readDocumentSource(link));
 }finally{await rm(directory,{recursive:true,force:true});}
});

// Change only the child's temporary source after lstat or fstat. Production code
// receives no test hooks; the child deadline also catches a blocking FIFO open.
const program=[
 "import fs from 'node:fs';",
 "import {syncBuiltinESMExports} from 'node:module';",
 "import {fileURLToPath} from 'node:url';",
 "import {execFileSync} from 'node:child_process';",
 "const [file,mode,moduleUrl]=process.argv.slice(1);let switched=false,bytesRead=0;",
 "if(mode.startsWith('replace-')){const lstat=fs.promises.lstat.bind(fs.promises);fs.promises.lstat=async(...args)=>{const stat=await lstat(...args);if(!switched&&fileURLToPath(args[0])===file){switched=true;await fs.promises.rename(file,file+'.original');if(mode==='replace-fifo')execFileSync('mkfifo',[file]);else if(mode==='replace-link')await fs.promises.symlink(file+'.original',file);else await fs.promises.writeFile(file,'REPLACEMENT MUST NOT BE READ');}return stat;};}",
 "if(mode==='grow'){const open=fs.promises.open.bind(fs.promises);fs.promises.open=async(...args)=>{const handle=await open(...args),stat=handle.stat.bind(handle),read=handle.read.bind(handle);handle.stat=async()=>{const result=await stat();if(!switched){switched=true;await fs.promises.appendFile(file,'x'.repeat(24576));}return result;};handle.read=async(...values)=>{const result=await read(...values);bytesRead+=result.bytesRead;return result;};return handle;};}",
 "syncBuiltinESMExports();const {readDocumentSource}=await import(moduleUrl);",
 "try{await readDocumentSource(file);console.log(JSON.stringify({status:'read',switched,bytesRead}));process.exitCode=1;}catch(error){console.log(JSON.stringify({status:'rejected',name:error.name,code:error.code,message:error.message,switched,bytesRead}));}",
].join('\n');

for(const mode of ['fifo','replace-fifo','replace-link','replace-file','grow'])test('local source reading rejects '+mode+' without waiting for a pipe or reading unbounded data',{skip:process.platform==='win32'&&['fifo','replace-fifo','replace-link'].includes(mode)},async()=>{
 const directory=await mkdtemp(join(tmpdir(),'notabenda-source-race-'));
 try{
  const file=join(directory,'private-file.md');
  if(mode==='fifo'){const pipe=spawnSync('mkfifo',[file],{encoding:'utf8'});assert.equal(pipe.status,0,pipe.stderr);}else await writeFile(file,'ORIGINAL SOURCE');
  const result=spawnSync(process.execPath,['--input-type=module','--eval',program,file,mode,new URL('../dist/index.js',import.meta.url).href],{encoding:'utf8',timeout:4000,killSignal:'SIGKILL'});
  assert.equal(result.error,undefined,'source validation must finish without waiting for a pipe writer');assert.equal(result.status,0,result.stderr);
  const observed=JSON.parse(result.stdout);assert.equal(observed.status,'rejected');assert.equal(observed.name,'AuthoringError');assert.equal(observed.code,'invalid-source');assert.doesNotMatch(observed.message,/private-file|ORIGINAL SOURCE|REPLACEMENT/u);
  assert.equal(observed.switched,mode!=='fifo','the intended replacement or growth actually occurred');
  assert.ok(observed.bytesRead<=MAX_SOURCE_BYTES+1,'a changing file cannot make the read exceed its fixed buffer');
  if(mode==='grow')assert.equal(observed.bytesRead,MAX_SOURCE_BYTES+1,'read the boundary sentinel before rejecting growth');
 }finally{await rm(directory,{recursive:true,force:true});}
});
