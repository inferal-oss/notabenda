#!/usr/bin/env node
import {runDiscoveryCli} from './discovery-cli.js';
/** @requirements REQ-PRODUCT-PACKAGE REQ-PRODUCT-DOCUMENTS REQ-PRODUCT-ARTIFACTS REQ-PRODUCT-RETAINED-RELEASES */
import {runSetupWizard} from './setup-cli.js';
import {createReadStream} from 'node:fs';
import {readCliJson} from './cli-json.js';
import {readSetupCatalogSelections} from './catalog-selection.js';
import {attachCatalogReview} from './catalog-release.js';
import {canonicalJson} from './content.js';
import { readFile, writeFile, mkdir, realpath } from 'node:fs/promises';
import { resolve, sep, dirname, basename } from 'node:path';
import { validateSiteConfig, SiteConfigError } from './config.js';
import { compileLegalDocuments,createRetainedReleaseFiles } from './content.js';
import { writeBuildFiles } from './files.js';
import { createStarterConfig } from './starter.js';
// @requirements REQ-PRODUCT-AGENT-INTEGRATION
import {describeIntegration,selectIntegration} from './integration-reference.js';

const canonicalOutput=async(path:string):Promise<string>=>{try{return await realpath(path);}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;const parent=dirname(path);if(parent===path)throw error;return resolve(await canonicalOutput(parent),basename(path));}};

