import {createCompatibilityConsent as createConsent} from '@notabenda/core/consent/compat';
// @requirements REQ-PRODUCT-SCOPE-GUARDS
// @requirements REQ-PRODUCT-CONFIG REQ-US-COPPA-SCOPE REQ-CH-PROFILING REQ-CA-OBA REQ-US-VA-RIGHTS REQ-AU-PIXELS
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {mountControls,ScopeGuardError,evaluateScopeGuards,toPublicConfig,validateSiteConfig,createTermsAcceptance} from '@notabenda/core';
import {compileLegalDocuments,createConsentNotice,createTermsOffer,createCollectionNotice,canonicalJson,sha256} from '@notabenda/core/content';
import {createSetupPlan,readSetupAnswers} from '@notabenda/core/setup';
import {createConsentEvidenceStore,createAdminWorker,recordLegalRelease,registerConsentNotice,setActiveConsentNotice,getConsentHead,recordConsentChoice,registerTermsOffer,setActiveTermsOffer,recordTermsAcceptance} from '@notabenda/cloudflare';
import {createSyntheticStorage} from '../../notabenda-cf/examples/synthetic.mjs';
import {fixture} from './helpers.mjs';
const at=Date.parse('2026-10-18T12:00:00.000Z');
const absent=()=>({children:'absent',sensitiveData:'absent',highRiskProfiling:'absent',regulatedSector:'absent'});
const policy=(site={},purposes=[])=>({version:1,revision:'assessment-1',site:{...absent(),...site},purposes});
const memory=()=>{const data=new Map();return {data,storage:{getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value),removeItem:key=>data.delete(key)}};};
async function setup(){
 const config=await fixture({reviewed:true}),p=structuredClone(config.purposes[0]);p.id='ordinary';p.name='Ordinary local tools';const restricted={...structuredClone(p),id:'specialized',name:'A specialized process'};config.purposes=[p,restricted];
 config.services=[{id:'ordinary-service',name:'Local tools',provider:'Fictional',location:'Local synthetic test',purposeIds:['ordinary']},{id:'specialized-service',name:'Specialized tools',provider:'Fictional',location:'Local synthetic test',purposeIds:['specialized']},{id:'combined-service',name:'Combined tools',provider:'Fictional',location:'Local synthetic test',purposeIds:['ordinary','specialized']}];config.storage=[];
 config.consent={purposes:config.purposes.map(p=>({id:p.id,scope:'one'})),services:config.services.map(s=>({id:s.id,scope:'one'})),grantLifetimeDays:30,refusalLifetimeDays:180,dismissalMinutes:20};config.scopeGuards=policy({},[{id:'specialized',facts:{sensitiveData:'present'}}]);
 const local=memory(),environment={storage:local.storage,now:()=>at},build=compileLegalDocuments(config),notice=createConsentNotice(build.artifact,{scopeId:'cookie-choices'}),storage=createSyntheticStorage([]),context={siteId:config.site.id,scopeId:'cookie-choices',streamId:'synthetic-guard-context',now:()=>new Date(at)};
 await recordLegalRelease(storage,build.artifact);await registerConsentNotice(storage,notice,context);await setActiveConsentNotice(storage,notice.noticeId,context);
 return {config,local,environment,build,notice,storage,context};
}
const command=(f,choices={ordinary:true,specialized:false},action='save')=>({schemaVersion:1,noticeId:f.notice.noticeId,requestId:crypto.randomUUID(),expectedRevision:0,action,choices,clientAt:new Date(at).toISOString()});

test('legacy declarations remain explicitly unassessed; absent facts do not grant permission or certify coverage',async()=>{
 const f=await setup();delete f.config.scopeGuards;const result=validateSiteConfig(f.config,{mode:'production'});assert.equal(result.valid,true);assert.ok(result.diagnostics.some(d=>d.code==='unassessed-scope'&&d.severity==='warning'));assert.equal(evaluateScopeGuards(f.config).status,'unassessed');const legacy=compileLegalDocuments(f.config);const old=createConsentNotice(legacy.artifact,{scopeId:'legacy'});assert.equal(JSON.parse(old.scopes.ordinary).scopeGuard,undefined);
 f.config.scopeGuards=policy();const c=createConsent(f.config,f.environment);assert.equal(c.getSnapshot().scopeGuards.status,'no-declared-restrictions');assert.equal(c.isAllowed('ordinary'),false);c.destroy();
});

