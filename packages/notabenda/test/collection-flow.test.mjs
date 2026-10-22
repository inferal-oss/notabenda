// @requirements REQ-PRODUCT-COLLECTION-FLOW REQ-TR-BASIS REQ-PRODUCT-A11Y REQ-PRODUCT-LOCALIZATION
import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {createCollectionFlow,verifyCollectionFlow,compileLegalDocuments,canonicalJson} from '@notabenda/core/content';
import {normalizeCollectionFlow,renderCollectionFlow,mountCollectionFlow} from '@notabenda/core/collection/flow';
import {createFormPermission} from '@notabenda/core';
import {recordLegalRelease,registerFormPermissionOffer,setActiveFormPermissionOffer,formPermissionStreamRef,getFormPermissionState,recordFormPermission} from '@notabenda/cloudflare';
import {createSyntheticStorage} from '../../notabenda-cf/examples/synthetic.mjs';
import {fixture} from './helpers.mjs';
import {setup} from './collection-flow-fixture.mjs';

test('composition binds explicit presentation to the exact release and keeps notice-only purposes out of offers',async()=>{
 const f=await setup(),before=canonicalJson(f.build.artifact),settings=structuredClone(f.settings);
 assert.deepEqual(f.flow.notice.purposes.map(p=>p.id),['message','updates']);assert.deepEqual(f.flow.permissions.map(o=>o.purposeId),['updates']);assert.equal(f.flow.routes[0].presentation,'notice-only');assert.equal(f.flow.permissions[0].artifactId,f.flow.notice.artifactId);assert.deepEqual(verifyCollectionFlow(f.flow,f.build.artifact),f.flow);assert.equal(canonicalJson(f.build.artifact),before);assert.deepEqual(f.settings,settings);
 const reversed=structuredClone(settings);reversed.decisions.reverse();assert.deepEqual(createCollectionFlow(f.build.artifact,reversed),f.flow);
 const only=structuredClone(settings);only.decisions=only.decisions.map(d=>({purposeId:d.purposeId,presentation:'notice-only'}));const noPermission=createCollectionFlow(f.build.artifact,only);assert.deepEqual(noPermission.permissions,[]);assert.doesNotMatch(renderCollectionFlow(noPermission,{idPrefix:'only'}),/input|button|data-collection-permission/);
});
test('missing, duplicate, unknown, ambiguous and contradictory decisions fail rather than infer a legal route',async()=>{
 const f=await setup();
 for(const mutate of [s=>delete s.reviewedArtifactId,s=>s.reviewedArtifactId='a'.repeat(64),s=>s.decisions.pop(),s=>s.decisions.push(s.decisions[0]),s=>s.decisions[1].purposeId='unknown',s=>s.decisions[1].presentation='unknown',s=>delete s.decisions[1].permission,s=>s.decisions[0].permission=s.decisions[1].permission,s=>s.decisions[1].permission.purposeId='message',s=>s.decisions[1].permission.private='secret',s=>s.notice.private='secret',s=>s.decisions[1].permission.wording.title=s.notice.wording.title,s=>s.decisions[1].permission.wording.statement=s.notice.wording.intro]){const s=structuredClone(f.settings);mutate(s);assert.throws(()=>createCollectionFlow(f.build.artifact,s),undefined,mutate.toString());}
 const changed=structuredClone(f.config);changed.purposes[0].description+=' Changed processing.';const next=compileLegalDocuments(changed);assert.throws(()=>createCollectionFlow(next.artifact,f.settings));assert.throws(()=>verifyCollectionFlow(f.flow,next.artifact));
 // Wording and optionality never select presentation for the host.
 const s=structuredClone(f.settings);delete s.decisions[0].presentation;assert.throws(()=>createCollectionFlow(f.build.artifact,s));
});
test('indirect/mixed and unsupported ordinary-permission contexts fail; draft release/wording needs explicit preview',async()=>{
 const f=await setup();
 for(const source of ['indirect','both']){const c=structuredClone(f.config);c.purposes[0].collection.source=source;const b=compileLegalDocuments(c),s={...f.settings,reviewedArtifactId:b.manifest.artifactId};assert.throws(()=>createCollectionFlow(b.artifact,s));}
 for(const fact of ['children','sensitiveData','highRiskProfiling','regulatedSector']){const c=structuredClone(f.config);c.scopeGuards.site[fact]='unknown';const b=compileLegalDocuments(c);assert.throws(()=>createCollectionFlow(b.artifact,{...f.settings,reviewedArtifactId:b.manifest.artifactId}));}
 const draft=structuredClone(f.config);draft.documents.privacy.review.status='draft';const b=compileLegalDocuments(draft,{mode:'preview'}),s={...f.settings,reviewedArtifactId:b.manifest.artifactId};assert.throws(()=>createCollectionFlow(b.artifact,s));assert.equal(createCollectionFlow(b.artifact,s,{mode:'preview'}).mode,'preview');
 for(const part of ['notice','permission']){const settings=structuredClone(f.settings);(part==='notice'?settings.notice:settings.decisions[1].permission).reviewStatus='draft';assert.throws(()=>createCollectionFlow(f.build.artifact,settings));assert.equal(createCollectionFlow(f.build.artifact,settings,{mode:'preview'}).mode,'production');}
});
test('normalization rejects cross-release facts, extra offers, wrong routing and hostile/accessor input without executing it',async()=>{
 const f=await setup();for(const mutate of [v=>v.schemaVersion='1',v=>v.extra=true,v=>v.siteId='other',v=>v.permissions[0].artifactId='b'.repeat(64),v=>v.permissions[0].facts.purpose.description+=' altered',v=>v.routes[1].offerId='c'.repeat(64),v=>v.permissions.push(v.permissions[0]),v=>v.routes[0].offerId=v.permissions[0].offerId,v=>v.notice.controller.name='Other controller',v=>v.notice.privacy.transfers='Changed transfer']){const value=structuredClone(f.flow);mutate(value);assert.throws(()=>normalizeCollectionFlow(value),undefined,mutate.toString());}
 let reads=0;const value=structuredClone(f.flow);Object.defineProperty(value.notice,'wording',{enumerable:true,get(){reads++;throw Error();}});assert.throws(()=>normalizeCollectionFlow(value));assert.equal(reads,0);
 const forged=structuredClone(f.flow);forged.flowId='d'.repeat(64);assert.throws(()=>verifyCollectionFlow(forged,f.build.artifact));
 const detached=normalizeCollectionFlow(f.flow);detached.notice.purposes[0].name='Changed';assert.notEqual(f.flow.notice.purposes[0].name,'Changed');
});
async function recorded(f){
 const storage=createSyntheticStorage([]),offer=f.flow.permissions[0],scope={siteId:offer.siteId,permissionId:offer.permissionId},context={...scope,streamId:'host-bound-contact-generation',now:()=>new Date('2026-10-22T12:00:00Z')};
 await recordLegalRelease(storage,f.build.artifact);await registerFormPermissionOffer(storage,offer,scope);await setActiveFormPermissionOffer(storage,offer.offerId,scope);
 let writes=0,reads=0;const controller=createFormPermission(offer,{now:()=>new Date('2026-10-22T12:00:00Z'),streamRef:await formPermissionStreamRef(context),read:()=>{reads++;return getFormPermissionState(storage,context);},submit:command=>{writes++;return recordFormPermission(storage,command,context);}});
 return {controller,storage,context,writes:()=>writes,reads:()=>reads};
}
test('static notice survives no JavaScript; hydration preserves reading state and only deliberate permission actions record',async()=>{
 const f=await setup(),r=await recorded(f),html=renderCollectionFlow(f.flow,{idPrefix:'contact',headingLevel:3}),dom=new JSDOM('<form><div id="flow">'+html+'</div><button type="submit">Send message</button></form>'),d=dom.window.document,host=d.querySelector('#flow'),notice=host.querySelector('.nb-collection-notice'),details=notice.querySelector('details');details.open=true;details.querySelector('summary').focus();const focused=d.activeElement;
 assert.equal(host.querySelectorAll('input,button').length,0);assert.ok(notice.textContent.includes('Contract steps requested'));
 let tasks=0;d.querySelector('form').addEventListener('submit',e=>{e.preventDefault();tasks++;});const ui=mountCollectionFlow(host,{flow:f.flow,idPrefix:'contact',headingLevel:3,permissions:{'updates-email':r.controller}});
 try{
  assert.equal(host.querySelectorAll('.nb-collection-flow').length,1);assert.equal(host.querySelector('.nb-collection-notice'),notice);assert.equal(details.open,true);assert.equal(d.activeElement,focused);assert.equal(host.querySelectorAll('.nb-form-permission h3').length,1);assert.equal(host.querySelectorAll('input[type=checkbox]').length,1);assert.equal(notice.querySelector('input,button'),null);assert.equal(r.reads(),0);assert.equal(r.writes(),0);
  d.querySelector('button[type=submit]').click();assert.equal(tasks,1);assert.equal(r.writes(),0);
  await r.controller.refresh();const box=host.querySelector('input');box.click();d.querySelector('button[type=submit]').click();assert.equal(tasks,2);assert.equal(r.writes(),0);assert.equal(r.controller.getSnapshot().allowed,false);
  await r.controller.grant();assert.equal(r.writes(),1);assert.equal((await getFormPermissionState(r.storage,r.context)).permitted,true);assert.equal(host.querySelector('.nb-collection-notice'),notice);
  await r.controller.withdraw();assert.equal((await getFormPermissionState(r.storage,r.context)).permitted,false);assert.equal(r.writes(),2);
 }finally{ui.destroy();assert.ok(host.querySelector('.nb-collection-notice'));assert.equal(host.querySelector('input'),null);r.controller.destroy();dom.window.close();}
});
test('invalid or mismatched controllers/SSR preserve host content and mount teardown leaves host controllers alive',async()=>{
 const f=await setup(),r=await recorded(f),dom=new JSDOM('<div id="host"><p>Keep this host content</p></div>'),host=dom.window.document.querySelector('#host'),before=host.innerHTML;
 try{
  for(const permissions of [{},{'extra':r.controller},{'updates-email':{...r.controller,getOffer:()=>({...r.controller.getOffer(),revision:'wrong'})}}]){assert.throws(()=>mountCollectionFlow(host,{flow:f.flow,idPrefix:'contact',permissions}));assert.equal(host.innerHTML,before);}
  const ui=mountCollectionFlow(host,{flow:f.flow,idPrefix:'contact',permissions:{'updates-email':r.controller}});ui.destroy();ui.destroy();assert.equal(host.innerHTML,before);assert.notEqual(r.controller.getSnapshot().status,'destroyed');
  host.innerHTML=renderCollectionFlow(f.flow,{idPrefix:'contact'});host.querySelector('.nb-collection-notice h2').textContent='Wrong visible notice';const wrong=host.innerHTML;assert.throws(()=>mountCollectionFlow(host,{flow:f.flow,idPrefix:'contact',permissions:{'updates-email':r.controller}}));assert.equal(host.innerHTML,wrong);
 }finally{r.controller.destroy();dom.window.close();}
});

