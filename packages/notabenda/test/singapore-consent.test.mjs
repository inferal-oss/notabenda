// @requirements REQ-SG-CONSENT-CONDITIONS REQ-SG-CONSENT-ROUTES REQ-SG-WITHDRAWAL REQ-SG-ACCOUNTABILITY
import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {createConsent,renderCollectionNotice} from '@notabenda/core';
import {compileConsentRuntimeConfig,compileLegalDocuments,createCollectionNotice} from '@notabenda/core/content';
import {createConsentRuntime} from '@notabenda/core/consent';
import {createSetupPlan} from '@notabenda/core/setup';
import {describeIntegration} from '@notabenda/core/integration';
import {fixture} from './helpers.mjs';
async function inventory(){
 const c=await fixture({reviewed:true});c.jurisdictions=['SG'];c.storage=[];c.purposes=c.purposes.slice(0,1);
 c.services=[{id:'optional-service',name:'Sample service',provider:'Sample provider',purposeIds:[c.purposes[0].id],location:'This test',processingActivities:[]}];
 c.consent={purposes:[{id:c.purposes[0].id,scope:'one'}],services:[{id:'optional-service',scope:'one'}],grantLifetimeDays:30,refusalLifetimeDays:180,dismissalMinutes:30};
 c.controller.dpo={name:'Example privacy office',email:'privacy-office@example.test'};
 c.privacy.complaints={description:'Contact the privacy office to make a complaint.',url:'mailto:privacy-office@example.test'};
 c.private={reason:'PRIVATE-SINGAPORE-ASSESSMENT'};
 return c;
}
const profiles=[['compatibility',c=>c],['compiled',c=>compileConsentRuntimeConfig(c,{evidence:'local'})]];
const create=(profile,c,env)=>profile==='compatibility'?createConsent(c,env):createConsentRuntime(c,env);
const environment=()=>{let fail=false;const values=new Map();return {values,fail(){fail=true;},env:{storage:{getItem:k=>values.get(k)??null,setItem(k,v){if(fail)throw Error('quota');values.set(k,v);},removeItem:k=>values.delete(k)},schedule:()=>()=>{}}};};

test('statutory route guidance stays advisory and cannot become a generated runtime mode or legal basis',async()=>{
 const review=describeIntegration(['cookie-consent']).cookieJurisdictionReviews.items[0];
 assert.deepEqual(review.consentRoutes.map(r=>r.id),['consent','deemed-consent','without-consent']);
 assert.ok(review.consentRoutes.every(r=>r.createsGrant===false));
 assert.match(review.consentRoutes.find(r=>r.id==='deemed-consent').hostReview,/assessment, notice, opt-out and prescribed requirements/);
 const c=await inventory();const answers={schemaVersion:1,markets:['SG'],answers:{'optional-storage':{choice:'no',justification:'Deemed consent or a schedule exception, according to an unverified private note.'}}};
 const before=structuredClone(c),plan=createSetupPlan(answers,{config:c,preserveConfig:true});
 assert.deepEqual(c,before);assert.deepEqual(plan.config.consent,c.consent);assert.deepEqual(plan.config.purposes,c.purposes);
 assert.equal(plan.config.storageExceptions,undefined);assert.doesNotMatch(JSON.stringify(plan.config),/PRIVATE-SINGAPORE|unverified private note|deemed-consent/);
 const controller=createConsent(plan.config,environment().env);
 try{assert.equal(controller.isAllowed(c.purposes[0].id),false);controller.dismiss();assert.equal(controller.isAllowed(c.purposes[0].id),false);}finally{controller.destroy();}
});

test('a static collection disclosure renders declared purpose, public responsible contact and complaint route without granting permission',async()=>{
 const c=await inventory(),f=environment(),controller=createConsent(c,f.env),build=compileLegalDocuments(c);
 const notice=createCollectionNotice(build.artifact,{scopeId:'message',purposeIds:[c.purposes[0].id],reviewStatus:'reviewed',wording:{title:'About your message',intro:'Read how the information in your message is used.'}});
 const dom=new JSDOM('<form>'+renderCollectionNotice(notice,{idPrefix:'message-privacy'})+'<input aria-label="Your message"></form>');
 try{
  const d=dom.window.document,text=d.querySelector('form').textContent;
  assert.ok(text.includes(c.purposes[0].description));assert.ok(text.includes(c.controller.dpo.name));assert.ok(text.includes(c.privacy.complaints.description));
  assert.ok([...d.querySelectorAll('a')].some(a=>a.getAttribute('href')==='mailto:privacy-office@example.test'));
  assert.ok([...d.querySelectorAll('a')].some(a=>a.getAttribute('href')===notice.document.url));
  assert.equal(d.querySelectorAll('button,input[type=checkbox]').length,0);assert.doesNotMatch(d.body.innerHTML,/PRIVATE-SINGAPORE-ASSESSMENT/);
  assert.equal(controller.isAllowed(c.purposes[0].id),false);assert.equal(f.values.size,0);
 }finally{controller.destroy();dom.window.close();}
});

for(const [profile,input] of profiles){
 test(profile+': changing an actual declared purpose requires a fresh choice, rather than reusing an earlier grant',async()=>{
  const c=await inventory(),f=environment(),first=create(profile,input(c),f.env),id=c.purposes[0].id;
  first.acceptAll();assert.equal(first.isAllowed(id),true);first.destroy();
  c.purposes[0].description='A new use not covered by the previous purpose description.';
  const next=create(profile,input(c),f.env);
  try{assert.equal(next.isAllowed(id),false);assert.equal(next.getSnapshot().purposes[id],'unknown');assert.equal(next.getSnapshot().shouldPrompt,true);}finally{next.destroy();}
 });
 test(profile+': withdrawal stops registered work even when saving fails, and removes the stale grant when deletion remains available',async()=>{
  const c=await inventory(),f=environment(),controller=create(profile,input(c),f.env),id=c.purposes[0].id;let signal,starts=0,stops=0;
  controller.registerService('optional-service',{purposes:[id],start(ctx){signal=ctx.signal;starts++;return ()=>{stops++;};}});
  try{
   controller.acceptAll();await controller.settled();assert.equal(starts,1);f.fail();
   assert.equal(controller.rejectAll().persisted,false);assert.equal(signal.aborted,true);assert.equal(controller.isAllowed(id),false);
   await controller.settled();assert.equal(stops,1);controller.refresh();assert.equal(controller.isAllowed(id),false);
   assert.equal(f.values.has('notabenda:choices:v1:'+c.site.id),false);
   const reload=create(profile,input(c),f.env);try{assert.equal(reload.isAllowed(id),false);}finally{reload.destroy();}
  }finally{controller.destroy();await controller.settled();}
 });
}
