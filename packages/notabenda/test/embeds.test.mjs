// @requirements REQ-PRODUCT-EMBED-LOCALIZATION
// @requirements REQ-PRODUCT-EMBEDS REQ-EU-DEVICE REQ-PRODUCT-CONSENT-RUNTIME REQ-PRODUCT-SAFE-CONTENT
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM,ResourceLoader} from 'jsdom';
import {createConsent,createEmbedService,renderEmbedPlaceholder,toPublicConfig,validateSiteConfig} from '@notabenda/core';
import {compileLegalDocuments,createConsentNotice} from '@notabenda/core/content';
import {recordLegalRelease,registerConsentNotice,setActiveConsentNotice,recordConsentChoice,getConsentHead} from '@notabenda/cloudflare';
import {createSyntheticStorage} from '../../notabenda-cf/examples/synthetic.mjs';
import {fixture} from './helpers.mjs';

const instant='2026-10-18T12:00:00.000Z';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const frame={kind:'iframe',src:'/fictional-frame',title:'Fictional map',description:'Optional map from the declared fictional provider.'};
const image={kind:'image',src:'https://media.example.test/image.png',title:'Fictional illustration',alt:'A fictional blue landscape',description:'Optional image from the same declared service.'};
async function setup(){
  const config=await fixture({reviewed:true});
  config.purposes=[config.purposes[0],{...structuredClone(config.purposes[0]),id:'media',name:'Embedded media'}];
  config.services=[{id:'optional-media',name:'Fictional media',provider:'Fictional provider',location:'Test only',purposeIds:config.purposes.map(p=>p.id),resourceOrigins:['self','https://media.example.test']}];config.storage=[];
  config.consent={purposes:config.purposes.map(p=>({id:p.id,scope:'one'})),services:[{id:'optional-media',scope:'one'}],grantLifetimeDays:1,refusalLifetimeDays:180,dismissalMinutes:30};
  const values=new Map();let clock=Date.parse(instant);let notify;let timer;
  const env={storage:{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)},now:()=>clock,schedule:callback=>{timer=callback;return ()=>{};},subscribe:(_key,callback)=>{notify=callback;return ()=>{};}};
  const requests=[];class Loader extends ResourceLoader{fetch(url){requests.push(url);return null;}}
  const dom=new JSDOM('<main><div id="a"></div><div id="b"></div><div id="c"></div></main>',{url:'https://app.example.test/',resources:new Loader()});
  return {config,env,values,dom,requests,get a(){return dom.window.document.querySelector('#a');},get b(){return dom.window.document.querySelector('#b');},get c(){return dom.window.document.querySelector('#c');},advance(){clock+=86400001;timer?.();},notify(){notify?.();}};
}

test('SSR placeholders are inert and escaped, and media declarations join public inventory and consent scope',async()=>{
  const html=renderEmbedPlaceholder({title:'A <script> title',description:'Plain & useful text'});
  assert.match(html,/&lt;script&gt;/);assert.match(html,/hidden disabled/);assert.doesNotMatch(html,/<iframe|<img|src=|srcset=|<link|<script/);
  assert.throws(()=>renderEmbedPlaceholder({title:'',description:'Missing title'}));
  const f=await setup();assert.deepEqual(toPublicConfig(f.config).services[0].resourceOrigins,['self','https://media.example.test']);
  for(const origins of [[],['https://media.example.test/'],['http://media.example.test'],['https://user@media.example.test'],['self','self'],['https://*.example.test'],[null]]){
    const invalid=structuredClone(f.config);invalid.services[0].resourceOrigins=origins;assert.equal(validateSiteConfig(invalid).valid,false,JSON.stringify(origins));
  }
  let controller=createConsent(f.config,f.env);controller.acceptAll();controller.destroy();
  f.config.services[0].resourceOrigins.push('https://new.example.test');controller=createConsent(f.config,f.env);assert.equal(Object.values(controller.getSnapshot().permissions).some(Boolean),false);controller.destroy();f.dom.window.close();
});

