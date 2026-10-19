import {fixture} from './helpers.mjs';
export async function exceptionFixture(){
 const c=await fixture({reviewed:true});c.site.id='exception-test';
 const base=c.purposes[0];c.purposes=['improvement','appearance','marketing'].map(id=>({...structuredClone(base),id,name:id,description:'A test purpose: '+id}));
 c.services=c.purposes.map(p=>({id:p.id+'-service',name:p.name,provider:'Local test',location:'This browser',purposeIds:[p.id],processingActivities:[]}));
 c.storage=c.purposes.map(p=>({id:p.id+'-storage',name:'test-'+p.id,type:'localStorage',serviceId:p.id+'-service',duration:'Until cleared',classification:p.id==='marketing'?'optional':'exception',...(p.id==='marketing'?{}:{exceptionId:p.id})}));
 c.scopeGuards={version:1,revision:'assessment-1',site:{children:'absent',sensitiveData:'absent',highRiskProfiling:'absent',regulatedSector:'absent'}};
 c.consent={purposes:[{id:'marketing',scope:'one'}],services:[{id:'marketing-service',scope:'one'}],grantLifetimeDays:30,refusalLifetimeDays:180,dismissalMinutes:20};
 c.storageExceptions={schemaVersion:1,applicability:'host-assessed-uk-pecr',preferenceRetention:'until-cleared',preferenceNotice:'These settings stay in this browser until you clear its storage.',information:{label:'Storage information',href:'/cookies'},entries:[
 {id:'improvement',revision:1,serviceIds:['improvement-service'],purposeIds:['improvement'],storageIds:['improvement-storage'],title:'Service improvement',description:'Test aggregate statistics only.',reviewStatus:'reviewed',profile:'uk-pecr-statistical',conditions:{informationSocietyService:true,soleImprovementStatistics:true,aggregateNonIdentifyingResults:true,noIndividualDecisions:true,deleteIndividualDataAfterAggregation:true,noAutomaticallyEmittedSignals:true,thirdPartyUse:'none',noOtherUseOrLinking:true}},
 {id:'appearance',revision:1,serviceIds:['appearance-service'],purposeIds:['appearance'],storageIds:['appearance-storage'],title:'Page appearance',description:'Test layout preference only.',reviewStatus:'reviewed',profile:'uk-pecr-appearance',conditions:{informationSocietyService:true,soleAppearanceOrFunctionality:true,noBehaviouralContentSelection:true,onlyNecessaryPersonalData:true}}
 ]};return c;
}
export function memoryJournal(){
 const data=new Map(),listeners=new Map();let queue=Promise.resolve();
 const journal={data,fail:false,hold:null,
  read:async key=>structuredClone(data.get(key)),
  update(key,change){const work=queue.then(async()=>{if(journal.fail)throw Error('unavailable');const before=data.get(key),after=structuredClone(change(structuredClone(before)));data.set(key,after);if(JSON.stringify(before)!==JSON.stringify(after))for(const fn of listeners.get(key)??[])fn();const hold=journal.hold;journal.hold=null;if(hold)await hold;return structuredClone(after);});queue=work.catch(()=>{});return work;},
  subscribe(key,fn){const set=listeners.get(key)??new Set();listeners.set(key,set);set.add(fn);return ()=>set.delete(fn);},
  notify(key){for(const fn of listeners.get(key)??[])fn();}
 };return journal;
}
export const deferred=()=>{let resolve,reject;return {promise:new Promise((a,b)=>{resolve=a;reject=b;}),get resolve(){return resolve;},get reject(){return reject;}};};
