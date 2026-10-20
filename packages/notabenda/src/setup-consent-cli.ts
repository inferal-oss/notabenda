// @requirements REQ-PRODUCT-CONSENT-AUTHORING
import {toPublicConfig} from './config.js';
import {createStarterConfig} from './starter.js';
import {createConsentDraftPlan} from './setup-consent.js';
import type {SiteConfig} from './types.js';

export async function reviewSetupConsent(base:SiteConfig|undefined,ask:(prompt:string,max?:number)=>Promise<string>):Promise<SiteConfig|undefined> {
 if((await ask('Configure cookie control enrollment and memory periods? yes / no [no]: ',16)).toLowerCase()!=='yes')return base;
 const snapshot=toPublicConfig(base??createStarterConfig(),{mode:'preview'}),prior=snapshot.consent;
 if(!snapshot.services.length){console.log('Add actual services and their processing purposes before configuring cookie controls. No sample service was added.');return base;}
 console.log('Consent settings are a local draft. No defaults, legal basis, regional policy or scope relaxation will be chosen. Selecting a service includes all of its purposes.');
 console.log(snapshot.services.map(s=>s.id+' — '+s.name+'; purposes: '+s.purposeIds.join(', ')).join('\n'));
 try{
  const answer=await ask('Service IDs (comma separated; blank keeps existing; cancel leaves unchanged): ',4000);if(answer.toLowerCase()==='cancel')return base;
  const ids=answer?answer.split(',').map(s=>s.trim()).filter(Boolean):prior?.services.map(s=>s.id)??[];
  if(!ids.length||ids.length>80||new Set(ids).size!==ids.length||ids.some(id=>!snapshot.services.some(s=>s.id===id)))throw Error('Choose one to eighty unique declared service IDs.');
  const services=[];for(const id of ids)services.push({id,scope:(await ask('Material service version for '+id+' (blank keeps existing): ',200))||prior?.services.find(s=>s.id===id)?.scope||''});
  const needed=new Set(ids.flatMap(id=>snapshot.services.find(s=>s.id===id)!.purposeIds));
  console.log('All included purposes: '+[...needed].join(', ')+'. Review shared and multiple-purpose effects before confirming.');
  const purposes=[];for(const p of snapshot.purposes.filter(p=>needed.has(p.id)))purposes.push({id:p.id,scope:(await ask('Material purpose version for '+p.id+' (blank keeps existing): ',200))||prior?.purposes.find(item=>item.id===p.id)?.scope||''});
  const number=async(label:string,key:'grantLifetimeDays'|'refusalLifetimeDays'|'dismissalMinutes')=>{const text=(await ask(label+' (blank keeps existing; no default for new settings): ',16))||(prior===undefined?'':String(prior[key]));return text?Number(text):NaN;};
  const settings={services,purposes,grantLifetimeDays:await number('Remember grants, in days (1–730)','grantLifetimeDays'),refusalLifetimeDays:await number('Remember refusals, in days (1–730)','refusalLifetimeDays'),dismissalMinutes:await number('Pause after dismissal, in minutes (0–43200)','dismissalMinutes')};
  const plan=createConsentDraftPlan(base??snapshot,{baseline:snapshot,settings});
  console.log('Proposed control settings:\n'+JSON.stringify(settings,null,2));
  if(plan.blockedPurposeIds.length)console.log('Scope declarations still block these purposes: '+plan.blockedPurposeIds.join(', '));
  if((await ask('Save these settings in the local draft? yes / no [no]: ',16)).toLowerCase()!=='yes')return base;
  const confirmed=createConsentDraftPlan(base??snapshot,{baseline:snapshot,settings});console.log(confirmed.reviewItems.join('\n'));return confirmed.config;
 }catch(e){console.log((e instanceof Error?e.message:'Check the explicit control settings.')+' No control settings were changed.');return base;}
}
