// Generated from packages/notabenda/src/form-refusal-policy.ts by scripts/sync-order-policy.mjs.
// @requirements REQ-PRODUCT-FORM-PERMISSIONS REQ-ZA-MARKETING
/** Host-reviewed copy for an explicit negative choice. Silence is not a refusal event. */
export interface FormRefusalCopy {label:string;recorded:string;pending:string;retry:string}
export function normalizeFormRefusalCopy(input:unknown):FormRefusalCopy {
  if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid form refusal copy.');
  const value=input as Record<string,unknown>,fields=['label','recorded','pending','retry'];
  if(Object.keys(value).length!==fields.length||fields.some(key=>!Object.hasOwn(value,key)||typeof value[key]!=='string'||!value[key].trim()||new TextEncoder().encode(value[key]).length>(key==='label'||key==='retry'?120:2000)||/[\u0000-\u001f\u007f]/u.test(value[key])))throw Error('Invalid form refusal copy.');
  return {...value} as unknown as FormRefusalCopy;
}
