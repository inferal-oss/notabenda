/** @requirements REQ-PRODUCT-SERVICE-DETECTION REQ-PRODUCT-SERVICE-CATALOG */
import {lstat,realpath,readdir,open} from 'node:fs/promises';
import {constants} from 'node:fs';
import {resolve,relative,join,extname,sep,dirname,isAbsolute} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {normalizeServiceCatalog} from './catalog.js';
import type {CatalogIdentifier} from './catalog.js';
const exec=promisify(execFile);
async function systemGit(root:string):Promise<string>{
 const candidates=process.platform==='win32'?[join(process.env.ProgramFiles??'C:\\Program Files','Git','cmd','git.exe'),join(process.env.ProgramFiles??'C:\\Program Files','Git','bin','git.exe')]:['/opt/homebrew/bin/git','/usr/local/bin/git','/usr/bin/git','/bin/git'];
 for(const candidate of candidates)try{const path=await realpath(candidate),inside=relative(root,path);if(inside===''||!isAbsolute(inside)&&inside!=='..'&&!inside.startsWith('..'+sep))continue;if((await lstat(path)).isFile())return path;}catch{}
 throw Object.assign(new Error('System Git is unavailable.'),{code:'ENOENT'});
}
const skippedDirectories=new Set(['.git','node_modules','vendor','dist','build','coverage','.next','.nuxt','.output','.local','.wrangler','.aws','.ssh','.codex','.agents','.venv','venv','__pycache__','target']);
const extensions=new Set(['.js','.mjs','.cjs','.jsx','.ts','.tsx','.py','.tf','.json','.toml','.yaml','.yml']);
const safePath=(p:string)=>p.length<=500&&!/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u.test(p)&&!p.split('/').some(x=>skippedDirectories.has(x))&&!p.split('/').some(x=>/^\.env(?:\.|$)|^\.dev\.vars(?:\.|$)|secret|credential|\.pem$|\.key$/iu.test(x));
export interface ProjectServiceEvidence {file:string;ruleId:string;ecosystem:CatalogIdentifier['ecosystem'];identifier:string;match:'exact'|'prefix';context:'dependency'|'development-dependency'|'source-import'|'infrastructure';explanation:string}
export interface ProjectServiceFinding {productId:string;productName:string;providerId:string;providerName:string;reviewRequired:true;evidence:ProjectServiceEvidence[]}
export interface ProjectServiceReport {schemaVersion:1;kind:'project-service-discovery';catalog:{id:string;revision:string};coverage:{selection:'git-ignore-aware'|'built-in-skips';filesExamined:number;bytesExamined:number;identifierTokensExamined:number;omittedEvidence:number;skippedFiles:number;limited:boolean};findings:ProjectServiceFinding[];notes:string[]}
/** Static, local scan. Never imports project modules, runs scripts/installers or reads secret-file values. */
export async function scanProjectServices(directory:string,input:unknown):Promise<ProjectServiceReport>{
 const catalog=normalizeServiceCatalog(input),root=await realpath(resolve(directory));if(!(await lstat(root)).isDirectory())throw Error('Select an existing project directory.');
 let paths:string[]=[],selection:ProjectServiceReport['coverage']['selection']='built-in-skips',limited=false;
 try{
  // npx can prepend project node_modules/.bin to PATH. Never run a project-supplied Git shim.
  const git=await systemGit(root);
  const {stdout}=await exec(git,['-c','core.fsmonitor=false','-c','core.untrackedCache=false','ls-files','-z','--cached','--others','--exclude-standard','--','.'],{cwd:root,encoding:'utf8',timeout:5000,maxBuffer:4*1024*1024,env:{...process.env,GIT_TERMINAL_PROMPT:'0',GIT_OPTIONAL_LOCKS:'0'}});
  paths=stdout.split('\0').filter(Boolean);selection='git-ignore-aware';
 }catch(error){
  // A normal non-Git project uses bounded traversal. Other Git failures are reported as limited coverage.
  const code=(error as {code?:string|number}).code;
  let ancestor=root;while(true){let found=false;try{await lstat(join(ancestor,'.git'));found=true;}catch{}if(found)throw Error('Git file selection failed; no fallback scan of an ignored repository was performed.');const parent=dirname(ancestor);if(parent===ancestor)break;ancestor=parent;}
  if(code!==128&&code!=='ENOENT')throw Error('Project file selection failed. No partial fallback scan was performed.');
  let visited=0;
  async function visit(folder:string,prefix=''):Promise<void>{
   let entries;try{entries=await readdir(folder,{withFileTypes:true});}catch{limited=true;return;}
   entries.sort((a,b)=>a.name.localeCompare(b.name,'en'));
   for(const entry of entries){if(++visited>20000){limited=true;return;}const path=prefix+entry.name;if(!safePath(path))continue;if(entry.isDirectory())await visit(join(folder,entry.name),path+'/');else if(entry.isFile())paths.push(path);if(paths.length>=5000){limited=true;return;}}
  }await visit(root);
 }
 paths=[...new Set(paths.map(p=>p.split(sep).join('/')))].sort();if(paths.length>5000){limited=true;paths=paths.slice(0,5000);}
 const providers=new Map(catalog.providers.map(p=>[p.id,p])),findings=new Map<string,ProjectServiceFinding>();
 let filesExamined=0,bytesExamined=0,skippedFiles=0,omittedEvidence=0;const observed=new Set<string>();
 const rules=catalog.products.flatMap(product=>product.identifiers.map(rule=>({product,rule})));
 const emit=(file:string,ecosystem:CatalogIdentifier['ecosystem'],identifier:string,context:ProjectServiceEvidence['context'])=>{
  // Only known identifier tokens are retained. No source line, value, URL, account key or package URL is output.
  const valid=identifier.length<=200&&(ecosystem==='npm'?/^(?:@[A-Za-z0-9][A-Za-z0-9._-]*\/)?[A-Za-z0-9][A-Za-z0-9._-]*$/u.test(identifier):ecosystem==='python'?/^[a-z0-9][a-z0-9-]*$/u.test(identifier):ecosystem==='terraform'?/^[A-Za-z0-9_-]+$/u.test(identifier):/^[A-Za-z0-9][A-Za-z0-9_./:-]*$/u.test(identifier));
  if(!valid){limited=true;return;}
  const token=JSON.stringify([file,ecosystem,identifier,context]);if(observed.has(token))return;if(observed.size>=20000){limited=true;return;}observed.add(token);
  for(const {product,rule} of rules){if(rule.ecosystem!==ecosystem||!(rule.match==='exact'?identifier===rule.value:identifier.startsWith(rule.value)))continue;
   const provider=providers.get(product.providerId)!,finding=findings.get(product.id)??{productId:product.id,productName:product.name,providerId:provider.id,providerName:provider.name,reviewRequired:true as const,evidence:[]};
   if(!finding.evidence.some(e=>e.file===file&&e.ruleId===rule.id&&e.identifier===rule.value&&e.context===context)){if(finding.evidence.length>=100){omittedEvidence++;limited=true;}else finding.evidence.push({file,ruleId:rule.id,ecosystem,identifier:rule.value,match:rule.match,context,explanation:rule.explanation});}
   findings.set(product.id,finding);
  }
 };
 for(const file of paths){
  if(observed.size>=20000){limited=true;break;}
  if(!safePath(file)||file.startsWith('/')||file.split('/').includes('..')||!(extensions.has(extname(file))||file.endsWith('requirements.txt')||file.endsWith('Dockerfile'))){skippedFiles++;continue;}
  const path=resolve(root,file);if(relative(root,path).startsWith('..'+sep)){skippedFiles++;continue;}
  // Reject symlinks in every ancestor, including tracked directory links and the final file.
  let unsafe=false,cursor=root;for(const part of file.split('/')){cursor=join(cursor,part);try{if((await lstat(cursor)).isSymbolicLink()){unsafe=true;break;}}catch{unsafe=true;break;}}
  if(unsafe){skippedFiles++;continue;}
  let source:string;try{
   const h=await open(path,constants.O_RDONLY|constants.O_NOFOLLOW);try{const stat=await h.stat();if(!stat.isFile()||stat.size>262144||bytesExamined+stat.size>32*1024*1024){limited=true;skippedFiles++;continue;}
    const buffer=Buffer.alloc(Math.min(262145,stat.size+1));let size=0;while(size<buffer.length){const {bytesRead}=await h.read(buffer,size,buffer.length-size,size);if(!bytesRead)break;size+=bytesRead;}if(size>262144||bytesExamined+size>32*1024*1024){limited=true;skippedFiles++;continue;}if(size>stat.size)limited=true;source=new TextDecoder('utf-8',{fatal:true}).decode(buffer.subarray(0,size));bytesExamined+=size;
   }finally{await h.close();}
  }catch{limited=true;skippedFiles++;continue;}filesExamined++;
  if(source.includes('\0')){skippedFiles++;continue;}
  if(file.split('/').at(-1)==='package.json')try{const value=JSON.parse(source);for(const [key,context] of [['dependencies','dependency'],['optionalDependencies','dependency'],['peerDependencies','dependency'],['devDependencies','development-dependency']] as const){const record=value?.[key];if(record&&typeof record==='object'&&!Array.isArray(record))for(const name of Object.keys(record))emit(file,'npm',name,context);}}catch{limited=true;}
  if(/\.[cm]?[jt]sx?$/u.test(file)){
   // Capture package/module specifiers, never surrounding source. Strings and comments can still produce candidates.
   const pattern=/(?:\bfrom\s*|\bimport\s*(?:\(\s*)?|\brequire\s*\(\s*)['"]([@a-zA-Z0-9_./-]{1,200})['"]/gu;
   for(const match of source.matchAll(pattern)){const specifier=match[1]!;if(!specifier.startsWith('.')&&!specifier.startsWith('/')){const segments=specifier.split('/'),name=specifier.startsWith('@')?segments.slice(0,2).join('/'):segments[0]!;emit(file,'npm',name,'source-import');}}
  }
  if(file.endsWith('requirements.txt'))for(const line of source.split(/\r?\n/u)){const match=/^\s*([A-Za-z0-9][A-Za-z0-9_.-]{0,100})\s*(?:[<>=!~\[]|$)/u.exec(line);if(match)emit(file,'python',match[1]!.toLowerCase().replace(/[-_.]+/gu,'-'),'dependency');}
  if(file.endsWith('.py'))for(const match of source.matchAll(/^\s*(?:from|import)\s+([a-zA-Z_][a-zA-Z0-9_]*)/gmu))emit(file,'python',match[1]!.toLowerCase().replace(/_/gu,'-'),'source-import');
  if(file.endsWith('.tf'))for(const match of source.matchAll(/\b(?:resource|data)\s+"([a-zA-Z0-9_-]{1,100})"/gu))emit(file,'terraform',match[1]!,'infrastructure');
  if(file.endsWith('Dockerfile'))for(const match of source.matchAll(/^\s*FROM\s+(?:--platform=\S+\s+)?([a-zA-Z0-9_./:-]{1,200})/gmu))emit(file,'docker',match[1]!,'infrastructure');
 }
 return {schemaVersion:1,kind:'project-service-discovery',catalog:{id:catalog.id,revision:catalog.revision},coverage:{selection,filesExamined,bytesExamined,identifierTokensExamined:observed.size,omittedEvidence,skippedFiles,limited},findings:[...findings.values()].sort((a,b)=>a.productId.localeCompare(b.productId,'en')),notes:[
  'Static candidates only: dependencies, source text and infrastructure declarations do not prove installation, live execution, contractual provider, data transfer or legal necessity. Confirm actual site use.',
  'Development dependencies and source imports remain separate evidence. Imports found in comments or strings may be false positives; generic database clients can be self-hosted.',
  'Secret-named files, symlinks, dependency/generated directories and unsupported or oversized files are skipped. No project modules, package scripts, SDKs or network probes are executed.',
  'Git projects use Git’s ignore-aware file list with filesystem monitoring disabled. Other projects use built-in skips; custom ignore rules are not interpreted by that fallback.',
  'File names and known identifiers may still reveal private project structure. Review before sharing. Empty or limited results never prove no third parties.',
  'No configuration is changed, permission granted, report uploaded or CI workflow required.'
 ]};
}
