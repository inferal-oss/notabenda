// @requirements REQ-PRODUCT-CF-DOCTOR REQ-PRODUCT-CF-STARTER
// This command reads files only. Never import project modules, run scripts or load credentials.
import {readFile,realpath,readdir,lstat} from 'node:fs/promises';
import {resolve,relative,dirname,join,isAbsolute} from 'node:path';

const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const slug=value=>typeof value==='string'&&/^[a-z](?:[a-z0-9-]{0,61}[a-z0-9])?$/u.test(value);
const inside=(root,path)=>{const part=relative(root,path);return part===''||!isAbsolute(part)&&part!=='..'&&!part.startsWith('..'+(process.platform==='win32'?'\\':'/'));};
const privatePart=value=>/^(?:\.env(?:\..*)?|\.dev\.vars(?:\..*)?|setup\.private\.json|\.git|\.wrangler)$/iu.test(value)||/\.(?:sqlite(?:3)?|db|tgz)$/iu.test(value);
const boundedPath=value=>typeof value==='string'&&value.length>0&&value.length<=1024&&!/[\u0000-\u001f\u007f]/u.test(value);
async function text(path,limit=1048576){const info=await lstat(path);if(!info.isFile()||info.size>limit)throw Error('file');return readFile(path,'utf8');}
async function projectPath(root,base,value){if(!boundedPath(value))throw Error('path');const path=resolve(base,value);if(!inside(root,path)||relative(root,path).split(/[\\/]/u).some(privatePart))throw Error('path');const actual=await realpath(path);if(!inside(root,actual)||relative(root,actual).split(/[\\/]/u).some(privatePart))throw Error('path');return actual;}
async function nonemptyFile(path,limit){const info=await lstat(path);if(!info.isFile()||info.size===0||info.size>limit)throw Error('file');}

/** JSONC comments and trailing commas only; strings remain byte-for-byte JSON. No eval. */
export function parseJsonc(source){
 let result='',string=false,escaped=false;
 for(let i=source.charCodeAt(0)===0xfeff?1:0;i<source.length;i++){
  const char=source[i],next=source[i+1];
  if(string){result+=char;if(escaped)escaped=false;else if(char==='\\')escaped=true;else if(char==='"')string=false;continue;}
  if(char==='"'){string=true;result+=char;continue;}
  if(char==='/'&&next==='/'){result+=' ';i+=2;while(i<source.length&&!['\n','\r'].includes(source[i]))i++;if(i<source.length)result+=source[i];continue;}
  if(char==='/'&&next==='*'){const end=source.indexOf('*/',i+2);if(end<0)throw Error('json');result+=' ';i=end+1;continue;}
  result+=char;
 }
 let clean='';string=false;escaped=false;
 for(let i=0;i<result.length;i++){
  const char=result[i];
  if(string){clean+=char;if(escaped)escaped=false;else if(char==='\\')escaped=true;else if(char==='"')string=false;continue;}
  if(char==='"'){string=true;clean+=char;continue;}
  if(char===','){let next=i+1;while(/\s/u.test(result[next]??'')&&next<result.length)next++;if(result[next]===']'||result[next]==='}')continue;}
  clean+=char;
 }
 return JSON.parse(clean);
}

