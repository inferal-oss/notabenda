import type {ProcessingActivity} from './types.js';
import type {ConsentRuntimeInventory} from './consent-runtime-config.js';

export type GlobalPrivacyControlStatus='observed'|'not-observed'|'unavailable';
export interface PrivacySignalSnapshot {
  globalPrivacyControl:GlobalPrivacyControlStatus;
  restrictedActivities:ProcessingActivity[];
  restrictedServices:Record<string,ProcessingActivity[]>;
}
/** @requirements REQ-PRODUCT-PRIVACY-SIGNALS
 * Fetch combines repeated headers. The draft protocol honors any individual field exactly equal to 1.
 */
export function hasGlobalPrivacyControl(request:Pick<Request,'headers'>):boolean {
  return (request.headers.get('Sec-GPC')??'').split(',').some(value=>value.replace(/^[ \t]+|[ \t]+$/gu,'')==='1');
}
/** Browser access only when invoked by a controller; imports and snapshot reads stay pure. */
export function browserGlobalPrivacyControl():unknown {
  return typeof window==='undefined'?undefined:(window.navigator as Navigator&{globalPrivacyControl?:boolean}).globalPrivacyControl;
}
/** @requirements REQ-PRODUCT-PRIVACY-SIGNALS REQ-US-CA-GPC REQ-US-CO-GPC REQ-US-CT-GPC */
export function evaluatePrivacySignals(config:ConsentRuntimeInventory,status:GlobalPrivacyControlStatus):PrivacySignalSnapshot|undefined {
  if(!config.privacySignals)return;
  const activities=status==='not-observed'?[]:[...config.privacySignals.globalPrivacyControl.appliesTo];
  return {globalPrivacyControl:status,restrictedActivities:activities,restrictedServices:Object.fromEntries(config.services.flatMap(service=>{
    const blocked=(service.processingActivities??[]).filter(activity=>activities.includes(activity));
    return blocked.length?[[service.id,blocked]]:[];
  }))};
}