test('present and unknown declarations for every supported fact block optional work while static production pages remain usable',async()=>{
 for(const fact of Object.keys(absent()))for(const value of ['present','unknown']){
  const f=await setup();f.config.scopeGuards=policy({[fact]:value});const valid=validateSiteConfig(f.config,{mode:'production'});assert.equal(valid.valid,true);assert.ok(valid.diagnostics.some(d=>d.code==='restricted-scope'));const build=compileLegalDocuments(f.config);assert.equal(build.manifest.mode,'production');assert.ok(build.files['privacy/index.html']);
  const c=createConsent(f.config,f.environment);let starts=0;c.registerService('ordinary-service',{purposes:['ordinary'],start(){starts++;return ()=>{};}});c.acceptAll();await c.settled();assert.equal(starts,0);assert.equal(c.getSnapshot().shouldPrompt,false);assert.deepEqual(c.getSnapshot().permissions,{ordinary:false,specialized:false});assert.equal(c.getSnapshot().purposes.ordinary,'unknown');assert.equal(f.local.data.size,0);c.rejectAll();assert.equal(c.isAllowed('ordinary'),false);c.destroy();
 }
});

test('site restrictions cannot be relaxed by purpose facts; sibling and combined service eligibility remain explicit',async()=>{
 const f=await setup();const c=createConsent(f.config,f.environment),starts=[];for(const service of f.config.services)c.registerService(service.id,{purposes:service.purposeIds,start(){starts.push(service.id);return ()=>{};}});
 assert.deepEqual(c.getSnapshot().scopeGuards.blockedPurposeIds,['specialized']);assert.deepEqual(c.getSnapshot().scopeGuards.blockedServiceIds,['specialized-service','combined-service']);c.acceptAll();await c.settled();assert.deepEqual(starts,['ordinary-service']);assert.deepEqual(c.getSnapshot().permissions,{ordinary:true,specialized:false});assert.equal(c.getSnapshot().purposes.specialized,'denied');
 const before=[...f.local.data];assert.throws(()=>c.choose({ordinary:true,specialized:true}),error=>error instanceof ScopeGuardError&&error.code==='scope-restricted'&&error.purposeIds.includes('specialized'));assert.deepEqual([...f.local.data],before);c.rejectAll();assert.equal(c.isAllowed('ordinary'),false);c.destroy();
 f.config.scopeGuards=policy({children:'present'},[{id:'ordinary',facts:{children:'absent'}}]);const decision=evaluateScopeGuards(f.config);assert.ok(decision.blockedPurposeIds.includes('ordinary'));assert.equal(decision.purposeRestrictions.ordinary.find(r=>r.fact==='children').path,'scopeGuards.site.children');
});

test('invalid declarations, hidden override flags and unknown purpose references fail validation without publishing notes',async()=>{
 const f=await setup();for(const guards of [null,{...policy(),version:2},{...policy(),revision:''},{...policy(),revision:'é'.repeat(101)},{...policy(),site:{children:'absent'}},{...policy(),site:{...absent(),children:false}},{...policy(),reviewed:true},{...policy(),purposes:[{id:'missing',facts:{children:'absent'}}]},{...policy(),purposes:[{id:'ordinary',facts:{}}]},{...policy(),purposes:[{id:'ordinary',facts:{children:'present'}},{id:'ordinary',facts:{children:'absent'}}]},{...policy(),site:{...absent(),privateReason:'Do not publish me'}}]){f.config.scopeGuards=guards;assert.equal(validateSiteConfig(f.config).valid,false);assert.throws(()=>toPublicConfig(f.config));}
 f.config.scopeGuards=policy();f.config.private={assessmentNotes:'private-scope-narrative'};const publicConfig=toPublicConfig(f.config);publicConfig.scopeGuards.site.children='present';assert.equal(f.config.scopeGuards.site.children,'absent');assert.doesNotMatch(JSON.stringify(compileLegalDocuments(f.config)),/private-scope-narrative/);
});

test('material guard revisions invalidate old grants and cannot erase a still-current refusal',async()=>{
 const f=await setup();f.config.scopeGuards=policy();let c=createConsent(f.config,f.environment);c.acceptAll();assert.equal(c.isAllowed('specialized'),true);c.destroy();
 f.config.scopeGuards=policy({},[{id:'specialized',facts:{sensitiveData:'present'}}]);f.config.scopeGuards.revision='assessment-2';c=createConsent(f.config,f.environment);assert.equal(c.isAllowed('specialized'),false);assert.equal(c.getSnapshot().purposes.specialized,'unknown');c.destroy();
 f.config.scopeGuards=policy();f.config.scopeGuards.revision='assessment-3';c=createConsent(f.config,f.environment);assert.equal(c.isAllowed('specialized'),false);assert.equal(c.getSnapshot().shouldPrompt,true);c.rejectAll();c.destroy();f.config.scopeGuards.revision='assessment-4';c=createConsent(f.config,f.environment);assert.equal(c.getSnapshot().purposes.specialized,'withdrawn');assert.equal(c.getSnapshot().shouldPrompt,false);c.destroy();
});

