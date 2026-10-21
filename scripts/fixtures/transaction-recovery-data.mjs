// @requirements REQ-PRODUCT-CF-REMOTE-RECOVERY REQ-PRODUCT-EVIDENCE-LIFECYCLE
// Node-only preparation. Compact recipes preserve the multi-chunk file test without embedding byte arrays.
import {randomUUID} from 'node:crypto';
import {createContractActionDefinition,canonicalJson,sha256} from '@notabenda/core/content';
import {createPaidOrderDefinition,createPaidOrderReview} from '@notabenda/authoring/orders';
import {contractDeclarationRef} from '@notabenda/cloudflare';
import {paidOrderCheckoutRef} from '@notabenda/cloudflare/orders';
export async function prepareTransactionRecovery(artifact,at,holdReviewAt){
 const siteId=artifact.manifest.siteId,roles=['retired','held','delivered','uncertain'],families=['contracts','orders'];
const definition=createContractActionDefinition(artifact,{actionId:'end-subscription',revision:'one',profile:'eu-withdrawal',reviewStatus:'reviewed'});
const data={at,siteId,artifact,definition,holdReviewAt,holdProbeId:randomUUID(),contracts:{},orders:{},decisions:Object.fromEntries(families.map(family=>[family,{requestId:randomUUID(),reason:'operator-erasure',eligibleAt:at,legalHold:false,...(family==='orders'?{externalWorkStopped:true}:{})}]))};
const orderDefinition=createPaidOrderDefinition({profile:'eu-paid-distance-order-v1',siteId,locale:'en',direction:'ltr',reviewStatus:'reviewed',documents:[],items:[{id:'service',productId:'consultation',name:'Planning appointment',kind:'service',characteristics:['One remote appointment'],commitment:{duration:'One appointment',termination:'No renewal',minimum:'One appointment'},guarantee:null}]});
const fixed=amountMinor=>({kind:'fixed',amountMinor});
for(const role of roles){
 const requestId=randomUUID(),context={siteId,actionId:definition.actionId,operationId:'fixture-operation-'+role},ref=await contractDeclarationRef(context,requestId);
 data.contracts[role]={context,contextRef:ref,id:sha256(canonicalJson([ref,requestId])),request:{schemaVersion:1,definitionId:definition.definitionId,requestId,clientAt:at,fields:{name:'Avery Linden',contract:'Sample annual plan '+role,email:'avery@example.test'}}};
 const orderContext={siteId,scopeId:'checkout',checkoutId:'fixture-'+role},contextRef=await paidOrderCheckoutRef(orderContext);
 const quote={quoteId:'quote-'+role,revision:'one',contextRef,definitionId:orderDefinition.definitionId,issuedAt:at,expiresAt:new Date(Date.parse(at)+15*60000).toISOString(),lines:[{itemId:'service',quantity:1}],pricing:{currency:'EUR',fractionDigits:2,payments:[{id:'appointment',lineIds:['service'],label:'Appointment',amount:fixed('12000'),due:{kind:'now'},recurrence:{kind:'once'}}],totalPrice:fixed('12000'),dueNow:fixed('12000'),taxAndChargesNotice:'VAT included'}};
 const review=createPaidOrderReview(orderDefinition,quote),request={schemaVersion:1,requestId:randomUUID(),reviewId:review.reviewId,definitionId:orderDefinition.definitionId,quoteId:quote.quoteId,quoteRevision:quote.revision,contextRef};
 const body='Contract C-1042-'+role+'\nPrepared for Alex Morgan\nOne planning appointment. Total EUR 120 including VAT.\nComplete fictional host-supplied contract and withdrawal information.\n';
 data.orders[role]={context:orderContext,contextRef,id:sha256(canonicalJson(['notabenda-paid-order-admission-v1',contextRef])),review,request,bundle:{request,contract:{reference:'C-1042-'+role,concludedAt:at},addressee:{name:'Alex Morgan',recipientRef:'customer-'+role,destinationRef:'contact-'+role,destinationVersion:'version-3'},issuedAt:at,locale:'en',reviewStatus:'reviewed',coverage:{selfContained:true,preContractInformation:'included-in-files',digitalContent:{status:'not-applicable',reason:'Service appointment.'}},files:[{id:'customer-copy',filename:'confirmation.txt',mediaType:'text/plain',role:'confirmation',recipe:{prefix:body,repeat:0,suffix:''}},{id:'terms',filename:'terms.html',mediaType:'text/html',role:'attachment',recipe:{prefix:'<!doctype html><h1>Sample terms</h1><!--'+role+' ',repeat:150000,suffix:'-->'}}]}};
}

 data.intents=families.flatMap(family=>['held','retired'].map(role=>({family,role,contextRef:data[family][role].contextRef,kind:role==='held'?'hold':'retirement'})));
 return data;
}
