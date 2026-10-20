// @requirements REQ-PRODUCT-LOCALIZATION REQ-PRODUCT-COLLECTION-NOTICE
import {normalizeMessages} from './localization-policy.js';
export const collectionMessageFields={
 draft:[],responsibleLabel:[],mixedSources:[],informationLabel:[],providingLabel:[],required:[],optional:[],consequencesLabel:[],
 detailsLabel:[],privacyLinkLabel:[],controllerHeading:[],representativeHeading:[],dpoHeading:[],purposeDetails:['purpose'],
 collectionSourceLabel:[],directSource:[],bothSource:[],sourceDetailsLabel:[],legalBasisLabel:[],retentionLabel:[],
 recipientsHeading:[],recipientPurposes:['purposes'],providerPrivacyLabel:[],noRecipients:[],transfersHeading:[],automatedHeading:[],
 rightsHeading:[],exerciseRightsLabel:[],complaintsHeading:[],complaintInfoLabel:[],privacyVersion:['version'],effectiveDate:['effectiveDate'],listSeparator:[],
} as const;
export type CollectionMessages={[K in keyof typeof collectionMessageFields]:string};
export interface CollectionLocalization {schemaVersion:1;locale:string;direction:'ltr'|'rtl';revision:string;reviewStatus:'draft'|'reviewed';collection:CollectionMessages}
/** Complete selected static interface; the descriptor supplies no processing facts. */
export function normalizeCollectionLocalization(input:unknown,options:{locale?:string;allowPreview?:boolean}={}):CollectionLocalization{
 const fail=():never=>{throw Error('Invalid collection localization. Supply complete versioned plain-text messages for the selected language.');};
 if(!input||typeof input!=='object'||Array.isArray(input))return fail();
 const keys=['schemaVersion','locale','direction','revision','reviewStatus','collection'],fields=Object.getOwnPropertyDescriptors(input);
 if(Reflect.ownKeys(input).length!==keys.length||keys.some(k=>!fields[k]||!Object.hasOwn(fields[k]!,'value')))return fail();
 const v=Object.fromEntries(keys.map(k=>[k,fields[k]!.value]));
 try{if(typeof v.locale!=='string'||Intl.getCanonicalLocales(v.locale)[0]!==v.locale||options.locale!==undefined&&v.locale!==options.locale)return fail();}catch{return fail();}
 if(v.schemaVersion!==1||(v.direction!=='ltr'&&v.direction!=='rtl')||typeof v.revision!=='string'||!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,119}$/u.test(v.revision)||(v.reviewStatus!=='draft'&&v.reviewStatus!=='reviewed')||!options.allowPreview&&v.reviewStatus!=='reviewed')return fail();
 const result:CollectionLocalization={schemaVersion:1,locale:v.locale as string,direction:v.direction,revision:v.revision,reviewStatus:v.reviewStatus,collection:normalizeMessages(v.collection,collectionMessageFields)};
 if(new TextEncoder().encode(JSON.stringify(result)).length>16384)return fail();return result;
}
export function selectCollectionLocalization(input:{schemaVersion:1;locale:string;direction:'ltr'|'rtl';revision:string;reviewStatus:'draft'|'reviewed';collection?:CollectionMessages}):CollectionLocalization{
 if(!input.collection)throw Error('Localized collection notices need localization.collection messages.');
 return {schemaVersion:1,locale:input.locale,direction:input.direction,revision:input.revision,reviewStatus:input.reviewStatus,collection:input.collection};
}
