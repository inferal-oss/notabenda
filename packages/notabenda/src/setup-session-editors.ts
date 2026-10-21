// @requirements REQ-PRODUCT-TERMS-AUTHORING
import {toPublicConfig} from './config.js';
// @requirements REQ-PRODUCT-SETUP-SESSION
import {readEditorFields} from './setup-session-fields.js';
import {readStorageDraftReview} from './setup-storage.js';
import {normalizeServiceCatalog} from './catalog.js';
import {setupQuestions} from './setup.js';
import type {mountPurposeEditor} from './setup-purpose-ui.js';
import type {mountConsentEditor} from './setup-consent-ui.js';
import type {mountTermsEditor} from './setup-terms-ui.js';
import type {mountRightsEditor} from './setup-rights-ui.js';
import type {mountStorageEditor} from './setup-storage-ui.js';
import type {CatalogPickerDraft} from './catalog-ui.js';
import type {CatalogReviewDraft} from './catalog-review-ui.js';
export interface SetupEditorDrafts {
 purpose:ReturnType<ReturnType<typeof mountPurposeEditor>['getSessionDraft']>;
 storage:ReturnType<ReturnType<typeof mountStorageEditor>['getSessionDraft']>;
 consent?:ReturnType<ReturnType<typeof mountConsentEditor>['getSessionDraft']>;
 terms?:ReturnType<ReturnType<typeof mountTermsEditor>['getSessionDraft']>;
 rights?:ReturnType<ReturnType<typeof mountRightsEditor>['getSessionDraft']>;
 catalog?:CatalogPickerDraft;review?:{serviceId:string;draft:CatalogReviewDraft};inventory:boolean;notes:string[];
}
/** Structural validation of unfinished edits. Configuration validators still run on explicit Save. */
export function readSetupEditorDrafts(input:unknown):SetupEditorDrafts {
 const v=input as SetupEditorDrafts;
 const shape=(x:unknown,required:string[],optional:string[]=[])=>{if(!x||typeof x!=='object'||Array.isArray(x)||required.some(k=>!Object.hasOwn(x,k))||Object.keys(x).some(k=>!required.includes(k)&&!optional.includes(k)))throw Error('Incompatible saved editor draft.');};
 const string=(x:unknown,max=4000)=>{if(typeof x!=='string'||x.length>max)throw Error('Saved editor text is too long.');};
 const id=(x:unknown)=>{if(typeof x!=='string'||!/^[a-z][a-z0-9-]{0,119}$/u.test(x))throw Error('Invalid saved editor ID.');};
 const bool=(x:unknown)=>{if(typeof x!=='boolean')throw Error('Invalid saved foldout.');};
 const list=(x:unknown,max:number)=>{if(!Array.isArray(x)||x.length>max)throw Error('Invalid saved editor list.');};
 shape(v,['purpose','storage','inventory','notes'],['consent','rights','terms','catalog','review']);bool(v.inventory);list(v.notes,setupQuestions.length);if(v.notes.some(x=>!setupQuestions.some(q=>q.id===x)))throw Error('Unknown saved question.');
 const proposal=(p:NonNullable<SetupEditorDrafts['purpose']['proposal']>,extra:string[]=[])=>{shape(p,['remove','fields','baseline'],['id',...extra]);bool(p.remove);if(p.id!==undefined)id(p.id);if(p.remove&&!p.id)throw Error('Saved removal needs an existing item.');readEditorFields(p.fields);toPublicConfig(p.baseline,{mode:'preview'});};
 shape(v.purpose,['open'],['proposal']);bool(v.purpose.open);if(v.purpose.proposal)proposal(v.purpose.proposal);
 if(v.terms){shape(v.terms,['open'],['proposal']);bool(v.terms.open);if(v.terms.proposal)proposal(v.terms.proposal);}
 shape(v.storage,['open','filter','review'],['proposal']);bool(v.storage.open);string(v.storage.filter,4000);readStorageDraftReview(v.storage.review);
 if(v.storage.proposal){const p=v.storage.proposal;proposal(p,['owner','scopes']);if(p.owner!==undefined&&p.owner!=='')id(p.owner);list(p.scopes,64);for(const pair of p.scopes){list(pair,2);if(pair.length!==2)throw Error('Invalid saved storage scope.');id(pair[0]);shape(pair[1],['scope','technology']);string(pair[1].scope,200);string(pair[1].technology,30000);}}
 if(v.consent){shape(v.consent,['baseline','fields','selected','purposes']);toPublicConfig(v.consent.baseline,{mode:'preview'});readEditorFields(v.consent.fields);list(v.consent.selected,512);v.consent.selected.forEach(id);list(v.consent.purposes,512);for(const p of v.consent.purposes){list(p,2);if(p.length!==2)throw Error('Invalid saved purpose version.');id(p[0]);string(p[1],200);}}
 if(v.rights){const r=v.rights;shape(r,['baseline','fields','actions','steps']);toPublicConfig(r.baseline,{mode:'preview'});readEditorFields(r.fields);list(r.actions,16);r.actions.forEach(x=>{if(x!==null)id(x);});if(!Number.isInteger(r.steps)||r.steps<0||r.steps>6)throw Error('Invalid saved next steps.');}
 if(v.catalog){const c=v.catalog;shape(c,['open','query'],['proposal']);bool(c.open);string(c.query,120);if(c.proposal){shape(c.proposal,['baseline','reference','fields']);toPublicConfig(c.proposal.baseline,{mode:'preview'});const reference=normalizeServiceCatalog(c.proposal.reference);if(reference.products.length!==1||reference.providers.length!==1)throw Error('Invalid saved reference.');readEditorFields(c.proposal.fields);}}
 if(v.review){shape(v.review,['serviceId','draft']);id(v.review.serviceId);shape(v.review.draft,['reason'],['reference']);string(v.review.draft.reason);if(v.review.draft.reference)normalizeServiceCatalog(v.review.draft.reference);}
 const copy=structuredClone(v);for(const p of [copy.purpose.proposal,copy.storage.proposal,copy.terms?.proposal,copy.consent,copy.rights,copy.catalog?.proposal])if(p)p.baseline=toPublicConfig(p.baseline,{mode:'preview'});return copy;
}
