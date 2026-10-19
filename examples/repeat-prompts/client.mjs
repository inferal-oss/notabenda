// @requirements REQ-IT-REPROMPT REQ-PRODUCT-REGIONAL-PROMPTS
// @requirements REQ-IT-REPROMPT
import {createConsent,mountControls} from '/assets/runtime/index.js';
const config=await(await fetch(location.pathname.replace(/\/index\.html$/u,'/').replace(/\/?$/u,'/')+'site.json')).json();
const values=new Map();let clock=Date.now(),starts=0,consent,ui,unsubscribe;
const environment={now:()=>clock,storage:{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)},schedule:()=>()=>{}};
const show=(id,value)=>{document.getElementById(id).textContent=value;};
const dates=new Intl.DateTimeFormat('en',{dateStyle:'medium',timeStyle:'short',timeZone:'UTC'});
function paint(snapshot){
  const decision=snapshot.promptDecision;
  show('clock',dates.format(clock)+' UTC');show('eligible',decision?.nextEligibleAt?dates.format(Date.parse(decision.nextEligibleAt))+' UTC':decision?.reason==='material-change'?'Eligible through declared change':'No withholding deadline');
  show('notice-state',snapshot.shouldPrompt?'Asking for a choice':'Quiet');show('permission',Object.entries(snapshot.permissions).filter(([,on])=>on).map(([id])=>config.purposes.find(p=>p.id===id).name).join(', ')||'All optional purposes off');
  show('reason',decision?.reason??'No regional rule');show('profile-version',decision?`${decision.profile} · ${decision.version}`:'None');show('starts',String(starts));
}
function mount(){
  consent=createConsent(config,environment);for(const service of config.consent.services)consent.registerService(service.id,{purposes:config.services.find(s=>s.id===service.id).purposeIds,start(){starts++;paint(consent.getSnapshot());return()=>{};}});
  ui=mountControls(document.getElementById('privacy-controls'),{consent});unsubscribe=consent.subscribe(paint);
}
mount();
document.getElementById('review').addEventListener('click',()=>consent.openPreferences());
document.getElementById('next-day').addEventListener('click',()=>{clock+=86400000;consent.refresh();show('lab-status','Simulated time advanced one day. Permission is evaluated independently.');});
document.getElementById('six-months').addEventListener('click',()=>{
  const deadline=consent.getSnapshot().promptDecision?.nextEligibleAt;
  if(deadline)clock=Math.max(clock,Date.parse(deadline));else{const date=new Date(clock);date.setUTCMonth(date.getUTCMonth()+6);clock=date.getTime();}
  consent.refresh();show('lab-status','Simulated clock reached the six-month boundary. Eligibility to ask does not grant permission.');
});
document.getElementById('material-change').addEventListener('click',async event=>{
  const button=event.currentTarget;button.disabled=true;unsubscribe();ui.destroy();consent.destroy();await consent.settled();
  config.consent.promptPolicy={profile:'it-garante-2021',processingRevision:'provider-two',materialChange:{fromRevision:'initial',summary:'The fictional measurement provider has changed. Review its purpose and recipients before making a new choice.'}};
  mount();show('lab-status','Declared transition initial → provider-two. Its explanation appears in the notice; earlier denials stay off.');
});
addEventListener('pagehide',event=>{if(!event.persisted){unsubscribe();ui.destroy();consent.destroy();}},{once:true});
