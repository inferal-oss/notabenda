// @requirements REQ-EU-ORDER-ACTION
// @requirements REQ-PRODUCT-FORM-PERMISSIONS REQ-PRODUCT-COLLECTION-NOTICE
// @requirements REQ-PRODUCT-REACT REQ-PRODUCT-PACKAGE
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

test('packed React subpaths install only with explicitly supplied peers and expose server-safe components and strict consumer types',async()=>{
  const cwd=await mkdtemp(join(tmpdir(),'notabenda-react-package-'));const root=fileURLToPath(new URL('../../..',import.meta.url));
  const env={...process.env,...(existsSync(join(root,'.local/npm-cache'))?{npm_config_cache:join(root,'.local/npm-cache')}:{})};
  try {
    const packed=spawnSync('npm',['pack','--workspace','@notabenda/core','--json','--ignore-scripts','--pack-destination',cwd],{cwd:root,encoding:'utf8',env});assert.equal(packed.status,0,packed.stderr);
    const manifest=JSON.parse(packed.stdout)[0];for(const path of ['dist/react.js','dist/react.d.ts','dist/react-consent.js','dist/react-consent.d.ts','dist/react-consent-bindings.js','dist/react-documents.js','dist/react-documents.d.ts','dist/react-form-permission.js','dist/react-form-permission.d.ts'])assert.ok(manifest.files.some(f=>f.path===path),path);
    await writeFile(join(cwd,'package.json'),'{"type":"module","private":true}');
    const installed=spawnSync('npm',['install','--offline','--ignore-scripts','--no-audit','--no-fund',join(cwd,manifest.filename),'react@19.3.1','react-dom@19.3.1','@types/react@19.3.0','@types/react-dom@19.3.0'],{cwd,encoding:'utf8',env});assert.equal(installed.status,0,installed.stderr);
    const run=spawnSync(process.execPath,['--input-type=module','-e',"import {ConsentProvider,useConsentSnapshot,FormPermissionProvider,FormPermissionField,useFormPermissionSnapshot} from '@notabenda/core/react';import {LegalDocument,PaidOrderReview} from '@notabenda/core/react/documents';import {ConsentProvider as RuntimeProvider,useConsentController as runtimeController} from '@notabenda/core/react/consent';if([RuntimeProvider,runtimeController,ConsentProvider,useConsentSnapshot,LegalDocument,PaidOrderReview,FormPermissionProvider,FormPermissionField,useFormPermissionSnapshot].some(v=>typeof v!=='function'))process.exit(1);"],{cwd,encoding:'utf8'});assert.equal(run.status,0,run.stderr);
    await writeFile(join(cwd,'consumer.ts'),"import {createElement} from 'react';import {createConsent,type PublicSiteConfig} from '@notabenda/core';import {ConsentProvider,ConsentControls,PreferencesButton,useConsentSnapshot,usePurposeAllowed,useServiceAllowed,type ReactConsentSnapshot} from '@notabenda/core/react';import {LegalDocument,LegalLinks} from '@notabenda/core/react/documents';declare const config:PublicSiteConfig;const controller=createConsent(config);createElement(ConsentProvider,{controller},createElement(ConsentControls));createElement(PreferencesButton,{className:'choice'},'Review');createElement(LegalDocument,{config,kind:'privacy'});createElement(LegalLinks,{config});function Probe(){const state:ReactConsentSnapshot=useConsentSnapshot();const allowed:boolean=usePurposeAllowed('optional');const service:boolean=useServiceAllowed('optional-service');void service;\n// @ts-expect-error snapshots are read-only\nstate.permissions.optional=true;return allowed?state.purposes.optional:null;}void Probe;");
    await writeFile(join(cwd,'consumer.ts'),await readFile(join(cwd,'consumer.ts'),'utf8')+"\nimport {CollectionNotice} from '@notabenda/core/react/documents';createElement(CollectionNotice,{notice:{},idPrefix:'contact',headingLevel:3});\n");
    await writeFile(join(cwd,'consumer.ts'),await readFile(join(cwd,'consumer.ts'),'utf8')+`
import {type FormPermissionController} from '@notabenda/core';
import {FormPermissionProvider,FormPermissionField,useFormPermissionController,useFormPermissionSnapshot,useFormPermissionAllowed,type ReactFormPermissionSnapshot} from '@notabenda/core/react';
declare const permission:FormPermissionController;
createElement(FormPermissionProvider,{controller:permission},createElement(FormPermissionField,{className:'field',fallback:'Contact us for help.'}));
function PermissionProbe(){const state:ReactFormPermissionSnapshot=useFormPermissionSnapshot();const allowed:boolean=useFormPermissionAllowed();const same:FormPermissionController=useFormPermissionController();
// @ts-expect-error nested permission snapshots are read-only
if(state.current)state.current.permitted=true;
// @ts-expect-error nested receipts are read-only
if(state.current?.event)state.current.event.revision=123;
return allowed?state.status:same.getSnapshot().status;}void PermissionProbe;
`);
    await writeFile(join(cwd,'consumer.ts'),await readFile(join(cwd,'consumer.ts'),'utf8')+`
import {useConsentController as useLegacyConsentController} from '@notabenda/core/react';
import {createConsentRuntime,type ConsentRuntimeInventory} from '@notabenda/core/consent';
import {compileConsentRuntimeConfig} from '@notabenda/core/content';
import {ConsentProvider as CompiledProvider,ConsentControls as CompiledControls,useConsentController as useCompiledConsentController,useConsentSnapshot as useCompiledConsentSnapshot} from '@notabenda/core/react/consent';
const compiledController=createConsentRuntime(compileConsentRuntimeConfig(config,{evidence:'local'}));
createElement(CompiledProvider,{controller:compiledController},createElement(CompiledControls));
createElement(CompiledProvider,{controller});
// @ts-expect-error compatibility provider keeps its full-config hook contract
createElement(ConsentProvider,{controller:compiledController});
function CompiledProbe(){const inventory:ConsentRuntimeInventory=useCompiledConsentController().getConfig();
// @ts-expect-error compiled getters do not invent operator contacts
inventory.controller.email;
const snapshot=useCompiledConsentSnapshot();
// @ts-expect-error nested prompt source references are immutable
snapshot.promptDecision?.sourceIds.push('other');
// @ts-expect-error nested prompt decisions are immutable
if(snapshot.promptDecision)snapshot.promptDecision.allowsPrompt=true;
return inventory.site.id;}
function CompatibilityProbe(){const full:PublicSiteConfig=useLegacyConsentController().getConfig();return full.controller.email;}
void [CompiledProbe,CompatibilityProbe];
`);
    await writeFile(join(cwd,'consumer.ts'),await readFile(join(cwd,'consumer.ts'),'utf8')+`\nimport {PaidOrderReview} from '@notabenda/core/react/documents';createElement(PaidOrderReview,{review:{},idPrefix:'checkout',headingLevel:2});`);
    const types=spawnSync(process.execPath,[resolve(root,'node_modules/typescript/bin/tsc'),'--strict','--noEmit','--module','nodenext','--moduleResolution','nodenext','--target','es2022',join(cwd,'consumer.ts')],{cwd,encoding:'utf8'});assert.equal(types.status,0,types.stdout+types.stderr);
  }finally{await rm(cwd,{recursive:true,force:true});}
});
