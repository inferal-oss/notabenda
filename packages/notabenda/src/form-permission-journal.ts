// @requirements REQ-PRODUCT-FORM-PERMISSIONS
/** Atomic persistence is required: a read followed by an unrelated write is insufficient. */
export interface FormPermissionJournal {
  read(key:string):Promise<unknown>;
  update(key:string,change:(value:unknown)=>unknown):Promise<unknown>;
  subscribe?(key:string,changed:()=>void):()=>void;
}
export interface IndexedDBFormPermissionJournal extends FormPermissionJournal {close():void}

/** Optional browser storage. Opening, reading and notifications never perform network requests. */
export function createIndexedDBFormPermissionJournal(options:{databaseName?:string;indexedDB?:IDBFactory;broadcastChannel?:typeof BroadcastChannel|null}={}):IndexedDBFormPermissionJournal {
  const factory=options.indexedDB??globalThis.indexedDB,name=options.databaseName??'notabenda-form-permissions-v1';
  if(!factory||typeof name!=='string'||!name.trim()||name.length>200)throw new Error('IndexedDB is unavailable or its database name is invalid.');
  let closed=false,opening:Promise<IDBDatabase>|undefined;
  const listeners=new Map<string,Set<()=>void>>();
  const Channel=options.broadcastChannel===undefined?globalThis.BroadcastChannel:options.broadcastChannel;
  let channel:BroadcastChannel|undefined;try{if(Channel)channel=new Channel('notabenda:form-permissions:'+name);}catch{}
  const notify=(key:string)=>{for(const fn of listeners.get(key)??[])try{fn();}catch{}};
  if(channel)channel.onmessage=event=>{if(typeof event.data==='string')notify(event.data);};
  const visible=()=>{if(typeof document!=='undefined'&&document.visibilityState==='visible')for(const key of listeners.keys())notify(key);};
  if(typeof window!=='undefined'){window.addEventListener('pageshow',visible);document.addEventListener('visibilitychange',visible);}
  function open():Promise<IDBDatabase>{
    if(closed)return Promise.reject(new Error('Permission journal is closed.'));
    return opening??=new Promise((resolve,reject)=>{
      const request=factory.open(name,1);
      request.onupgradeneeded=()=>{request.result.createObjectStore('contexts');};
      request.onerror=()=>reject(new Error('Permission journal could not open.'));
      request.onblocked=()=>reject(new Error('Permission journal upgrade is blocked.'));
      request.onsuccess=()=>{const db=request.result;if(closed){db.close();reject(new Error('Permission journal is closed.'));return;}db.onversionchange=()=>db.close();resolve(db);};
    });
  }
  async function transaction(key:string,change?:((value:unknown)=>unknown)):Promise<unknown>{
    if(typeof key!=='string'||!key.length||key.length>512)throw new Error('Invalid journal key.');
    const db=await open();if(closed)throw new Error('Permission journal is closed.');
    return new Promise((resolve,reject)=>{
      const tx=db.transaction('contexts',change?'readwrite':'readonly',change?{durability:'strict'}:{}),store=tx.objectStore('contexts');let result:unknown,changed=false;
      const request=store.get(key);
      request.onsuccess=()=>{try{
        const previous=request.result;
        result=change?change(structuredClone(previous)):previous;
        if(change&&JSON.stringify(result)!==JSON.stringify(previous)){
          const serialized=JSON.stringify(result);if(serialized===undefined||new TextEncoder().encode(serialized).length>65536)throw new Error('Permission journal record is too large.');
          store.put(structuredClone(result),key);changed=true;
        }
      }catch{tx.abort();}};
      tx.oncomplete=()=>{resolve(structuredClone(result));if(changed){notify(key);try{channel?.postMessage(key);}catch{}}};
      tx.onabort=tx.onerror=()=>reject(new Error('Permission journal transaction failed.'));
    });
  }
  return {read:key=>transaction(key),update:(key,change)=>transaction(key,change),subscribe(key,changed){if(closed)throw new Error('Permission journal is closed.');const group=listeners.get(key)??new Set();group.add(changed);listeners.set(key,group);return ()=>{group.delete(changed);if(!group.size)listeners.delete(key);};},close(){if(closed)return;closed=true;channel?.close();if(typeof window!=='undefined'){window.removeEventListener('pageshow',visible);document.removeEventListener('visibilitychange',visible);}listeners.clear();void opening?.then(db=>db.close(),()=>{});}};
}
