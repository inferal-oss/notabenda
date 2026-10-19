// @requirements REQ-PRODUCT-SCOPE-GUARDS
// @requirements REQ-PRODUCT-PROCESSING-CHOICES
'use client';

import {createContext,createElement,useContext,useEffect,useMemo,useRef,useSyncExternalStore} from 'react';
import type {ReactElement,ReactNode,ButtonHTMLAttributes} from 'react';
import type {ConsentController,ConsentSnapshot,ChoiceStatus,ServiceStatus} from './consent.js';
import type {ProcessingActivity} from './types.js';
import {evaluateScopeGuards} from './scope-guards.js';
import type {ScopeGuardDecision,ScopeGuardReason} from './scope-guards.js';
import {mountControls} from './controls.js';
export {LegalDocument,LegalLinks,CollectionNotice} from './react-documents.js';
export type {LegalDocumentProps,LegalLinksProps,CollectionNoticeProps} from './react-documents.js';

export interface ReactConsentSnapshot extends Readonly<Omit<ConsentSnapshot,'purposes'|'permissions'|'servicePermissions'|'privacySignals'|'processingChoices'|'services'|'evidence'|'scopeGuards'>> {
  readonly scopeGuards:Readonly<Omit<ScopeGuardDecision,'blockedPurposeIds'|'blockedServiceIds'|'purposeRestrictions'>>&{readonly blockedPurposeIds:readonly string[];readonly blockedServiceIds:readonly string[];readonly purposeRestrictions:Readonly<Record<string,readonly (Readonly<Omit<ScopeGuardReason,'requirementIds'>>&{readonly requirementIds:readonly string[]})[]>>};
  readonly purposes:Readonly<Record<string,ChoiceStatus>>;
  readonly permissions:Readonly<Record<string,boolean>>;
  readonly servicePermissions:Readonly<Record<string,boolean>>;
  readonly privacySignals?:Readonly<{globalPrivacyControl:NonNullable<ConsentSnapshot['privacySignals']>['globalPrivacyControl'];restrictedActivities:readonly ProcessingActivity[];restrictedServices:Readonly<Record<string,readonly ProcessingActivity[]>>}>;
  readonly processingChoices?:Readonly<Omit<NonNullable<ConsentSnapshot['processingChoices']>,'restrictedActivities'|'blockedActivities'>&{restrictedActivities:readonly ProcessingActivity[];blockedActivities:readonly ProcessingActivity[]}>;
  readonly services:Readonly<Record<string,ServiceStatus>>;
  readonly evidence?:Readonly<NonNullable<ConsentSnapshot['evidence']>>;
}
function immutable(value:ConsentSnapshot):ReactConsentSnapshot {
  Object.freeze(value.purposes);Object.freeze(value.permissions);Object.freeze(value.servicePermissions);Object.freeze(value.services);
  if(value.privacySignals){Object.freeze(value.privacySignals.restrictedActivities);for(const activities of Object.values(value.privacySignals.restrictedServices))Object.freeze(activities);Object.freeze(value.privacySignals.restrictedServices);Object.freeze(value.privacySignals);}
  if(value.processingChoices){Object.freeze(value.processingChoices.restrictedActivities);Object.freeze(value.processingChoices.blockedActivities);Object.freeze(value.processingChoices);}
  for(const reasons of Object.values(value.scopeGuards.purposeRestrictions)){for(const reason of reasons){Object.freeze(reason.requirementIds);Object.freeze(reason);}Object.freeze(reasons);}Object.freeze(value.scopeGuards.purposeRestrictions);Object.freeze(value.scopeGuards.blockedPurposeIds);Object.freeze(value.scopeGuards.blockedServiceIds);Object.freeze(value.scopeGuards);
  if(value.evidence)Object.freeze(value.evidence);
  return Object.freeze(value);
}
function bridge(controller:ConsentController) {
  const config=controller.getConfig();const policy=config.consent!;
  const server=immutable({scopeGuards:evaluateScopeGuards(config),purposes:Object.fromEntries(policy.purposes.map(p=>[p.id,'unknown' as const])),permissions:Object.fromEntries(policy.purposes.map(p=>[p.id,false])),servicePermissions:Object.fromEntries(policy.services.map(s=>[s.id,false])),services:Object.fromEntries(policy.services.map(s=>[s.id,'blocked' as const])),shouldPrompt:false,preferencesOpen:false,persistence:'unavailable',destroyed:false,...(controller.getNotice()?{evidence:{status:'checking' as const,canGrant:false,canRetry:false,requiresChoice:false}}:{})});
  let current:ReactConsentSnapshot|undefined;let serialized:string|undefined;
  const read=()=>{
    // getSnapshot is a pure read; isAllowed can refresh storage and must never run during React render.
    const value=controller.getSnapshot();const key=JSON.stringify(value);
    if(key!==serialized){current=immutable(value);serialized=key;}
    return current!;
  };
  return {controller,read,server:()=>server,subscribe:(notify:()=>void)=>{
    if(controller.getSnapshot().destroyed){notify();return ()=>{};}
    // Subscribe before React's subsequent read, including after a period with no mounted consumers.
    return controller.subscribe(()=>notify());
  }};
}
type Bridge=ReturnType<typeof bridge>;
const ConsentContext=createContext<Bridge|null>(null);
function useBridge():Bridge {
  const value=useContext(ConsentContext);
  if(!value)throw new Error('Mount ConsentProvider with a host-owned consent controller before using Notabenda React hooks.');
  return value;
}
export interface ConsentProviderProps {controller:ConsentController;children?:ReactNode}

