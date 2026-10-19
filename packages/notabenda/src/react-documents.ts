import {renderRightsCenter} from './rights.js';
import type {RightsCenterRenderOptions} from './rights.js';
import {createElement} from 'react';
import type {ReactElement} from 'react';
import {renderCollectionNotice} from './collection.js';
import {renderIndirectCollectionNotice} from './indirect-collection.js';
import {renderLegalGuaranteeNotice} from './guarantee-notice.js';
import {renderLegalDocument,renderLegalLinks} from './documents.js';
import type {DocumentKind,ValidationOptions} from './types.js';
import {renderServiceDirectory} from './service-directory.js';
import type {ServiceDirectoryOptions} from './service-directory.js';

/** @requirements REQ-PRODUCT-SERVICE-CATALOG REQ-PRODUCT-REACT */
export interface ServiceDirectoryProps extends ServiceDirectoryOptions {config:unknown;className?:string}
export function ServiceDirectory({config,className,...options}:ServiceDirectoryProps):ReactElement {
  return createElement('div',{className,dangerouslySetInnerHTML:{__html:renderServiceDirectory(config,options)}});
}

export interface LegalDocumentProps extends ValidationOptions {config:unknown;kind:DocumentKind;className?:string}
export interface LegalLinksProps {config:unknown;className?:string}

/** @requirements REQ-PRODUCT-REACT REQ-PRODUCT-DOCUMENTS REQ-PRODUCT-SAFE-CONTENT
 * Server-safe structured document wrapper. Only the validated core renderer supplies markup.
 */
export function LegalDocument({config,kind,mode='production',className}:LegalDocumentProps):ReactElement {
  return createElement('div',{className,dangerouslySetInnerHTML:{__html:renderLegalDocument(config,kind,{mode})}});
}
/** Legal links are ordinary anchors; no consent or agreement action is implied. */
export function LegalLinks({config,className}:LegalLinksProps):ReactElement {
  return createElement('div',{className,dangerouslySetInnerHTML:{__html:renderLegalLinks(config)}});
}

/** @requirements REQ-PRODUCT-COLLECTION-NOTICE REQ-PRODUCT-REACT */
export interface CollectionNoticeProps {notice:unknown;idPrefix:string;headingLevel?:2|3|4|5|6;allowPreview?:boolean;className?:string}
export function CollectionNotice({notice,idPrefix,headingLevel,allowPreview=false,className}:CollectionNoticeProps):ReactElement {
  return createElement('div',{className,dangerouslySetInnerHTML:{__html:renderCollectionNotice(notice,{idPrefix,allowPreview,...(headingLevel===undefined?{}:{headingLevel})})}});
}

/** @requirements REQ-NZ-INDIRECT REQ-PRODUCT-INDIRECT-NOTICE REQ-PRODUCT-REACT */
export function IndirectCollectionNotice({notice,idPrefix,headingLevel,allowPreview=false,className}:CollectionNoticeProps):ReactElement {
  return createElement('div',{className,dangerouslySetInnerHTML:{__html:renderIndirectCollectionNotice(notice,{idPrefix,allowPreview,...(headingLevel===undefined?{}:{headingLevel})})}});
}

/** @requirements REQ-EU-GUARANTEE-NOTICE REQ-PRODUCT-GUARANTEE-NOTICE REQ-PRODUCT-REACT */
export function LegalGuaranteeNotice({notice,idPrefix,headingLevel,allowPreview=false,className}:CollectionNoticeProps):ReactElement {
  return createElement('div',{className,dangerouslySetInnerHTML:{__html:renderLegalGuaranteeNotice(notice,{idPrefix,allowPreview,...(headingLevel===undefined?{}:{headingLevel})})}});
}

/** @requirements REQ-PRODUCT-RIGHTS-CENTER REQ-PRODUCT-REACT */
export interface RightsCenterProps extends RightsCenterRenderOptions {config:unknown;className?:string}
export function RightsCenter({config,className,...options}:RightsCenterProps):ReactElement {
 return createElement('div',{className,dangerouslySetInnerHTML:{__html:renderRightsCenter(config,options)}});
}