test('localized composition preserves the selected language and direction; only permission routes require form messages',async()=>{
 const {readFile}=await import('node:fs/promises'),f=await setup(),load=async name=>JSON.parse(await readFile(new URL('../../../examples/localization/'+name,import.meta.url)));
 const config=structuredClone(f.config);config.site.locale='pt-BR';config.localization=await load('messages.json');config.localization.reviewStatus='reviewed';config.localization.collection=await load('collection-messages.json');config.localization.formPermission=await load('form-messages.json');
 const build=compileLegalDocuments(config),settings=structuredClone(f.settings);settings.reviewedArtifactId=build.manifest.artifactId;settings.notice.wording={title:'Sobre este formulário',intro:'Sua mensagem e as atualizações têm finalidades diferentes.'};settings.decisions[1].permission.wording={title:'Atualizações por email',statement:'Quero receber atualizações por email.',grantLabel:'Salvar permissão',withdrawLabel:'Retirar permissão',optionality:'Opcional. Sua mensagem não depende desta escolha.',withdrawalExplanation:'Retire a permissão para atualizações a qualquer momento.'};
 const flow=createCollectionFlow(build.artifact,settings),html=renderCollectionFlow(flow,{idPrefix:'mensagem'});assert.match(html,/lang="pt-BR" dir="ltr"/);assert.deepEqual(verifyCollectionFlow(flow,build.artifact),flow);
 const permission=createFormPermission(flow.permissions[0],{streamRef:'a'.repeat(64),read:async()=>{assert.fail('Mount must not read');},submit:async()=>{assert.fail('Mount must not submit');}}),dom=new JSDOM('<div id="host">'+html+'</div>');
 const ui=mountCollectionFlow(dom.window.document.querySelector('#host'),{flow,idPrefix:'mensagem',permissions:{'updates-email':permission}});try{const label=dom.window.document.querySelector('.nb-form-permission-choice');assert.equal(label.textContent,settings.decisions[1].permission.wording.statement);assert.equal(label.querySelector('input').checked,false);assert.equal(dom.window.document.querySelector('.nb-form-permission').lang,'pt-BR');}finally{ui.destroy();permission.destroy();dom.window.close();}
 const other=structuredClone(flow);other.permissions[0].localization.locale='en';assert.throws(()=>normalizeCollectionFlow(other));
 const noDictionary=structuredClone(config);delete noDictionary.localization.formPermission;const next=compileLegalDocuments(noDictionary),ns={...settings,reviewedArtifactId:next.manifest.artifactId};assert.throws(()=>createCollectionFlow(next.artifact,ns),/localization.formPermission/);ns.decisions=ns.decisions.map(d=>({purposeId:d.purposeId,presentation:'notice-only'}));assert.equal(createCollectionFlow(next.artifact,ns).permissions.length,0);
});

