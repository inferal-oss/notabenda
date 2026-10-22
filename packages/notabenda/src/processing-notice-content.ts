// @requirements REQ-PRODUCT-PROCESSING-WORKBENCH REQ-PRODUCT-PROCESSING-CHOICES
import {normalizeProcessingNotice,processingCopy} from './processing.js';
import type {ProcessingNotice} from './processing.js';
/** Presentation data with no notice identity, controller or recording authority. */
export type ProcessingNoticeContent=Omit<ProcessingNotice,'noticeId'>;
export function normalizeProcessingNoticeContent(input:unknown):ProcessingNoticeContent {
 // Reuse the established bounded plain-data validator, retaining legacy notice validation unchanged.
 // The internal shape sentinel is never returned, hashed, rendered or used by a controller.
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Supply complete processing notice presentation data.');
 // Snapshot descriptors before spreading so accessors/toJSON cannot execute.
 const value=processingCopy(input) as Record<string,unknown>;
 if(Object.hasOwn(value,'noticeId'))throw Error('Presentation data must not include a notice identity.');
 const {noticeId:_,...content}=normalizeProcessingNotice({...value,noticeId:'0'.repeat(64)},{allowPreview:true});return content;
}
/** Shared native presentation. Inert mode has no active action or outside link and invents no status. */
export function createProcessingNoticeView(doc:Document,input:ProcessingNoticeContent,inert=false){
 const n=normalizeProcessingNoticeContent(input),root=doc.createElement('section');root.className='nb-processing-choices';root.lang=n.localization?.locale??'en';root.dir=n.localization?.direction??'ltr';root.setAttribute('aria-label',n.wording.title);
 const title=doc.createElement('h2');title.textContent=n.wording.title;const description=doc.createElement('p');description.textContent=n.wording.description;root.append(title,description);
 if(n.mode==='preview'||n.document.reviewStatus!=='reviewed'){const draft=doc.createElement('p');draft.className='nb-draft';draft.textContent=n.localization?.processingChoices.draft??'Preview — this opt-out notice needs review.';root.append(draft);}
 const status=doc.createElement('p');status.setAttribute('role','status');const action=doc.createElement('button');action.type='button';action.className='nb-choice-button';action.textContent=n.wording.actionLabel;action.disabled=inert;
 const retry=doc.createElement('button');retry.type='button';retry.className='nb-text-button';retry.textContent=n.localization?.processingChoices.retryLabel??'Try recording again';
 const link=inert?doc.createElement('span'):doc.createElement('a');link.textContent=n.document.title;if(!inert)(link as HTMLAnchorElement).href=n.document.url;else {link.className='nb-processing-preview-link';link.setAttribute('aria-disabled','true');}
 if(inert)root.append(action,link);else root.append(status,action,retry,link);
 return {root,status,action,retry,link};
}
