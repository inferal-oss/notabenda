// @requirements REQ-PRODUCT-SCOPE-GUARDS
// @requirements REQ-PRODUCT-CONFIG REQ-US-COPPA-SCOPE REQ-CH-PROFILING REQ-CA-OBA REQ-US-VA-RIGHTS REQ-AU-PIXELS
import {normalizeScopeGuardPolicy,scopeGuardContext,scopeGuardFields} from './scope-guard-policy.js';
import type {ScopeGuardFacts} from './scope-guard-policy.js';
import type {PublicSiteConfig,RequirementId} from './types.js';
export interface ScopeGuardReason {fact:keyof ScopeGuardFacts;declaration:'present'|'unknown';path:string;requirementIds:RequirementId[]}
export interface ScopeGuardDecision {
  status:'unassessed'|'restricted'|'no-declared-restrictions';
  coverage:'registered-optional-services';
  revision?:string;
  purposeRestrictions:Record<string,ScopeGuardReason[]>;
  blockedPurposeIds:string[];
  blockedServiceIds:string[];
}
export class ScopeGuardError extends Error {
  readonly code='scope-restricted';
  constructor(readonly purposeIds:readonly string[]){super('This choice includes purposes that need a separate supported process.');this.name='ScopeGuardError';}
}
const references:Record<keyof ScopeGuardFacts,RequirementId[]>={children:['REQ-US-COPPA-SCOPE','REQ-CA-OBA'],sensitiveData:['REQ-US-VA-RIGHTS','REQ-AU-PIXELS','REQ-CA-OBA'],highRiskProfiling:['REQ-CH-PROFILING'],regulatedSector:['REQ-PRODUCT-CONFIG']};
/** A support boundary, not an applicability decision, age check, or finding of lawfulness. */
export function evaluateScopeGuards(config:PublicSiteConfig):ScopeGuardDecision {
  const empty={coverage:'registered-optional-services' as const,purposeRestrictions:{},blockedPurposeIds:[],blockedServiceIds:[]};
  if(config.scopeGuards===undefined)return {status:'unassessed',...empty};
  const policy=normalizeScopeGuardPolicy(config.scopeGuards,config.purposes.map(p=>p.id)),purposeRestrictions:ScopeGuardDecision['purposeRestrictions']={};
  for(const purpose of config.purposes){
    const context=scopeGuardContext(policy,purpose.id)!;
    const extra=policy.purposes?.find(p=>p.id===purpose.id);
    const reasons:ScopeGuardReason[]=[];
    for(const field of scopeGuardFields){const value=context.facts[field];if(value==='absent')continue;const overridden=extra?.facts[field]===value&&policy.site[field]!==value;reasons.push({fact:field,declaration:value,path:overridden?`scopeGuards.purposes[${policy.purposes!.indexOf(extra!)}].facts.${field}`:`scopeGuards.site.${field}`,requirementIds:[...references[field]]});}
    if(reasons.length)purposeRestrictions[purpose.id]=reasons;
  }
  const blockedPurposeIds=(config.consent?.purposes??[]).filter(p=>Object.hasOwn(purposeRestrictions,p.id)).map(p=>p.id);
  const blockedServiceIds=(config.consent?.services??[]).filter(s=>config.services.find(item=>item.id===s.id)!.purposeIds.some(id=>blockedPurposeIds.includes(id))).map(s=>s.id);
  return {status:Object.keys(purposeRestrictions).length||scopeGuardFields.some(field=>policy.site[field]!=='absent')?'restricted':'no-declared-restrictions',coverage:'registered-optional-services',revision:policy.revision,purposeRestrictions,blockedPurposeIds,blockedServiceIds};
}