/** @requirements REQ-PRODUCT-REACT REQ-PRODUCT-CONSENT-RUNTIME REQ-PRODUCT-CONSENT-EVIDENCE
 * Connect an existing controller. No creation, registration, choice writes or controller destruction during render.
 */
export function ConsentProvider({controller,children}:ConsentProviderProps):ReactElement {
  const value=useMemo(()=>bridge(controller),[controller]);
  return createElement(ConsentContext.Provider,{value},children);
}
export function useConsentController():ConsentController {return useBridge().controller;}
/** Immutable UI state, with conservative SSR/hydration. Actual optional work must use registerService. */
export function useConsentSnapshot():ReactConsentSnapshot {
  const store=useBridge();return useSyncExternalStore(store.subscribe,store.read,store.server);
}
/** Effective UI permission, distinct from a locally saved purpose grant awaiting evidence. */
export function usePurposeAllowed(purposeId:string):boolean {return useConsentSnapshot().permissions[purposeId]===true;}
/** @requirements REQ-PRODUCT-PRIVACY-SIGNALS Effective service eligibility, including processing restrictions. */
export function useServiceAllowed(serviceId:string):boolean {return useConsentSnapshot().servicePermissions[serviceId]===true;}

const mounted=new WeakSet<ConsentController>();
export interface ConsentControlsProps {className?:string;preferencesLabel?:string}
/** Reuse the native nonmodal notice and user-opened drawer; one controls mount per controller. */
export function ConsentControls({className,preferencesLabel}:ConsentControlsProps):ReactElement {
  const controller=useConsentController();const container=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    if(controller.getSnapshot().destroyed)return;
    if(mounted.has(controller))throw new Error('Mount one ConsentControls component per consent controller. Use PreferencesButton for additional entry points.');
    const target=container.current;if(!target)return;
    const controls=mountControls(target,{consent:controller,...(preferencesLabel===undefined?{}:{preferencesLabel})});
    mounted.add(controller);
    return ()=>{controls.destroy({preservePreferences:true});mounted.delete(controller);};
  },[controller,preferencesLabel]);
  return createElement('div',{ref:container,className});
}
export type PreferencesButtonProps=Omit<ButtonHTMLAttributes<HTMLButtonElement>,'type'|'onClick'>;
export function PreferencesButton({children,disabled,...props}:PreferencesButtonProps):ReactElement {
  const controller=useConsentController();const state=useConsentSnapshot();
  return createElement('button',{...props,type:'button',disabled:disabled||state.destroyed,onClick:()=>controller.openPreferences()},children??'Privacy choices');
}

export {FormPermissionProvider,FormPermissionField,useFormPermissionController,useFormPermissionSnapshot,useFormPermissionAllowed} from './react-form-permission.js';
export type {FormPermissionProviderProps,FormPermissionFieldProps,ReactFormPermissionSnapshot} from './react-form-permission.js';
