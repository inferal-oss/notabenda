// @requirements REQ-PRODUCT-EMBED-LOCALIZATION REQ-PRODUCT-LOCALIZATION
import {normalizeInterfaceLocalization} from './localization-policy.js';
import type {InterfaceLocalizationMetadata} from './localization-policy.js';
export const embedMessageFields={preferencesLabel:[],waiting:[],allowed:[],error:[]} as const;
export type EmbedMessages={[K in keyof typeof embedMessageFields]:string};
export interface EmbedLocalization extends InterfaceLocalizationMetadata {embeds:EmbedMessages}
export const embedLocalizationPolicy={key:'embeds',fields:embedMessageFields,maxBytes:12288,error:'Invalid embed localization. Supply complete versioned plain-text messages for the selected language.'} as const;
export const defaultEmbedMessages:EmbedMessages=/* @__PURE__ */ Object.freeze({preferencesLabel:'Review privacy choices',waiting:'Not loaded. Review your choices to allow this content.',allowed:'Permission allows this content. Your browser may still block it.',error:'This content could not load. Review your choices or reload the page.'});
export function normalizeEmbedLocalization(input:unknown,options:{locale?:string;allowPreview?:boolean}={}):EmbedLocalization {
 return normalizeInterfaceLocalization(input,embedLocalizationPolicy,options);
}
/** Select before compiling a narrow cookie runtime; that descriptor deliberately excludes media copy. */
export function selectEmbedLocalization(config:{site:{locale:string};localization?:InterfaceLocalizationMetadata&{embeds?:EmbedMessages}}):EmbedLocalization|undefined {
 const l=config.localization;
 if(l?.embeds===undefined){if(!/^en(?:-|$)/iu.test(config.site.locale))throw Error('Localized gated media needs complete localization.embeds messages. Keep the site locale and provide the dictionary; compiled controllers need the separately selected embed localization.');return undefined;}
 const {schemaVersion,locale,direction,revision,reviewStatus,embeds}=l;return {schemaVersion,locale,direction,revision,reviewStatus,embeds};
}
