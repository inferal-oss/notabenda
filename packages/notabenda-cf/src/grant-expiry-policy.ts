// Generated from packages/notabenda/src/grant-expiry-policy.ts by scripts/sync-order-policy.mjs.
// @requirements REQ-IE-CONSENT-DURATION REQ-PRODUCT-CONSENT-RUNTIME REQ-PRODUCT-CONSENT-EVIDENCE
/** Explicit host selection of the DPC default; this does not decide applicability or justify an extension. */
export interface GrantExpiryPolicy {profile:'ie-dpc-six-month-default';version:1}
export function isGrantExpiryPolicy(value:unknown):value is GrantExpiryPolicy {
  return !!value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===2&&Object.hasOwn(value,'profile')&&Object.hasOwn(value,'version')&&(value as GrantExpiryPolicy).profile==='ie-dpc-six-month-default'&&(value as GrantExpiryPolicy).version===1;
}
export function sameGrantExpiryPolicy(a:unknown,b:unknown):boolean {
  return a===undefined&&b===undefined||isGrantExpiryPolicy(a)&&isGrantExpiryPolicy(b);
}
/** @requirements REQ-IT-REPROMPT Six UTC calendar months; clamp month-end without changing the time of day. */
export function sixCalendarMonthsAfter(at:number):number {
  const date=new Date(at),day=date.getUTCDate();
  date.setUTCDate(1);date.setUTCMonth(date.getUTCMonth()+6);
  const end=new Date(date.getTime());end.setUTCMonth(end.getUTCMonth()+1);end.setUTCDate(0);
  date.setUTCDate(Math.min(day,end.getUTCDate()));
  return date.getTime();
}
/** A shorter explicit lifetime always wins. Refusal/solicitation/retention clocks do not use this function. */
export function grantExpiresAt(at:number,days:number,policy?:GrantExpiryPolicy):number {
  const until=at+days*86400000;
  return policy?Math.min(until,sixCalendarMonthsAfter(at)):until;
}

/** Calendar clamping is not monotonic across month-end times. Bound a receipt by both clocks. */
export function receiptGrantExpiresAt(clientAt:number,recordedAt:number,days:number,policy?:GrantExpiryPolicy):number {
  return Math.min(grantExpiresAt(clientAt,days,policy),grantExpiresAt(recordedAt,days,policy));
}
