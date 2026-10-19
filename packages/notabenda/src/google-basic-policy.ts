// @requirements REQ-GOOGLE-MODE REQ-PRODUCT-CONFIG
export const googleConsentTypes=['analytics_storage','ad_storage','ad_user_data','ad_personalization'] as const;
export type GoogleConsentType=typeof googleConsentTypes[number];
export type GoogleConsentState=Record<GoogleConsentType,'granted'|'denied'>;
export interface GoogleBasicConfig {version:1;tagIds:string[];signals:Record<GoogleConsentType,string[]>}
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
/** Explicit public declarations only; arrays with no purposes keep that Google signal denied. */
export function normalizeGoogleBasic(input:unknown,purposeIds:readonly string[]):GoogleBasicConfig {
 const invalid=():never=>{throw new Error('Declare Google Basic version 1, unique G-/AW- tag IDs and all four signal purpose arrays covering exactly this service’s purposes. Empty arrays mean denied.');};
 if(!object(input)||Object.keys(input).length!==3||Object.keys(input).some(key=>!['version','tagIds','signals'].includes(key))||input.version!==1||!Array.isArray(input.tagIds)||!input.tagIds.length||input.tagIds.length>10||new Set(input.tagIds).size!==input.tagIds.length||input.tagIds.some(id=>typeof id!=='string'||!(/^(?:G-[A-Z0-9]{4,20}|AW-[0-9]{3,20})$/u.test(id)))||!object(input.signals)||Object.keys(input.signals).length!==4||Object.keys(input.signals).some(key=>!googleConsentTypes.some(type=>type===key)))return invalid();
 const mapping={} as Record<GoogleConsentType,string[]>,used=new Set<string>();
 for(const type of googleConsentTypes){const ids=input.signals[type];if(!Array.isArray(ids)||ids.length>40||new Set(ids).size!==ids.length||ids.some(id=>typeof id!=='string'||!purposeIds.includes(id)))return invalid();mapping[type]=[...ids];for(const id of ids)used.add(id);}
 if(input.tagIds.some(id=>(id as string).startsWith('G-'))&&!mapping.analytics_storage.length||input.tagIds.some(id=>(id as string).startsWith('AW-'))&&(!mapping.ad_storage.length||!mapping.ad_user_data.length))return invalid();
 if(!purposeIds.length||purposeIds.some(id=>!used.has(id))||used.size!==new Set(purposeIds).size)return invalid();
 return {version:1,tagIds:[...input.tagIds] as string[],signals:mapping};
}
