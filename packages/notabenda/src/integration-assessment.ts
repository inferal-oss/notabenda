// @requirements REQ-PRODUCT-AGENT-INTEGRATION
import {selectIntegration} from './integration-reference.js';
import {readSetupAnswers,createSetupPlan} from './setup.js';
import {validateSiteConfig} from './config.js';

/** JSON data only, including through the API. Never invoke a caller's getters/toJSON. */
function plainInput(input:unknown):Record<string,unknown>{
 const fail=():never=>{throw Error('Assessment requires bounded plain JSON with selection, config and optional answers.');};
 const seen=new Set<object>();let nodes=0,bytes=0;
 function copy(value:unknown,depth:number):unknown{
  if(++nodes>50000||depth>64)return fail();
  if(value===null||typeof value==='boolean')return value;
  if(typeof value==='number')return Number.isFinite(value)?value:fail();
  if(typeof value==='string'){bytes+=new TextEncoder().encode(value).length;if(bytes>1024*1024)return fail();return value;}
  if(!value||typeof value!=='object'||seen.has(value))return fail();
  const array=Array.isArray(value),proto=Object.getPrototypeOf(value);
  if(array?proto!==Array.prototype:proto!==null&&proto!==Object.prototype)return fail();
  seen.add(value);const result:Record<string,unknown>|unknown[]=array?[]:Object.create(null);
  for(const key of Reflect.ownKeys(value)){
   if(array&&key==='length')continue;
   if(typeof key!=='string'||array&&!/^(0|[1-9][0-9]*)$/u.test(key))return fail();
   const descriptor=Object.getOwnPropertyDescriptor(value,key)!;
   if(!descriptor.enumerable||!Object.hasOwn(descriptor,'value'))return fail();
   bytes+=new TextEncoder().encode(key).length;if(bytes>1024*1024)return fail();
   Object.defineProperty(result,key,{value:copy(descriptor.value,depth+1),enumerable:true,writable:true,configurable:true});
  }
  if(array&&(result as unknown[]).length!==(value as unknown[]).length)return fail();
  if(array&&Object.keys(result).length!==(value as unknown[]).length)return fail();
  seen.delete(value);return result;
 }
 const root=copy(input,0);
 if(!root||typeof root!=='object'||Array.isArray(root)||Object.keys(root).some(k=>!['selection','config','answers'].includes(k))||!Object.hasOwn(root,'selection')||!Object.hasOwn(root,'config'))return fail();
 return root as Record<string,unknown>;
}

/** Inspect values without publishing them or interpreting presence as truth. */
function observe(config:unknown,path:string){
 let values:unknown[]=[config];
 for(const key of path.split('.')){
  const containers=values.flatMap(v=>Array.isArray(v)?v:[v]);
  values=containers.map(v=>v!==null&&typeof v==='object'&&Object.hasOwn(v,key)?(v as Record<string,unknown>)[key]:undefined);
 }
 const populated=values.filter(v=>v!==null&&v!==undefined&&!(typeof v==='string'&&!v.trim())&&!(Array.isArray(v)&&!v.length));
 const matched=values.filter(v=>v!==undefined).length;
 return {path,state:!matched?'absent':!populated.length?'empty':populated.length<values.length?'partial':'declared',matchedItems:matched,totalItems:values.length};
}

/** Read-only reconciliation; never drafts config, selects applicability or asserts readiness. */
export function assessIntegration(input:unknown){
 const data=plainInput(input),selection=selectIntegration(data.selection),reference=selection.reference;
 const answers=data.answers===undefined?undefined:readSetupAnswers(data.answers);
 const preview=validateSiteConfig(data.config,{mode:'preview'}),production=validateSiteConfig(data.config,{mode:'production'});
 const questions=reference.questions.filter(q=>reference.relevantQuestionIds.includes(q.id)).map(q=>{
  const answer=answers?.answers[q.id];return {...q,choice:answer?.choice??'unknown',justificationRecorded:!!answer?.justification,
   status:!answer||answer.choice==='unknown'?'needs-answer':!answer.justification?'needs-support':'recorded-unverified'};
 });
 const targets=reference.targets.map(t=>({
  id:t.id,selection:t.selection,outcome:t.outcome,guides:t.guides,
  configuration:t.configPaths.map(path=>({...observe(data.config,path),requiredForTarget:t.requiredConfigPaths?.includes(path)??false})),
  factsToConfirm:t.factsNeeded,hostWorkToVerify:t.hostWork,acceptanceScenarios:t.verify
 }));
 const missingRequiredConfig=targets.flatMap(t=>t.configuration.filter(f=>f.requiredForTarget&&f.state!=='declared').map(f=>({targetId:t.id,path:f.path,state:f.state})));
 const publicFacts=answers?.publicFacts??{};
 const factPaths={siteName:'site.name',siteId:'site.id',siteUrl:'site.url',controllerName:'controller.name',controllerEmail:'controller.email',controllerAddress:'controller.address'} as const;
 const factConflicts=Object.entries(factPaths).filter(([id,path])=>{
  const asserted=publicFacts[id as keyof typeof factPaths];if(!asserted)return false;
  const [section,key]=path.split('.');const current=(data.config as Record<string,unknown>)?.[section!];
  return !current||typeof current!=='object'||(current as Record<string,unknown>)[key!]!==asserted;
 }).map(([factId,path])=>({factId,path,action:'Reconcile the explicit answer with the current config; neither value was changed.'}));
 // Reuse the wizard's conflict/restriction advice without modifying the supplied config.
 const sharedReview=preview.valid&&answers?createSetupPlan(answers,{config:data.config,preserveConfig:true}).report:undefined;
 const practiceConflicts=sharedReview?.reviewItems.filter(item=>item.startsWith('Conflict:'))??[];
 const sharedReviewItems=sharedReview?.reviewItems.filter(item=>{
  const question=reference.questions.find(q=>item.startsWith(q.title));
  return !question||reference.relevantQuestionIds.includes(question.id);
 })??[];
 return {
  schemaVersion:1,kind:'private-integration-assessment',requestedTargetIds:selection.requestedTargetIds,prerequisiteTargetIds:selection.prerequisiteTargetIds,
  unresolvedScopeQuestionIds:selection.unresolvedQuestionIds,prerequisiteReview:selection.prerequisiteReview,
  status:!preview.valid?'invalid-config':!targets.length?'no-targets':missingRequiredConfig.length||factConflicts.length||practiceConflicts.length||questions.some(q=>q.status!=='recorded-unverified')?'needs-input':!production.valid?'needs-review':'needs-verification',
  productionReady:false,
  boundaries:{readsOnlyExplicitInputs:true,writesFiles:false,executesProjectCode:false,changesConfig:false,activatesFeatures:false,declaredIsNotVerified:true,legalReview:false},
  validation:{preview,production},missingRequiredConfig,factConflicts,practiceConflicts,questions,targets,
  recommendations:sharedReview?.recommendations.filter(r=>reference.relevantQuestionIds.includes(r.id as typeof reference.relevantQuestionIds[number])||r.status==='review')??[],
  sharedReviewItems,
  limits:['Configuration presence and recorded answers do not establish factual correctness, applicability or host behavior.','Missing optional paths can be intentional. Required paths are minimum target prerequisites, not a complete feature test.','Questionnaire review items may concern the broader inventory; they do not add targets.','No inferred values, draft configuration or operator-private values are returned. Keep this assessment private; diagnostic paths may identify inventory entries.']
 };
}
