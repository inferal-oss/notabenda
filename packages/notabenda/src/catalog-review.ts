/** @requirements REQ-PRODUCT-SERVICE-CATALOG REQ-PRODUCT-SETUP */
import {createCatalogServiceDraft} from './catalog.js';
import {normalizeCatalogServiceSelection} from './catalog-selection.js';
import type {CatalogServiceSelection} from './catalog-selection.js';
import {assertPlainCatalogData} from './catalog-plain.js';
import {toPublicConfig} from './config.js';
import type {Service,Purpose,SiteConfig} from './types.js';
const canonical=(v:unknown):string=>v===null||typeof v!=='object'?JSON.stringify(v):Array.isArray(v)?'['+v.map(canonical).join(',')+']':'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical((v as Record<string,unknown>)[k])).join(',')+'}';
export interface CatalogSelectionReview {
 schemaVersion:1;kind:'catalog-selection-review';previous:CatalogServiceSelection;
 /** Exact full current service, including fields outside the catalog projection. */
 currentService:Service;currentPurposes:Purpose[];
 proposed:Pick<CatalogServiceSelection,'reference'|'service'|'purposes'>;
 changes:('reference'|'service'|'purposes')[];
}
export interface CatalogSelectionRevision {previous:CatalogServiceSelection;next:CatalogServiceSelection}
/** A detached comparison only. No refreshed approval or private reason is invented. */
export function prepareCatalogSelectionReview(input:unknown,previousInput:unknown,catalog?:unknown):CatalogSelectionReview {
 const previous=normalizeCatalogServiceSelection(previousInput),config=toPublicConfig(input,{mode:'preview'}),current=config.services.find(s=>s.id===previous.service.id);
 if(!current)throw Error('This catalog note has no matching service. Import the matching config or remove only the note.');
 const draft=createCatalogServiceDraft(catalog??previous.reference,previous.reference.products[0]!.id,{id:current.id,purposeIds:current.purposeIds,provider:current.provider,location:current.location,...(current.privacyUrl===undefined?{}:{privacyUrl:current.privacyUrl})});
 draft.service.name=current.name; // A catalog label update never renames an operator's service.
 const {catalogId,catalogRevision,sources,provider,product}=draft.catalogSelection;
 if(catalogId!==previous.reference.id)throw Error('Re-review must use the same catalog identity. Select a different catalog as a new service review.');
 const reference={schemaVersion:1 as const,kind:'notabenda-service-catalog' as const,id:catalogId,revision:catalogRevision,sources,providers:[provider],products:[{...product,identifiers:[],storageHints:[]}]};
 const purposes=current.purposeIds.map(id=>config.purposes.find(p=>p.id===id)!);
 // Validate the candidate structure without treating the old reason as a renewed decision.
 const candidate=normalizeCatalogServiceSelection({schemaVersion:1,kind:'catalog-service-selection',reference,service:draft.service,purposes,justification:previous.justification,review:'operator-confirmed'});
 const proposed={reference:candidate.reference,service:candidate.service,purposes:candidate.purposes};
 const changes:CatalogSelectionReview['changes']=[];for(const key of ['reference','service','purposes'] as const)if(canonical(previous[key])!==canonical(proposed[key]))changes.push(key);
 return {schemaVersion:1,kind:'catalog-selection-review',previous,currentService:structuredClone(current),currentPurposes:structuredClone(purposes),proposed,changes};
}
/** Confirm an exact still-current comparison. Preserves enforcement settings and unrelated inventory. */
export function confirmCatalogSelectionReview(input:unknown,review:CatalogSelectionReview,decision:{confirmed:true;justification:string}):{config:SiteConfig;selection:CatalogServiceSelection;revision:CatalogSelectionRevision} {
 assertPlainCatalogData(review);assertPlainCatalogData(decision);
 if(!review||review.kind!=='catalog-selection-review'||decision?.confirmed!==true||Object.keys(decision).sort().join(',')!=='confirmed,justification')throw Error('Explicit renewed review and private justification are required.');
 const expected=prepareCatalogSelectionReview(input,review.previous,review.proposed?.reference);
 if(canonical(review)!==canonical(expected))throw Error('Draft or comparison changed. Reopen the catalog review before confirming.');
 const selection=normalizeCatalogServiceSelection({schemaVersion:1,kind:'catalog-service-selection',...expected.proposed,justification:decision.justification,review:'operator-confirmed'});
 const config=toPublicConfig(input,{mode:'preview'}),index=config.services.findIndex(s=>s.id===selection.service.id),current=config.services[index]!;
 config.services[index]={...current,...structuredClone(selection.service)};
 // Absence is meaningful for optional projected fields too.
 if(selection.service.privacyUrl===undefined)delete config.services[index]!.privacyUrl;
 if(canonical(current)!==canonical(config.services[index]))for(const doc of Object.values(config.documents))doc.review.status='draft';
 return {config,selection,revision:{previous:expected.previous,next:structuredClone(selection)}};
}
/** Private review history is descriptive, not proof of identity, chronology or publication. */
export function normalizeCatalogSelectionRevisions(input:unknown):CatalogSelectionRevision[]{
 assertPlainCatalogData(input);if(!Array.isArray(input)||input.length>32)throw Error('Keep at most 32 catalog review revisions in one report.');
 return input.map(raw=>{if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).sort().join(',')!=='next,previous')throw Error('Invalid catalog review revision.');const previous=normalizeCatalogServiceSelection(raw.previous),next=normalizeCatalogServiceSelection(raw.next);if(previous.service.id!==next.service.id||previous.reference.products[0]!.id!==next.reference.products[0]!.id)throw Error('A review revision must refer to the same local service and product.');return {previous,next};});
}
export function readSetupCatalogRevisions(input:unknown):CatalogSelectionRevision[]{
 assertPlainCatalogData(input);if(!input||typeof input!=='object'||Array.isArray(input)||(input as Record<string,unknown>).kind!=='private-setup-report')return [];
 return normalizeCatalogSelectionRevisions((input as Record<string,unknown>).catalogSelectionRevisions??[]);
}
