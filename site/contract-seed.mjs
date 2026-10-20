// @requirements REQ-PRODUCT-CONTRACT-ACTIONS REQ-PRODUCT-DEMO-WORKSPACE
import {recordContractDeclaration,claimContractDelivery,settleContractDelivery} from '@notabenda/cloudflare';
const samples=[
 {key:'reading-return',route:'withdrawal',name:'Arden Vale',contract:'Juniper Notes · annual reading plan · JN-24031',email:'arden@example.test',at:'2026-10-16T09:12:00.000Z',application:'accepted',acknowledgement:'accepted'},
 {key:'monthly-ending',route:'cancellation',name:'Casey Reed',contract:'Juniper Notes · monthly studio · JN-24042',email:'casey@example.test',at:'2026-10-17T11:35:00.000Z',cancellation:{kind:'ordinary',reason:'',ending:'Zum Ende des laufenden Abrechnungszeitraums'},acknowledgement:'accepted'},
 {key:'service-unavailable',route:'cancellation',name:'Rowan Ellis',contract:'Juniper Notes · team studio · JN-24058',email:'rowan@example.test',at:'2026-10-18T08:20:00.000Z',cancellation:{kind:'extraordinary',reason:'Die vereinbarte Leistung steht nicht mehr zur Verfügung.',ending:''},acknowledgement:'uncertain'},
];
export async function seedContractDeclarations(storage,data){
 for(const sample of samples){
  const definition=data.contractActions.definitions[sample.route],digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(definition.definitionId+sample.key))),b=>b.toString(16).padStart(2,'0')).join(''),requestId=`${digest.slice(0,8)}-${digest.slice(8,12)}-4${digest.slice(13,16)}-8${digest.slice(17,20)}-${digest.slice(20,32)}`;
  const context={siteId:definition.siteId,actionId:definition.actionId,operationId:'seed-contract-'+sample.key+'-'+definition.definitionId,allowPreview:true,now:()=>new Date(sample.at)},fields={name:sample.name,contract:sample.contract,email:sample.email,...(sample.cancellation?{cancellation:sample.cancellation}:{})};
  const receipt=await recordContractDeclaration(storage,{schemaVersion:1,definitionId:definition.definitionId,requestId,clientAt:sample.at,fields},context);
  const existing=await storage.get('notabenda/contracts/'+definition.siteId+'/events/'+receipt.id);
  for(const channel of ['application','acknowledgement'])if(sample[channel]&&existing.delivery[channel].attempts===0){const lease=await claimContractDelivery(storage,receipt.id,channel,context);if(lease)await settleContractDelivery(storage,lease,sample[channel]==='accepted'?{status:'accepted',providerRef:'demo-provider-'+sample.key+'-'+channel}:{status:'uncertain'},context);}
 }
}
