// @requirements REQ-PRODUCT-STORAGE-CLEANUP REQ-PRODUCT-CONSENT-RUNTIME
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {createConsent,registerStorageService} from 'notabenda';
import {fixture} from './helpers.mjs';
const deferred=()=>{let resolve;const promise=new Promise(done=>{resolve=done;});return {promise,resolve};};
const access=values=>({getItem:key=>values.get(key)??null,removeItem:key=>values.delete(key),setItem:(key,value)=>values.set(key,value)});
async function setup(){
  const config=await fixture();config.purposes=[config.purposes[0]];
  config.services=[{id:'sample',name:'Sample',provider:'Fictional',location:'This browser',purposeIds:[config.purposes[0].id]}];
  config.storage=['localStorage','sessionStorage','cookie'].map((type,i)=>({id:'item-'+i,name:'synthetic-'+i,type,serviceId:'sample',duration:'Until withdrawal',classification:'optional'}));
  config.consent={purposes:[{id:config.purposes[0].id,scope:'one'}],services:[{id:'sample',scope:'one'}],grantLifetimeDays:1,refusalLifetimeDays:180,dismissalMinutes:30};
  const local=new Map(),session=new Map(),choices=new Map(),cookies=[];let time=Date.parse('2026-10-18T12:00:00Z');let timer;
  const env={storage:access(choices),now:()=>time,schedule(callback){timer=callback;return ()=>{};}};
  const cleanup={localStorage:()=>access(local),sessionStorage:()=>access(session),cookies:{hostname:'app.example.test',secure:true,expire:value=>cookies.push(value)}};
  const targets=[{storageId:'item-0'},{storageId:'item-1'},{storageId:'item-2',cookieScopes:[{path:'/sample'},{path:'/',domain:'example.test'}]}];
  return {config,local,session,choices,cookies,env,cleanup,targets,advance(){time+=86400001;timer?.();},options(c,start=()=>()=>{}){return {consent:c,serviceId:'sample',targets,start};}};
}

test('initial refusal clears only declared exact optional keys and never returns stored values',async()=>{
  const f=await setup();f.local.set('synthetic-0','secret-local');f.local.set('unrelated','keep');f.session.set('synthetic-1','secret-session');
  const c=createConsent(f.config,f.env);let starts=0;const a=registerStorageService(f.options(c,()=>{starts++;return ()=>{};}),f.cleanup);
  await c.settled();assert.equal(starts,0);assert.equal(f.local.get('synthetic-0'),undefined);assert.equal(f.session.get('synthetic-1'),undefined);assert.equal(f.local.get('unrelated'),'keep');
  const report=a.getSnapshot().report;assert.equal(report.reason,'initial');assert.equal(report.failed,false);assert.deepEqual(report.results.map(r=>r.status),['absent-at-check','absent-at-check','expiration-requested','expiration-requested']);
  assert.match(f.cookies[0],/^synthetic-2=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=\/sample; Secure$/);assert.match(f.cookies[1],/Path=\/; Domain=example.test; Secure$/);
  assert.doesNotMatch(JSON.stringify(report),/secret|keep|synthetic-/);report.results[0].status='changed';assert.equal(a.getSnapshot().report.results[0].status,'absent-at-check');
  await a.destroy();c.destroy();
});

test('known granted service keeps data at registration and withdrawal clears synchronously then after late teardown writes',async()=>{
  const f=await setup();const c=createConsent(f.config,f.env);c.acceptAll();f.local.set('synthetic-0','existing');let signal;
  const entered=deferred(),finish=deferred();const a=registerStorageService(f.options(c,context=>{signal=context.signal;return async()=>{entered.resolve();await finish.promise;f.local.set('synthetic-0','late');};}),f.cleanup);
  assert.equal(a.getSnapshot().report,null);assert.equal(f.local.get('synthetic-0'),'existing');await c.settled();c.rejectAll();assert.equal(signal.aborted,true);assert.equal(f.local.has('synthetic-0'),false);assert.equal(a.getSnapshot().report.reason,'abort');
  await entered.promise;finish.resolve();await c.settled();assert.equal(f.local.has('synthetic-0'),false);assert.equal(a.getSnapshot().report.reason,'teardown');await a.destroy();c.destroy();
});

