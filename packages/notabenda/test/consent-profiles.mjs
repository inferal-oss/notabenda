import {createConsent} from 'notabenda';
import {compileConsentRuntimeConfig} from 'notabenda/content';
import {createConsentRuntime} from 'notabenda/consent';
import {requiredConsentEvidence} from 'notabenda/consent/evidence';
export const consentProfiles=[['compatibility',createConsent],['compiled',(input,environment,options={})=>{
 const {evidence,...rest}=options;
 return createConsentRuntime(compileConsentRuntimeConfig(input,{evidence:evidence?'required':'local',mode:'preview'}),environment,{...rest,...(evidence?{evidence:requiredConsentEvidence(evidence)}:{})});
}]];
