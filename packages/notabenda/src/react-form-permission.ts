'use client';
// @requirements REQ-PRODUCT-REACT REQ-PRODUCT-FORM-PERMISSIONS REQ-PRODUCT-A11Y
import {createContext,createElement,useContext,useEffect,useMemo,useRef,useState,useSyncExternalStore} from 'react';
import type {ReactElement,ReactNode} from 'react';
import {mountFormPermission} from './form-permission.js';
import type {FormPermissionController,FormPermissionSnapshot} from './form-permission.js';

type Immutable<T> = T extends object ? {readonly [K in keyof T]:Immutable<T[K]>} : T;
export type ReactFormPermissionSnapshot=Immutable<FormPermissionSnapshot>;
function freeze<T>(value:T):Immutable<T> {
  if(value&&typeof value==='object'){for(const child of Object.values(value))freeze(child);Object.freeze(value);}
  return value as Immutable<T>;
}
function bridge(controller:FormPermissionController){
  // A server request must not reveal a browser's retained permission or pending command.
  const server=freeze<FormPermissionSnapshot>({checked:false,status:'idle',allowed:false,current:null});
  let current:ReactFormPermissionSnapshot|undefined,key:string|undefined;
  return {controller,server:()=>server,read(){const next=controller.getSnapshot(),serialized=JSON.stringify(next);if(key!==serialized){current=freeze(next);key=serialized;}return current!;},subscribe:(notify:()=>void)=>controller.subscribe(()=>notify())};
}
const Context=createContext<ReturnType<typeof bridge>|null>(null);
function useBridge(){const value=useContext(Context);if(!value)throw new Error('Mount FormPermissionProvider with a host-owned form permission controller.');return value;}
export interface FormPermissionProviderProps {controller:FormPermissionController;children?:ReactNode}
/** No controller creation, read, recovery delivery or destruction in the React lifecycle. */
export function FormPermissionProvider({controller,children}:FormPermissionProviderProps):ReactElement {
  const value=useMemo(()=>bridge(controller),[controller]);return createElement(Context.Provider,{value},children);
}
export function useFormPermissionController():FormPermissionController{return useBridge().controller;}
/** Cached, deeply immutable UI projection; server rendering always starts unchecked and off. */
export function useFormPermissionSnapshot():ReactFormPermissionSnapshot {const store=useBridge();return useSyncExternalStore(store.subscribe,store.read,store.server);}
export function useFormPermissionAllowed():boolean{return useFormPermissionSnapshot().allowed;}
const mounted=new WeakSet<FormPermissionController>();
export interface FormPermissionFieldProps {className?:string;fallback?:ReactNode}
/** One native field per controller. Form submission remains wholly owned by the application. */
export function FormPermissionField({className,fallback}:FormPermissionFieldProps):ReactElement {
  const controller=useFormPermissionController(),container=useRef<HTMLDivElement>(null),[ready,setReady]=useState(false);
  useEffect(()=>{
    if(mounted.has(controller))throw new Error('Mount one FormPermissionField per form permission controller.');
    const target=container.current;if(!target)return;
    const field=mountFormPermission(target,{permission:controller});mounted.add(controller);setReady(true);
    return ()=>{field.destroy();mounted.delete(controller);setReady(false);};
  },[controller]);
  return createElement('div',{className},createElement('div',{ref:container}),createElement('div',{hidden:ready},fallback??createElement('p',null,'Permission controls require JavaScript. Use the site’s privacy contact for help.')));
}