test('withdrawal during pending startup and immediate regrant waits for old final deletion before new writes',async()=>{
  const f=await setup();const c=createConsent(f.config,f.env);const entered=deferred(),ready=deferred(),stopping=deferred(),finish=deferred();let starts=0;
  const a=registerStorageService(f.options(c,async()=>{starts++;if(starts===1){f.local.set('synthetic-0','first');entered.resolve();await ready.promise;return async()=>{stopping.resolve();await finish.promise;f.local.set('synthetic-0','late first');};}assert.equal(f.local.has('synthetic-0'),false);f.local.set('synthetic-0','second');return ()=>{};}),f.cleanup);
  c.acceptAll();await entered.promise;c.rejectAll();assert.equal(f.local.has('synthetic-0'),false);c.acceptAll();ready.resolve();await stopping.promise;assert.equal(starts,1);finish.resolve();await c.settled();assert.equal(starts,2);assert.equal(f.local.get('synthetic-0'),'second');await a.destroy();assert.equal(f.local.has('synthetic-0'),false);c.destroy();
});

test('writes followed by rejected startup, invalid cleanup or throwing teardown are cleared and require reload',async()=>{
  for(const behavior of ['throw','invalid','stop']){
    const f=await setup();const c=createConsent(f.config,f.env);let starts=0;
    const a=registerStorageService(f.options(c,async()=>{starts++;f.local.set('synthetic-0','partial');if(behavior==='throw')throw new Error('private exception');if(behavior==='invalid')return null;return ()=>{f.local.set('synthetic-0','late');throw new Error('private exception');};}),f.cleanup);
    c.acceptAll();await c.settled();if(behavior==='stop'){c.rejectAll();await c.settled();}assert.equal(f.local.has('synthetic-0'),false);assert.equal(c.getSnapshot().services.sample,'reload-required');c.acceptAll();await c.settled();assert.equal(starts,1);assert.doesNotMatch(JSON.stringify(a.getSnapshot()),/private exception/);await a.destroy();c.destroy();
  }
});

test('failed initial removal tries all targets, retries before startup, and refuses producer if failure persists',async()=>{
  for(const recover of [false,true]){
    const f=await setup();const c=createConsent(f.config,f.env);let blocked=true,starts=0;
    f.cleanup.localStorage=()=>({removeItem(){if(blocked)throw new Error('private value');},getItem(){return null;}});f.session.set('synthetic-1','old');
    const a=registerStorageService(f.options(c,()=>{starts++;return ()=>{};}),f.cleanup);assert.equal(a.getSnapshot().report.failed,true);assert.equal(f.session.has('synthetic-1'),false);assert.equal(f.cookies.length,2);
    blocked=!recover;c.acceptAll();await c.settled();assert.equal(starts,recover?1:0);assert.equal(c.getSnapshot().services.sample,recover?'active':'reload-required');assert.doesNotMatch(JSON.stringify(a.getSnapshot()),/private value/);await a.destroy();c.destroy();
  }
});

test('blocked getters, ineffective removal and cookie setters are reported independently without interrupting abort',async()=>{
  const f=await setup();const c=createConsent(f.config,f.env);const a=registerStorageService(f.options(c,()=>{f.local.set('synthetic-0','live');return ()=>{};}),f.cleanup);c.acceptAll();await c.settled();
  f.cleanup.localStorage=()=>({removeItem(){},getItem:()=> 'still here'});f.cleanup.sessionStorage=()=>{throw new Error('private reason');};Object.defineProperty(f.cleanup,'cookies',{get(){throw new Error('private reason');}});
  assert.doesNotThrow(()=>c.rejectAll());assert.deepEqual(a.getSnapshot().report.results.map(r=>r.error),['still-present','unavailable','operation-failed','operation-failed']);await c.settled();assert.equal(c.getSnapshot().services.sample,'reload-required');await a.destroy();c.destroy();
});

