#!/usr/bin/env node
// @requirements REQ-PRODUCT-CF-STARTER REQ-PRODUCT-CF-DOCTOR REQ-PRODUCT-PACKAGE
import {readFile,mkdir,writeFile,realpath} from 'node:fs/promises';
import {resolve,dirname,basename,join} from 'node:path';
import {inspectProject,printReport} from './doctor.mjs';

const help=`notabenda-cf init [--out-dir DIRECTORY] [--name WORKER_NAME]
                   [--site-id SITE_ID] [--base-path /backoffice]

Create a new, local Cloudflare project. Existing paths are never replaced.
The host authorization hook denies access until you implement it.
No installation, login, resource creation or deployment is performed.

notabenda-cf doctor [--directory DIRECTORY] [--config FILE.jsonc]
                    [--env ENVIRONMENT] [--json]

Read-only checks for the generated starter. No project code is executed.
Reports local issues and separate manual reviews; never certifies production.
`;
const slug=value=>typeof value==='string'&&/^[a-z](?:[a-z0-9-]{0,61}[a-z0-9])?$/u.test(value);
let created;
try{
 const args=process.argv.slice(2);
 if(!args.length||args.length===1&&['--help','-h','help'].includes(args[0])||args.length===2&&['init','doctor'].includes(args[0])&&['--help','-h'].includes(args[1])){process.stdout.write(help);}
 else if(args[0]==='doctor'){
  args.shift();const options={};
  while(args.length){const key=args.shift();if(!['--directory','--config','--env','--json'].includes(key)||Object.hasOwn(options,key))throw Error('Use documented doctor options once.');if(key==='--json'){options[key]=true;continue;}if(!args.length||args[0].startsWith('--'))throw Error('Doctor options need a value.');options[key]=args.shift();}
  let report;try{report=await inspectProject({directory:options['--directory'],config:options['--config'],environment:options['--env']});}catch{throw Error('The bounded local check could not finish. No project code was executed or file contents printed.');}
  process.stdout.write(printReport(report,options['--json']));if(!report.localChecksPassed)process.exitCode=1;
 }
 else{
  if(args.shift()!=='init')throw Error('Use init, doctor or --help.');
  const options={};
  while(args.length){const key=args.shift();if(!['--out-dir','--name','--site-id','--base-path'].includes(key)||Object.hasOwn(options,key)||!args.length||args[0].startsWith('--'))throw Error('Use each documented option once, with a value.');options[key]=args.shift();}
  const name=options['--name']??'notabenda-evidence',siteId=options['--site-id']??'site-one',basePath=options['--base-path']??'/backoffice';
  if(!slug(name)||!slug(siteId))throw Error('Worker name and site ID must be lowercase slugs of at most 63 characters.');
  if(basePath.length>200||!/^\/[a-z][a-z0-9-]*(?:\/[a-z][a-z0-9-]*)*$/u.test(basePath)||/^\/assets(?:\/|$)/u.test(basePath))throw Error('Use a clean lowercase admin base path outside /assets.');
  const requested=resolve(options['--out-dir']??name),parent=await realpath(dirname(requested)),target=join(parent,basename(requested));
  const metadata=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
  const settings={schemaVersion:1,siteId,basePath,workspaceLabel:'Evidence studio'};
  const files={
   'package.json':JSON.stringify({name,private:true,type:'module',engines:{node:'>=22.22.0'},scripts:{build:'node scripts/build-assets.mjs',doctor:'notabenda-cf doctor',dev:'npm run build && wrangler dev',check:'npm run build && wrangler deploy --dry-run',deploy:'npm run build && wrangler deploy'},dependencies:{notabenda:metadata.version,'notabenda-cf':metadata.version},devDependencies:{esbuild:'0.28.2',wrangler:'4.151.1'}},null,2)+'\n',
   'wrangler.json':JSON.stringify({$schema:'node_modules/wrangler/config-schema.json',name,main:'src/worker.mjs',compatibility_date:'2026-10-18',assets:{directory:'./public',binding:'ASSETS',run_worker_first:true},durable_objects:{bindings:[{name:'EVIDENCE',class_name:'EvidenceWorkspace'}]},exports:{EvidenceWorkspace:{type:'durable-object',storage:'sqlite'}},observability:{enabled:false},upload_source_maps:false},null,2)+'\n',
   'src/settings.mjs':'// Public host-owned configuration. Keep credentials in the host secret store.\nexport const settings = '+JSON.stringify(settings,null,2)+';\n',
   '.gitignore':'node_modules/\npublic/\ndist/\n.wrangler/\n.dev.vars\n.dev.vars.*\n.env\n.env.*\nsetup.private.json\n',
   'LICENSE':await readFile(new URL('../LICENSE',import.meta.url),'utf8'),
  };
  for(const path of ['README.md','src/worker.mjs','src/host.mjs','src/workspace.mjs','src/authorize.mjs','src/setup.mjs','scripts/build-assets.mjs'])files[path]=await readFile(new URL('../templates/'+path,import.meta.url),'utf8');
  // Exclusive directory creation owns the output boundary. Every file is exclusive too.
  await mkdir(target,{mode:0o700});created=target;
  for(const [path,body] of Object.entries(files)){await mkdir(dirname(join(target,path)),{recursive:true});await writeFile(join(target,path),body,{flag:'wx',mode:0o600});}
  process.stdout.write(`Created Cloudflare starter at ${target}\nSite: ${siteId} · Admin: ${basePath}\nImplement src/authorize.mjs, install dependencies, then run npm run check.\nThe packages are currently a local preview; see the generated README for tarball installation.\n`);
 }
}catch(error){
 const code=error?.code;
 const message=code==='EEXIST'?'Output path already exists; nothing there was replaced.':code==='ENOENT'?'The output parent must already exist.':code==='EACCES'||code==='EPERM'?'Cannot write the selected output location.':error instanceof Error?error.message:'Could not create the starter.';
 process.stderr.write(`notabenda-cf: ${message}\n${created?'A partial new project remains at '+created+'; inspect it before retrying.\n':''}`);process.exitCode=1;
}
