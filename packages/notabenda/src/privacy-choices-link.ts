// @requirements REQ-US-CA-ALTERNATIVE-LINK REQ-PRODUCT-PRIVACY-CHOICE-LINK REQ-PRODUCT-A11Y REQ-PRODUCT-MOBILE
import {normalizePrivacyChoicesLink} from './privacy-choices-policy.js';
import {privacyChoicesIconPaths} from './privacy-choices-icon.js';
export {normalizePrivacyChoicesLink} from './privacy-choices-policy.js';
export type {PrivacyChoicesLink} from './privacy-choices-policy.js';
const escape=(value:string)=>value.replace(/[&<>"']/gu,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
/** A plain anchor. No preference, consent, transport or storage action occurs when rendering it. */
export function renderPrivacyChoicesLink(input:unknown,options:{allowPreview?:boolean}={}):string {
 const d=normalizePrivacyChoicesLink(input,options),icon=d.presentation==='california-alternative-2026'?`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 14" width="30" height="14" aria-hidden="true" focusable="false">${privacyChoicesIconPaths.map(p=>`<path d="${escape(p.d)}" fill="${p.fill}"${'fillRule' in p?` fill-rule="${p.fillRule}" clip-rule="${p.clipRule}"`:''}${p.fill==='#0066FF'?' data-privacy-choices-ink=""':''}/>`).join('')}</svg>`:'';
 return `<a class="nb-privacy-choices-link" data-privacy-choices-revision="${escape(d.revision)}" data-privacy-choices-presentation="${d.presentation}" href="${escape(d.href)}">${icon}<span${d.presentation==='california-alternative-2026'?' lang="en" dir="ltr"':''}>${escape(d.label)}</span></a>`;
}
