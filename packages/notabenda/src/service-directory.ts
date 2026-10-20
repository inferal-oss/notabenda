// @requirements REQ-EU-INTERESTS-DISCLOSURE
import {purposeLegalBasis} from './purpose-disclosures.js';
// @requirements REQ-PRODUCT-SERVICE-LOCALIZATION
import {defaultServiceDirectoryMessages,selectServiceDirectoryLocalization} from './service-directory-localization.js';
import {formatMessage} from './localization-policy.js';
import type {ServiceDirectoryLocalization,ServiceDirectoryMessages} from './service-directory-localization.js';
export {normalizeServiceDirectoryLocalization} from './service-directory-localization.js';
export type {ServiceDirectoryLocalization,ServiceDirectoryMessages} from './service-directory-localization.js';
/** @requirements REQ-PRODUCT-SERVICE-CATALOG REQ-PRODUCT-A11Y REQ-PRODUCT-MOBILE */
import {toPublicConfig,isSafeLink} from './config.js';
import {escapeHtml} from './documents.js';
import {declaredServices} from './service-inventory.js';
import type {DeclaredService} from './service-inventory.js';
import type {ValidationOptions} from './types.js';
export {createServiceInventory} from './service-inventory.js';
export type {DeclaredService} from './service-inventory.js';

