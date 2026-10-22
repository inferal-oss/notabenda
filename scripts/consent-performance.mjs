// @requirements REQ-PRODUCT-BUNDLE-BUDGET REQ-PRODUCT-CONSENT-RUNTIME
// Shared Node/browser measurement loop. Synthetic storage, clock and lifecycles;
// no network, visitor records, timers, remote receipts or third-party loaders.
export function summarize(samples){
 if(!samples.length||samples.some(value=>!Number.isFinite(value)||value<0))throw Error('Invalid timing samples.');
 const sorted=[...samples].sort((a,b)=>a-b);
 return {unit:'ms',count:samples.length,min:sorted[0],median:sorted[Math.floor(sorted.length/2)],p95:sorted[Math.ceil(sorted.length*.95)-1],max:sorted.at(-1),samples};
}
export async function measureConsent({create,input,inventory,samples=30,warmup=8,batch=10,mount,yieldTask=async()=>{},clock=()=>performance.now()}){
 if(!Number.isInteger(samples)||samples<2||samples>200||!Number.isInteger(warmup)||warmup<0||warmup>100||!Number.isInteger(batch)||batch<1||batch>100)throw Error('Use bounded benchmark sample counts.');
 const instant=Date.parse('2026-10-19T12:00:00.000Z');
 const constructor=[],returningConstructor=[],snapshots=[],reject=[],grant=[],mounting=[];let starts=0,stops=0;
 const environment=(values=new Map(),write=()=>{})=>({storage:{getItem:key=>values.get(key)??null,setItem(key,value){write();values.set(key,value);},removeItem(key){write();values.delete(key);}},now:()=>instant,globalPrivacyControl:()=>false,schedule:()=>()=>{}});
 for(let index=-warmup;index<samples;index++){
  const env=environment(),start=clock(),controller=create(input,env);const elapsed=clock()-start;
  controller.destroy();await controller.settled();if(index>=0)constructor.push(elapsed);
  if(index%5===0)await yieldTask();
 }
 // Capture through the public controller, then restore a separate copy per sample.
 // Seeding storage and checking permissions are outside the timed constructor.
 const saved=new Map(),previous=create(input,environment(saved));
 try{previous.acceptAll();await previous.settled();if(!Object.values(previous.getSnapshot().servicePermissions).every(Boolean))throw Error('Benchmark saved grant was not effective.');}
 finally{previous.destroy();await previous.settled();}
 for(let index=-warmup;index<samples;index++){
  let writes=0;
  const values=new Map(saved),env=environment(values,()=>{writes++;}),start=clock(),controller=create(input,env),elapsed=clock()-start;
  try{
   const snapshot=controller.getSnapshot();
   if(!Object.values(snapshot.servicePermissions).every(Boolean)||snapshot.shouldPrompt||writes||JSON.stringify([...values])!==JSON.stringify([...saved]))throw Error('Benchmark returning choice changed or did not restore.');
  }finally{controller.destroy();await controller.settled();}
  if(index>=0)returningConstructor.push(elapsed);
  if(index%5===0)await yieldTask();
 }
 const controller=create(input,environment());let unmount;
 try{
  for(const service of inventory.services)controller.registerService(service.id,{purposes:service.purposeIds,start(){starts++;return ()=>{stops++;};}});
  if(mount){const start=clock();unmount=mount(controller);mounting.push(clock()-start);}
  controller.acceptAll();await controller.settled();
  if(!Object.values(controller.getSnapshot().servicePermissions).every(Boolean)||starts!==inventory.services.length)throw Error('Benchmark grants did not start exactly the declared services.');
  for(let index=-warmup;index<samples;index++){
   let start=clock();for(let count=0;count<batch;count++)controller.getSnapshot();
   const snapshotTime=(clock()-start)/batch;
   start=clock();controller.rejectAll();const rejectTime=clock()-start;await controller.settled();
   if(Object.values(controller.getSnapshot().servicePermissions).some(Boolean)||controller.getSnapshot().shouldPrompt)throw Error('Benchmark rejection left a permission or prompt.');
   start=clock();controller.acceptAll();const grantTime=clock()-start;await controller.settled();
   if(!Object.values(controller.getSnapshot().servicePermissions).every(Boolean))throw Error('Benchmark grant was not effective.');
   if(index>=0){snapshots.push(snapshotTime);reject.push(rejectTime);grant.push(grantTime);}
   await yieldTask();
  }
 }finally{try{unmount?.();}finally{controller.destroy();await controller.settled();}}
 if(starts!==stops)throw Error('Benchmark leaked a service lifecycle.');
 return {samples,warmup,snapshotBatch:batch,phases:{constructor:summarize(constructor),returningConstructor:summarize(returningConstructor),grantedSnapshot:summarize(snapshots),rejectCall:summarize(reject),grantCall:summarize(grant),...(mounting.length?{mountOnce:summarize(mounting)}:{})},lifecycle:{starts,stops},limits:['Constructors include normalization and initial synchronous state, but exclude module download/parse/evaluation and build-time compilation. Fresh construction uses empty storage; returning construction restores an exact local grant from a separate public controller. Seeding storage and checking permissions are outside the timed interval.','Decision timings end at synchronous API return; teardown/start completion and browser paint/INP are not timed.','Snapshot samples are ten-call batch averages by default; their p95 is not individual-call tail latency. Browser clock coarsening can produce zero or rounded durations.','Returning constructors and snapshots have saved local grants and a configured, not-observed GPC policy. No receipt transport or independent processing-choice controller is attached.','Browser mounting, when supplied, adds actual synchronous DOM work to decision calls. Node results do not measure layout or rendering.']};
}
