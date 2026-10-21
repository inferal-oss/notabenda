// @requirements REQ-PRODUCT-CONSENT-NOTICE-FILES
// @requirements REQ-PRODUCT-CONSENT-EVIDENCE REQ-PRODUCT-RETAINED-RELEASES REQ-PRODUCT-SAFE-CONTENT
import {canonicalJson,createConsentNotice} from './content.js';
import type {LegalArtifact} from './content.js';
import {copyPublicReleaseJson,normalizePublicLegalArtifact} from './release-files.js';
import {normalizeConsentNotice} from './consent-notice.js';
import type {ConsentNotice} from './consent-notice.js';
import type {ValidationOptions} from './types.js';

const fail=():never=>{throw Error('Invalid consent notice release. Supply an intact public notice and its legal release for this site and build mode.');};
const pinned=(notice:ConsentNotice)=>`artifacts/${notice.artifactId}/consent/${notice.noticeId}.json`;
export interface ConsentNoticeBuild {notice:ConsentNotice;files:Record<string,string>}

/** Build an explicit current alias and an immutable notice-ID URL. No registration or activation. */
export function createConsentNoticeFiles(artifact:unknown,settings:Parameters<typeof createConsentNotice>[1],options:ValidationOptions={}):ConsentNoticeBuild {
 const release=normalizePublicLegalArtifact(artifact,options);
 const value=copyPublicReleaseJson(settings,32768).value;
 if(!value||typeof value!=='object'||Array.isArray(value)||!Object.hasOwn(value,'scopeId')||Object.keys(value).some(key=>!['scopeId','wording','deliveryWindowSeconds'].includes(key)))return fail();
 if(value.wording!==undefined&&(!value.wording||typeof value.wording!=='object'||Array.isArray(value.wording))||value.deliveryWindowSeconds!==undefined&&(!Number.isInteger(value.deliveryWindowSeconds)||Number(value.deliveryWindowSeconds)<30||Number(value.deliveryWindowSeconds)>86400))return fail();
 const notice=createConsentNotice(release,value as unknown as Parameters<typeof createConsentNotice>[1],options),body=canonicalJson(notice)+'\n';
 return {notice,files:{'consent-notice.json':body,[pinned(notice)]:body}};
}

// Read only indexed data properties. No sparse arrays, custom iterators, accessors or symbols.
function entries(input:unknown,max:number):unknown[]{
 if(!Array.isArray(input)||Object.getPrototypeOf(input)!==Array.prototype||input.length>max)return fail();
 const descriptors=Object.getOwnPropertyDescriptors(input);
 if(Reflect.ownKeys(descriptors).length!==input.length+1)return fail();
 return Array.from({length:input.length},(_,index)=>{const d=descriptors[String(index)];return d&&Object.hasOwn(d,'value')&&d.enumerable?d.value:fail();});
}

/** Re-emit only pinned notices after verifying their complete descriptor against the named releases. */
export function createRetainedConsentNoticeFiles(artifacts:readonly unknown[],notices:readonly unknown[],options:ValidationOptions&{siteId:string}):Record<string,string>{
 if(!options||typeof options.siteId!=='string'||!/^[a-z][a-z0-9-]{0,119}$/u.test(options.siteId)||options.mode!==undefined&&!['preview','production'].includes(options.mode))return fail();
 const inputs=entries(artifacts,257),saved=entries(notices,256),releases=new Map<string,LegalArtifact>();let bytes=0;
 for(const input of inputs){
  const artifact=normalizePublicLegalArtifact(input,options),id=artifact.manifest.artifactId;
  bytes+=Buffer.byteLength(canonicalJson(artifact));if(bytes>16*1024*1024||artifact.manifest.siteId!==options.siteId)return fail();
  const prior=releases.get(id);if(prior&&canonicalJson(prior)!==canonicalJson(artifact))return fail();releases.set(id,artifact);
 }
 const files:Record<string,string>={};
 for(const input of saved){
  const copy=copyPublicReleaseJson(input,32768).value,notice=normalizeConsentNotice(copy,{allowPreview:options.mode==='preview'}),artifact=releases.get(notice.artifactId);
  if(!artifact||notice.siteId!==options.siteId||notice.mode!==artifact.manifest.mode)return fail();
  const expected=createConsentNotice(artifact,{scopeId:notice.scopeId,deliveryWindowSeconds:notice.policy.deliveryWindowSeconds,...(notice.schemaVersion===1?{wording:notice.wording}:{})},options);
  if(canonicalJson(expected)!==canonicalJson(notice))return fail();
  const path=pinned(notice),body=canonicalJson(notice)+'\n';if(Object.hasOwn(files,path)&&files[path]!==body)return fail();files[path]=body;
 }
 return files;
}
