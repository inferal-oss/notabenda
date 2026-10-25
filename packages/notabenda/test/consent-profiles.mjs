import {createCompatibilityConsent as createConsent} from '@notabenda/core/consent/compat';

import {compileConsentRuntimeConfig} from '@notabenda/core/content';
import {createConsent as createConsentRuntime} from '@notabenda/core';
import {requiredConsentEvidence} from '@notabenda/core/consent/evidence';
export const consentProfiles=[['compatibility',createConsent],['compiled',(input,environment,options={})=>{
 const {evidence,...rest}=options;
 return createConsentRuntime(compileConsentRuntimeConfig(input,{evidence:evidence?'required':'local',mode:'preview'}),environment,{...rest,...(evidence?{evidence:requiredConsentEvidence(evidence)}:{})});
}]];