test('required evidence records only available choices with save; the backend rejects fabricated grants from the archived guard policy',async()=>{
 const f=await setup(),initial=await getConsentHead(f.storage,f.context),sent=[];const c=createConsent(f.config,f.environment,{evidence:{notice:f.notice,streamRef:initial.streamRef,read:()=>getConsentHead(f.storage,f.context),write:body=>{sent.push(body);return recordConsentChoice(f.storage,body,f.context);}}});await c.settled();c.acceptAll();await c.settled();assert.equal(sent[0].action,'save');assert.deepEqual(sent[0].choices,{ordinary:true,specialized:false});assert.equal(c.isAllowed('ordinary'),true);assert.equal(c.isAllowed('specialized'),false);
 await assert.rejects(recordConsentChoice(f.storage,{...command(f,{ordinary:true,specialized:true},'accept-all'),expectedRevision:1},f.context),e=>e.code==='scope-restricted');assert.equal((await getConsentHead(f.storage,f.context)).revision,1);const admin=createAdminWorker({basePath:'/admin',authorize:()=>({store:createConsentEvidenceStore(f.storage,f.context)})});const list=await admin.fetch(new Request('https://fictional.test/admin'));assert.match(await list.text(),/1 allowed · 0 declined · 1 held by scope guard/);const detail=await admin.fetch(new Request('https://fictional.test/admin/record?id='+(await getConsentHead(f.storage,f.context)).event.id));assert.match(await detail.text(),/Kept off by scope guard/);c.rejectAll();await c.settled();assert.equal((await getConsentHead(f.storage,f.context)).revision,2);assert.equal(c.isAllowed('ordinary'),false);c.destroy();
 const reloaded=createConsent(f.config,f.environment,{evidence:{notice:f.notice,streamRef:initial.streamRef,read:()=>getConsentHead(f.storage,f.context),write:body=>recordConsentChoice(f.storage,body,f.context)}});await reloaded.settled();assert.equal(reloaded.isAllowed('specialized'),false);reloaded.destroy();
});

test('historical receipts remain historical after guard activation, while an old notice can still withdraw the whole stream',async()=>{
 const f=await setup(),oldConfig=structuredClone(f.config);delete oldConfig.scopeGuards;const oldBuild=compileLegalDocuments(oldConfig),old=createConsentNotice(oldBuild.artifact,{scopeId:f.context.scopeId});await recordLegalRelease(f.storage,oldBuild.artifact);await registerConsentNotice(f.storage,old,f.context);await setActiveConsentNotice(f.storage,old.noticeId,f.context);const grant={...command(f,{ordinary:true,specialized:true},'accept-all'),noticeId:old.noticeId};const receipt=await recordConsentChoice(f.storage,grant,f.context);await setActiveConsentNotice(f.storage,f.notice.noticeId,f.context);
 assert.deepEqual((await recordConsentChoice(f.storage,grant,f.context)).receipt,receipt.receipt);await assert.rejects(recordConsentChoice(f.storage,{...grant,requestId:crypto.randomUUID(),expectedRevision:1},f.context),e=>e.code==='stale-notice');const withdrawn=await recordConsentChoice(f.storage,{...grant,requestId:crypto.randomUUID(),choices:{ordinary:false,specialized:false},action:'revoke-all'},f.context);assert.equal(Object.values(withdrawn.head.event.choices).some(Boolean),false);
});

test('terms agreement and collection information remain separate from specialized authorization',async()=>{
 const f=await setup();f.config.scopeGuards=policy({children:'present'});const build=compileLegalDocuments(f.config);const notice=createCollectionNotice(build.artifact,{scopeId:'contact',purposeIds:['ordinary'],reviewStatus:'reviewed',wording:{title:'About this request',intro:'Fictional collection context.'}});assert.equal(notice.purposes[0].id,'ordinary');const offer=createTermsOffer(build.artifact,{scopeId:'terms',statement:'I agree to these fictional terms.',actionLabel:'Agree'});await recordLegalRelease(f.storage,build.artifact);await registerTermsOffer(f.storage,offer,f.context);await setActiveTermsOffer(f.storage,offer.offerId,{...f.context,scopeId:'terms'});const t=createTermsAcceptance(offer,{operationId:'operation',submit:body=>recordTermsAcceptance(f.storage,body,{...f.context,scopeId:'terms',subjectId:'synthetic-subject',operationId:'operation'})});t.setChecked(true);await t.submit();const c=createConsent(f.config,f.environment);c.acceptAll();assert.equal(c.isAllowed('ordinary'),false);assert.equal(t.getSnapshot().status,'recorded');c.destroy();t.destroy();
});

