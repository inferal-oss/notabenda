import {createConsent} from '@notabenda/core';
import {compileConsentRuntimeConfig} from '@notabenda/core/content';
import {createConsentRuntime} from '@notabenda/core/consent';
import {requiredConsentEvidence} from '@notabenda/core/consent/evidence';
export const consentProfiles=[['compatibility',createConsent],['compiled',(input,environment,options={})=>{
 const {evidence,...rest}=options;
 return createConsentRuntime(compileConsentRuntimeConfig(input,{evidence:evidence?'required':'local',mode:'preview'}),environment,{...rest,...(evidence?{evidence:requiredConsentEvidence(evidence)}:{})});
}]];
