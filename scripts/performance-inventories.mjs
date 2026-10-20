// @requirements REQ-PRODUCT-BUNDLE-BUDGET
import {readFile} from 'node:fs/promises';
import {compileConsentRuntimeConfig} from '@notabenda/core/content';
export async function performanceInventories(){
 const fixture=JSON.parse(await readFile(new URL('../examples/static/notabenda.config.json',import.meta.url),'utf8'));
 return [2,12,40].map(count=>{
  const config=structuredClone(fixture);delete config.private;config.storage=[];
  config.site.id='performance-'+count;
  config.scopeGuards={version:1,revision:'synthetic-1',site:{children:'absent',sensitiveData:'absent',highRiskProfiling:'absent',regulatedSector:'absent'}};
  config.purposes=Array.from({length:count},(_,i)=>({id:'p'+i,name:'Purpose '+i,description:'Synthetic measurement purpose.',legalBasis:'Synthetic test declaration',dataCategories:['Usage'],retention:'Synthetic session',collection:{source:'direct',description:'Synthetic only',required:false,consequences:'No optional feature'}}));
  config.services=Array.from({length:count*2},(_,i)=>({id:'s'+i,name:'Service '+i,provider:'Synthetic provider',location:'This test',purposeIds:['p'+Math.floor(i/2)],processingActivities:i%2?[]:['sale','sharing','targeted-advertising']}));
  config.consent={purposes:config.purposes.map(p=>({id:p.id,scope:'1'})),services:config.services.map(s=>({id:s.id,scope:'1'})),grantLifetimeDays:1,refusalLifetimeDays:30,dismissalMinutes:10};
  config.privacySignals={globalPrivacyControl:{appliesTo:['sale','sharing','targeted-advertising'],explanation:'Synthetic benchmark policy only.'}};
  const compiled=compileConsentRuntimeConfig(config,{mode:'preview',evidence:'local'});
  return {id:count+'-purposes',purposes:count,services:count*2,config,compiled};
 });
}
