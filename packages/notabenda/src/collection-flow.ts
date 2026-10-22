// @requirements REQ-PRODUCT-COLLECTION-WORKBENCH
// @requirements REQ-PRODUCT-COLLECTION-FLOW REQ-TR-BASIS REQ-PRODUCT-A11Y REQ-PRODUCT-LOCALIZATION
import {assertPlainCatalogData} from './catalog-plain.js';
import {normalizeCollectionNotice,renderCollectionNotice,collectionNoticeIds} from './collection.js';
import type {CollectionNotice,CollectionNoticeSettings,CollectionNoticeRenderOptions} from './collection.js';
import {normalizeFormPermissionContent,normalizeFormPermissionOffer,formPermissionGrantSupported,mountFormPermission} from './form-permission.js';
import type {FormPermissionOffer,FormPermissionSettings,FormPermissionController} from './form-permission.js';

/** Presentation instructions, not a classification of a statutory processing condition. */
export type CollectionFlowDecision={purposeId:string;presentation:'notice-only'}|{purposeId:string;presentation:'separate-permission';permission:Omit<FormPermissionSettings,'purposeId'>};
export interface CollectionFlowSettings {reviewedArtifactId:string;notice:CollectionNoticeSettings;decisions:readonly CollectionFlowDecision[]}
export type CollectionFlowRoute={purposeId:string;presentation:'notice-only'}|{purposeId:string;presentation:'separate-permission';offerId:string};
export interface CollectionFlow {
 schemaVersion:1;kind:'notabenda-collection-flow';flowId:string;siteId:string;artifactId:string;mode:'preview'|'production';
 notice:CollectionNotice;routes:CollectionFlowRoute[];permissions:FormPermissionOffer[];
}
const invalid=():never=>{throw Error('Invalid collection flow. Declare one notice-only or separate-permission decision for every selected direct-collection purpose, bound to the reviewed release.');};
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const exact=(v:Record<string,unknown>,keys:string[])=>Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
const hash=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{64}$/u.test(v);
function canonical(v:unknown):string{return v===null||typeof v!=='object'?JSON.stringify(v):Array.isArray(v)?'['+v.map(canonical).join(',')+']':'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical((v as Record<string,unknown>)[k])).join(',')+'}';}
const same=(a:unknown,b:unknown)=>canonical(a)===canonical(b);
/** Shape/binding checks do not authenticate a descriptor. Hosts supply their trusted build. */
export function normalizeCollectionFlow(input:unknown,options:{allowPreview?:boolean}={}):CollectionFlow{
 let raw:unknown;
 try{assertPlainCatalogData(input);const json=JSON.stringify(input);if(new TextEncoder().encode(json).length>262144)return invalid();raw=JSON.parse(json);}catch{return invalid();}
 if(!object(raw)||!exact(raw,['schemaVersion','kind','flowId','siteId','artifactId','mode','notice','routes','permissions'])||raw.schemaVersion!==1||raw.kind!=='notabenda-collection-flow'||!hash(raw.flowId)||!Array.isArray(raw.routes)||!Array.isArray(raw.permissions)||raw.permissions.length>8)return invalid();
 const notice=normalizeCollectionNotice(raw.notice,options);
 if(raw.siteId!==notice.siteId||raw.artifactId!==notice.artifactId||raw.mode!==notice.mode||raw.routes.length!==notice.purposes.length||notice.purposes.some(p=>p.collection.source!=='direct'))return invalid();
 const permissions=raw.permissions.map(p=>normalizeFormPermissionOffer(p,options)),seen=new Set<string>(),ids=new Set<string>(),routes:CollectionFlowRoute[]=[];
 for(const [i,route] of raw.routes.entries()){
  const purpose=notice.purposes[i]!;
  if(!object(route)||route.purposeId!==purpose.id||typeof route.presentation!=='string'||!['notice-only','separate-permission'].includes(route.presentation)||!exact(route,route.presentation==='notice-only'?['purposeId','presentation']:['purposeId','presentation','offerId']))return invalid();
  if(route.presentation==='notice-only'){routes.push({purposeId:purpose.id,presentation:'notice-only'});continue;}
  const offer=permissions.find(p=>p.offerId===route.offerId);
  if(!offer||offer!==permissions[seen.size]||seen.has(offer.offerId)||ids.has(offer.permissionId)||offer.purposeId!==purpose.id||offer.siteId!==notice.siteId||offer.artifactId!==notice.artifactId||offer.mode!==notice.mode||!formPermissionGrantSupported(offer)||offer.marketingRequest!==undefined)return invalid();
  if(offer.localization?offer.localization.locale!==notice.locale||notice.localization&&offer.localization.direction!==notice.localization.direction:!/^en(?:-|$)/iu.test(notice.locale))return invalid();
  const recipients=notice.recipients.filter(r=>r.purposeIds.includes(purpose.id)).map(r=>({...r,purposeIds:[purpose.id]}));
  if(!same(offer.document,notice.document)||!same(offer.facts.controller,notice.controller)||!same(offer.facts.purpose,purpose)||!same(offer.facts.privacy,notice.privacy)||!same(offer.facts.recipients,recipients)||offer.wording.title.trim()===notice.wording.title.trim()||offer.wording.statement.trim()===notice.wording.intro.trim())return invalid();
  seen.add(offer.offerId);ids.add(offer.permissionId);routes.push({purposeId:purpose.id,presentation:'separate-permission',offerId:offer.offerId});
 }
 if(seen.size!==permissions.length)return invalid();
 return {schemaVersion:1,kind:'notabenda-collection-flow',flowId:raw.flowId,siteId:notice.siteId,artifactId:notice.artifactId,mode:notice.mode,notice,routes,permissions};
}
const escape=(value:string)=>value.replace(/[&<>"']/gu,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
/** Static disclosure and distinct permission text. No checkbox approves the notice. */
export function renderCollectionFlow(input:unknown,options:CollectionNoticeRenderOptions):string{
 const flow=normalizeCollectionFlow(input,{allowPreview:options?.allowPreview===true});
 const disclosure=renderCollectionNotice(flow.notice,options),ids=collectionNoticeIds(options.idPrefix),heading='h'+(options.headingLevel??2),l=flow.notice.localization;
 return `<div class="nb-collection-flow" data-collection-flow-id="${flow.flowId}" lang="${escape(flow.notice.locale)}"${l?` dir="${l.direction}"`:''}>${disclosure}${flow.permissions.map(offer=>{
  return renderCollectionFlowPermission(offer,ids.rootId,options.headingLevel??2);
 }).join('')}</div>`;
}
/** Shared static permission wording. No controls, reads or submissions are mounted. */
export function renderCollectionFlowPermission(input:unknown,rootId:string,headingLevel:2|3|4|5|6=2):string {
 return renderCollectionFlowPermissionPreview((({offerId:_,...content})=>content)(normalizeFormPermissionOffer(input,{allowPreview:true})),rootId,headingLevel);
}
/** Provisional static wording uses the same rendering without an offer identity. */
export function renderCollectionFlowPermissionPreview(input:unknown,rootId:string,headingLevel:2|3|4|5|6=2):string {
 const offer=normalizeFormPermissionContent(input),heading='h'+headingLevel;
 if(!/^[a-z][a-z0-9-]{0,126}$/u.test(rootId))throw Error('Use a derived collection notice ID.');if(![2,3,4,5,6].includes(headingLevel))throw Error('Use heading level 2–6.');
  const id=rootId+'-'+offer.permissionId;
  return `<div class="nb-collection-flow-slot" data-collection-permission="${escape(offer.permissionId)}"><section class="nb-form-permission" aria-labelledby="${id}"><${heading} id="${id}">${escape(offer.wording.title)}</${heading}><p>${escape(offer.wording.optionality)}</p><p>${escape(offer.wording.statement)}</p><p>${escape(offer.wording.withdrawalExplanation)}</p><a href="${escape(offer.withdrawalUrl)}">${escape(offer.localization?.formPermission.withdrawalHelp??'Withdrawal help')}</a></section></div>`;
}
/** Mount only supplied, exactly matching host controllers. No reads, grants or form-submit hooks. */
export function mountCollectionFlow(container:HTMLElement,options:{flow:unknown;idPrefix:string;headingLevel?:2|3|4|5|6;allowPreview?:boolean;permissions:Readonly<Record<string,FormPermissionController>>}):{destroy():void}{
 const flow=normalizeCollectionFlow(options.flow,{allowPreview:options.allowPreview===true}),controllers=options.permissions;
 if(!container?.ownerDocument||!object(controllers)||!exact(controllers,flow.permissions.map(p=>p.permissionId)))throw Error('Supply exactly the host-owned permission controllers required by this collection flow.');
 for(const offer of flow.permissions){const controller=controllers[offer.permissionId];if(!controller||typeof controller.getOffer!=='function'||!same(normalizeFormPermissionOffer(controller.getOffer(),{allowPreview:options.allowPreview===true}),offer))throw Error('A permission controller does not match the collection flow offer.');}
 const doc=container.ownerDocument,template=doc.createElement('template');template.innerHTML=renderCollectionFlow(flow,options);const rendered=template.content.firstElementChild!;
 const existing=[...container.children].filter(node=>node.hasAttribute('data-collection-flow-id'));
 if(existing.length>1)throw Error('Use one collection flow per dedicated mount container.');
 const root=existing[0]??rendered,hydrated=existing.length===1;
 if(hydrated){
  const copy=root.cloneNode(true) as Element;
  // Opening native disclosure details before hydration must not discard that reading state.
  for(const details of copy.querySelectorAll('details'))details.removeAttribute('open');
  if(!copy.isEqualNode(rendered))throw Error('The rendered collection flow does not match the supplied descriptor. Keep the exact static fragment.');
 }
 const mounted:{destroy():void}[]=[],replacements:{slot:HTMLElement;staged:HTMLElement;fallback:Node[];focused:HTMLElement|null}[]=[];
 try{for(const slot of root.querySelectorAll<HTMLElement>('[data-collection-permission]')){
  const staged=doc.createElement('div');mounted.push(mountFormPermission(staged,{permission:controllers[slot.dataset.collectionPermission!]!,...(options.headingLevel===undefined?{}:{headingLevel:options.headingLevel})}));
  replacements.push({slot,staged,fallback:[...slot.childNodes],focused:slot.contains(doc.activeElement)?doc.activeElement as HTMLElement:null});
 }}catch(error){for(const ui of mounted)ui.destroy();throw error;}
 for(const item of replacements){
  item.slot.replaceChildren(...item.staged.childNodes);
  if(item.focused&&doc.activeElement===doc.body){const href=item.focused.getAttribute('href');[...item.slot.querySelectorAll('a')].find(link=>link.getAttribute('href')===href)?.focus({preventScroll:true});}
 }
 if(!hydrated)container.append(root);let destroyed=false;
 return {destroy(){if(destroyed)return;destroyed=true;for(const ui of mounted)ui.destroy();if(hydrated)for(const {slot,fallback} of replacements)slot.replaceChildren(...fallback);else root.remove();}};
}
