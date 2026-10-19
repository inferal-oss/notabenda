#!/usr/bin/env node
import {runDiscoveryCli} from './discovery-cli.js';
/** @requirements REQ-PRODUCT-PACKAGE REQ-PRODUCT-DOCUMENTS REQ-PRODUCT-ARTIFACTS REQ-PRODUCT-RETAINED-RELEASES */
import {runSetupWizard} from './setup-cli.js';
import {createReadStream} from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { validateSiteConfig, SiteConfigError } from './config.js';
import { compileLegalDocuments,createRetainedReleaseFiles } from './content.js';
import { writeBuildFiles } from './files.js';
import { createStarterConfig } from './starter.js';

const usage = `Usage: notabenda <init|wizard|check|build|discover|catalog> [--config FILE] [--preview] [--json] [--out-dir DIRECTORY]

discover Review explicit browser captures against the declared inventory; no crawling.
wizard Ask about practices, coverage and justifications; write a draft and private report.
init   Write a draft notabenda.config.json without overwriting an existing file.
check  Validate configuration (production checks by default; --preview permits drafts).
build  Generate static legal pages, public configuration and a versioned artifact.

All configuration is JSON; no module execution or network access is required.
--out-dir applies to build (default: legal-dist) or wizard (default: notabenda-setup).
Wizard: --answers FILE supplies versioned JSON for noninteractive use; --config FILE
imports an existing config. Output requires a new directory and never overwrites. --json applies to check.
--retain-artifact FILE applies to build and can be repeated. Supply trusted public
compiler artifacts to keep old pinned document URLs in a clean deployment.
Private MD/MDX source archives are not publication inputs. Preview remains explicit.
Discovery: --capture FILE (repeat up to 20) supplies explicit browser capture JSON.
--config FILE selects the inventory; --json prints the private review. Optional
--out-dir DIRECTORY writes a new private review directory and never overwrites.
Catalog: catalog search QUERY [--delivery backend] [--limit 20] [--json].
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
  if(command==='catalog'){await (await import('./catalog-cli.js')).runCatalogCli(args,'search');return;}
  if(command==='discover'){await runDiscoveryCli(args);return;}
  if (!['init', 'wizard', 'check', 'build'].includes(command!)) throw new Error('Unknown command. Run notabenda --help.');
  let configPath = 'notabenda.config.json'; let outDir = 'legal-dist'; let preview = false; let json = false; let answersPath:string|undefined;
  const retainedPaths:string[]=[];
  const seen = new Set<string>();
  while (args.length) {
    const flag = args.shift()!;
    if (seen.has(flag)&&flag!=='--retain-artifact') throw new Error('Duplicate CLI option.');
    seen.add(flag);
    if (flag === '--preview') preview = true;
    else if (flag === '--json') json = true;
    else if (flag === '--config' || flag === '--out-dir' || flag === '--retain-artifact' || flag === '--answers') {
      const value = args.shift();
      if (!value || value.startsWith('--')) throw new Error('CLI option requires a value.');
      if(flag==='--answers')answersPath=value;else if (flag === '--config') configPath = value; else if(flag==='--retain-artifact'){retainedPaths.push(value);if(retainedPaths.length>256)throw new Error('Too many retained artifacts.');}else outDir = value;
    } else throw new Error('Unknown CLI option. Run notabenda --help.');
  }
  if (seen.has('--out-dir') && !['build','wizard'].includes(command!)) throw new Error('--out-dir is only valid for build or wizard.');
  if (seen.has('--retain-artifact') && command !== 'build') throw new Error('--retain-artifact is only valid for build.');
  if (json && command !== 'check') throw new Error('--json is only valid for check.');
  if (preview && command === 'init') throw new Error('init always creates a draft; --preview applies to check/build.');
  if(answersPath&&command!=='wizard')throw new Error('--answers is only valid for wizard.');
  if(command==='wizard'){if(preview||json||retainedPaths.length)throw new Error('wizard creates drafts; check/build options do not apply.');await runSetupWizard({outDir:seen.has('--out-dir')?outDir:'notabenda-setup',...(seen.has('--config')?{configPath}:{}),...(answersPath?{answersPath}:{})});return;}
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
  const build = compileLegalDocuments(input, { mode });
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
  await writeBuildFiles(resolve(outDir), { ...build.files,...pinned, 'assets/notabenda.css': css });
  console.log(`Built ${build.manifest.documents.length} ${mode} documents in ${outDir}. Artifact: ${build.manifest.artifactId}`);
}

main().catch(error => {
  if (error instanceof SiteConfigError) for (const d of error.diagnostics) console.error(`${d.path}: ${d.message} [${d.requirementIds.join(', ')}]`);
  else console.error(error instanceof SyntaxError ? 'Configuration is not valid JSON.' : (error as NodeJS.ErrnoException).code === 'EEXIST' ? 'Output already exists; no existing file or directory will be overwritten.' : (error as Error).message);
  process.exitCode = 1;
});
