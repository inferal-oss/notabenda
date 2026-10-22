// Generated from packages/notabenda/src/south-africa-marketing-policy.ts by scripts/sync-order-policy.mjs.
// @requirements REQ-ZA-MARKETING REQ-PRODUCT-FORM-PERMISSIONS
/** Public, operator-authored request particulars. This is not solicitation eligibility. */
export interface SouthAfricaMarketingRequest {
  profile:'za-popia-web-request';version:1;goodsServices:string;
  /** Future marketing method; consent itself is collected through the web field. */
  method:'email'|'sms'|'whatsapp';
  labels:{goodsServices:string;method:string;responsibleParty:string};
}
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const exact=(v:Record<string,unknown>,keys:string[])=>Object.keys(v).length===keys.length&&keys.every(key=>Object.hasOwn(v,key));
const text=(v:unknown,max:number):v is string=>typeof v==='string'&&!!v.trim()&&new TextEncoder().encode(v).length<=max&&!/[\u0000-\u001f\u007f]/u.test(v);
/** Shape and bounds only; the host reviews the request's truth, language and legal sufficiency. */
export function normalizeSouthAfricaMarketingRequest(input:unknown):SouthAfricaMarketingRequest {
  if(!object(input)||!exact(input,['profile','version','goodsServices','method','labels'])||input.profile!=='za-popia-web-request'||input.version!==1||!text(input.goodsServices,2000)||!['email','sms','whatsapp'].some(method=>method===input.method)||!object(input.labels)||!exact(input.labels,['goodsServices','method','responsibleParty'])||Object.values(input.labels).some(label=>!text(label,120)))throw Error('Invalid South African web marketing request.');
  return {...input,labels:{...input.labels}} as unknown as SouthAfricaMarketingRequest;
}