test('one lifecycle gates several resources, requires every purpose, and placeholder review never grants',async()=>{
  const f=await setup();const controller=createConsent(f.config,f.env);const group=createEmbedService({consent:controller,serviceId:'optional-media'});
  const a=group.mount(f.a,frame);group.mount(f.b,image);const doc=f.dom.window.document;
  assert.equal(doc.querySelectorAll('iframe,img,[src]').length,0);assert.equal(f.requests.length,0);
  f.a.querySelector('button').click();assert.equal(controller.getSnapshot().preferencesOpen,true);assert.equal(f.values.size,0);controller.closePreferences();
  const ids=f.config.purposes.map(p=>p.id);controller.choose({[ids[0]]:true,[ids[1]]:false});await controller.settled();assert.equal(doc.querySelectorAll('[src]').length,0);
  controller.acceptAll();await controller.settled();assert.equal(doc.querySelectorAll('[src]').length,2);assert.equal(f.requests.length,1);
  const node=f.a.querySelector('iframe');assert.equal(node.getAttribute('sandbox'),'');assert.equal(node.getAttribute('referrerpolicy'),'no-referrer');assert.equal(node.title,frame.title);
  a.destroy();assert.equal(doc.querySelectorAll('[src]').length,1);assert.equal(controller.getSnapshot().services['optional-media'],'active');
  controller.rejectAll();assert.equal(doc.querySelectorAll('[src]').length,0,'abort removes resources synchronously');await controller.settled();assert.equal(controller.getSnapshot().services['optional-media'],'blocked');
  group.destroy();controller.destroy();f.dom.window.close();
});

test('late mounts reconcile local storage, detached mounts stay inert, and disconnect/reconnect follows current permission',async()=>{
  const f=await setup();const controller=createConsent(f.config,f.env);const group=createEmbedService({consent:controller,serviceId:'optional-media'});
  controller.acceptAll();await controller.settled();const detached=f.dom.window.document.createElement('div');const mounted=group.mount(detached,image);assert.equal(detached.querySelector('img'),null);
  f.a.append(detached);await tick();assert.ok(detached.querySelector('img'));
  detached.remove();await tick();assert.equal(detached.querySelector('img'),null);assert.equal(detached.querySelector('[src]'),null);
  f.a.append(detached);await tick();assert.ok(detached.querySelector('img'));
  f.values.clear();group.mount(f.b,frame);assert.equal(f.b.querySelector('iframe'),null);assert.equal(detached.querySelector('img'),null);assert.equal(f.requests.length,0);
  mounted.destroy();group.destroy();controller.destroy();f.dom.window.close();
});

test('withdrawal, expiry and controller destruction invalidate resources and late errors cannot replace a new generation',async()=>{
  const f=await setup();const controller=createConsent(f.config,f.env);const group=createEmbedService({consent:controller,serviceId:'optional-media'});group.mount(f.a,image);
  controller.acceptAll();await controller.settled();const old=f.a.querySelector('img');controller.rejectAll();assert.equal(old.hasAttribute('src'),false);assert.equal(old.isConnected,false);
  controller.acceptAll();await controller.settled();const current=f.a.querySelector('img');assert.notEqual(current,old);old.dispatchEvent(new f.dom.window.Event('error'));assert.equal(f.a.querySelector('img'),current);
  f.advance();assert.equal(f.a.querySelector('img'),null);await controller.settled();
  controller.acceptAll();await controller.settled();assert.ok(f.a.querySelector('img'));controller.destroy();assert.equal(f.a.querySelector('img'),null);assert.equal(f.a.querySelector('button').hidden,true);
  group.destroy();await controller.settled();f.dom.window.close();
});