test('expiry and GPC restriction clear storage while a cookie purpose grant may remain',async()=>{
  for(const kind of ['expiry','GPC']){
    const f=await setup();let signal=false;if(kind==='GPC'){f.config.services[0].processingActivities=['sale'];f.config.privacySignals={globalPrivacyControl:{appliesTo:['sale'],explanation:'Synthetic restriction policy.'}};f.env.globalPrivacyControl=()=>signal;}
    const c=createConsent(f.config,f.env);const a=registerStorageService(f.options(c,()=>{f.local.set('synthetic-0','live');return ()=>{};}),f.cleanup);c.acceptAll();await c.settled();assert.equal(f.local.has('synthetic-0'),true);
    if(kind==='expiry')f.advance();else {signal=true;c.refresh();assert.equal(c.getSnapshot().permissions[f.config.purposes[0].id],true);}assert.equal(f.local.has('synthetic-0'),false);await c.settled();await a.destroy();c.destroy();
  }
});

test('destroy is idempotent, awaits owned pending generation, emits detached state and ignores unrelated pending teardown',async()=>{
  const f=await setup();f.config.services.push({...f.config.services[0],id:'other'});f.config.consent.services.push({id:'other',scope:'one'});
  const c=createConsent(f.config,f.env),entered=deferred(),ready=deferred(),otherEntered=deferred(),otherDone=deferred();
  c.registerService('other',{purposes:[f.config.purposes[0].id],start:()=>async()=>{otherEntered.resolve();await otherDone.promise;}});
  const a=registerStorageService(f.options(c,async({signal})=>{entered.resolve(signal);await ready.promise;return ()=>{f.local.set('synthetic-0','late');};}),f.cleanup);
  const states=[];a.subscribe(s=>{states.push(s.state);if(s.report)s.report.failed=true;});a.subscribe(()=>{throw new Error();});c.acceptAll();const signal=await entered.promise;let closed=false;const close=a.destroy();assert.equal(close,a.destroy());close.then(()=>{closed=true;});assert.equal(signal.aborted,true);assert.equal(a.getSnapshot().state,'closing');assert.throws(()=>a.subscribe(()=>{}));await Promise.resolve();assert.equal(closed,false);
  c.rejectAll();await otherEntered.promise;ready.resolve();await close;assert.equal(f.local.has('synthetic-0'),false);assert.equal(a.getSnapshot().state,'closed');assert.equal(a.getSnapshot().report.failed,false);assert.ok(states.includes('closing'));assert.equal(states.at(-1),'closed');otherDone.resolve();await c.settled();c.destroy();
});

test('destroy before queued startup prevents producer and duplicate registration never deletes live data',async()=>{
  const f=await setup();const c=createConsent(f.config,f.env);c.acceptAll();let starts=0;const a=registerStorageService(f.options(c,()=>{starts++;return ()=>{};}),f.cleanup);await a.destroy();await c.settled();assert.equal(starts,0);f.local.set('synthetic-0','preserved');assert.throws(()=>registerStorageService(f.options(c),f.cleanup));assert.equal(f.local.get('synthetic-0'),'preserved');c.destroy();
});

test('validation rejects complete invalid batches before any registration or storage mutation',async()=>{
  const invalid=[
    f=>f.targets.push({storageId:'missing'}),f=>f.targets.push(f.targets[0]),f=>f.targets[0].extra=true,
    f=>f.config.storage[0].classification='necessary',f=>f.config.storage[0].name='notabenda:private',
    f=>f.targets[0].cookieScopes=[{path:'/'}],f=>f.config.storage.push({...f.config.storage[0],id:'shared'}),
    f=>f.targets[2].cookieScopes=[],f=>f.targets[2].cookieScopes=[{path:'/; injected=true'}],f=>f.targets[2].cookieScopes=[{path:'/\n'}],
    f=>f.targets[2].cookieScopes=[{path:'/',domain:'foreign.test'}],f=>f.targets[2].cookieScopes=[{path:'/',domain:'ample.test'}],f=>f.targets[2].cookieScopes=[{path:'/',domain:'.example.test'}],
    f=>f.targets[2].cookieScopes=[{path:'/',domain:'a'.repeat(64)+'.test'}],f=>f.targets[2].cookieScopes=[{path:'/'},{path:'/'}],
    f=>f.config.storage[2].name='bad;cookie',f=>f.config.storage[2].name='__Http-private',f=>f.config.storage[2].name='__Host-Http-private',
    f=>f.config.storage[2].name='__Host-token',f=>{f.config.storage[2].name='__Secure-token';f.cleanup.cookies.secure=false;}
  ];
  for(const mutate of invalid){const f=await setup();mutate(f);if(f.config.storage[0].classification==='necessary')f.config.storage[0].necessityReason='Fictional necessity';const c=createConsent(f.config,f.env);f.local.set('synthetic-0','untouched');assert.throws(()=>registerStorageService(f.options(c),f.cleanup));assert.equal(f.local.get('synthetic-0'),'untouched');assert.equal(f.cookies.length,0);c.destroy();}
});