test('a later controller subscription failure releases staged views and leaves the original form untouched',async()=>{
 const f=await setup(),settings=structuredClone(f.settings);settings.decisions[0]={purposeId:'message',presentation:'separate-permission',permission:{...structuredClone(settings.decisions[1].permission),permissionId:'follow-up-email',wording:{...settings.decisions[1].permission.wording,title:'Separate follow-up',statement:'Allow a separate follow-up for this synthetic test.'}}};
 const flow=createCollectionFlow(f.build.artifact,settings),controllers=Object.fromEntries(flow.permissions.map(offer=>[offer.permissionId,createFormPermission(offer,{streamRef:'a'.repeat(64),read:async()=>{assert.fail();},submit:async()=>{assert.fail();}})])),dom=new JSDOM('<div id="host">'+renderCollectionFlow(flow,{idPrefix:'staged'})+'</div>'),host=dom.window.document.querySelector('#host'),before=host.innerHTML;let subscriptions=0;
 const first=controllers['follow-up-email'],broken={...controllers['updates-email'],subscribe(){throw Error('Host subscription unavailable');}},wrapped={...first,subscribe(listener){subscriptions++;const off=first.subscribe(listener);return ()=>{subscriptions--;off();};}};
 try{assert.throws(()=>mountCollectionFlow(host,{flow,idPrefix:'staged',permissions:{'follow-up-email':wrapped,'updates-email':broken}}),/Host subscription unavailable/);assert.equal(subscriptions,0);assert.equal(host.innerHTML,before);for(const c of Object.values(controllers))assert.notEqual(c.getSnapshot().status,'destroyed');}finally{for(const c of Object.values(controllers))c.destroy();dom.window.close();}
});
