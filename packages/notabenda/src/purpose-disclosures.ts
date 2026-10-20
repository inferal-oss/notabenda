// @requirements REQ-EU-INTERESTS-DISCLOSURE
import type {Purpose} from './types.js';

/** A public, host-authored statement; never a private balancing assessment. */
export const isLegitimateInterests=(value:unknown):value is string=>typeof value==='string'&&!!value.trim()&&new TextEncoder().encode(value).length<=4000&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value);

/** Preserve existing wording when absent. Both parts use the host's content language. */
export function purposeLegalBasis(purpose:Pick<Purpose,'legalBasis'|'legitimateInterests'>):string {
  return purpose.legitimateInterests===undefined?purpose.legalBasis:purpose.legalBasis+(/[.!?…]$/u.test(purpose.legalBasis.trimEnd())?' ':'. ')+purpose.legitimateInterests;
}