test('default controls disable restricted choices and clearly offer only available purposes',async()=>{
 const f=await setup(),c=createConsent(f.config,f.environment),dom=new JSDOM('<div></div>');dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;};const container=dom.window.document.querySelector('div'),ui=mountControls(container,{consent:c});assert.equal(container.querySelector('input[name=specialized]').disabled,true);assert.equal(container.querySelector('input[name=ordinary]').disabled,false);assert.match(container.textContent,/separate supported process/);const action=[...container.querySelectorAll('button')].find(b=>b.textContent==='Allow available');assert.ok(action);action.click();assert.deepEqual(c.getSnapshot().permissions,{ordinary:true,specialized:false});ui.destroy();dom.window.close();c.destroy();
});

test('wizard declarations stay private where appropriate, preserve imported restrictions and migrate older private reports',async()=>{
 const f=await setup();f.config.scopeGuards=policy({children:'present'});const answers={schemaVersion:1,markets:['US-VA'],answers:{children:{choice:'no',justification:'private-child-reason'},'sensitive-data':{choice:'yes',justification:'private-sensitive-reason'},'high-risk-profiling':{choice:'unknown',justification:''},'regulated-sector':{choice:'no',justification:'private-sector-reason'}}};const plan=createSetupPlan(answers,{config:f.config});assert.equal(plan.config.scopeGuards.site.children,'present');assert.equal(plan.config.scopeGuards.site.sensitiveData,'present');assert.match(plan.report.reviewItems.join(' '),/relax the imported scope guard/);assert.deepEqual(plan.config.scopeGuards.purposes,f.config.scopeGuards.purposes);assert.doesNotMatch(JSON.stringify(compileLegalDocuments(plan.config,{mode:'preview'})),/private-child-reason|private-sensitive-reason|private-sector-reason/);assert.match(JSON.stringify(plan.report),/private-sensitive-reason/);assert.equal(plan.report.questionnaireVersion,'8');assert.deepEqual(readSetupAnswers({...plan.report,questionnaireVersion:'1'}),plan.report.answers);
 const fresh=createSetupPlan(answers);assert.equal(fresh.config.scopeGuards.site.children,'absent');assert.equal(fresh.config.scopeGuards.site.sensitiveData,'present');assert.equal(fresh.config.scopeGuards.site.highRiskProfiling,'unknown');
});

test('the backend rejects malformed guard declarations even in otherwise hash-consistent archives',async()=>{
 const f=await setup(),a=structuredClone(f.build.artifact);a.publicConfig.scopeGuards.reviewed=true;a.manifest.configSha256=sha256(canonicalJson(a.publicConfig));const {artifactId,...descriptor}=a.manifest;a.manifest.artifactId=sha256(canonicalJson(descriptor));await assert.rejects(recordLegalRelease(f.storage,a),/scopeGuards/);
});

test('guard exclusions never count as Italian withholding, while deliberate refusals retain the prompt floor',async()=>{
 for(const action of ['allow','reject']){
  const f=await setup();let clock=at;f.config.consent={...f.config.consent,grantLifetimeDays:1,refusalLifetimeDays:1,dismissalMinutes:0,promptPolicy:{profile:'it-garante-2021',processingRevision:'initial'}};
  const c=createConsent(f.config,{...f.environment,now:()=>clock,schedule:()=>()=>{}});if(action==='allow')c.acceptAll();else c.rejectAll();
  assert.equal(c.getSnapshot().promptDecision.reason,action==='allow'?'no-prior-withholding':'withholding-floor');clock+=86400001;c.refresh();assert.equal(c.getSnapshot().shouldPrompt,action==='allow');assert.equal(c.isAllowed('specialized'),false);c.destroy();
 }
});

test('an all-false granular save still describes guarded purposes as held off, without inferring an explicit decline',async()=>{
 const f=await setup();const result=await recordConsentChoice(f.storage,command(f,{ordinary:false,specialized:false},'revoke-all'),f.context);const admin=createAdminWorker({basePath:'/admin',authorize:()=>({store:createConsentEvidenceStore(f.storage,f.context)})});const response=await admin.fetch(new Request('https://fictional.test/admin/record?id='+result.receipt.id));assert.equal(response.status,200);const html=await response.text();assert.match(html,/1 declined · 1 held by scope guard/);assert.match(html,/Kept off by scope guard/);assert.match(html,/Reported decline/);
});

test('setup revises bounded Unicode declarations into a valid draft and preserves the restriction',async()=>{
 const f=await setup();f.config.scopeGuards=policy();f.config.scopeGuards.revision='é'.repeat(100);assert.equal(validateSiteConfig(f.config).valid,true);const plan=createSetupPlan({schemaVersion:1,markets:[],answers:{children:{choice:'yes',justification:'A fictional assessment.'}}},{config:f.config});assert.equal(validateSiteConfig(plan.config,{mode:'preview'}).valid,true);assert.ok(new TextEncoder().encode(plan.config.scopeGuards.revision).length<=200);assert.equal(plan.config.scopeGuards.site.children,'present');
});
