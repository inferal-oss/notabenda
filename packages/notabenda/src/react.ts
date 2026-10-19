// @requirements REQ-PRODUCT-REACT REQ-PRODUCT-CONSENT-RUNTIME REQ-PRODUCT-CONSENT-EVIDENCE
'use client';
import {createReactConsentBindings} from './react-consent-bindings.js';
import type {ReactConsentProviderProps} from './react-consent-bindings.js';
import type {ConsentController} from './consent-types.js';
export type {ReactConsentSnapshot,ConsentControlsProps,PreferencesButtonProps} from './react-consent-bindings.js';
export type ConsentProviderProps=ReactConsentProviderProps<ConsentController>;
/** Compatibility bindings retain the complete public configuration returned by the legacy hook. */
export const {ConsentProvider,ConsentControls,PreferencesButton,useConsentController,useConsentSnapshot,usePurposeAllowed,useServiceAllowed}=createReactConsentBindings<ConsentController>();
export {LegalDocument,LegalLinks,CollectionNotice} from './react-documents.js';
export type {LegalDocumentProps,LegalLinksProps,CollectionNoticeProps} from './react-documents.js';
export {FormPermissionProvider,FormPermissionField,useFormPermissionController,useFormPermissionSnapshot,useFormPermissionAllowed} from './react-form-permission.js';
export type {FormPermissionProviderProps,FormPermissionFieldProps,ReactFormPermissionSnapshot} from './react-form-permission.js';
