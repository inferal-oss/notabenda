// @requirements REQ-PRODUCT-LOCALIZATION
// @requirements REQ-PRODUCT-SCOPE-GUARDS
// @requirements REQ-PRODUCT-PROCESSING-CHOICES
'use client';

import {createContext,createElement,useContext,useEffect,useMemo,useRef,useSyncExternalStore} from 'react';
import type {ReactElement,ReactNode,ButtonHTMLAttributes} from 'react';
import type {ConsentStateController,ConsentSnapshot,ChoiceStatus,ServiceStatus} from './consent-types.js';
import type {ProcessingActivity} from './types.js';
import {evaluateScopeGuards} from './scope-guards.js';
import type {ScopeGuardDecision,ScopeGuardReason} from './scope-guards.js';
import {mountControls} from './controls.js';

export interface ReactConsentSnapshot extends Readonly<Omit<ConsentSnapshot,'purposes'|'permissions'|'servicePermissions'|'privacySignals'|'processingChoices'|'services'|'evidence'|'scopeGuards'|'promptDecision'>> {
  readonly scopeGuards:Readonly<Omit<ScopeGuardDecision,'blockedPurposeIds'|'blockedServiceIds'|'purposeRestrictions'>>&{readonly blockedPurposeIds:readonly string[];readonly blockedServiceIds:readonly string[];readonly purposeRestrictions:Readonly<Record<string,readonly (Readonly<Omit<ScopeGuardReason,'requirementIds'>>&{readonly requirementIds:readonly string[]})[]>>};
  readonly purposes:Readonly<Record<string,ChoiceStatus>>;
  readonly permissions:Readonly<Record<string,boolean>>;
  readonly servicePermissions:Readonly<Record<string,boolean>>;
  readonly privacySignals?:Readonly<{globalPrivacyControl:NonNullable<ConsentSnapshot['privacySignals']>['globalPrivacyControl'];restrictedActivities:readonly ProcessingActivity[];restrictedServices:Readonly<Record<string,readonly ProcessingActivity[]>>}>;
  readonly processingChoices?:Readonly<Omit<NonNullable<ConsentSnapshot['processingChoices']>,'restrictedActivities'|'blockedActivities'>&{restrictedActivities:readonly ProcessingActivity[];blockedActivities:readonly ProcessingActivity[]}>;
  readonly services:Readonly<Record<string,ServiceStatus>>;
  readonly evidence?:Readonly<NonNullable<ConsentSnapshot['evidence']>>;
  readonly promptDecision?:Readonly<Omit<NonNullable<ConsentSnapshot['promptDecision']>,'requirementIds'|'sourceIds'>>&{readonly requirementIds:readonly string[];readonly sourceIds:readonly string[]};
}
function immutable(value:ConsentSnapshot):ReactConsentSnapshot {
  Object.freeze(value.purposes);Object.freeze(value.permissions);Object.freeze(value.servicePermissions);Object.freeze(value.services);
  if(value.privacySignals){Object.freeze(value.privacySignals.restrictedActivities);for(const activities of Object.values(value.privacySignals.restrictedServices))Object.freeze(activities);Object.freeze(value.privacySignals.restrictedServices);Object.freeze(value.privacySignals);}
  if(value.processingChoices){Object.freeze(value.processingChoices.restrictedActivities);Object.freeze(value.processingChoices.blockedActivities);Object.freeze(value.processingChoices);}
  for(const reasons of Object.values(value.scopeGuards.purposeRestrictions)){for(const reason of reasons){Object.freeze(reason.requirementIds);Object.freeze(reason);}Object.freeze(reasons);}Object.freeze(value.scopeGuards.purposeRestrictions);Object.freeze(value.scopeGuards.blockedPurposeIds);Object.freeze(value.scopeGuards.blockedServiceIds);Object.freeze(value.scopeGuards);
  if(value.evidence)Object.freeze(value.evidence);
  if(value.promptDecision){Object.freeze(value.promptDecision.requirementIds);Object.freeze(value.promptDecision.sourceIds);Object.freeze(value.promptDecision);}
  return Object.freeze(value);
}
function bridge<Controller extends ConsentStateController>(controller:Controller) {
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
/** Shared mount ownership covers both React entry points. Contexts remain separately typed. */
const mounted=new WeakSet<ConsentStateController>();
export interface ReactConsentProviderProps<Controller extends ConsentStateController> {controller:Controller;children?:ReactNode}
export interface ConsentControlsProps {className?:string;preferencesLabel?:string}
export type PreferencesButtonProps=Omit<ButtonHTMLAttributes<HTMLButtonElement>,'type'|'onClick'>;
/** One implementation, independently typed contexts; no full-config cast in the compiled hook. */
export function createReactConsentBindings<Controller extends ConsentStateController>() {
  type Bridge=ReturnType<typeof bridge<Controller>>;
  const ConsentContext=createContext<Bridge|null>(null);
  function useBridge():Bridge {
   const value=useContext(ConsentContext);
   if(!value)throw new Error('Mount ConsentProvider from the same Notabenda React entry point before using its hooks.');
   return value;
  }
 /** @requirements REQ-PRODUCT-REACT REQ-PRODUCT-CONSENT-RUNTIME REQ-PRODUCT-CONSENT-EVIDENCE
  * Connect an existing controller. No creation, registration, choice writes or controller destruction during render.
  */
 function ConsentProvider({controller,children}:ReactConsentProviderProps<Controller>):ReactElement {
   const value=useMemo(()=>bridge(controller),[controller]);
   return createElement(ConsentContext.Provider,{value},children);
 }
 function useConsentController():Controller {return useBridge().controller;}
 /** Immutable UI state, with conservative SSR/hydration. Actual optional work must use registerService. */
 function useConsentSnapshot():ReactConsentSnapshot {
   const store=useBridge();return useSyncExternalStore(store.subscribe,store.read,store.server);
 }
 /** Effective UI permission, distinct from a locally saved purpose grant awaiting evidence. */
 function usePurposeAllowed(purposeId:string):boolean {return useConsentSnapshot().permissions[purposeId]===true;}
 /** @requirements REQ-PRODUCT-PRIVACY-SIGNALS Effective service eligibility, including processing restrictions. */
 function useServiceAllowed(serviceId:string):boolean {return useConsentSnapshot().servicePermissions[serviceId]===true;}

 /** Reuse the native nonmodal notice and user-opened drawer; one controls mount per controller. */
 function ConsentControls({className,preferencesLabel}:ConsentControlsProps):ReactElement {
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
 function PreferencesButton({children,disabled,...props}:PreferencesButtonProps):ReactElement {
   const controller=useConsentController();const state=useConsentSnapshot();
   const localization=controller.getNotice()?.localization??controller.getConfig().localization;
   return createElement('button',{'aria-haspopup':'dialog','aria-expanded':state.preferencesOpen,...props,...(localization&&children===undefined?{lang:localization.locale,dir:localization.direction}:{}),type:'button',disabled:disabled||state.destroyed,onClick:()=>controller.openPreferences()},children??localization?.consent.triggerLabel??'Privacy choices');
 }

 return {ConsentProvider,ConsentControls,PreferencesButton,useConsentController,useConsentSnapshot,usePurposeAllowed,useServiceAllowed};
}
