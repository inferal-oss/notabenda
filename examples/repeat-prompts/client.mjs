// @requirements REQ-IE-CONSENT-DURATION
import {sixCalendarMonthsAfter} from '/assets/runtime/grant-expiry-policy.js';
// @requirements REQ-IT-REPROMPT REQ-PRODUCT-REGIONAL-PROMPTS
// @requirements REQ-IT-REPROMPT
import {createConsent,mountControls} from '/assets/runtime/index.js';
const config=await(await fetch(location.pathname.replace(/\/index\.html$/u,'/').replace(/\/?$/u,'/')+'site.json')).json();
const values=new Map();let clock=Date.now(),starts=0,stops=0,consent,ui,unsubscribe;
const environment={now:()=>clock,storage:{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)},schedule:()=>()=>{}};
const show=(id,value)=>{document.getElementById(id).textContent=value;};
const dates=new Intl.DateTimeFormat('en',{dateStyle:'medium',timeStyle:'short',timeZone:'UTC'});
function paint(snapshot){
  const decision=snapshot.promptDecision;
  show('clock',dates.format(clock)+' UTC');show('eligible',decision?.nextEligibleAt?dates.format(Date.parse(decision.nextEligibleAt))+' UTC':decision?.reason==='material-change'?'Eligible through declared change':'No withholding deadline');
  show('notice-state',snapshot.shouldPrompt?'Asking for a choice':'Quiet');show('permission',Object.entries(snapshot.permissions).filter(([,on])=>on).map(([id])=>config.purposes.find(p=>p.id===id).name).join(', ')||'All optional purposes off');
  show('reason',decision?.reason??'No regional rule');show('profile-version',decision?`${decision.profile} · ${decision.version}`:'None');show('starts',String(starts));show('stops',String(stops));
  const stored=values.get('notabenda:choices:v1:'+config.site.id),choices=stored?JSON.parse(stored).choices:{};const deadlines=Object.values(choices).filter(c=>c.status==='granted'&&c.until>clock).map(c=>c.until);
  show('grant-policy',config.consent.grantExpiryPolicy?'Six UTC calendar months; shorter day limits still apply':'Configured day lifetime only');show('grant-deadline',deadlines.length?dates.format(Math.min(...deadlines))+' UTC':'No current grants');
}
function mount(){
  consent=createConsent(config,environment);for(const service of config.consent.services)consent.registerService(service.id,{purposes:config.services.find(s=>s.id===service.id).purposeIds,start(){starts++;paint(consent.getSnapshot());return()=>{stops++;paint(consent.getSnapshot());};}});
  ui=mountControls(document.getElementById('privacy-controls'),{consent});unsubscribe=consent.subscribe(paint);
}
mount();
document.getElementById('review').addEventListener('click',()=>consent.openPreferences());
document.getElementById('next-day').addEventListener('click',()=>{clock+=86400000;consent.refresh();show('lab-status','Simulated time advanced one day. Permission is evaluated independently.');});
document.getElementById('six-months').addEventListener('click',()=>{
  const prompt=consent.getSnapshot().promptDecision?.nextEligibleAt,stored=values.get('notabenda:choices:v1:'+config.site.id);const choices=stored?JSON.parse(stored).choices:{};const deadlines=[...(prompt?[Date.parse(prompt)]:[]),...Object.values(choices).filter(c=>c.status==='granted').map(c=>c.until)].filter(at=>at>clock);
  clock=deadlines.length?Math.min(...deadlines):sixCalendarMonthsAfter(clock);
  consent.refresh();show('lab-status','Reached the next configured boundary. Expired grants stay off until a new choice.');
});
document.getElementById('grant-cap').addEventListener('click',async event=>{
  const button=event.currentTarget;button.disabled=true;unsubscribe();ui.destroy();consent.destroy();await consent.settled();values.clear();starts=0;stops=0;clock=Date.parse('2026-08-31T12:00:00.000Z');
  config.consent.grantLifetimeDays=365;config.consent.refusalLifetimeDays=365;config.consent.grantExpiryPolicy={profile:'ie-dpc-six-month-default',version:1};config.consent.promptPolicy={profile:'it-garante-2021',processingRevision:'initial'};
  mount();button.disabled=false;document.getElementById('material-change').disabled=false;show('lab-status','Reset to 31 August 2026, noon UTC. Accept a purpose, then reach its boundary: 28 February 2027. The 365-day refusal memory and Italian solicitation rule remain separate.');
});
document.getElementById('material-change').addEventListener('click',async event=>{
  const button=event.currentTarget;button.disabled=true;unsubscribe();ui.destroy();consent.destroy();await consent.settled();
  config.consent.promptPolicy={profile:'it-garante-2021',processingRevision:'provider-two',materialChange:{fromRevision:'initial',summary:'The fictional measurement provider has changed. Review its purpose and recipients before making a new choice.'}};
  mount();show('lab-status','Declared transition initial → provider-two. Its explanation appears in the notice; earlier denials stay off.');
});
addEventListener('pagehide',event=>{if(!event.persisted){unsubscribe();ui.destroy();consent.destroy();}},{once:true});
