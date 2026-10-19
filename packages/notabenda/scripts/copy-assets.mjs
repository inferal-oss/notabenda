import {createConsentStyles} from './consent-styles.mjs';
import { copyFile, chmod, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
await copyFile(new URL('../src/styles.css', import.meta.url), new URL('../dist/styles.css', import.meta.url));
await copyFile(new URL('../src/services.css', import.meta.url), new URL('../dist/services.css', import.meta.url));
await copyFile(new URL('../src/orders.css', import.meta.url), new URL('../dist/orders.css', import.meta.url));
await copyFile(new URL('../src/guarantees.css', import.meta.url), new URL('../dist/guarantees.css', import.meta.url));
await writeFile(new URL('../dist/consent.css',import.meta.url),createConsentStyles(await readFile(new URL('../src/styles.css',import.meta.url),'utf8')));
await copyFile(new URL('../src/storage-exceptions.css', import.meta.url), new URL('../dist/storage-exceptions.css', import.meta.url));
await chmod(new URL('../dist/cli.js', import.meta.url), 0o755);
await mkdir(new URL('../dist/astro/',import.meta.url),{recursive:true});
for(const file of await readdir(new URL('../src/astro/',import.meta.url)))if(file.endsWith('.astro'))await copyFile(new URL('../src/astro/'+file,import.meta.url),new URL('../dist/astro/'+file,import.meta.url));

// @requirements REQ-PRODUCT-SERVICE-CATALOG
await mkdir(new URL('../dist/catalog/',import.meta.url),{recursive:true});
for(const [source,target] of [['schema.json','schema.json'],['NOTICE','NOTICE.txt'],['sources/open-cookie-database/LICENSE','open-cookie-database-LICENSE.txt']])await copyFile(new URL('../../../catalog/'+source,import.meta.url),new URL('../dist/catalog/'+target,import.meta.url));
