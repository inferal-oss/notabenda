// @requirements REQ-QC-PROFILING
import {createConsentRuntime,mountControls} from 'notabenda/consent';
const response=await fetch('/technology/runtime.json');if(!response.ok)throw Error('Privacy settings unavailable.');
const consent=createConsentRuntime(await response.json()),key='juniper-technology:interests',output=document.querySelector('#profile-state'),suggestion=document.querySelector('#profile-suggestion');
// Remove only this feature's old data when a saved grant no longer authorizes it.
if(!consent.isServiceAllowed('reading-profile'))try{window.sessionStorage.removeItem(key);}catch{/* The feature remains off. */}
const topics=[...document.querySelectorAll('[data-topic]')],copy={Design:'Notice the small decisions in the objects around you.',Outdoors:'A short walk can be a good place to start.',Culture:'A story can open a different way of seeing.'};
// Ordinary reading is available independently of profile permission.
for(const button of topics)button.addEventListener('click',()=>{document.querySelector('#article-title').textContent=button.dataset.topic;document.querySelector('#article-copy').textContent=copy[button.dataset.topic];});
consent.registerService('reading-profile',{purposes:['reading-interests'],start({signal}){
 let counts={Design:0,Outdoors:0,Culture:0};
 try{const raw=window.sessionStorage.getItem(key),saved=raw&&raw.length<=512?JSON.parse(raw):null;if(saved&&Object.keys(counts).every(k=>Object.hasOwn(saved,k)&&Number.isInteger(saved[k])&&saved[k]>=0&&saved[k]<=10000)&&Object.keys(saved).length===3)counts=saved;}catch{/* Start a new permitted session profile. */}
 const render=()=>{output.textContent='On';const [topic,count]=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];suggestion.textContent=count?`Suggested topic: ${topic} · ${count} opened this session.`:'Open a topic to start your reading profile.';};
 const listeners=topics.map(button=>{const click=()=>{if(signal.aborted)return;const topic=button.dataset.topic;counts[topic]=Math.min(10000,counts[topic]+1);try{window.sessionStorage.setItem(key,JSON.stringify(counts));render();}catch{output.textContent='Unavailable';suggestion.textContent='The reading profile could not be saved.';}};button.addEventListener('click',click);return ()=>button.removeEventListener('click',click);});
 render();const off=()=>{output.textContent='Off';suggestion.textContent='No reading profile is being built.';};signal.addEventListener('abort',off,{once:true});
 return ()=>{for(const remove of listeners)remove();off();window.sessionStorage.removeItem(key);};
}});
mountControls(document.querySelector('#privacy-controls'),{consent,noticeMode:'on-demand',preferencesLabel:'Open privacy choices'});
for(const link of document.querySelectorAll('.nb-technology-activation a'))link.addEventListener('click',event=>{event.preventDefault();consent.openPreferences();});