const usage = `Usage: notabenda <init|wizard|check|build|discover|catalog|describe|assess|schema> [--config FILE] [--preview] [--json] [--out-dir DIRECTORY]

discover Review explicit browser captures against the declared inventory; no crawling.
wizard Ask about practices, coverage and justifications; write a draft and private report.
init   Write a draft notabenda.config.json without overwriting an existing file.
check  Validate configuration (production checks by default; --preview permits drafts).
build  Generate static legal pages, public configuration and a versioned artifact.
describe [TARGET ...] [--json]  Read-only integration map, facts, actual setup question IDs
and unknown-answer template. No project scan or config mutation. Omit targets to list all.
describe --selection FILE [--json]  Resolve explicit yes/no/unknown scope decisions
from selectionTemplate; reads only the named ordinary JSON file and package metadata.
Cannot combine --selection with target IDs. An empty selection selects nothing.
schema [PATH] [--json]  Installed SiteConfig authoring JSON Schema; optional dot path
selects a field. Arrays describe item fields, for example services.resourceOrigins.
Reads no project files. This shape does not replace cross-field validation with check.
assess --selection FILE --config FILE [--answers FILE] [--json]  Read-only reconciliation
of selected targets, explicit configuration and optional wizard practice answers.
Reports minimum missing config, relevant unknowns, validation and unverified host work.
Never writes a draft or enables features. Exit zero means a report was produced, not readiness.

All configuration is JSON; no module execution or network access is required.
--out-dir applies to build (default: legal-dist) or wizard (default: notabenda-setup).
Wizard: --answers FILE supplies versioned JSON for noninteractive use; --config FILE
imports an existing config. Output requires a new directory and never overwrites. --json applies to check, describe and assess.
Wizard --project DIRECTORY explicitly scans supported source/dependency identifiers and
offers actual-use review in interactive setup; --catalog FILE selects its reference catalog.
With --answers, findings are saved privately without adding services automatically.
--retain-artifact FILE applies to build and can be repeated. Supply trusted public
compiler artifacts to keep old pinned document URLs in a clean deployment.
Private MD/MDX source archives are not publication inputs. Preview remains explicit.
Build --catalog-report FILE --private-out-dir NEW_DIRECTORY attaches current selected
reference facts to the release and writes a separate private archive. Justifications
and questionnaire history stay in the report. Keep the private directory off your web host.
Discovery: --capture FILE (repeat up to 20) supplies explicit browser capture JSON.
--config FILE selects the inventory; --json prints the private review. Optional
--out-dir DIRECTORY writes a new private review directory and never overwrites.
Catalog: catalog search QUERY [--delivery backend] [--limit 20] [--json].
Catalog product: catalog show PRODUCT_ID [--catalog FILE] [--json].
Catalog re-review: catalog review --config FILE --report FILE --service ID --out-dir NEW
[--catalog FILE | --latest]. Interactive comparison and renewed private justification;
without a reference flag, the prior pinned reference is preserved.
Browser candidates: catalog detect --capture FILE [--rules FILE] [--out-dir NEW] [--json].
New catalog captures retain their exact rule snapshot. V1 captures support only origin/name hints.
Project discovery: discover --project DIRECTORY [--catalog FILE] [--json]
[--out-dir NEW_DIRECTORY] statically finds reviewable SDK/infrastructure candidates.
No project code, installers or network probes run.
Discovery --capture-origin ORIGIN explicitly binds staging/loopback observations;
the review preserves both that observed origin and the configured deployment.
`;

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (!args.length || args.includes('--help') || args.includes('-h')) { console.log(usage); return; }
  const command = args.shift();
  if(command==='schema'){await (await import('./schema-cli.js')).runSchemaCli(args);return;}
  if(command==='assess'){
    const options:Record<string,string>=Object.create(null);let json=false;const seen=new Set<string>();
    while(args.length){
      const flag=args.shift()!;if(seen.has(flag))throw Error('Duplicate assess option.');seen.add(flag);
      if(flag==='--json'){json=true;continue;}
      if(!['--selection','--config','--answers'].includes(flag))throw Error('assess accepts --selection FILE, --config FILE, optional --answers FILE and --json.');
      const value=args.shift();if(!value||value.startsWith('-'))throw Error('Assessment options require explicit JSON files.');options[flag]=value;
    }
    if(!options['--selection']||!options['--config'])throw Error('assess requires explicit --selection FILE and --config FILE.');
    const selection=await readCliJson(options['--selection'],65536,'Selection could not be read as bounded ordinary JSON.');
    const config=await readCliJson(options['--config'],1024*1024,'Config could not be read as bounded ordinary JSON.');
    const answers=options['--answers']?await readCliJson(options['--answers'],512*1024,'Answers could not be read as bounded ordinary JSON.'):undefined;
    const {assessIntegration}=await import('./integration-assessment.js');
    const assessment=assessIntegration({selection,config,...(answers===undefined?{}:{answers})});
    const {name,version}=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
    console.log(json?JSON.stringify({package:{name,version},...assessment},null,2):`${name} ${version} · private integration assessment\nStatus: ${assessment.status}; production readiness is not established.\nRequested: ${assessment.requestedTargetIds.join(', ')||'none'}\nMissing target configuration: ${assessment.missingRequiredConfig.map(f=>f.path).join(', ')||'none detected'}\nPractice answers needing attention: ${assessment.questions.filter(q=>q.status!=='recorded-unverified').map(q=>q.id).join(', ')||'none'}\nConflicts to reconcile: ${assessment.factConflicts.length} public facts, ${assessment.practiceConflicts.length} practice declarations.\nPreview valid: ${assessment.validation.preview.valid}; production config valid: ${assessment.validation.production.valid}.\nUse --json for diagnostics, config observations and host work to verify. No files changed.`);return;
  }
  if(command==='describe'){
    let json=false,selectionPath:string|undefined;const targetIds:string[]=[],seen=new Set<string>();
    while(args.length){
      const arg=args.shift()!;
      if(arg.startsWith('-')){
        if(seen.has(arg))throw Error('Duplicate describe option.');seen.add(arg);
        if(arg==='--json')json=true;
        else if(arg==='--selection'){
          const value=args.shift();if(!value||value.startsWith('-'))throw Error('describe --selection requires an explicit JSON file.');selectionPath=value;
        }else throw Error('describe accepts target IDs, --selection FILE and one optional --json.');
      }else targetIds.push(arg);
    }
    if(selectionPath&&targetIds.length)throw Error('describe --selection cannot be combined with target IDs.');
    const selection=selectionPath?selectIntegration(await readCliJson(selectionPath,65536,'Selection could not be read as bounded ordinary JSON.')):undefined;
    const reference=selection?.reference??describeIntegration(targetIds);
    const {name,version}=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
    console.log(json?JSON.stringify({package:{name,version},...(selection??reference)},null,2):`${name} ${version} · integration targets\n`+reference.targets.map((t:{id:string;outcome:string;selection:string})=>`[${t.selection}] ${t.id}: ${t.outcome}`).join('\n')+(reference.targets.some(t=>t.selection==='prerequisite')?'\nPrerequisites: check existing supporting configuration and documents before adding work; these are not additional requested features.\n':'')+(selection?`\nScope: ${selection.status}; unanswered: ${selection.unresolvedQuestionIds.join(', ')||'none'}.\n`:'')+'\nUse --json for config paths, host work, facts, setup questions and verification. Advisory only; nothing enabled or written.');return;
  }
  if(command==='catalog'){if(args[0]==='show'){args.shift();await (await import('./catalog-cli.js')).showCatalogProduct(args);return;}if(args[0]==='review'){args.shift();await (await import('./catalog-review-cli.js')).runCatalogReviewCli(args);return;}if(args[0]==='detect'){await (await import('./catalog-browser-cli.js')).runBrowserCatalogCli(args);return;}await (await import('./catalog-cli.js')).runCatalogCli(args,'search');return;}
  if(command==='discover'){await runDiscoveryCli(args);return;}
  if (!['init', 'wizard', 'check', 'build'].includes(command!)) throw new Error('Unknown command. Run notabenda --help.');
  let configPath = 'notabenda.config.json'; let outDir = 'legal-dist'; let preview = false; let json = false; let answersPath:string|undefined,projectDirectory:string|undefined,catalogPath:string|undefined,catalogReportPath:string|undefined,privateOutDir:string|undefined;
  const retainedPaths:string[]=[];
  const seen = new Set<string>();
  while (args.length) {
    const flag = args.shift()!;
    if (seen.has(flag)&&flag!=='--retain-artifact') throw new Error('Duplicate CLI option.');
    seen.add(flag);
    if (flag === '--preview') preview = true;
    else if (flag === '--json') json = true;
    else if (flag === '--config' || flag === '--out-dir' || flag === '--retain-artifact' || flag === '--answers' || flag === '--project' || flag === '--catalog' || flag === '--catalog-report' || flag === '--private-out-dir') {
      const value = args.shift();
      if (!value || value.startsWith('--')) throw new Error('CLI option requires a value.');
      if(flag==='--catalog-report')catalogReportPath=value;else if(flag==='--private-out-dir')privateOutDir=value;else if(flag==='--project')projectDirectory=value;else if(flag==='--catalog')catalogPath=value;else if(flag==='--answers')answersPath=value;else if (flag === '--config') configPath = value; else if(flag==='--retain-artifact'){retainedPaths.push(value);if(retainedPaths.length>256)throw new Error('Too many retained artifacts.');}else outDir = value;
    } else throw new Error('Unknown CLI option. Run notabenda --help.');
  }
  if((catalogReportPath||privateOutDir)&&(command!=='build'||!catalogReportPath||!privateOutDir))throw Error('Build requires --catalog-report and --private-out-dir together.');
  if(privateOutDir){
    const pub=await canonicalOutput(resolve(outDir)),priv=resolve(await realpath(dirname(resolve(privateOutDir))),basename(privateOutDir));if(pub===priv||priv.startsWith(pub+sep)||pub.startsWith(priv+sep))throw Error('Public output and private archive directories must be separate, non-nested paths.');}
  if (seen.has('--out-dir') && !['build','wizard'].includes(command!)) throw new Error('--out-dir is only valid for build or wizard.');
  if (seen.has('--retain-artifact') && command !== 'build') throw new Error('--retain-artifact is only valid for build.');
  if (json && command !== 'check') throw new Error('--json is only valid for check.');
  if (preview && command === 'init') throw new Error('init always creates a draft; --preview applies to check/build.');
  if(answersPath&&command!=='wizard')throw new Error('--answers is only valid for wizard.');
  if((projectDirectory||catalogPath)&&command!=='wizard')throw new Error('--project and --catalog apply only to wizard or the separate discover/catalog commands.');
  if(catalogPath&&!projectDirectory)throw new Error('Wizard --catalog requires --project DIRECTORY.');
  if(command==='wizard'){if(preview||json||retainedPaths.length)throw new Error('wizard creates drafts; check/build options do not apply.');await runSetupWizard({outDir:seen.has('--out-dir')?outDir:'notabenda-setup',...(seen.has('--config')?{configPath}:{}),...(answersPath?{answersPath}:{}),...(projectDirectory?{projectDirectory}:{}),...(catalogPath?{catalogPath}:{})});return;}
  if (command === 'init') {
    await writeFile(resolve(configPath), JSON.stringify(createStarterConfig(), null, 2) + '\n', { flag: 'wx' });
    console.log('Created draft site configuration. Replace sample facts and supply appropriate reviewed content before production use.');
    return;
  }
  const input: unknown = JSON.parse(await readFile(resolve(configPath), 'utf8'));
  const mode = preview ? 'preview' : 'production';
  const result = validateSiteConfig(input, { mode });
  if (command === 'check') {
    if (json) console.log(JSON.stringify(result, null, 2));
    else if (result.valid) console.log(`Configuration valid for ${mode}. This checks structure and review declarations, not legal compliance.`);
    else for (const d of result.diagnostics) console.error(`${d.path}: ${d.message} [${d.requirementIds.join(', ')}]`);
    if (!result.valid) process.exitCode = 1;
    return;
  }
  if (!result.valid) throw new SiteConfigError(result.diagnostics);
  let build = compileLegalDocuments(input, { mode });
  let archive:import('./content.js').LegalSourceArchive|undefined;
  if(catalogReportPath){
    const report=await readCliJson(catalogReportPath,512*1024,'Catalog report could not be read as bounded ordinary JSON.');
    if(!report||typeof report!=='object'||Array.isArray(report)||(report as Record<string,unknown>).kind!=='private-setup-report')throw Error('Supply an explicit private setup report with current catalog selections.');
    const finalized=attachCatalogReview(build,readSetupCatalogSelections(report));build=finalized;archive=finalized.archive;
  }
  const retained:unknown[]=[];
  for(const path of retainedPaths){
    // Stream explicit inputs with a hard bound, rather than discovering files in a workspace.
    const chunks:Buffer[]=[];let bytes=0;
    try{for await(const chunk of createReadStream(resolve(path))){bytes+=chunk.length;if(bytes>128*1024)throw new Error();chunks.push(chunk as Buffer);}retained.push(JSON.parse(Buffer.concat(chunks).toString('utf8')));}
    catch{throw new Error('A retained public artifact could not be read as bounded JSON.');}
  }
  const pinned=retained.length?createRetainedReleaseFiles(retained,{siteId:build.publicConfig.site.id,mode}):{};
  for(const [path,contents] of Object.entries(pinned))if(Object.hasOwn(build.files,path)&&build.files[path]!==contents)throw new Error('A retained artifact conflicts with the current release.');
  const css = await readFile(new URL('./styles.css', import.meta.url), 'utf8');
  if(archive&&privateOutDir){
    // Exclusive private output is never added to public build.files. No existing directory is reused.
    const root=resolve(privateOutDir);await mkdir(root,{mode:0o700});
    // Recheck physical paths after creation: unresolved names may alias on case-insensitive volumes.
    const actualPrivate=await realpath(root),actualPublic=await canonicalOutput(resolve(outDir));
    if(actualPrivate===actualPublic||actualPrivate.startsWith(actualPublic+sep)||actualPublic.startsWith(actualPrivate+sep))throw Error('Public output and private archive directories resolve to overlapping paths. No private archive was written.');
    await writeFile(resolve(root,'release.private.json'),canonicalJson(archive)+'\n',{flag:'wx',mode:0o600});
    await writeFile(resolve(root,'.gitignore'),'*\n',{flag:'wx',mode:0o600});
  }
  await writeBuildFiles(resolve(outDir), { ...build.files,...pinned, 'assets/notabenda.css': css });
  console.log(`Built ${build.manifest.documents.length} ${mode} documents in ${outDir}. Artifact: ${build.manifest.artifactId}`);
}

main().catch(error => {
  if (error instanceof SiteConfigError) for (const d of error.diagnostics) console.error(`${d.path}: ${d.message} [${d.requirementIds.join(', ')}]`);
  else console.error(error instanceof SyntaxError ? 'Configuration is not valid JSON.' : (error as NodeJS.ErrnoException).code === 'EEXIST' ? 'Output already exists; no existing file or directory will be overwritten.' : (error as Error).message);
  process.exitCode = 1;
});
