// @requirements REQ-PRODUCT-CONTRACT-ACTIONS REQ-PRODUCT-EVIDENCE-LIFECYCLE
// Maintainer test fixture only. The runner binds loopback and supplies an ephemeral test capability.
import {DurableObject} from 'cloudflare:workers';
import {recordLegalRelease,registerContractActionDefinition,recordContractDeclaration,claimContractDelivery,settleContractDelivery,dispatchContractDeclaration,dispatchContractDelivery,createContractDeclarationStore} from '@notabenda/cloudflare';
import data from '../../site/dist/server-data.json' with {type:'json'};
const definition=data.contractActions.definitions.withdrawal;
export default {async fetch(request,env){
 const url=new URL(request.url);
 if(url.origin!==env.RUNTIME_ORIGIN||request.headers.get('X-Notabenda-Runtime')!==env.RUNTIME_KEY)return new Response('Not found',{status:404});
 if(request.method!=='POST')return new Response('Method not allowed',{status:405});
 return env.CASE.get(env.CASE.idFromName('owned-dispatch-case')).fetch(request);
}};
export class DispatchCase extends DurableObject {
 constructor(ctx,env){super(ctx,env);this.storage=ctx.storage;this.environment=env;}
 async fetch(request){
  const path=new URL(request.url).pathname,body=await request.json(),clock=await this.storage.get('runtime/clock')??'2026-10-19T12:00:00.000Z',context={siteId:definition.siteId,actionId:definition.actionId,operationId:'owned-local-operation',allowPreview:true,now:()=>new Date(clock)};
  if(path==='/clock'){if(!/^2026-10-19T12:00:\d\d\.000Z$/u.test(body.at))return new Response('Invalid test clock',{status:400});await this.storage.put('runtime/clock',body.at);return Response.json({ok:true});}
  if(path==='/capture'){
   await recordLegalRelease(this.storage,data.contractActions.artifact);await registerContractActionDefinition(this.storage,definition,context);
   const receipt=await recordContractDeclaration(this.storage,{schemaVersion:1,definitionId:definition.definitionId,requestId:body.requestId,clientAt:clock,fields:{name:'Avery Linden',contract:'Annual plan · sample JN-28017',email:'avery@example.test'}},context);return Response.json(receipt);
  }
  if(path==='/inspect'){const record=await createContractDeclarationStore(this.storage,{siteId:definition.siteId,allowPreview:true}).get(body.id);return Response.json(record??null);}
  if(path==='/lease')return Response.json(await claimContractDelivery(this.storage,body.id,body.channel,context,{leaseMs:1000})??null);
  if(path==='/settle')return Response.json(await settleContractDelivery(this.storage,body.lease,{status:'accepted',providerRef:'obsolete-caller'},context));
  const sink=this.environment.SINK.get(this.environment.SINK.idFromName('independent-provider'));
  if(path==='/provider')return sink.fetch(new Request('https://provider.example.test/inspect',{method:'POST',body:'{}'}));
  const deliver=mode=>async({lease,signal})=>{
   if(signal.aborted)throw Error('Aborted before provider.');
   const response=await sink.fetch(new Request('https://provider.example.test/accept',{method:'POST',body:JSON.stringify({deliveryId:lease.deliveryId,payloadSha256:lease.payloadSha256,channel:lease.channel})}));
   if(!response.ok)throw Error('Provider did not accept.');const result=await response.json();
   if(mode==='lose-response')throw Error('Simulated lost provider response.');
   if(mode==='hang')return new Promise(()=>{});
   return result;
  };
  if(path==='/dispatch')return Response.json(await dispatchContractDeclaration(this.storage,body.id,context,{acknowledgement:{deliver:deliver(body.acknowledgement),timeoutMs:3000},application:{deliver:deliver(body.application),timeoutMs:body.application==='hang'?100:3000}}));
  if(path==='/dispatch-one')return Response.json(await dispatchContractDelivery(this.storage,body.id,body.channel,context,{deliver:deliver(body.mode),timeoutMs:3000}));
  return new Response('Not found',{status:404});
 }
}
export class ProviderSink extends DurableObject {
 constructor(ctx,env){super(ctx,env);this.storage=ctx.storage;}
 async fetch(request){
  if(new URL(request.url).pathname==='/inspect')return Response.json(Object.fromEntries(await this.storage.list({prefix:'provider/'})));
  const body=await request.json();if(!/^[a-f0-9]{64}$/u.test(body.deliveryId)||!/^[a-f0-9]{64}$/u.test(body.payloadSha256)||!['acknowledgement','application'].includes(body.channel))return new Response('Invalid provider input',{status:400});
  return this.storage.transaction(async tx=>{
   const key='provider/'+body.deliveryId,prior=await tx.get(key);
   if(prior&&(prior.payloadSha256!==body.payloadSha256||prior.channel!==body.channel))return new Response('Idempotency conflict',{status:409});
   const value=prior?{...prior,calls:prior.calls+1}:{deliveryId:body.deliveryId,payloadSha256:body.payloadSha256,channel:body.channel,calls:1,commits:1,providerRef:'sample-provider-'+body.deliveryId};
   await tx.put(key,value);return Response.json({providerRef:value.providerRef});
  });
 }
}