test('unsafe destinations/capabilities fail without changing the container and copied options cannot expand later',async()=>{
  const f=await setup();const controller=createConsent(f.config,f.env);const group=createEmbedService({consent:controller,serviceId:'optional-media'});f.a.textContent='Static fallback';
  for(const src of ['//evil.example.test/frame','https://evil.example.test/frame','http://media.example.test/frame','https://user:pass@media.example.test/frame','/\\evil.example.test/frame','javascript:alert(1)','data:text/html,test','mailto:person@example.test'])assert.throws(()=>group.mount(f.a,{...frame,src}));
  for(const spec of [{...frame,sandbox:['allow-scripts','allow-same-origin']},{...frame,sandbox:['not-a-token']},{...image,alt:''},{...frame,allow:'\nfullscreen'}])assert.throws(()=>group.mount(f.a,spec));
  assert.equal(f.a.textContent,'Static fallback');
  const spec={...frame,sandbox:['allow-forms']};const mounted=group.mount(f.a,spec);spec.src='https://evil.example.test';spec.sandbox.push('allow-scripts');
  controller.acceptAll();await controller.settled();assert.equal(f.a.querySelector('iframe').src,'https://app.example.test/fictional-frame');assert.equal(f.a.querySelector('iframe').getAttribute('sandbox'),'allow-forms');
  assert.throws(()=>group.mount(f.a,image),/one embed/);assert.throws(()=>createEmbedService({consent:controller,serviceId:'optional-media'}),/one lifecycle/);
  mounted.destroy();assert.equal(f.a.textContent,'Static fallback');group.destroy();assert.throws(()=>group.mount(f.b,frame),/live/);controller.destroy();f.dom.window.close();
});

test('individual image failure stays a readable placeholder without auto-retry or a stale error handler',async()=>{
  const f=await setup();const controller=createConsent(f.config,f.env);const group=createEmbedService({consent:controller,serviceId:'optional-media'});const mounted=group.mount(f.a,image);
  controller.acceptAll();await controller.settled();f.a.querySelector('img').dispatchEvent(new f.dom.window.Event('error'));assert.equal(f.a.querySelector('img'),null);assert.match(f.a.textContent,/could not load/);
  mounted.refresh();controller.rejectAll();controller.acceptAll();await controller.settled();assert.equal(f.a.querySelector('img'),null);assert.equal(f.a.querySelector('button').disabled,false);
  group.destroy();controller.destroy();f.dom.window.close();
});

// @requirements REQ-PRODUCT-CONSENT-EVIDENCE
test('required-receipt media waits for an actual acknowledgment and does not restart head verification on activation',async()=>{
  const f=await setup();const build=compileLegalDocuments(f.config);const notice=createConsentNotice(build.artifact,{scopeId:'embedded-media'});const storage=createSyntheticStorage([]);
  const context={siteId:f.config.site.id,scopeId:notice.scopeId,streamId:'fictional-embed-stream',now:()=>new Date(instant)};
  await recordLegalRelease(storage,build.artifact);await registerConsentNotice(storage,notice,context);await setActiveConsentNotice(storage,notice.noticeId,context);
  const initial=await getConsentHead(storage,context);let release;const delivery=new Promise(resolve=>{release=resolve;});let reads=0;
  const controller=createConsent(f.config,f.env,{evidence:{notice,streamRef:initial.streamRef,read(){assert.ok(++reads<5,'activation must not restart head verification');return getConsentHead(storage,context);},async write(body){await delivery;return recordConsentChoice(storage,body,context);}}});
  const group=createEmbedService({consent:controller,serviceId:'optional-media'});group.mount(f.a,frame);await controller.settled();controller.acceptAll();assert.equal(f.a.querySelector('iframe'),null);assert.equal(controller.getSnapshot().purposes[f.config.purposes[0].id],'granted');
  release();await controller.settled();assert.ok(f.a.querySelector('iframe'));assert.equal(f.requests.length,1);assert.equal(reads,1);
  group.mount(f.b,image);await controller.settled();assert.ok(f.b.querySelector('img'));assert.equal(reads,1);
  f.values.clear();group.mount(f.c,image);assert.equal(f.dom.window.document.querySelectorAll('[src]').length,0);await controller.settled();assert.equal(reads,2);
  group.destroy();controller.destroy();f.dom.window.close();
});
