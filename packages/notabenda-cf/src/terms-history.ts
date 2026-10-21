// @requirements REQ-PRODUCT-TERMS-HISTORY REQ-PRODUCT-CF-HISTORY
import {normalizeRecord,boundedText} from './records.js';
import {normalizeTermsAgreementSettings} from './terms-settings.js';
import type {TermsAgreementSetting} from './terms-settings.js';
import {normalizeTermsLocalization} from './terms-localization-policy.js';
import type {TermsLocalization} from './terms-localization-policy.js';
import type {JsonValue} from './types.js';
export const TERMS_SETTINGS_BYTES=64*1024;
export interface TermsSettingsRelease {
 schemaVersion:1;kind:'terms-agreement-settings';artifactId:string;siteId:string;locale:string;mode:'preview'|'production';
 declaration:'configured'|'not-declared';agreements:TermsAgreementSetting[];
 document:{title:string;version:string;effectiveDate:string;reviewStatus:'draft'|'reviewed';sha256:string;contentSha256:string;url:string};
 localization?:TermsLocalization;
}
const invalid=():never=>{throw Error('Invalid retained terms agreement settings.');};
const object=(v:unknown):Record<string,unknown>=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:invalid();
const exact=(v:Record<string,unknown>,required:string[],optional:string[]=[])=>required.every(k=>Object.hasOwn(v,k))&&Object.keys(v).every(k=>required.includes(k)||optional.includes(k));
const text=(v:unknown,max:number):v is string=>typeof v==='string'&&!!v.trim()&&boundedText(v,max);
const hash=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{64}$/u.test(v);
/** A bounded projection, normalized independently at the custom-store/render boundary. */
export function normalizeTermsSettingsRelease(input:unknown):TermsSettingsRelease {
 const v=object(normalizeRecord({id:'settings',data:input},TERMS_SETTINGS_BYTES).data);
 if(!exact(v,['schemaVersion','kind','artifactId','siteId','locale','mode','declaration','agreements','document'],['localization'])||v.schemaVersion!==1||v.kind!=='terms-agreement-settings'||!hash(v.artifactId)||!text(v.siteId,120)||!/^[a-z][a-z0-9-]*$/u.test(v.siteId)||!text(v.locale,100)||(v.mode!=='preview'&&v.mode!=='production')||(v.declaration!=='configured'&&v.declaration!=='not-declared'))return invalid();
 const mode=v.mode as 'preview'|'production',declaration=v.declaration as TermsSettingsRelease['declaration'];
 let agreements:TermsAgreementSetting[];
 if(declaration==='not-declared'){if(!Array.isArray(v.agreements)||v.agreements.length)return invalid();agreements=[];}
 else agreements=normalizeTermsAgreementSettings(v.agreements,{allowPreview:mode==='preview'});
 const d=object(v.document);
 if(!exact(d,['title','version','effectiveDate','reviewStatus','sha256','contentSha256','url'])||!text(d.title,300)||!text(d.version,200)||typeof d.effectiveDate!=='string'||!/^\d{4}-\d{2}-\d{2}$/u.test(d.effectiveDate)||!Number.isFinite(Date.parse(d.effectiveDate))||new Date(d.effectiveDate).toISOString().slice(0,10)!==d.effectiveDate||(d.reviewStatus!=='draft'&&d.reviewStatus!=='reviewed')||mode==='production'&&d.reviewStatus!=='reviewed'||!hash(d.sha256)||!hash(d.contentSha256)||d.url!==`/artifacts/${v.artifactId}/terms.html`)return invalid();
 const localization=v.localization===undefined?undefined:normalizeTermsLocalization(v.localization,{locale:v.locale,allowPreview:mode==='preview'});
 return {schemaVersion:1,kind:'terms-agreement-settings',artifactId:v.artifactId,siteId:v.siteId,locale:v.locale,mode,declaration,agreements,document:{title:d.title,version:d.version,effectiveDate:d.effectiveDate,reviewStatus:d.reviewStatus as 'draft'|'reviewed',sha256:d.sha256,contentSha256:d.contentSha256,url:d.url},...(localization?{localization}:{})};
}
/** Call only after full stored-release validation. No offers or current selections are read or generated. */
export function termsSettingsFromArtifact(artifact:Record<string,JsonValue>):TermsSettingsRelease {
 const m=object(artifact.manifest),config=artifact.publicConfig===undefined?{}:object(artifact.publicConfig),site=config.site===undefined?{}:object(config.site);
 if(site.id!==undefined&&site.id!==m.siteId||site.locale!==undefined&&site.locale!==m.locale||!Array.isArray(m.documents))return invalid();
 const docs=m.documents.filter(d=>object(d).kind==='terms');if(docs.length!==1)return invalid();const d=object(docs[0]);
 const settings=config.terms===undefined?undefined:object(config.terms).agreements;
 const l=config.localization===undefined?undefined:object(config.localization),localization=l?.terms===undefined?undefined:{schemaVersion:l.schemaVersion,locale:l.locale,direction:l.direction,revision:l.revision,reviewStatus:l.reviewStatus,terms:l.terms};
 if((settings!==undefined||localization!==undefined)&&!hash(m.configSha256))return invalid();
 return normalizeTermsSettingsRelease({schemaVersion:1,kind:'terms-agreement-settings',artifactId:m.artifactId,siteId:m.siteId,locale:m.locale,mode:m.mode,declaration:settings===undefined?'not-declared':'configured',agreements:settings===undefined?[]:settings,document:{title:d.title,version:d.version,effectiveDate:d.effectiveDate,reviewStatus:d.reviewStatus,sha256:d.sha256,contentSha256:d.contentSha256,url:`/artifacts/${m.artifactId}/terms.html`},...(localization?{localization}:{})});
}
