import {readSetupEditorDrafts} from './setup-session-editors.js';
// @requirements REQ-PRODUCT-SETUP-SESSION
import {normalizeCartridgeSelection} from './cartridges.js';
import type {CartridgeSelection} from './cartridges.js';
import {readSetupAnswers} from './setup.js';
import {readSetupCatalogSelections} from './catalog-selection.js';
import {readSetupCatalogRevisions} from './catalog-review.js';
import {toPublicConfig} from './config.js';
import type {SetupUIDraft} from './setup-ui.js';
/** Optional tab-local draft storage. It carries no runtime permissions or authorization. */
export interface PackSessionOptions {
 key:string;maxAgeMs?:number;
 storage?:Pick<Storage,'getItem'|'setItem'|'removeItem'>;
 /** Host clock; useful for deterministic expiry tests. */
 now?:()=>number;
}
export type PackSessionStatus='empty'|'saved'|'restored'|'expired'|'cleared'|'invalid'|'unavailable'|'too-large'|'unsaved';
export interface PackSessionDraft {schemaVersion:1;kind:'private-pack-session';selection:CartridgeSelection;view:'packs'|'setup';setup?:SetupUIDraft}
/** Validate the installed pins and questionnaire. Never plan unfinished answers during restoration. */
export function readPackSessionDraft(input:unknown):PackSessionDraft {
 const v=input as PackSessionDraft;
 const exact=(o:object,keys:string[])=>Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));
 if(!v||typeof v!=='object'||Array.isArray(v)||!exact(v,['schemaVersion','kind','selection','view',...(Object.hasOwn(v,'setup')?['setup']:[])])||v.schemaVersion!==1||v.kind!=='private-pack-session'||!['packs','setup'].includes(v.view))throw Error('Invalid saved pack draft.');
 const selection=normalizeCartridgeSelection(v.selection);let setup:SetupUIDraft|undefined;
 if(v.setup!==undefined){const d=v.setup;if(!d||typeof d!=='object'||Array.isArray(d)||!exact(d,['report','stage','prepared',...(Object.hasOwn(d,'config')?['config']:[]),...(Object.hasOwn(d,'editors')?['editors']:[])])||!Number.isInteger(d.stage)||d.stage<0||d.stage>5||typeof d.prepared!=='boolean'||d.report?.kind!=='private-setup-report'||d.report.schemaVersion!==1||d.report.questionnaireVersion!=='8')throw Error('Incompatible saved setup draft.');
  if(Object.keys(d.report).some(k=>!['schemaVersion','questionnaireVersion','kind','answers','catalogSelections','catalogSelectionRevisions','cartridges'].includes(k)))throw Error('Unknown saved report fields.');
  readSetupAnswers(d.report);readSetupCatalogSelections(d.report);readSetupCatalogRevisions(d.report);
  const pins=normalizeCartridgeSelection(d.report.cartridges);if(!pins.selected.length||v.view==='setup'&&JSON.stringify(pins)!==JSON.stringify(selection))throw Error('Saved setup pins do not match.');
  setup={...d,...(d.config===undefined?{}:{config:toPublicConfig(d.config,{mode:'preview'})}),...(d.editors===undefined?{}:{editors:readSetupEditorDrafts(d.editors)})};
 }
 if(v.view==='setup'&&(!setup||!selection.selected.length))throw Error('Saved setup is missing.');
 return {schemaVersion:1,kind:'private-pack-session',selection,view:v.view,...(setup?{setup}:{})};
}
const MAX_BYTES=1024*1024;
// Public projections may reorder keys during validation; that is not an edit.
const signature=(payload:unknown)=>JSON.stringify(payload,(_key,value)=>value&&typeof value==='object'&&!Array.isArray(value)?Object.fromEntries(Object.keys(value).sort().map(key=>[key,value[key]])):value);
export function createPackSession(window:Window,options:PackSessionOptions,onStatus:(status:PackSessionStatus)=>void){
 const ttl=options.maxAgeMs??86400000,now=options.now??Date.now;
 if(!/^[a-zA-Z0-9][a-zA-Z0-9:._/-]{0,159}$/u.test(options.key)||!Number.isSafeInteger(ttl)||ttl<60000||ttl>7*86400000||typeof now!=='function')throw Error('Supply a stable session key and expiry between one minute and seven days.');
 let storage:PackSessionOptions['storage'],timer:ReturnType<typeof setTimeout>|undefined,dead=false,last='',expires=0,savedAt=0;
 const status=(value:PackSessionStatus)=>{if(!dead)onStatus(value);};
 try{storage=options.storage??window.sessionStorage;}catch{status('unavailable');}
 function clock(){const t=now();if(!Number.isSafeInteger(t)||t<0||t>Number.MAX_SAFE_INTEGER-ttl)throw Error('Invalid draft clock.');return t;}
 function remove(value:PackSessionStatus){clearTimeout(timer);timer=undefined;expires=0;try{storage?.removeItem(options.key);status(value);}catch{status('unavailable');}}
 function expire(){if(dead||!expires)return;try{const t=clock();if(t<savedAt||t>=expires)remove('expired');else schedule();}catch{remove('unavailable');}}
 function schedule(){clearTimeout(timer);if(expires&&!dead){timer=setTimeout(expire,Math.max(1,expires-clock()));(timer as unknown as {unref?:()=>void}).unref?.();}}
 const visible=()=>{if(window.document.visibilityState==='visible')expire();};window.addEventListener('pageshow',expire);window.document.addEventListener('visibilitychange',visible);
 return {
  read():unknown {
   if(!storage){status('unavailable');return;}
   try{const raw=storage.getItem(options.key);if(raw===null){status('empty');return;}if(raw.length>MAX_BYTES||new TextEncoder().encode(raw).length>MAX_BYTES){remove('invalid');return;}
    const v=JSON.parse(raw),t=clock();if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).sort().join(',')!=='expiresAt,payload,savedAt,schemaVersion'||v.schemaVersion!==1||!Number.isSafeInteger(v.savedAt)||v.savedAt<0||!Number.isSafeInteger(v.expiresAt)||v.expiresAt-v.savedAt!==ttl){remove('invalid');return;}
    if(t<v.savedAt||t>=v.expiresAt){remove('expired');return;}savedAt=v.savedAt;expires=v.expiresAt;last=signature(v.payload);schedule();status('restored');return v.payload;
   }catch{remove('invalid');return;}
  },
  save(payload:unknown){
   if(dead||!storage)return;
   try{const encoded=signature(payload);if(typeof encoded!=='string')throw Error('Invalid draft.');if(encoded===last)return;const t=clock(),raw=JSON.stringify({schemaVersion:1,savedAt:t,expiresAt:t+ttl,payload});if(new TextEncoder().encode(raw).length>MAX_BYTES){status('too-large');return;}
    storage.setItem(options.key,raw);last=encoded;savedAt=t;expires=t+ttl;schedule();status('saved');
   }catch{status('unavailable');}
  },
  clear(payload?:unknown){last=signature(payload)??'';remove('cleared');},
  reject(){last='';remove('invalid');},
  unsaved(){status('unsaved');},
  destroy(){if(dead)return;dead=true;clearTimeout(timer);window.removeEventListener('pageshow',expire);window.document.removeEventListener('visibilitychange',visible);},
 };
}
