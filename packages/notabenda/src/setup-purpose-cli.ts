/** @requirements REQ-PRODUCT-SETUP REQ-PRODUCT-CONFIG REQ-PRODUCT-SERVICE-CATALOG */
import {createPurposeDraftPlan} from './setup-purpose.js';
import {createStarterConfig} from './starter.js';
import type {Purpose,SiteConfig} from './types.js';
export async function reviewSetupPurposes(base:SiteConfig|undefined,ask:(prompt:string,max?:number)=>Promise<string>):Promise<SiteConfig|undefined> {
 if((await ask('Review processing purposes before choosing services? yes / no [no]: ',16)).toLowerCase()!=='yes')return base;
 console.log('Purpose facts are public notice content. Blank keeps an existing value. For basis, retention or consequences, ? leaves an explicit draft placeholder. This does not decide a legal basis.');
 while(true){
  const config=base??createStarterConfig();console.log(config.purposes.length?config.purposes.map(p=>p.id+' — '+p.name).join('\n'):'No processing purposes declared.');
  const action=(await ask('Purpose action: add / edit / remove / done [done]: ',16)).toLowerCase();if(!action||action==='done')return base;if(!['add','edit','remove'].includes(action))continue;
  const id=await ask(action==='add'?'Unique stable purpose ID: ':'Existing purpose ID: ',120),previous=config.purposes.find(p=>p.id===id);
  if(action!=='add'&&!previous){console.log('Choose an existing purpose ID.');continue;}
  try{
   if(action==='remove'){
    if((await ask('Confirm removing this purpose from the local draft? yes / no [no]: ',16)).toLowerCase()!=='yes')continue;
    base=createPurposeDraftPlan(config,{action:'remove',previous:previous!}).config;console.log('Removed the unreferenced purpose from the local draft.');continue;
   }
   const prior=action==='edit'?previous:undefined;
   const value=async(label:string,key:string,previous?:string,unresolved=false)=>{const answer=await ask(label+': ');return unresolved&&answer==='?'?`{{purposes.${id}.${key}}}`:answer||previous||(unresolved?`{{purposes.${id}.${key}}}`:'');};
   const name=await value('Purpose name','name',prior?.name),description=await value('What you use the data for','description',prior?.description);
   const categories=await ask('Data categories (comma-separated; blank keeps existing): '),dataCategories=categories?categories.split(',').map(value=>value.trim()).filter(Boolean):prior?.dataCategories??[];
   const legalBasis=await value('Reviewed legal basis (blank is unresolved for a new purpose; ? marks unresolved)','legalBasis',prior?.legalBasis,true);
   // @requirements REQ-EU-INTERESTS-DISCLOSURE
   const interestsAnswer=await ask('Public legitimate interests and who pursues them, when applicable (blank keeps existing; - removes; ? leaves unresolved). Keep the balancing assessment private: ');
   const legitimateInterests=interestsAnswer==='-'?undefined:interestsAnswer==='?'?`{{purposes.${id}.legitimateInterests}}`:interestsAnswer||prior?.legitimateInterests;
   const retention=await value('How long you keep the data (blank is unresolved for a new purpose; ? marks unresolved)','retention',prior?.retention,true);
   const source=(await ask('Collection source: direct / indirect / both (blank keeps existing): ',16)).toLowerCase()||prior?.collection.source;
   const required=(await ask('Is providing the data required? yes / no (blank keeps existing): ',16)).toLowerCase()||(prior===undefined?'':prior.collection.required?'yes':'no');
   if(!['direct','indirect','both'].includes(source??'')||!['yes','no'].includes(required))throw Error('Choose an actual collection source and yes/no for whether providing information is required.');
   const collectionDescription=await value('When and where you collect it','collection.description',prior?.collection.description),consequences=await value('What happens if it is not provided (blank is unresolved for a new purpose; ? marks unresolved)','collection.consequences',prior?.collection.consequences,true);
   const purpose:Purpose={id,name,description,dataCategories,legalBasis,...(legitimateInterests===undefined?{}:{legitimateInterests}),retention,collection:{source:source as Purpose['collection']['source'],description:collectionDescription,required:required==='yes',consequences}};
   const plan=createPurposeDraftPlan(config,prior?{action:'update',previous:prior,purpose}:{action:'add',purpose});
   console.log('Public purpose draft:\n'+JSON.stringify(purpose,null,2));
   if((await ask('Confirm these public purpose facts in the local draft? yes / no [no]: ',16)).toLowerCase()!=='yes')continue;
   base=plan.config;console.log('Purpose draft updated. No integration, legal approval or consent grant was created.');
  }catch(error){console.log((error instanceof Error?error.message:'Check the purpose facts.')+' No purpose change was applied.');}
 }
}
