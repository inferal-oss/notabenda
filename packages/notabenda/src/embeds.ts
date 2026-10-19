import type {ConsentController,ConsentSnapshot} from './consent.js';
import {isSafeLink} from './config.js';

export interface EmbedPlaceholder {title:string;description:string;preferencesLabel?:string}
export type EmbedOptions = EmbedPlaceholder & (
  {kind:'iframe';src:string;sandbox?:readonly string[];allow?:string} |
  {kind:'image';src:string;alt:string}
);
export interface MountedEmbed {refresh():void;destroy():void}
export interface EmbedService {mount(container:HTMLElement,options:EmbedOptions):MountedEmbed;destroy():void}
const containers=new WeakSet<HTMLElement>();
const sandboxTokens=new Set(['allow-downloads','allow-forms','allow-modals','allow-orientation-lock','allow-pointer-lock','allow-popups','allow-popups-to-escape-sandbox','allow-presentation','allow-same-origin','allow-scripts','allow-storage-access-by-user-activation','allow-top-navigation','allow-top-navigation-by-user-activation','allow-top-navigation-to-custom-protocols']);
function text(value:unknown,name:string,max=2000):asserts value is string {
  if(typeof value!=='string'||!value.trim()||value.length>max||/[\u0000-\u001f\u007f]/u.test(value))throw new Error(`Provide plain ${name} text within ${max} characters.`);
}
function placeholder(input:EmbedPlaceholder):Required<EmbedPlaceholder> {
  text(input.title,'embed title',300);text(input.description,'embed description');
  const preferencesLabel=input.preferencesLabel??'Review privacy choices';text(preferencesLabel,'preferences label',120);
  return {title:input.title,description:input.description,preferencesLabel};
}
const escape=(value:string)=>value.replace(/[&<>"']/gu,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const waiting='Not loaded. Review your choices to allow this content.';

/** @requirements REQ-PRODUCT-EMBEDS REQ-PRODUCT-SAFE-CONTENT
 * SSR fallback: no resource URL, hints, active media or nonfunctional visible button.
 */
export function renderEmbedPlaceholder(input:EmbedPlaceholder):string {
  const copy=placeholder(input);
  return `<section class="nb-embed" aria-label="${escape(copy.title)}"><strong class="nb-embed-title">${escape(copy.title)}</strong><p>${escape(copy.description)}</p><p class="nb-embed-status" role="status">${waiting}</p><button class="nb-choice-button" type="button" hidden disabled>${escape(copy.preferencesLabel)}</button></section>`;
}

/** @requirements REQ-PRODUCT-EMBEDS REQ-EU-DEVICE REQ-PRODUCT-CONSENT-RUNTIME
 * One host-owned lifecycle, several media surfaces. No resource attribute exists before effective permission.
 */
export function createEmbedService(options:{consent:ConsentController;serviceId:string}):EmbedService {
  const {consent,serviceId}=options;
  const config=consent.getConfig();const service=config.services.find(s=>s.id===serviceId);
  if(!service?.resourceOrigins?.length||!config.consent?.services.some(s=>s.id===serviceId))throw new Error('Declare a consent-managed embed service with resourceOrigins first.');
  const origins=[...service.resourceOrigins];const purposes=[...service.purposeIds];
  const mounts=new Set<{sync(state:ConsentSnapshot):void;activate():void;stop():void;destroy():void}>();
  let disposed=false;let signal:AbortSignal|undefined;
  const permitted=(state:ConsentSnapshot)=>!disposed&&!state.destroyed&&state.servicePermissions[serviceId]===true;
  const unregister=consent.registerService(serviceId,{purposes,start(context){
    signal=context.signal;
    const stop=()=>{if(signal===context.signal)signal=undefined;for(const mount of mounts)mount.stop();};
    context.signal.addEventListener('abort',stop,{once:true});
    for(const mount of mounts)mount.activate();
    return ()=>{context.signal.removeEventListener('abort',stop);stop();};
  }});
  const unsubscribe=consent.subscribe(state=>{for(const mount of mounts)mount.sync(state);});
  return {mount(container,input){
    if(disposed||consent.getSnapshot().destroyed)throw new Error('Use a live embed service.');
    if(containers.has(container))throw new Error('Mount one embed per dedicated container.');
    const copy=placeholder(input);const doc=container.ownerDocument;
    if(!['iframe','image'].includes(input.kind)||!isSafeLink(input.src)||input.src.startsWith('mailto:')||input.src.length>4096)throw new Error('Use an HTTPS or root-relative media URL.');
    const url=new URL(input.src,doc.URL);
    if(!origins.some(origin=>origin==='self'?url.origin===doc.location?.origin:origin===url.origin))throw new Error('Media destination is outside the service resourceOrigins.');
    if(input.kind==='image')text(input.alt,'image alternative',1000);
    if(input.kind==='iframe'){
      if(input.sandbox!==undefined&&(!Array.isArray(input.sandbox)||input.sandbox.some(token=>!sandboxTokens.has(token))||new Set(input.sandbox).size!==input.sandbox.length))throw new Error('Use explicit supported iframe sandbox tokens.');
      if(input.sandbox?.includes('allow-scripts')&&input.sandbox.includes('allow-same-origin')&&url.origin===doc.location?.origin)throw new Error('Do not combine scripts and same-origin sandbox privileges for same-origin content.');
      if(input.allow!==undefined)text(input.allow,'iframe permissions policy',500);
    }
    // Copy options once: later caller mutations cannot expand capabilities or change the approved URL.
    const spec=input.kind==='image'?{kind:input.kind,alt:input.alt} as const:{kind:input.kind,sandbox:[...(input.sandbox??[])].join(' '),allow:input.allow??''} as const;
    const element=<K extends keyof HTMLElementTagNameMap>(tag:K,className?:string,content?:string)=>{const node=doc.createElement(tag);if(className)node.className=className;if(content)node.textContent=content;return node;};
    const root=element('section','nb-embed');root.setAttribute('aria-label',copy.title);
    const status=element('p','nb-embed-status',waiting);status.setAttribute('role','status');
    const media=element('div','nb-embed-media');media.hidden=true;
    const button=element('button','nb-choice-button',copy.preferencesLabel);button.type='button';
    root.append(element('strong','nb-embed-title',copy.title),element('p',undefined,copy.description),media,status,button);
    const original=Array.from(container.childNodes);let removed=false;let failed=false;let activating=false;
    let resource:HTMLIFrameElement|HTMLImageElement|undefined;let unlisten=()=>{};
    let connected=false;
    const stop=()=>{
      const previous=resource;resource=undefined;unlisten();unlisten=()=>{};
      if(previous){const focused=doc.activeElement===previous;previous.removeAttribute('src');previous.remove();if(focused&&root.isConnected&&!removed)button.focus({preventScroll:true});}
      media.hidden=true;
      if(!removed)status.textContent=failed?'This content could not load. Review your choices or reload the page.':waiting;
    };
    const sync=(state:ConsentSnapshot)=>{
      button.disabled=removed||disposed||state.destroyed;button.hidden=button.disabled;
      if(!permitted(state))stop();
      else if(resource)status.textContent='Permission allows this content. Your browser may still block it.';
    };
    const activate=()=>{
      if(removed||disposed||resource||failed||activating||!root.isConnected||!signal||signal.aborted)return;
      activating=true;
      try{
        // A late mount cannot reuse an active flag after storage changed without its event arriving.
        // Central eligibility includes cookie grants, required receipts and processing restrictions.
        consent.isServiceAllowed(serviceId);
        const current=signal;
        if(!current||current.aborted||!permitted(consent.getSnapshot())||!root.isConnected)return;
        const node=spec.kind==='iframe'?element('iframe'):element('img');
        node.setAttribute('referrerpolicy','no-referrer');node.setAttribute('width','640');node.setAttribute('height','360');
        if(spec.kind==='iframe'){node.setAttribute('title',copy.title);node.setAttribute('sandbox',spec.sandbox);if(spec.allow)node.setAttribute('allow',spec.allow);}
        else{node.setAttribute('alt',spec.alt);node.setAttribute('decoding','async');}
        // No src assignment, even to a detached image, occurs until all checks above succeed.
        resource=node;
        const error=()=>{if(resource!==node||current.aborted||removed)return;failed=true;stop();};
        node.addEventListener('error',error);unlisten=()=>node.removeEventListener('error',error);
        node.setAttribute('src',url.href);media.append(node);media.hidden=false;sync(consent.getSnapshot());
      }finally{activating=false;}
    };
    const review=()=>{if(!removed&&!disposed&&!consent.getSnapshot().destroyed)consent.openPreferences();};
    button.addEventListener('click',review);
    const refresh=()=>{if(removed)return;connected=root.isConnected;if(!connected)stop();else activate();sync(consent.getSnapshot());};
    const Observer=doc.defaultView?.MutationObserver;
    const observer=Observer?new Observer(()=>{if(connected!==root.isConnected)refresh();}):undefined;
    const mount={sync,activate,stop,destroy(){if(removed)return;removed=true;observer?.disconnect();button.removeEventListener('click',review);stop();mounts.delete(mount);containers.delete(container);root.remove();if(!container.childNodes.length)container.append(...original);}};
    containers.add(container);mounts.add(mount);container.replaceChildren(root);connected=root.isConnected;
    observer?.observe(doc,{childList:true,subtree:true});
    refresh();
    return {refresh,destroy:mount.destroy};
  },destroy(){
    if(disposed)return;disposed=true;unsubscribe();unregister();signal=undefined;for(const mount of [...mounts])mount.destroy();
  }};
}
