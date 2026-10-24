// @requirements REQ-PRODUCT-RELEASE-CANDIDATE
import {readFile} from 'node:fs/promises';

// These libraries contribute code to the example browser output. Build tools
// that only run locally are not copied into the public distribution.
const libraries=[
 ['yaml','ISC','Configuration import and export'],
 ['ajv','MIT','Generated configuration validator'],
 ['react','MIT','React examples'],
 ['react-dom','MIT','React examples'],
 ['scheduler','MIT','React rendering scheduler'],
 ['astro','MIT','Astro navigation client'],
];
export async function exampleLicenseFiles(){
 const files={},lines=['Notabenda example distribution - third-party notices','',
  'Notabenda code: Apache-2.0 OR MIT, at your option.',
  'Full texts: /assets/licenses/notabenda-LICENSE.txt,',
  '/assets/licenses/notabenda-LICENSE-APACHE.txt and /assets/licenses/notabenda-LICENSE-MIT.txt.','',
  'The following libraries retain their own licenses:',''];
 for(const [name,license,use] of libraries){
  const base=new URL('../../node_modules/'+name+'/',import.meta.url),metadata=JSON.parse(await readFile(new URL('package.json',base),'utf8'));
  files['assets/licenses/'+name+'-LICENSE.txt']=await readFile(new URL('LICENSE',base),'utf8');
  lines.push(`${name} ${metadata.version} - ${license}. ${use}.`,`Full text: /assets/licenses/${name}-LICENSE.txt`,'');
 }
 for(const name of ['LICENSE','LICENSE-APACHE','LICENSE-MIT'])files['assets/licenses/notabenda-'+name+'.txt']=await readFile(new URL('../../'+name,import.meta.url),'utf8');
 lines.push('Imported service reference data: Open Cookie Database contributors, Apache-2.0.',
  'Attribution, changes and full license: /assets/catalog/NOTICE.txt and',
  '/assets/catalog/open-cookie-database-LICENSE.txt.','',
  'Official EU guarantee artwork and the California opt-out icon retain their',
  'source/use conditions and accompanying asset notices. They are not relicensed',
  'under the Notabenda code license. Keep those notices with redistributed assets.','');
 files['assets/THIRD-PARTY-NOTICES.txt']=lines.join('\n');
 return files;
}
