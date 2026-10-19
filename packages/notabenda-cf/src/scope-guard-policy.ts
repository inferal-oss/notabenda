// @requirements REQ-PRODUCT-SCOPE-GUARDS
// @requirements REQ-PRODUCT-CONFIG
/** Public operator declarations, never visitor attributes or a specialized authorization. */
export type ScopeGuardFact = 'absent'|'present'|'unknown';
export interface ScopeGuardFacts {children:ScopeGuardFact;sensitiveData:ScopeGuardFact;highRiskProfiling:ScopeGuardFact;regulatedSector:ScopeGuardFact}
export interface ScopeGuardPolicy {
  version:1;
  /** New material revision whenever an assessment changes. Never reuse a prior revision. */
  revision:string;
  site:ScopeGuardFacts;
  /** Additional restrictions. An absent value cannot relax a restrictive site declaration. */
  purposes?:{id:string;facts:Partial<ScopeGuardFacts>}[];
}
export const scopeGuardFields=['children','sensitiveData','highRiskProfiling','regulatedSector'] as const;
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const exact=(v:Record<string,unknown>,required:string[],optional:string[]=[])=>required.every(k=>Object.hasOwn(v,k))&&Object.keys(v).every(k=>required.includes(k)||optional.includes(k));
const fact=(v:unknown):v is ScopeGuardFact=>v==='absent'||v==='present'||v==='unknown';
const invalid=():never=>{throw new Error('Use scopeGuards version 1, a bounded material revision, four explicit site facts and unique declared purpose restrictions. Keep justifications in private reports.');};
export function normalizeScopeGuardPolicy(value:unknown,purposeIds:readonly string[]):ScopeGuardPolicy {
  if(!object(value)||!exact(value,['version','revision','site'],['purposes'])||value.version!==1||typeof value.revision!=='string'||!value.revision.trim()||new TextEncoder().encode(value.revision).length>200||/[\u0000-\u001f\u007f]/u.test(value.revision)||!object(value.site)||!exact(value.site,[...scopeGuardFields])||scopeGuardFields.some(field=>!fact((value.site as Record<string,unknown>)[field])))return invalid();
  const site=Object.fromEntries(scopeGuardFields.map(field=>[field,(value.site as Record<string,unknown>)[field]])) as unknown as ScopeGuardFacts;
  const purposes:NonNullable<ScopeGuardPolicy['purposes']>=[];const seen=new Set<string>();
  if(value.purposes!==undefined){
    if(!Array.isArray(value.purposes)||value.purposes.length>256)return invalid();
    for(const entry of value.purposes){
      if(!object(entry)||!exact(entry,['id','facts'])||typeof entry.id!=='string'||!purposeIds.includes(entry.id)||seen.has(entry.id)||!object(entry.facts)||!Object.keys(entry.facts).length||!exact(entry.facts,[],[...scopeGuardFields])||Object.values(entry.facts).some(value=>!fact(value)))return invalid();
      seen.add(entry.id);purposes.push({id:entry.id,facts:Object.fromEntries(scopeGuardFields.filter(field=>Object.hasOwn(entry.facts as object,field)).map(field=>[field,(entry.facts as Record<string,unknown>)[field]]))});
    }
  }
  return {version:1,revision:value.revision,site,...(value.purposes===undefined?{}:{purposes})};
}
export function scopeGuardContext(policy:ScopeGuardPolicy|undefined,purposeId:string):{version:1;revision:string;facts:ScopeGuardFacts}|undefined {
  if(!policy)return undefined;
  const extra=policy.purposes?.find(p=>p.id===purposeId)?.facts;
  const rank={absent:0,unknown:1,present:2};
  const facts=Object.fromEntries(scopeGuardFields.map(field=>{const base=policy.site[field],value=extra?.[field];return [field,value!==undefined&&rank[value]>rank[base]?value:base];})) as unknown as ScopeGuardFacts;
  return {version:1,revision:policy.revision,facts};
}
export const scopeGuardBlocked=(policy:ScopeGuardPolicy|undefined,purposeId:string):boolean=>{
  const context=scopeGuardContext(policy,purposeId);return !!context&&scopeGuardFields.some(field=>context.facts[field]!=='absent');
};
