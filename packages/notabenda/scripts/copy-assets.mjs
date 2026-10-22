// @requirements REQ-PRODUCT-AGENT-HANDOFF
// @requirements REQ-PRODUCT-CARTRIDGES
import {build} from 'esbuild';
import {packCapabilityStyles} from '../dist/pack-capabilities-ui.js';
import {createConsentStyles} from './consent-styles.mjs';
import {createConfigSchema} from './config-schema.mjs';
import {createConfigShapeValidator} from './config-shape-validator.mjs';
import { copyFile, chmod, mkdir, readdir, readFile, writeFile, rm } from 'node:fs/promises';
const handoffStyles=await readFile(new URL('../src/agent-handoff.css',import.meta.url),'utf8');
await copyFile(new URL('../src/agent-handoff.css',import.meta.url),new URL('../dist/agent-handoff.css',import.meta.url));
await writeFile(new URL('../dist/styles.css',import.meta.url),await readFile(new URL('../src/styles.css',import.meta.url),'utf8')+'\n'+handoffStyles);
await copyFile(new URL('../src/services.css', import.meta.url), new URL('../dist/services.css', import.meta.url));
await copyFile(new URL('../src/orders.css', import.meta.url), new URL('../dist/orders.css', import.meta.url));
await copyFile(new URL('../src/guarantees.css', import.meta.url), new URL('../dist/guarantees.css', import.meta.url));
await writeFile(new URL('../dist/consent.css',import.meta.url),createConsentStyles(await readFile(new URL('../src/styles.css',import.meta.url),'utf8')));
await copyFile(new URL('../src/storage-exceptions.css', import.meta.url), new URL('../dist/storage-exceptions.css', import.meta.url));
// @requirements REQ-QC-PROFILING
await copyFile(new URL('../src/technology.css', import.meta.url), new URL('../dist/technology.css', import.meta.url));
await writeFile(new URL('../dist/cartridges.css',import.meta.url),await readFile(new URL('../src/cartridges.css',import.meta.url),'utf8')+'\n'+handoffStyles+'\n'+packCapabilityStyles);
await chmod(new URL('../dist/cli.js', import.meta.url), 0o755);
await mkdir(new URL('../dist/astro/',import.meta.url),{recursive:true});
for(const file of await readdir(new URL('../src/astro/',import.meta.url)))if(file.endsWith('.astro'))await copyFile(new URL('../src/astro/'+file,import.meta.url),new URL('../dist/astro/'+file,import.meta.url));

// @requirements REQ-PRODUCT-SERVICE-CATALOG
await mkdir(new URL('../dist/catalog/',import.meta.url),{recursive:true});
for(const [source,target] of [['schema.json','schema.json'],['NOTICE','NOTICE.txt'],['sources/open-cookie-database/LICENSE','open-cookie-database-LICENSE.txt']])await copyFile(new URL('../../../catalog/'+source,import.meta.url),new URL('../dist/catalog/'+target,import.meta.url));

// @requirements REQ-PRODUCT-AGENT-INTEGRATION
const configSchema=await createConfigSchema();
await writeFile(new URL('../dist/site-config.schema.json',import.meta.url),JSON.stringify(configSchema,null,2)+'\n');
await writeFile(new URL('../dist/site-config-validator.js',import.meta.url),createConfigShapeValidator(configSchema));
await copyFile(new URL('../src/site-config-validator.d.ts',import.meta.url),new URL('../dist/site-config-validator.d.ts',import.meta.url));
await mkdir(new URL('../dist/licenses/',import.meta.url),{recursive:true});
await copyFile(new URL('../../../node_modules/ajv/LICENSE',import.meta.url),new URL('../dist/licenses/ajv-LICENSE.txt',import.meta.url));
// One maintained skill, distributed with the installed package version.
await mkdir(new URL('../dist/skill/agents/',import.meta.url),{recursive:true});
await mkdir(new URL('../dist/skill/references/',import.meta.url),{recursive:true});
for(const path of ['SKILL.md','agents/openai.yaml','references/configuration-target.md'])await copyFile(new URL('../../../skills/notabenda/'+path,import.meta.url),new URL('../dist/skill/'+path,import.meta.url));

// @requirements REQ-PRODUCT-CONFIG-SOURCES
// Self-contained universal parser; no installed dependency or ordinary visitor import.
await build({entryPoints:[new URL('../src/config-yaml.ts',import.meta.url).pathname],outfile:new URL('../dist/config-yaml.js',import.meta.url).pathname,bundle:true,platform:'browser',format:'esm',target:'es2022',sourcemap:false,legalComments:'inline'});
await rm(new URL('../dist/config-yaml.js.map',import.meta.url),{force:true});
await copyFile(new URL('../../../node_modules/yaml/LICENSE',import.meta.url),new URL('../dist/licenses/yaml-LICENSE.txt',import.meta.url));

// @requirements REQ-PRODUCT-SERVICE-DETECTION
// Bundle the pinned parser only into the Node project scanner, with its original license.
await build({entryPoints:[new URL('../src/catalog-toml.ts',import.meta.url).pathname],outfile:new URL('../dist/catalog-toml.js',import.meta.url).pathname,bundle:true,platform:'node',format:'esm',target:'node22',sourcemap:false,legalComments:'inline'});
await rm(new URL('../dist/catalog-toml.js.map',import.meta.url),{force:true});
await copyFile(new URL('../../../node_modules/smol-toml/LICENSE',import.meta.url),new URL('../dist/licenses/smol-toml-LICENSE.txt',import.meta.url));

// @requirements REQ-PRODUCT-SERVICE-DETECTION
// Pinned XML parser is confined to the optional Node scanner; retain both upstream licenses.
await build({entryPoints:[new URL('../src/catalog-nuget.ts',import.meta.url).pathname],outfile:new URL('../dist/catalog-nuget.js',import.meta.url).pathname,bundle:true,platform:'node',format:'esm',target:'node22',sourcemap:false,legalComments:'inline'});
await rm(new URL('../dist/catalog-nuget.js.map',import.meta.url),{force:true});
await copyFile(new URL('../licenses/saxes-LICENSE.txt',import.meta.url),new URL('../dist/licenses/saxes-LICENSE.txt',import.meta.url));
await copyFile(new URL('../../../node_modules/xmlchars/LICENSE',import.meta.url),new URL('../dist/licenses/xmlchars-LICENSE.txt',import.meta.url));

// @requirements REQ-PRODUCT-COLLECTION-WORKBENCH
await copyFile(new URL('../src/collection-workbench.css',import.meta.url),new URL('../dist/collection-workbench.css',import.meta.url));
await build({entryPoints:[new URL('../dist/collection-workbench-app.js',import.meta.url).pathname],allowOverwrite:true,outfile:new URL('../dist/collection-workbench-app.js',import.meta.url).pathname,bundle:true,platform:'browser',format:'esm',target:'es2022',minify:true,sourcemap:false});
await rm(new URL('../dist/collection-workbench-app.js.map',import.meta.url),{force:true});

// @requirements REQ-PRODUCT-PROCESSING-WORKBENCH
await copyFile(new URL('../src/processing-workbench.css',import.meta.url),new URL('../dist/processing-workbench.css',import.meta.url));
await build({entryPoints:[new URL('../dist/processing-workbench-app.js',import.meta.url).pathname],allowOverwrite:true,outfile:new URL('../dist/processing-workbench-app.js',import.meta.url).pathname,bundle:true,platform:'browser',format:'esm',target:'es2022',minify:true,sourcemap:false});
