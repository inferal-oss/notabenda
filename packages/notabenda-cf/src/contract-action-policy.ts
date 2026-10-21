// Generated from packages/notabenda/src/contract-action-policy.ts by scripts/sync-order-policy.mjs.
// @requirements REQ-PRODUCT-CONTRACT-LOCALIZATION
import {normalizeContractActionLocalization} from './contract-action-localization.js';
import type {ContractActionLocalization,ContractActionMessages} from './contract-action-localization.js';
// @requirements REQ-PRODUCT-CONTRACT-ACTIONS REQ-DE-CANCEL REQ-DE-WITHDRAWAL REQ-EU-WITHDRAWAL REQ-BR-CONTRACT
type BuildMode='production'|'preview';
export type ContractActionProfile='de-cancellation'|'de-withdrawal'|'eu-withdrawal'|'br-withdrawal';
export interface ContractActionDocument {title:string;url:string;version:string;effectiveDate:string;sha256:string;contentSha256:string;reviewStatus:'draft'|'reviewed'}
export interface ContractActionDefinition {schemaVersion:1|2;localization?:ContractActionLocalization;definitionId:string;siteId:string;actionId:string;revision:string;profile:ContractActionProfile;locale:string;renderingPolicy:'contract-form-v1'|'contract-form-v2';mode:BuildMode;reviewStatus:'draft'|'reviewed';artifactId:string;wording:{title:string;entryLabel:string;confirmLabel:string;statement:string};documents:{terms:ContractActionDocument;privacy:ContractActionDocument}}
export interface ContractActionFields {name:string;contract:string;email:string;cancellation?:{kind:'ordinary'|'extraordinary';reason:string;ending:string}}
export interface ContractActionRequest {schemaVersion:1;definitionId:string;requestId:string;clientAt:string;fields:ContractActionFields}
export interface ContractActionReceipt {schemaVersion:1;id:string;definitionId:string;requestId:string;operationRef:string;receivedAt:string;requestSha256:string;stage:'received';acknowledgement:{status:'pending';text:string;sha256:string}}
export const contractActionProfiles:readonly ContractActionProfile[]=['de-cancellation','de-withdrawal','eu-withdrawal','br-withdrawal'];
export const contractActionDefaults={
 'de-cancellation':{title:'Vertrag kündigen',entryLabel:'Verträge hier kündigen',confirmLabel:'jetzt kündigen',statement:'Hiermit kündige ich den bezeichneten Vertrag.'},
 'de-withdrawal':{title:'Vertrag widerrufen',entryLabel:'Vertrag widerrufen',confirmLabel:'Widerruf bestätigen',statement:'Hiermit widerrufe ich den bezeichneten Vertrag oder Vertragsteil.'},
 'eu-withdrawal':{title:'Withdraw from a contract',entryLabel:'Withdraw from contract here',confirmLabel:'Confirm withdrawal',statement:'I withdraw from the contract or part of the contract identified below.'},
 'br-withdrawal':{title:'Desistir do contrato',entryLabel:'Exercer direito de arrependimento',confirmLabel:'Confirmar desistência',statement:'Exerço o direito de arrependimento em relação ao contrato identificado abaixo.'},
} satisfies Record<ContractActionProfile,ContractActionDefinition['wording']>;
export const contractActionHash=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{64}$/u.test(v);
export const contractActionUuid=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/u.test(v);
export const contractActionIso=(v:unknown):v is string=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v;
const text=(v:unknown,max:number,empty=false):v is string=>typeof v==='string'&&(empty||v.trim().length>0)&&v.length<=max&&new TextEncoder().encode(v).length<=max&&!/[\u0000-\u001f\u007f]/u.test(v);
const multiline=(v:unknown,max:number,empty=false):v is string=>typeof v==='string'&&(empty||v.trim().length>0)&&new TextEncoder().encode(v).length<=max&&!/[\u0000-\u0008\u000b-\u001f\u007f]/u.test(v);
const slug=(v:unknown):v is string=>text(v,120)&&/^[a-z][a-z0-9-]*$/u.test(v);
function record(v:unknown,keys:string[]):Record<string,unknown>{
 if(!v||typeof v!=='object'||![Object.prototype,null].includes(Object.getPrototypeOf(v)))throw Error('Invalid contract action data.');
 const descriptors=Object.getOwnPropertyDescriptors(v),own=Reflect.ownKeys(descriptors);
 if(own.length!==keys.length||own.some(key=>typeof key!=='string'||!keys.includes(key)||!('value' in descriptors[key]!)))throw Error('Invalid contract action fields.');
 return Object.fromEntries(keys.map(key=>[key,descriptors[key]!.value]));
}
export function normalizeContractActionDefinition(input:unknown,options:{allowPreview?:boolean}={}):ContractActionDefinition {
 const localized=!!input&&typeof input==='object'&&Object.getOwnPropertyDescriptor(input,'schemaVersion')?.value===2;
 const d=record(input,['schemaVersion','definitionId','siteId','actionId','revision','profile','locale','renderingPolicy','mode','reviewStatus','artifactId','wording','documents',...(localized?['localization']:[])]);
 if((d.schemaVersion!==1&&d.schemaVersion!==2)||!contractActionHash(d.definitionId)||!contractActionHash(d.artifactId)||!slug(d.siteId)||!slug(d.actionId)||!text(d.revision,200)||!contractActionProfiles.includes(d.profile as ContractActionProfile)||d.renderingPolicy!==(localized?'contract-form-v2':'contract-form-v1')||!localized&&d.locale!==(String(d.profile).startsWith('de-')?'de-DE':d.profile==='br-withdrawal'?'pt-BR':'en')||typeof d.mode!=='string'||!['production','preview'].includes(d.mode)||typeof d.reviewStatus!=='string'||!['draft','reviewed'].includes(d.reviewStatus))throw Error('Invalid contract action definition.');
 const localization=localized?normalizeContractActionLocalization(d.localization,{locale:typeof d.locale==='string'?d.locale:'',allowPreview:options.allowPreview===true}):undefined;
 const w=record(d.wording,['title','entryLabel','confirmLabel','statement']);for(const [key,value] of Object.entries(w))if(!text(value,key==='statement'?2000:300))throw Error('Invalid contract action wording.');
 const documents=record(d.documents,['terms','privacy']),out:Record<string,ContractActionDocument>={};
 for(const kind of ['terms','privacy']){const item=record(documents[kind],['title','url','version','effectiveDate','sha256','contentSha256','reviewStatus']);if(!text(item.title,300)||!text(item.version,200)||item.url!==`/artifacts/${d.artifactId}/${kind}.html`||!contractActionHash(item.sha256)||!contractActionHash(item.contentSha256)||typeof item.effectiveDate!=='string'||!/^\d{4}-\d{2}-\d{2}$/u.test(item.effectiveDate)||!Number.isFinite(Date.parse(item.effectiveDate))||new Date(item.effectiveDate).toISOString().slice(0,10)!==item.effectiveDate||typeof item.reviewStatus!=='string'||!['draft','reviewed'].includes(item.reviewStatus))throw Error('Invalid contract document reference.');out[kind]=item as unknown as ContractActionDocument;}
 if(!options.allowPreview&&(d.mode!=='production'||d.reviewStatus!=='reviewed'||Object.values(out).some(item=>item.reviewStatus!=='reviewed')))throw Error('Contract actions require reviewed production wording and documents.');
 return {...d,...(localization?{localization}:{}),wording:w,documents:out} as unknown as ContractActionDefinition;
}
export function normalizeContractActionFields(input:unknown,profile:ContractActionProfile):ContractActionFields {
 const f=record(input,['name','contract','email',...(profile==='de-cancellation'?['cancellation']:[])]);
 if(!text(f.name,300)||!multiline(f.contract,2000)||!text(f.email,320)||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(f.email))throw Error('Provide a name, contract description and confirmation email.');
 const fields:ContractActionFields={name:f.name,contract:f.contract,email:f.email};
 if(profile==='de-cancellation'){const c=record(f.cancellation,['kind','reason','ending']);if(typeof c.kind!=='string'||!['ordinary','extraordinary'].includes(c.kind)||!multiline(c.reason,2000,true)||!text(c.ending,300,true)||c.kind==='ordinary'&&c.reason!=='')throw Error('Invalid cancellation details.');fields.cancellation=c as unknown as NonNullable<ContractActionFields['cancellation']>;}
 return fields;
}
export function normalizeContractActionRequest(input:unknown,definition:ContractActionDefinition):ContractActionRequest {
 const r=record(input,['schemaVersion','definitionId','requestId','clientAt','fields']);if(r.schemaVersion!==1||r.definitionId!==definition.definitionId||!contractActionUuid(r.requestId)||!contractActionIso(r.clientAt))throw Error('Invalid contract action request.');
 return {...r,fields:normalizeContractActionFields(r.fields,definition.profile)} as unknown as ContractActionRequest;
}
/** UI language is versioned by profile/locale and renderingPolicy. Host overrides change declaration wording through a new definition. */
export function contractActionLabels(profile:ContractActionProfile){
 const language=profile.startsWith('de-')?'de':profile==='br-withdrawal'?'pt':'en';
 return ({
  de:{retry:'Dieselbe Anfrage erneut senden',newTab:'öffnet in einem neuen Tab',preview:'Vorschau',name:'Name',contract:'Vertrag oder Vertragsteil',email:'E-Mail für die Eingangsbestätigung',type:'Art der Kündigung',choose:'Bitte auswählen',ordinary:'Ordentliche Kündigung',extraordinary:'Außerordentliche Kündigung',reason:'Kündigungsgrund (optional)',ending:'Gewünschter Beendigungszeitpunkt (optional)',earliest:'Frühestmöglicher Zeitpunkt',review:'Angaben prüfen',edit:'Angaben bearbeiten',received:'Erklärung eingegangen',pending:'Die Erklärung wurde gespeichert. Der Versand der elektronischen Eingangsbestätigung steht noch aus. Eine Vertragsbeendigung oder Rückzahlung wird hier nicht bestätigt.',download:'Erklärung speichern',copy:'Kopie Ihrer Erklärung',saving:'Erklärung wird übermittelt…',uncertain:'Der Eingang konnte nicht bestätigt werden. Wiederholen Sie dieselbe Anfrage; beginnen Sie keine zweite Erklärung.',invalid:'Bitte prüfen Sie Name, Vertragsangaben und E-Mail.',unavailable:'Das Formular konnte nicht sicher geprüft werden. Laden Sie die Seite neu oder nutzen Sie einen anderen angegebenen Kontaktweg.',sentBy:'Übermittelt über',clientAt:'Vom Browser angegebene Absendezeit',receivedAt:'Eingang',request:'Anfrage',definition:'Formularversion',scope:'Eingang einer Erklärung. Vertragszuordnung, Rechtswirkung, Rückzahlung und Zustellung werden gesondert bearbeitet.'},
  pt:{retry:'Reenviar a mesma solicitação',newTab:'abre em uma nova aba',preview:'Prévia',name:'Nome',contract:'Contrato ou parte do contrato',email:'E-mail para confirmação de recebimento',type:'Tipo de cancelamento',choose:'Selecione',ordinary:'Ordinário',extraordinary:'Extraordinário',reason:'Motivo (opcional)',ending:'Término solicitado (opcional)',earliest:'O mais cedo possível',review:'Revisar informações',edit:'Editar informações',received:'Declaração recebida',pending:'A declaração foi registrada. O envio da confirmação eletrônica está pendente. Esta tela não confirma rescisão ou reembolso.',download:'Salvar declaração',copy:'Cópia da declaração',saving:'Enviando declaração…',uncertain:'Não foi possível confirmar o recebimento. Tente novamente com a mesma solicitação; não crie uma segunda declaração.',invalid:'Confira o nome, o contrato e o e-mail.',unavailable:'Não foi possível verificar o formulário. Recarregue a página ou use outro canal de contato informado.',sentBy:'Enviado por',clientAt:'Horário de envio informado pelo navegador',receivedAt:'Recebido em',request:'Solicitação',definition:'Versão do formulário',scope:'Recebimento de declaração. Identificação do contrato, efeito jurídico, reembolso e entrega são tratados separadamente.'},
  en:{retry:'Retry the same request',newTab:'opens in a new tab',preview:'Preview',name:'Name',contract:'Contract or part of the contract',email:'Confirmation email',type:'Cancellation type',choose:'Choose a type',ordinary:'Ordinary cancellation',extraordinary:'Extraordinary cancellation',reason:'Reason (optional)',ending:'Requested ending (optional)',earliest:'Earliest possible',review:'Review details',edit:'Edit details',received:'Declaration received',pending:'Your declaration is recorded. Electronic acknowledgement is pending dispatch. This screen does not confirm contract termination or a refund.',download:'Save declaration',copy:'Your declaration copy',saving:'Sending declaration…',uncertain:'Receipt could not be confirmed. Retry the same request; do not start a second declaration.',invalid:'Check your name, contract details and email.',unavailable:'This form could not be verified. Reload the page or use another listed contact route.',sentBy:'Submitted through',clientAt:'Browser-reported submission',receivedAt:'Received',request:'Request',definition:'Form version',scope:'Receipt of a declaration. Contract matching, legal effect, refunds and delivery are separate.'},
 })[language];
}
/** Select only retained v2 messages; legacy profile labels stay unchanged. */
export function contractActionDefinitionLabels(definition:ContractActionDefinition):ContractActionMessages {
 return definition.schemaVersion===2?normalizeContractActionLocalization(definition.localization,{locale:definition.locale,allowPreview:true}).contractActions:contractActionLabels(definition.profile);
}
/** Immutable receipt copy; date of host receipt differs from the unverified browser click clock. */
export function contractActionAcknowledgement(definition:ContractActionDefinition,request:ContractActionRequest,receivedAt:string):string {
 const l=contractActionDefinitionLabels(definition);
 return [definition.wording.title,definition.wording.statement,`${l.name}: ${request.fields.name}`,`${l.contract}: ${request.fields.contract}`,`${l.email}: ${request.fields.email}`,...(request.fields.cancellation?[`${l.type}: ${request.fields.cancellation.kind==='ordinary'?l.ordinary:l.extraordinary}`,`${l.reason}: ${request.fields.cancellation.reason}`,`${l.ending}: ${request.fields.cancellation.ending||l.earliest}`]:[]),`${l.sentBy}: ${definition.wording.confirmLabel}`,`${l.clientAt}: ${request.clientAt}`,`${l.receivedAt}: ${receivedAt}`,`${l.request}: ${request.requestId}`,`${l.definition}: ${definition.definitionId}`,l.scope].join('\n');
}