export interface ServiceDirectoryFilter {query?:string;purposeId?:string}
export interface ServiceDirectory {
  mode:'preview'|'production';
  localization?:ServiceDirectoryLocalization;
  site:{name:string;url:string;locale:string};
  policies:{privacy:{title:string;route:string;version:string;effectiveDate:string};cookies:{title:string;route:string;version:string;effectiveDate:string}};
  purposes:{id:string;name:string}[];totalServices:number;services:DeclaredService[];
}
export interface ServiceDirectoryOptions extends ValidationOptions,ServiceDirectoryFilter {
  /** Unique within the host page. Also gives each service a stable fragment link. */
  idPrefix:string;headingLevel?:1|2|3|4;title?:string;description?:string;
}
function safeText(value:unknown,max:number):value is string {
  return typeof value==='string'&&value.length<=max&&!/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u.test(value);
}
function filterServices(model:ServiceDirectory,filter:ServiceDirectoryFilter):DeclaredService[] {
  const query=filter.query===undefined?'':filter.query;
  if(!safeText(query,120)||filter.purposeId!==undefined&&(typeof filter.purposeId!=='string'||!model.purposes.some(p=>p.id===filter.purposeId)))throw Error('Use a short service search and a declared purpose ID.');
  const terms=query.toLocaleLowerCase(model.site.locale).trim().split(/\s+/u).filter(Boolean);
  return model.services.filter(service=>(filter.purposeId===undefined||service.purposes.some(p=>p.id===filter.purposeId))&&terms.every(term=>[
    service.name,service.provider,service.location,...service.purposes.flatMap(p=>[p.name,p.description,...p.dataCategories]),...service.storage.map(s=>s.name),
  ].join(' ').toLocaleLowerCase(model.site.locale).includes(term)));
}
/** Confirmed inventory only. This module never imports reference data or performs discovery. */
export function createServiceDirectory(input:unknown,options:ValidationOptions&ServiceDirectoryFilter={}):ServiceDirectory {
  const config=toPublicConfig(input,{mode:options.mode??'production'});
  const policy=(kind:'privacy'|'cookies')=>{
    const {title,route,version,effectiveDate}=config.documents[kind];return {title,route,version,effectiveDate};
  };
  const model:ServiceDirectory={mode:options.mode??'production',...(config.localization?.serviceDirectory?{localization:selectServiceDirectoryLocalization(config.localization)}:{}),site:{name:config.site.name,url:config.site.url,locale:config.site.locale},policies:{privacy:policy('privacy'),cookies:policy('cookies')},purposes:config.purposes.map(p=>({id:p.id,name:p.name})),totalServices:config.services.length,services:declaredServices(config)};
  model.services=filterServices(model,options);return model;
}
function messages(model:ServiceDirectory):ServiceDirectoryMessages {
 if(model.localization)return model.localization.serviceDirectory;
 if(!/^en(?:-|$)/iu.test(model.site.locale))throw Error('Localized service directories need localization.serviceDirectory messages. Use the headless inventory until the full dictionary is supplied.');
 return defaultServiceDirectoryMessages;
}
const countValues=(model:ServiceDirectory,shown:number)=>{const number=(n:number)=>model.localization?new Intl.NumberFormat(model.site.locale).format(n):String(n);return {shown:number(shown),total:number(model.totalServices)};};
const totalTemplate=(model:ServiceDirectory,m:ServiceDirectoryMessages)=>model.totalServices===1?m.totalOne:m.totalMany;
/** Escape templates and isolate substituted facts; no message can inject markup. */
function messageHtml(model:ServiceDirectory,template:string,values:Record<string,string>):string {
 return template.split(/(\{[a-zA-Z]+\})/u).map(part=>/^\{[a-zA-Z]+\}$/u.test(part)?model.localization?'<bdi dir="auto">'+escapeHtml(values[part.slice(1,-1)]!)+'</bdi>':escapeHtml(values[part.slice(1,-1)]!):escapeHtml(part)).join('');
}
function setCount(node:Element,model:ServiceDirectory,template:string,shown:number):void {
 const values:Record<string,string>=countValues(model,shown);
 if(!model.localization){node.textContent=formatMessage(template,values);return;}
 const doc=node.ownerDocument,parts=template.split(/(\{[a-zA-Z]+\})/u).map(part=>{if(!/^\{[a-zA-Z]+\}$/u.test(part))return doc.createTextNode(part);const bdi=doc.createElement('bdi');bdi.dir='auto';bdi.textContent=values[part.slice(1,-1)]!;return bdi;});node.replaceChildren(...parts);
}
function render(model:ServiceDirectory,options:ServiceDirectoryOptions):string {
  if(typeof options.idPrefix!=='string'||!/^[a-z][a-z0-9-]{0,79}$/u.test(options.idPrefix)||options.headingLevel!==undefined&&![1,2,3,4].includes(options.headingLevel)||options.title!==undefined&&(!safeText(options.title,160)||!options.title.trim())||options.description!==undefined&&!safeText(options.description,1000))throw Error('Supply a unique lowercase directory ID, heading level 1–4 and bounded display text.');
  const e=escapeHtml,id=options.idPrefix,level=options.headingLevel??1,m=messages(model),localized=model.localization;
  const title=options.title??m.title,description=options.description??m.description;
  const resultText=messageHtml(model,model.services.length===model.totalServices?totalTemplate(model,m):m.filteredCount,countValues(model,model.services.length));
  const storageTypes:Record<string,string>={cookie:m.storageCookie,localStorage:m.storageLocalStorage,sessionStorage:m.storageSessionStorage,indexedDB:m.storageIndexedDB,other:m.storageOther};
  const literal=(value:string)=>localized?'<bdi dir="auto">'+e(value)+'</bdi>':e(value);
  const cards=model.services.map(service=>`<li data-service-id="${e(service.id)}"><article class="nb-service-card" aria-labelledby="${id}-service-${e(service.id)}"><header><p class="nb-service-provider">${literal(service.provider)}</p><h${level+1} id="${id}-service-${e(service.id)}">${literal(service.name)}</h${level+1}></header><ul class="nb-service-purposes" aria-label="${e(m.purposesLabel)}">${service.purposes.map(p=>`<li>${e(p.name)}</li>`).join('')}</ul><dl class="nb-service-location"><dt>${e(m.locationLabel)}</dt><dd>${literal(service.location)}</dd></dl>${service.privacyUrl?`<a class="nb-service-privacy" href="${e(service.privacyUrl)}">${messageHtml(model,m.privacyLinkLabel,{serviceName:service.name})} <span aria-hidden="true">↗</span></a>`:`<p class="nb-service-unlisted">${e(m.unlistedPrivacy)}</p>`}<details><summary>${e(m.detailsLabel)}</summary><div class="nb-service-detail-body">${service.purposes.map(p=>`<section><h${level+2}>${e(p.name)}</h${level+2}><p>${e(p.description)}</p><dl><dt>${e(m.dataCategoriesLabel)}</dt><dd>${e(p.dataCategories.join(m.listSeparator))}</dd><dt>${e(m.legalBasisLabel)}</dt><dd>${e(purposeLegalBasis(p))}</dd><dt>${e(m.retentionLabel)}</dt><dd>${e(p.retention)}</dd></dl></section>`).join('')}<section><h${level+2}>${e(m.storageHeading)}</h${level+2}>${service.storage.length?`<ul class="nb-service-storage">${service.storage.map(item=>`<li><strong>${literal(item.name)}</strong><span>${e(storageTypes[item.type]!)} · ${e(m[item.classification])}</span><p>${e(item.duration)}</p>${item.necessityReason?`<p>${e(item.necessityReason)}</p>`:''}</li>`).join('')}</ul>`:`<p>${e(m.noStorage)}</p>`}</section></div></details></article></li>`).join('');
  return `<section class="nb-service-directory"${localized?` lang="${e(localized.locale)}" dir="${localized.direction}"`:''} aria-labelledby="${id}-title" data-service-directory="${id}"><header class="nb-service-intro"><p class="nb-service-eyebrow">${messageHtml(model,m.eyebrow,{siteName:model.site.name})}</p><h${level} id="${id}-title">${e(title)}</h${level}><p>${e(description)}</p>${model.mode==='preview'?`<p class="nb-service-preview" role="note">${e(m.draft)}</p>`:''}<nav class="nb-service-policy-links" aria-label="${e(m.relatedPoliciesLabel)}"><a href="${e(model.policies.privacy.route)}">${e(model.policies.privacy.title)}</a><a href="${e(model.policies.cookies.route)}">${e(model.policies.cookies.title)}</a></nav></header><div data-service-tools></div><p class="nb-service-result-count" id="${id}-results" data-service-results>${resultText}</p><ul class="nb-service-list">${cards}</ul><p class="nb-service-empty" data-service-empty${model.services.length?' hidden':''}>${e(model.totalServices?m.noMatches:m.emptyInventory)}</p></section>`;
}
/** Script-free HTML. Custom host filters may call this on a server or during build. */
export function renderServiceDirectory(input:unknown,options:ServiceDirectoryOptions):string {
  return render(createServiceDirectory(input,options),options);
}
export function renderServiceDirectoryPage(input:unknown,options:ServiceDirectoryOptions&{stylesheetUrl?:string}):string {
  const model=createServiceDirectory(input,options),body=render(model,{...options,headingLevel:1});
  const m=messages(model);
  if(options.stylesheetUrl!==undefined&&!isSafeLink(options.stylesheetUrl))throw Error('Unsafe directory stylesheet URL.');
  return `<!doctype html><html lang="${escapeHtml(model.site.locale)}"${model.localization?` dir="${model.localization.direction}"`: ''}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(options.title??m.pageTitle)} · ${escapeHtml(model.site.name)}</title>${options.stylesheetUrl?`<link rel="stylesheet" href="${escapeHtml(options.stylesheetUrl)}">`:''}</head><body class="nb-page nb-service-page"><a class="nb-service-skip" href="#main">${escapeHtml(m.skipToContent)}</a><header class="nb-site-header nb-service-sitebar"><a href="${escapeHtml(model.site.url)}">${escapeHtml(model.site.name)}</a><span>${escapeHtml(m.sitebarLabel)}</span></header><main id="main">${body}</main><footer class="nb-service-footer"><p>${escapeHtml(m.footer)}</p></footer></body></html>`;
}