export async function inspectProject({directory='.',config:configOption,environment}={}){
 const checks=[];
 const add=(id,status,message,action)=>checks.push({id,status,message,...(action?{action}:{}),requirementIds:['REQ-PRODUCT-CF-DOCTOR','REQ-PRODUCT-CF-STARTER']});
 const finish=()=>({schemaVersion:1,scope:'local-starter',environment:environment!==undefined?'named':'default',localChecksPassed:!checks.some(check=>check.status==='error'),productionReadiness:'not-assessed',checks});
 let root;try{root=await realpath(resolve(directory));if(!(await lstat(root)).isDirectory())throw Error('directory');}catch{add('PROJECT','error','The project directory is unavailable.','Select an existing starter with --directory.');return finish();}
 const [major,minor]=process.versions.node.split('.').map(Number);
 add('NODE',major>22||major===22&&minor>=22?'pass':'error','The CLI needs Node 22.22 or later.',major>22||major===22&&minor>=22?undefined:'Use a supported Node version before running the starter tools.');
 let configPath,raw;
 try{
  if(configOption!==undefined){if(!/\.jsonc?$/u.test(configOption))throw Error('config');configPath=await projectPath(root,root,configOption);}
  else{
   const found=[];for(const name of ['wrangler.json','wrangler.jsonc'])try{await lstat(join(root,name));found.push(name);}catch{}
   if(found.length!==1)throw Error('config');configPath=await projectPath(root,root,found[0]);
  }
  raw=parseJsonc(await text(configPath));if(!object(raw))throw Error('config');
  add('CONFIG','pass','A bounded JSON/JSONC Wrangler configuration was read without execution.');
 }catch{add('CONFIG','error','A single readable JSON/JSONC Wrangler configuration is required.','Use --config for an explicit project-relative JSON/JSONC file. TOML and programmatic/Vite configuration need Wrangler checks. No configuration contents were printed.');return finish();}
 let config=raw;
 if(environment!==undefined){
  if(!slug(environment)||!object(raw.env)||!Object.hasOwn(raw.env,environment)||!object(raw.env[environment])){add('ENVIRONMENT','error','The selected named environment is unavailable.','Select a declared environment with --env; other environments are not inspected.');return finish();}
  const selected=raw.env[environment];config={...raw,...selected,durable_objects:selected.durable_objects,vars:selected.vars};
  add('ENVIRONMENT','pass','Only the selected environment is checked. Its Durable Object bindings and vars are not inherited.');
 }else if(object(raw.env)&&Object.keys(raw.env).length)add('ENVIRONMENT','review','Named environments were not inspected.','Run doctor again with --env for each intended environment.');
 add('WORKER-NAME',slug(config.name)?'pass':'error','The Worker name must be a lowercase slug of at most 63 characters.');
 const date=config.compatibility_date,validDate=typeof date==='string'&&/^\d{4}-\d{2}-\d{2}$/u.test(date)&&Number.isFinite(Date.parse(date))&&new Date(date).toISOString().slice(0,10)===date&&date<=new Date().toISOString().slice(0,10);
 add('COMPATIBILITY-DATE',validDate?'pass':'error','The compatibility date must be a real date no later than today.');
 try{const entry=await projectPath(root,dirname(configPath),config.main);await nonemptyFile(entry,1048576);add('WORKER-ENTRY','pass','The configured Worker entry is a bounded file inside this project.');}catch{add('WORKER-ENTRY','error','The Worker entry is missing, outside this project or not a bounded regular file.','Check main relative to the selected Wrangler configuration.');}
 const bindings=config.durable_objects?.bindings,selected=Array.isArray(bindings)?bindings.filter(binding=>object(binding)&&binding.name==='EVIDENCE'):[];
 const binding=selected.length===1?selected[0]:undefined;
 add('EVIDENCE-BINDING',binding&&typeof binding.class_name==='string'&&!Object.hasOwn(binding,'script_name')&&!Object.hasOwn(binding,'environment')?'pass':'error','The starter needs one local EVIDENCE binding with a declared class.','Keep the existing binding, class and site identity stable; changing them can select different data.');
 const declaration=typeof binding?.class_name==='string'&&object(config.exports)&&Object.hasOwn(config.exports,binding.class_name)?config.exports[binding.class_name]:undefined;
 const live=object(declaration)&&declaration.type==='durable-object'&&declaration.storage==='sqlite'&&(declaration.state===undefined||declaration.state==='created');
 add('SQLITE-EXPORT',live?'pass':'error','The evidence class needs a live SQLite Durable Object export.','Resolve lifecycle changes deliberately with Wrangler; doctor never migrates, renames or deletes data.');
 if(Object.hasOwn(config,'migrations'))add('CLASS-LIFECYCLE','error','This starter uses declarative exports; a competing migrations key is unsupported.','Review existing deployment history before changing either declaration.');
 const assets=config.assets;
 add('ASSET-GATE',object(assets)&&assets.binding==='ASSETS'&&assets.run_worker_first===true?'pass':'error','The starter requires ASSETS and run_worker_first: true so its host can authorize before assets.','Selective routing requires a separate access review; this checker does not prove pattern coverage.');
 let assetRoot;
 try{assetRoot=await projectPath(root,dirname(configPath),assets?.directory);if(!(await lstat(assetRoot)).isDirectory())throw Error('assets');add('ASSET-DIRECTORY','pass','The configured asset directory exists inside the project.');}catch{add('ASSET-DIRECTORY','error','The asset directory is unavailable or outside this project.','Run the reviewed build command and inspect assets.directory.');}
 if(assetRoot){
  for(const [id,file] of [['SETUP-ASSET','assets/setup.mjs'],['STYLE-ASSET','assets/notabenda.css'],['CARTRIDGE-STYLE-ASSET','assets/cartridges.css']])try{const path=await projectPath(root,assetRoot,file);await nonemptyFile(path,4194304);add(id,'pass','A required nonempty setup asset exists.');}catch{add(id,'error','A required setup asset is missing, empty or outside this project.','Review scripts/build-assets.mjs, then run npm run build.');}
  let visited=0,privateNames=0,links=0;
  async function walk(path,depth=0){
   if(depth>24)throw Error('limit');
   for(const item of await readdir(path,{withFileTypes:true})){
    if(++visited>10000)throw Error('limit');
    if(item.isSymbolicLink()){links++;continue;}
    if(/^(?:\.env(?:\..*)?|\.dev\.vars(?:\..*)?|setup\.private\.json|\.git|\.wrangler|node_modules)$/iu.test(item.name)||/\.(?:sqlite(?:3)?|db|tgz)$/iu.test(item.name)){privateNames++;continue;}
    const child=join(path,item.name);if(item.isDirectory())await walk(child,depth+1);else if(!item.isFile())throw Error('file');
   }
  }
  try{await walk(assetRoot);add('PUBLIC-FILENAMES',privateNames?'error':'pass',privateNames?'Private or build-state filename patterns were found in the asset tree.':'No known private/build-state filename patterns were found in the bounded asset tree.',privateNames?'Remove these files from the upload tree after reviewing what must be retained. Filenames and contents are not printed.':undefined);add('ASSET-LINKS',links?'error':'pass',links?'Asset symlinks cannot be checked safely by this command.':'The asset walk encountered no symlinks.',links?'Build regular files into a dedicated asset directory; no symlink targets were scanned.':undefined);}catch{add('PUBLIC-FILENAMES','error','The bounded asset walk could not finish.','Use a readable, dedicated asset directory with at most 10,000 entries and 24 directory levels.');}
 }
 let settings;
 try{
  const source=await text(await projectPath(root,root,'src/settings.mjs'),65536);
  const match=source.match(/^\s*(?:(?:\/\/[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\/)\s*)*export const settings\s*=\s*([\s\S]*?);?\s*$/u);
  settings=match&&parseJsonc(match[1].replace(/;\s*$/u,''));
  if(!object(settings)||settings.schemaVersion!==1||!slug(settings.siteId)||typeof settings.basePath!=='string'||settings.basePath.length>200||!/^\/[a-z][a-z0-9-]*(?:\/[a-z][a-z0-9-]*)*$/u.test(settings.basePath)||/^\/assets(?:\/|$)/u.test(settings.basePath)||typeof settings.workspaceLabel!=='string'||!settings.workspaceLabel.trim()||settings.workspaceLabel.length>200)throw Error('settings');
  add('SITE-SETTINGS','pass','The starter has statically readable site ID, admin path and label settings.');
 }catch{add('SITE-SETTINGS','error','Static starter settings could not be validated without executing JavaScript.','Keep the exported settings as a JSON/JSONC object literal, or verify custom dynamic settings separately. No module was imported.');}
 try{
  const source=await text(await projectPath(root,root,'src/authorize.mjs'),131072),stub=await readFile(new URL('../templates/src/authorize.mjs',import.meta.url),'utf8');
  if(source.replace(/\r\n/gu,'\n').trim()===stub.trim()||/export\s+async\s+function\s+authorizeHostRequest\s*\([^)]*\)\s*\{\s*return\s+null\s*;?\s*\}/u.test(source))add('AUTHORIZATION','error','The bundled deny-all authorization hook is still present.','Implement host-owned authentication and permissions. The package does not supply credentials or a login.');
  else add('AUTHORIZATION','review','An authorization file exists; its behavior has not been verified.','Test denied/expired identities, inspection, configuration, export and private-source access against the actual host. Editing the stub is not evidence of secure authorization.');
 }catch{add('AUTHORIZATION','error','The starter authorization file is unavailable or outside the bounded project files.','Restore or deliberately replace the host authorization integration.');}
 try{
  const source=await text(await projectPath(root,root,'.gitignore'),65536),rules=source.split(/\r?\n/u).map(line=>line.trim().replace(/^\//u,''));
  const complete=['.dev.vars','.dev.vars.*','.env','.env.*','setup.private.json'].every(rule=>rules.includes(rule));
  add('PRIVATE-IGNORE-RULES',complete&&!rules.some(rule=>rule.startsWith('!'))?'pass':'review',complete?'The starter private-file ignore patterns are present.':'The starter private-file ignore patterns need review.','Verify actual Git tracking and nested/negated rules separately. Already tracked files are not protected by ignore rules.');
 }catch{add('PRIVATE-IGNORE-RULES','review','The starter ignore patterns could not be inspected.','Keep environment files and private setup reports outside version control and public assets.');}
 try{
  const pkg=JSON.parse(await text(await projectPath(root,root,'package.json'),262144));
  if(!object(pkg)||pkg.private!==true||!object(pkg.scripts)||typeof pkg.scripts.build!=='string'||!['notabenda','notabenda-cf','esbuild','wrangler'].every(name=>typeof pkg.dependencies?.[name]==='string'||typeof pkg.devDependencies?.[name]==='string'))throw Error('package');
  add('PROJECT-MANIFEST','pass','The project is private and declares the starter dependencies and build script.');
 }catch{add('PROJECT-MANIFEST','error','The private starter package manifest is incomplete.','Review package.json, its build script and both package/tool dependencies. No scripts were executed.');}
 for(const name of ['notabenda','notabenda-cf','esbuild','wrangler']){
  try{const installed=JSON.parse(await text(await projectPath(root,root,'node_modules/'+name+'/package.json'),262144));if(installed.name!==name||typeof installed.version!=='string')throw Error('package');add('DEPENDENCY-'+name.toUpperCase(),'pass','A required local dependency manifest exists.');}catch{add('DEPENDENCY-'+name.toUpperCase(),'error','A required local dependency manifest is unavailable.','Install the reviewed project dependencies. Unpublished previews need explicit local package tarballs. Doctor never installs or executes packages.');}
 }
 add('LOGGING',config.observability?.enabled===false?'pass':'review','Request/evidence logging needs an explicit host policy.','Review observability, tail consumers, application logs and redaction without recording raw evidence or credentials.');
 add('SOURCE-MAPS',config.upload_source_maps===false?'pass':'review','Source-map upload should follow an explicit publication/access decision.','Doctor does not inspect remote source maps or source contents.');
 add('RUNTIME-ACCESS','review','No running Worker, account, endpoint or secret was inspected.','Run the reviewed project build and Wrangler dry run, then test actual anonymous/authorized access and separate privileges.');
 add('DATA-LIFECYCLE','review','Retention, backups, restore, erasure and namespace continuity were not verified.','Use a separate staging environment and rehearse lifecycle operations before production changes.');
 add('PUBLIC-CONTENT','review','Asset contents and project source have not been audited for private data.','Review the upload tree and bundle before deployment. Filename checks alone cannot detect inline secrets or private records.');
 return finish();
}

export function printReport(report,json=false){
 if(json)return JSON.stringify(report,null,2)+'\n';
 const labels={pass:'OK',error:'FIX',review:'REVIEW'},counts={error:0,review:0};
 for(const item of report.checks)if(item.status!=='pass')counts[item.status]++;
 return 'Notabenda Cloudflare · local project checks\n'+(report.environment==='named'?'Selected named environment only.\n':'Default environment only.\n')+'\n'+report.checks.map(item=>`[${labels[item.status]}] ${item.id}: ${item.message}${item.action?'\n  '+item.action:''}`).join('\n')+`\n\n${counts.error} local issue(s); ${counts.review} manual review item(s).\nProduction readiness was not assessed. No project code, credentials, network or remote resources were used.\n`;
}
