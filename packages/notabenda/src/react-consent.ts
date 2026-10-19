// @requirements REQ-PRODUCT-REACT REQ-PRODUCT-BUNDLE-BUDGET REQ-PRODUCT-CONSENT-RUNTIME REQ-PRODUCT-CONSENT-EVIDENCE
'use client';
import {createReactConsentBindings} from './react-consent-bindings.js';
import type {ReactConsentProviderProps} from './react-consent-bindings.js';
import type {ConsentStateController} from './consent-types.js';
export type {ReactConsentSnapshot,ConsentControlsProps,PreferencesButtonProps} from './react-consent-bindings.js';
export type ConsentProviderProps=ReactConsentProviderProps<ConsentStateController>;
/** Compiled and compatibility controllers; the hook honestly returns the smaller runtime inventory. */
export const {ConsentProvider,ConsentControls,PreferencesButton,useConsentController,useConsentSnapshot,usePurposeAllowed,useServiceAllowed}=createReactConsentBindings<ConsentStateController>();
