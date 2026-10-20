// Generated from packages/notabenda/src/safe-links.ts by scripts/sync-order-policy.mjs.
// @requirements REQ-PRODUCT-SAFE-CONTENT REQ-PRODUCT-EMBEDS
export function isResourceOrigin(value: unknown): value is string {
  if(value==='self')return true;
  if(typeof value!=='string'||value.length>300)return false;
  try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password&&!url.hostname.includes('*')&&url.origin===value;}catch{return false;}
}
export function isSafeLink(value: unknown): value is string {
  if (typeof value !== 'string' || /[\s\u0000-\u001f\u007f\\]/u.test(value)) return false;
  if (/^\/(?!\/)/u.test(value)) return !/%(?:0[0-9a-f]|1[0-9a-f]|7f|5c)/iu.test(value);
  if (/^mailto:[a-zA-Z0-9.!$&'*+\/=^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/u.test(value)) return true;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; } catch { return false; }
}