const mounts=new WeakSet<HTMLElement>();
/** Optional local search. Static content and native details remain usable without this enhancement. */
export function mountServiceDirectory(container:HTMLElement,input:unknown,options:ServiceDirectoryOptions):{destroy():void} {
  if(!container?.ownerDocument||mounts.has(container))throw Error('Use an unmounted browser element.');
  // Search all declared services; supplied filters only set the initial control values.
  const model=createServiceDirectory(input,{...(options.mode?{mode:options.mode}:{})});
  const m=messages(model);
  filterServices(model,options);
  const html=render(model,options),document=container.ownerDocument,template=document.createElement('template');template.innerHTML=html;
  const existing=container.firstElementChild,comparison=existing?.cloneNode(true) as Element|undefined;
  // Preserve native details and focus if script-free markup was already being read before enhancement.
  comparison?.querySelectorAll('details[open]').forEach(details=>details.removeAttribute('open'));
  if(container.childElementCount!==1||!comparison?.isEqualNode(template.content.firstElementChild))container.replaceChildren(template.content);
  const tools=container.querySelector('[data-service-tools]')!;
  const toolbar=document.createElement('div');toolbar.className='nb-service-search';
  const searchLabel=document.createElement('label');searchLabel.textContent=m.searchLabel;
  const search=document.createElement('input');search.type='search';search.id=options.idPrefix+'-search';search.maxLength=120;search.autocomplete='off';search.placeholder=m.searchPlaceholder;search.value=options.query??'';search.setAttribute('aria-describedby',options.idPrefix+'-results');searchLabel.append(search);
  const purposeLabel=document.createElement('label');purposeLabel.textContent=m.purposeLabel;
  const purpose=document.createElement('select');purpose.id=options.idPrefix+'-purpose';purpose.setAttribute('aria-describedby',options.idPrefix+'-results');
  for(const item of [{id:'',name:m.allPurposes},...model.purposes]){const option=document.createElement('option');option.value=item.id;option.textContent=item.name;purpose.append(option);}purpose.value=options.purposeId??'';purposeLabel.append(purpose);
  toolbar.append(searchLabel,purposeLabel);tools.append(toolbar);
  const count=container.querySelector('[data-service-results]')!,empty=container.querySelector<HTMLElement>('[data-service-empty]')!,cards=[...container.querySelectorAll<HTMLElement>('.nb-service-list > li')];
  count.setAttribute('role','status');count.setAttribute('aria-live','polite');count.setAttribute('aria-atomic','true');
  const update=()=>{
    const shown=filterServices(model,{query:search.value,...(purpose.value?{purposeId:purpose.value}:{})}),ids=new Set(shown.map(s=>s.id));
    for(const card of cards)card.hidden=!ids.has(card.dataset.serviceId!);
    setCount(count,model,m.filteredCount,shown.length);
    empty.hidden=shown.length>0;
  };
  // Free typing may include controls copied from another application; treat those as a literal nonmatch.
  const onInput=()=>{try{update();}catch{for(const card of cards)card.hidden=true;setCount(count,model,m.filteredCount,0);empty.hidden=false;}};
  search.addEventListener('input',onInput);purpose.addEventListener('change',onInput);update();mounts.add(container);
  let destroyed=false;
  return {destroy(){if(destroyed)return;destroyed=true;search.removeEventListener('input',onInput);purpose.removeEventListener('change',onInput);toolbar.remove();for(const card of cards)card.hidden=false;empty.hidden=model.totalServices>0;setCount(count,model,totalTemplate(model,m),model.totalServices);count.removeAttribute('role');count.removeAttribute('aria-live');count.removeAttribute('aria-atomic');mounts.delete(container);}};
}
