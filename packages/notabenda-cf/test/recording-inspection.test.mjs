// @requirements REQ-PRODUCT-RECORDING-INSPECTION REQ-PRODUCT-CF-ADMIN REQ-PRODUCT-A11Y
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {compileLegalDocuments,createConsentNotice,createTermsOffer,createFormPermissionOffer} from '@notabenda/core/content';
import {recordLegalRelease,registerConsentNotice,setActiveConsentNotice,getConsentRecordingSelection,registerTermsOffer,setActiveTermsOffer,getTermsRecordingSelection,registerFormPermissionOffer,setActiveFormPermissionOffer,getFormPermissionRecordingSelection,createRecordingInspectionWorker,createWorkspaceOverviewWorker} from '@notabenda/cloudflare';
import {createSyntheticStorage} from '../examples/synthetic.mjs';
import {fixture} from '../../notabenda/test/helpers.mjs';
async function setup({preview=false}={}){
 const config=await fixture({reviewed:!preview});config.services=[{id:'sample',name:'Sample service',provider:'Sample',location:'This browser',purposeIds:config.purposes.map(p=>p.id)}];config.storage=[];config.scopeGuards={version:1,revision:'test-1',site:{children:'absent',sensitiveData:'absent',highRiskProfiling:'absent',regulatedSector:'absent'}};config.consent={purposes:config.purposes.map(p=>({id:p.id,scope:'one'})),services:config.services.filter(s=>s.purposeIds.length).map(s=>({id:s.id,scope:'one'})),grantLifetimeDays:30,refusalLifetimeDays:180,dismissalMinutes:30};
 const build=compileLegalDocuments(config,{mode:preview?'preview':'production'}),notice=createConsentNotice(build.artifact,{scopeId:'choices'},{mode:preview?'preview':'production'}),offer=createTermsOffer(build.artifact,{scopeId:'signup',statement:'I agree to the sample terms.',actionLabel:'Agree'},{mode:preview?'preview':'production'}),permission=createFormPermissionOffer(build.artifact,{permissionId:'email',purposeId:'enquiries',channel:{id:'email',label:'Email'},revision:'one',reviewStatus:preview?'draft':'reviewed',withdrawalUrl:'/preferences',wording:{title:'Email updates',statement:'Send me email updates.',grantLabel:'Save',withdrawLabel:'Withdraw',optionality:'Optional.',withdrawalExplanation:'Withdraw here.'}},{mode:preview?'preview':'production'}),storage=createSyntheticStorage([]),context={siteId:config.site.id,allowPreview:preview};
 await recordLegalRelease(storage,build.artifact);await registerConsentNotice(storage,notice,context);await registerTermsOffer(storage,offer,context);await registerFormPermissionOffer(storage,permission,context);
 const targets=[{id:'cookies',title:'Cookie notice',family:'consent',siteId:config.site.id,scopeId:'choices',read:()=>getConsentRecordingSelection(storage,{...context,scopeId:'choices'}),activate:id=>setActiveConsentNotice(storage,id,{...context,scopeId:'choices'}),descriptor:notice.noticeId,prefix:`notabenda/consent/${config.site.id}/`,pointer:{noticeId:notice.noticeId,siteId:config.site.id,scopeId:'choices'}},{id:'terms',title:'Signup terms',family:'terms',siteId:config.site.id,scopeId:'signup',read:()=>getTermsRecordingSelection(storage,{...context,scopeId:'signup'}),activate:id=>setActiveTermsOffer(storage,id,{...context,scopeId:'signup'}),descriptor:offer.offerId,prefix:`notabenda/terms/${config.site.id}/`,pointer:{offerId:offer.offerId,siteId:config.site.id,scopeId:'signup'}},{id:'email',title:'Email permission',family:'form-permission',siteId:config.site.id,scopeId:'email',read:()=>getFormPermissionRecordingSelection(storage,{...context,permissionId:'email'}),activate:id=>setActiveFormPermissionOffer(storage,id,{...context,permissionId:'email'}),descriptor:permission.offerId,prefix:`notabenda/permissions/${config.site.id}/`,pointer:{offerId:permission.offerId,revision:1}}];
 return {config,build,notice,offer,permission,storage,context,targets};
}
const request=path=>new Request('https://example.test'+path),snapshot=async storage=>[...await storage.list({prefix:'',limit:1000})];

