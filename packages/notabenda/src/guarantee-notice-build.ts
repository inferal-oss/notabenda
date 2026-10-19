/** @requirements REQ-EU-GUARANTEE-NOTICE REQ-PRODUCT-GUARANTEE-NOTICE */
import {readFile} from 'node:fs/promises';
import {canonicalJson,sha256} from './content.js';
import {normalizeLegalGuaranteeNotice} from './guarantee-notice.js';
import type {GuaranteeNoticeLanguage,GuaranteeNoticeWording,LegalGuaranteeNotice} from './guarantee-notice.js';
export interface LegalGuaranteeNoticeBuildOptions {
  language:GuaranteeNoticeLanguage;reviewStatus:'draft'|'reviewed';assetBase?:string;
  /** Required outside English. Translate the surrounding UI, not the official graphic. */
  wording?:GuaranteeNoticeWording;
  /** Optional reviewed replacement for the PDF-extracted text equivalent. Never edits the artwork. */
  textAlternative?:string;allowPreview?:boolean;
}
/** Copy one selected, integrity-checked local official asset. Never downloads or silently updates source files. */
export async function buildLegalGuaranteeNotice(options:LegalGuaranteeNoticeBuildOptions):Promise<{notice:LegalGuaranteeNotice;files:Record<string,string>}> {
  if(!options||typeof options.language!=='string'||!/^[a-z]{2}$/u.test(options.language))throw Error('Choose a supported notice language.');
  const manifest=JSON.parse(await readFile(new URL('../assets/guarantees/manifest.json',import.meta.url),'utf8'));
  const source=Object.hasOwn(manifest.assets,options.language)?manifest.assets[options.language]:undefined;
  if(!source)throw Error('Choose a supported notice language.');
  const base=options.assetBase??'/assets/guarantees';if(!/^\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+$/u.test(base))throw Error('Use an absolute local asset directory without a trailing slash.');
  const bytes=await readFile(new URL('../assets/guarantees/'+options.language+'.svg',import.meta.url),'utf8');
  if(sha256(bytes)!==source.sha256||new TextEncoder().encode(bytes).length!==source.bytes)throw Error('The bundled official guarantee asset failed its integrity check.');
  if(!options.wording&&options.language!=='en')throw Error('Provide translated surrounding labels for this notice language.');
  const wording=options.wording??{title:'Your legal guarantee rights',imageAlt:'Official EU legal guarantee notice. Its wording is also provided as text alongside the artwork.',fullSizeLink:'Open the full-size official notice',informationLink:'More about your legal guarantee rights'};
  const notice=normalizeLegalGuaranteeNotice({schemaVersion:1,kind:'eu-legal-guarantee-notice',renderingPolicy:'guarantee-notice-v1',sourceRevision:'ec-2026-10-19',noticeId:'0'.repeat(64),language:options.language,reviewStatus:options.reviewStatus,asset:{url:base+'/'+source.sha256+'.svg',sha256:source.sha256,bytes:source.bytes,width:source.viewBox[2],height:source.viewBox[3]},informationUrl:source.informationUrl,textAlternative:options.textAlternative??source.textAlternative,wording},{allowPreview:options.allowPreview===true});
  const {noticeId:_,...descriptor}=notice;
  return {notice:{...notice,noticeId:sha256(canonicalJson(descriptor))},files:{[notice.asset.url.slice(1)]:bytes}};
}
/** Recompute descriptor identity and check the selected asset metadata; does not authenticate the reviewer. */
export function verifyLegalGuaranteeNotice(input:unknown,options:{allowPreview?:boolean}={}):LegalGuaranteeNotice {
  const notice=normalizeLegalGuaranteeNotice(input,options),{noticeId,...descriptor}=notice;
  if(sha256(canonicalJson(descriptor))!==noticeId)throw Error('The guarantee notice does not match its content identity.');
  return notice;
}