test('SSR with no browser reports unavailable capabilities; missing cookie scopes cannot be guessed',async()=>{
  const f=await setup();const c=createConsent(f.config,f.env);const a=registerStorageService(f.options(c));assert.ok(a.getSnapshot().report.results.every(r=>r.status==='failed'&&r.error==='unavailable'));await a.destroy();c.destroy();
});

test('default browser capabilities remove same-path cookies and storage while preserving unrelated browser keys',async()=>{
  const f=await setup();f.targets[2].cookieScopes=[{path:'/sample'}];const dom=new JSDOM('',{url:'https://app.example.test/sample'});const previous=Object.getOwnPropertyDescriptor(globalThis,'window');Object.defineProperty(globalThis,'window',{configurable:true,value:dom.window});let c,a;
  try{dom.window.localStorage.setItem('synthetic-0','old');dom.window.sessionStorage.setItem('synthetic-1','old');dom.window.localStorage.setItem('unrelated','keep');dom.window.document.cookie='synthetic-2=value; Path=/sample; Secure';assert.match(dom.window.document.cookie,/synthetic-2/);c=createConsent(f.config,f.env);a=registerStorageService(f.options(c));assert.equal(dom.window.localStorage.getItem('synthetic-0'),null);assert.equal(dom.window.sessionStorage.getItem('synthetic-1'),null);assert.equal(dom.window.localStorage.getItem('unrelated'),'keep');assert.doesNotMatch(dom.window.document.cookie,/synthetic-2/);assert.equal(a.getSnapshot().report.results[2].status,'expiration-requested');}
  finally{await a?.destroy();c?.destroy();previous?Object.defineProperty(globalThis,'window',previous):delete globalThis.window;dom.window.close();}
});

test('withdrawal before queued start deletes existing granted storage, including zero-generation destroy',async()=>{
  for(const action of ['withdraw','destroy','GPC']){
    const f=await setup();let signal=false;if(action==='GPC'){f.config.services[0].processingActivities=['sale'];f.config.privacySignals={globalPrivacyControl:{appliesTo:['sale'],explanation:'Synthetic restriction policy.'}};f.env.globalPrivacyControl=()=>signal;}
    const c=createConsent(f.config,f.env);c.acceptAll();f.local.set('synthetic-0','previous visit');let starts=0;const a=registerStorageService(f.options(c,()=>{starts++;return ()=>{};}),f.cleanup);
    if(action==='destroy')await a.destroy();else if(action==='withdraw')c.rejectAll();else signal=true;
    await c.settled();assert.equal(starts,0);assert.equal(f.local.has('synthetic-0'),false,action);await a.destroy();assert.equal(a.getSnapshot().report.reason,'destroy');c.destroy();
  }
});

test('retry observers can withdraw or destroy without starting a revoked producer',async()=>{
  for(const action of ['withdraw','destroy']){
    const f=await setup();let blocked=true,starts=0;f.cleanup.localStorage=()=>({removeItem(){if(blocked)throw new Error();},getItem:()=>null});const c=createConsent(f.config,f.env);const a=registerStorageService(f.options(c,()=>{starts++;return ()=>{};}),f.cleanup);
    a.subscribe(snapshot=>{if(snapshot.report?.reason==='retry'){if(action==='withdraw')c.rejectAll();else void a.destroy();}});blocked=false;c.acceptAll();await c.settled();assert.equal(starts,0);await a.destroy();c.destroy();
  }
});