test('registration alone is unconfigured; selected/inactive targets and permission activation revisions remain distinct',async()=>{
 const f=await setup();for(const t of f.targets){const before=await snapshot(f.storage);assert.equal((await t.read()).status,'unconfigured');assert.deepEqual(await snapshot(f.storage),before);await t.activate(t.descriptor);const selected=await t.read();assert.equal(selected.status,'selected');assert.equal(selected.selected.id,t.descriptor);assert.equal(selected.selected.artifactId,f.build.manifest.artifactId);assert.equal(selected.selected.document.url,`/artifacts/${f.build.manifest.artifactId}/${t.family==='terms'?'terms':'privacy'}.html`);selected.selected.document.version='changed';assert.notEqual((await t.read()).selected.document.version,'changed');const active=await snapshot(f.storage);await t.read();assert.deepEqual(await snapshot(f.storage),active);await t.activate(null);assert.equal((await t.read()).status,'inactive');if(t.family==='form-permission'){assert.equal((await t.read()).activationRevision,2);await t.activate(t.descriptor);assert.equal((await t.read()).activationRevision,3);}}
});

test('inspection uses only activation/descriptor/archive gets and never visitor heads, enumeration or writes',async()=>{
 const f=await setup();for(const t of f.targets)await t.activate(t.descriptor);const keys=[];const readonly={...f.storage,transaction:callback=>f.storage.transaction(tx=>callback({get:key=>{keys.push(key);assert.doesNotMatch(key,/\/(?:heads|events|streams)\//u);return tx.get(key);},list(){throw Error('No enumeration');},put(){throw Error('No writes');},delete(){throw Error('No deletes');}}))};
 await getConsentRecordingSelection(readonly,{...f.context,scopeId:'choices'});await getTermsRecordingSelection(readonly,{...f.context,scopeId:'signup'});await getFormPermissionRecordingSelection(readonly,{...f.context,permissionId:'email'});assert.ok(keys.length>=9);assert.ok(keys.some(k=>k.startsWith('notabenda/releases/')));
});

test('corrupt pointers, cross-scope targets, missing archives and preview downgrades never become inactive or selected',async()=>{
 for(const index of [0,1,2]){const f=await setup(),t=f.targets[index];await t.activate(t.descriptor);const pointer=t.prefix+'active/'+t.scopeId;await f.storage.put(pointer,{...t.pointer,extra:'PRIVATE'});await assert.rejects(t.read());await f.storage.put(pointer,t.pointer);await f.storage.delete('notabenda/releases/'+f.build.manifest.artifactId);await assert.rejects(t.read());}
 const f=await setup();for(const t of f.targets.slice(0,2)){await t.activate(t.descriptor);await f.storage.put(t.prefix+'active/'+t.scopeId,{...t.pointer,scopeId:'other'});await assert.rejects(t.read());}
 const p=await setup({preview:true});for(const t of p.targets){await t.activate(t.descriptor);assert.equal((await t.read()).selected.mode,'preview');}await assert.rejects(getConsentRecordingSelection(p.storage,{siteId:p.config.site.id,scopeId:'choices'}));await assert.rejects(getTermsRecordingSelection(p.storage,{siteId:p.config.site.id,scopeId:'signup'}));await assert.rejects(getFormPermissionRecordingSelection(p.storage,{siteId:p.config.site.id,permissionId:'email'}));
});

test('HTML and JSON show fixed host scopes, exact current references and unavailable reads without exposing exceptions',async()=>{
 const f=await setup();await f.targets[0].activate(f.targets[0].descriptor);await f.targets[1].activate(f.targets[1].descriptor);await f.targets[1].activate(null);let calls=0;const unavailable={...f.targets[2],read:async()=>{calls++;throw Error('PRIVATE_TRANSPORT_KEY');}},worker=createRecordingInspectionWorker({basePath:'/admin/recording',historyPath:'/admin/history',authorize:()=>({targets:[f.targets[0],f.targets[1],unavailable]})});
 const response=await worker.fetch(request('/admin/recording'),{}),html=await response.text(),d=new JSDOM(html).window.document;assert.equal(response.status,200);assert.equal(d.querySelectorAll('.recording-item').length,3);assert.ok(d.body.textContent.includes('Selected'));assert.ok(d.body.textContent.includes('Inactive'));assert.ok(d.body.textContent.includes('Check unavailable'));assert.equal(d.querySelector('details[open]'),null);assert.equal(d.querySelector('script,input,form'),null);assert.doesNotMatch(html,/PRIVATE_TRANSPORT_KEY/);assert.equal(response.headers.get('Cache-Control'),'private, no-store');assert.match(response.headers.get('Content-Security-Policy'),/style-src 'nonce-/);assert.doesNotMatch(response.headers.get('Content-Security-Policy'),/unsafe-inline|script-src/);const link=new URL(d.querySelector('.recording-history').href,'https://example.test');assert.equal(link.pathname,'/admin/history');assert.equal(link.searchParams.get('q'),f.build.manifest.artifactId);
 const json=await (await worker.fetch(request('/admin/recording?format=json'),{})).json();assert.equal(json.observations[2].selection,null);assert.equal(json.observations[0].selection.status,'selected');assert.equal(json.boundaries.verifiesPublication,false);assert.equal(json.boundaries.readsVisitorState,false);assert.equal(calls,2);
});

test('authorization, method, route and selector failures perform no reader work',async()=>{
 let reads=0;const t={id:'sample',title:'Sample',family:'terms',siteId:'site',scopeId:'signup',read:async()=>{reads++;throw Error();}},denied=createRecordingInspectionWorker({authorize:()=>null}),worker=createRecordingInspectionWorker({basePath:'/admin/recording',authorize:()=>({targets:[t]})});
 assert.equal((await denied.fetch(request('/admin/recording'),{})).status,403);for(const [path,status] of [['/admin/recording?site=other',400],['/admin/recording?scope=other',400],['/admin/recording?format=json&format=json',400],['/admin/other',404]])assert.equal((await worker.fetch(request(path),{})).status,status);assert.equal((await worker.fetch(new Request('https://example.test/admin/recording',{method:'POST'}),{})).status,405);assert.equal(reads,0);
 for(const targets of [[t,t],Array.from({length:13},(_,i)=>({...t,id:'target-'+i}))])assert.equal((await createRecordingInspectionWorker({authorize:()=>({targets})}).fetch(request('/admin/recording'),{})).status,403);assert.equal(reads,0);
});

test('misrouted or accessor-bearing callback results are unavailable; late timed-out reads cannot change the response',async()=>{
 const f=await setup();await f.targets[0].activate(f.targets[0].descriptor);const selected=await f.targets[0].read();let getters=0;const hostile={...selected};Object.defineProperty(hostile,'siteId',{enumerable:true,get(){getters++;throw Error('PRIVATE');}});let signal,finish;const pending=new Promise(resolve=>finish=resolve),targets=[{...f.targets[0],id:'wrong',read:async()=>({...selected,scopeId:'other'})},{...f.targets[0],id:'hostile',read:async()=>hostile},{...f.targets[0],id:'slow',read:async context=>{signal=context.signal;return pending;}}];const worker=createRecordingInspectionWorker({basePath:'/admin/recording',readTimeoutMs:1000,authorize:()=>({targets})}),response=await worker.fetch(request('/admin/recording?format=json'),{}),text=await response.text(),json=JSON.parse(text);assert.ok(json.observations.every(o=>o.selection===null));assert.equal(signal.aborted,true);assert.equal(getters,0);finish(selected);await new Promise(r=>setImmediate(r));assert.equal(json.observations[2].selection,null);assert.doesNotMatch(text,/PRIVATE/);
});

test('workspace links require an explicit inspection grant and never read selections on overview',async()=>{
 for(const allow of [false,true]){const worker=createWorkspaceOverviewWorker({basePath:'/admin',recordingPath:'/admin/recording',authorize:()=>({areas:[],allowRecordingInspection:allow})});const d=new JSDOM(await (await worker.fetch(request('/admin'),{})).text()).window.document;assert.equal(!!d.querySelector('a[href="/admin/recording"]'),allow);}
});

test('expected selection comparisons distinguish every family, absent intent, inactivity and unavailable reads without changing storage',async()=>{
 const f=await setup(),targets=f.targets.map(t=>({...t,expected:{id:t.descriptor,artifactId:f.build.manifest.artifactId,mode:'production'}}));
 const worker=createRecordingInspectionWorker({basePath:'/admin/recording',authorize:()=>({targets})}),observe=async()=>{
  const before=await snapshot(f.storage),result=await(await worker.fetch(request('/admin/recording?format=json'),{})).json();assert.deepEqual(await snapshot(f.storage),before);return result;
 };
 assert.ok((await observe()).observations.every(o=>o.comparison.status==='unconfigured'));
 for(const t of targets)await t.activate(t.descriptor);
 const selected=await observe();assert.ok(selected.observations.every(o=>o.comparison.status==='matches'));assert.ok(selected.observations.every(o=>o.comparison.differingFields.length===0));assert.equal(selected.boundaries.verifiesExpectedArchive,false);
 for(const t of targets)await t.activate(null);
 assert.ok((await observe()).observations.every(o=>o.comparison.status==='inactive'));
 const unavailable=createRecordingInspectionWorker({basePath:'/admin/recording',authorize:()=>({targets:targets.map(t=>({...t,read:async()=>{throw Error('PRIVATE');}}))})});
 const result=await(await unavailable.fetch(request('/admin/recording?format=json'),{})).json();assert.ok(result.observations.every(o=>o.comparison.status==='unavailable'));assert.ok(result.observations.every(o=>o.selection===null));
 const unrequested=createRecordingInspectionWorker({basePath:'/admin/recording',authorize:()=>({targets:f.targets})});assert.ok((await(await unrequested.fetch(request('/admin/recording?format=json'),{})).json()).observations.every(o=>o.comparison.status==='not-specified'));
});

test('descriptor, release and mode compare independently and expected host input is copied before callbacks',async()=>{
 const f=await setup();await f.targets[0].activate(f.targets[0].descriptor);const expected={id:f.targets[0].descriptor,artifactId:f.build.manifest.artifactId,mode:'production'};
 for(const [field,value] of [['id','b'.repeat(64)],['artifactId','c'.repeat(64)],['mode','preview']]){
  const worker=createRecordingInspectionWorker({authorize:()=>({targets:[{...f.targets[0],expected:{...expected,[field]:value}}]})});
  const result=await(await worker.fetch(request('/admin/notabenda/recording?format=json'),{})).json(),comparison=result.observations[0].comparison;assert.equal(comparison.status,'different');assert.deepEqual(comparison.differingFields,[field]);assert.equal(comparison.expected[field],value);
 }
 const captured={...expected},worker=createRecordingInspectionWorker({authorize:()=>({targets:[{...f.targets[0],expected:captured,read:async()=>{captured.id='d'.repeat(64);return f.targets[0].read();}}]})});
 const result=await(await worker.fetch(request('/admin/notabenda/recording?format=json'),{})).json();assert.equal(result.observations[0].comparison.status,'matches');assert.equal(result.observations[0].comparison.expected.id,expected.id);assert.notEqual(captured.id,expected.id);
});

test('invalid or accessor-bearing expected references deny before any read and browser selectors cannot override host intent',async()=>{
 const f=await setup();let reads=0,getters=0;const expected={id:f.targets[0].descriptor,artifactId:f.build.manifest.artifactId,mode:'production'},hostile={...expected};Object.defineProperty(hostile,'id',{enumerable:true,get(){getters++;throw Error('PRIVATE');}});
 for(const input of [null,{},'PRIVATE',{...expected,id:'PRIVATE'},{...expected,artifactId:'x'.repeat(64)},{...expected,mode:'live'},{...expected,subject:'PRIVATE'},hostile]){
  const worker=createRecordingInspectionWorker({authorize:()=>({targets:[{...f.targets[0],expected:input,read:async()=>{reads++;throw Error('PRIVATE');}}]})}),response=await worker.fetch(request('/admin/notabenda/recording'),{});assert.equal(response.status,403);assert.doesNotMatch(await response.text(),/PRIVATE/);
 }
 const worker=createRecordingInspectionWorker({authorize:()=>({targets:[{...f.targets[0],expected,read:async()=>{reads++;return f.targets[0].read();}}]})});for(const query of ['expected='+expected.id,'artifactId='+expected.artifactId,'mode=preview'])assert.equal((await worker.fetch(request('/admin/notabenda/recording?'+query),{})).status,400);
 assert.equal(reads,0);assert.equal(getters,0);
});

test('a different real terms offer can serve matching policy bytes without matching the intended recording selection',async()=>{
 const f=await setup(),t=f.targets[1],replacement=createTermsOffer(f.build.artifact,{scopeId:'signup',statement:'I agree to a different sample statement.',actionLabel:'Agree'});
 await registerTermsOffer(f.storage,replacement,{...f.context,scopeId:'signup'});await t.activate(replacement.offerId);
 const before=await snapshot(f.storage),paths=[],worker=createRecordingInspectionWorker({basePath:'/admin/recording',historyPath:'/admin/history',authorize:()=>({targets:[{...t,expected:{id:t.descriptor,artifactId:f.build.manifest.artifactId,mode:'production'},publication:{origin:'https://public.example.test',label:'Fixture reader',fetch:async r=>{paths.push(new URL(r.url).pathname);return new Response(f.build.artifact.pages[f.build.manifest.documents.find(d=>d.kind==='terms').file],{headers:{'Content-Type':'text/html'}});}}}]})});
 const json=await(await worker.fetch(request('/admin/recording?publication=check&format=json'),{})).json();assert.equal(json.observations[0].publication.status,'matched');assert.equal(json.observations[0].comparison.status,'different');assert.deepEqual(json.observations[0].comparison.differingFields,['id']);assert.equal(json.observations[0].selection.selected.id,replacement.offerId);assert.deepEqual(paths,[t.family==='terms'?f.offer.document.url:'']);assert.deepEqual(await snapshot(f.storage),before);
 const html=await(await worker.fetch(request('/admin/recording'),{})).text(),d=new JSDOM(html).window.document;assert.match(d.body.textContent,/Another version is selected/);assert.match(d.body.textContent,/Different: descriptor/);assert.equal(d.querySelectorAll('[data-comparison=different]').length,1);const card=d.querySelector('.recording-item'),children=[...card.children];assert.ok(children.indexOf(card.querySelector('.recording-expectation'))<children.indexOf(card.querySelector(':scope > dl')),'Show the mismatch and next step before metadata');assert.equal(d.querySelector('details[open]'),null);assert.match(d.querySelector('.recording-expectation a').href,/q=/);assert.equal(d.querySelector('form,button,input,script'),null);assert.deepEqual(await snapshot(f.storage),before);
});
