// @requirements REQ-PRODUCT-FORM-PERMISSIONS REQ-PRODUCT-DEMO-WORKSPACE
import {recordFormPermission,formPermissionStreamRef,getFormPermissionState} from '@notabenda/cloudflare';
const uuid=n=>`f03a0000-0000-4000-8000-${String(n).padStart(12,'0')}`;
export async function seedFormPermissionJourneys(storage,data){
 const offer=data.formPermissions.offer,marker='demo/form-permission-seed/'+offer.offerId;
 if(await storage.get(marker))return;
 let started=await storage.get('demo/form-permission-seed-time');if(!started){started=new Date().toISOString();await storage.put('demo/form-permission-seed-time',started);}
 const base=Date.parse(started),journeys=[['grant'],['grant','withdraw'],['withdraw'],['grant','withdraw','grant'],['grant'],['grant','withdraw']];
 for(const [reader,actions] of journeys.entries()){
  const context={siteId:offer.siteId,permissionId:offer.permissionId,streamId:`reader-${String(reader+1).padStart(2,'0')}:email-generation-1:${offer.offerId}`,allowPreview:true},expectedStreamRef=await formPermissionStreamRef(context),active=await getFormPermissionState(storage,context);
  for(const [index,action] of actions.entries()){
   const instant=new Date(base-(journeys.length-reader)*86400000+index*7200000);
   await recordFormPermission(storage,{schemaVersion:1,offerId:offer.offerId,requestId:uuid(reader*10+index+1),action,expectedStreamRef,clientAt:new Date(instant.getTime()-900).toISOString(),...(action==='grant'?{expectedRevision:index,expectedActivation:active.activeRevision}:{})},{...context,now:()=>instant});
  }
 }
 await storage.put(marker,{seededAt:started,journeys:journeys.length});
}
