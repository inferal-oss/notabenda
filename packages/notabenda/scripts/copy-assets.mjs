// @requirements REQ-PRODUCT-AGENT-HANDOFF
// @requirements REQ-PRODUCT-CARTRIDGES
import {createConsentStyles} from './consent-styles.mjs';
import {createConfigSchema} from './config-schema.mjs';
import {createConfigShapeValidator} from './config-shape-validator.mjs';
import { copyFile, chmod, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
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
await writeFile(new URL('../dist/cartridges.css',import.meta.url),await readFile(new URL('../src/cartridges.css',import.meta.url),'utf8')+'\n'+handoffStyles);
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
