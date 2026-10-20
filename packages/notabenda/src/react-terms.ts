'use client';
// @requirements REQ-PRODUCT-REACT REQ-PRODUCT-TERMS-ADAPTERS REQ-PRODUCT-TERMS-ACCEPTANCE REQ-PRODUCT-A11Y
import {createContext,createElement,useContext,useLayoutEffect,useMemo,useRef,useState,useSyncExternalStore} from 'react';
import type {ReactElement,ReactNode} from 'react';
import {mountTermsAcceptance} from './terms.js';
import {claimTermsView} from './terms-view-owner.js';
import type {TermsAcceptanceController,TermsAcceptanceSnapshot} from './terms.js';

type Immutable<T> = T extends object ? {readonly [K in keyof T]:Immutable<T[K]>} : T;
export type ReactTermsAcceptanceSnapshot=Immutable<TermsAcceptanceSnapshot>;
function freeze<T>(value:T):Immutable<T> {
  if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}
  return value as Immutable<T>;
}
function bridge(controller:TermsAcceptanceController){
  // A server request must not reveal a browser's receipt or pending request.
  const server=freeze<TermsAcceptanceSnapshot>({checked:false,status:'idle'});
  let current:ReactTermsAcceptanceSnapshot|undefined,key:string|undefined;
  return {controller,server:()=>server,read(){const next=controller.getSnapshot(),serialized=JSON.stringify(next);if(key!==serialized){current=freeze(next);key=serialized;}return current!;},subscribe:(notify:()=>void)=>controller.subscribe(()=>notify())};
}
const Context=createContext<ReturnType<typeof bridge>|null>(null);
function useBridge(){const value=useContext(Context);if(!value)throw new Error('Mount TermsAcceptanceProvider with a host-owned terms acceptance controller.');return value;}
export interface TermsAcceptanceProviderProps {controller:TermsAcceptanceController;children?:ReactNode}
/** No controller creation, submission, recovery delivery or destruction in the React lifecycle. */
export function TermsAcceptanceProvider({controller,children}:TermsAcceptanceProviderProps):ReactElement {
  const value=useMemo(()=>bridge(controller),[controller]);return createElement(Context.Provider,{value},children);
}
export function useTermsAcceptanceController():TermsAcceptanceController{return useBridge().controller;}
/** Cached, deeply immutable UI projection; server rendering always starts unchecked and idle. */
export function useTermsAcceptanceSnapshot():ReactTermsAcceptanceSnapshot {const store=useBridge();return useSyncExternalStore(store.subscribe,store.read,store.server);}
export interface TermsAcceptanceControlProps {className?:string;fallback?:ReactNode}
/** One native control per controller. The application owns the operation and controller lifetime. */
export function TermsAcceptanceControl({className,fallback}:TermsAcceptanceControlProps):ReactElement {
  const controller=useTermsAcceptanceController(),container=useRef<HTMLDivElement>(null),[ready,setReady]=useState(false);
  // Dispose the old native handlers during commit, before parent layout effects can use a replaced operation.
  useLayoutEffect(()=>{
    const target=container.current;if(!target)return;
    const release=claimTermsView(controller);let field:ReturnType<typeof mountTermsAcceptance>;
    try{field=mountTermsAcceptance(target,{acceptance:controller});}catch(error){release();throw error;}
    setReady(true);
    return ()=>{field.destroy();release();setReady(false);};
  },[controller]);
  return createElement('div',{className},createElement('div',{ref:container}),createElement('div',{hidden:ready},fallback??createElement('p',null,'Agreement controls require JavaScript. Contact the site operator for help.')));
}
