// @requirements REQ-PRODUCT-CF-STARTER REQ-PRODUCT-CF-ADMIN
import {createSetupWorker} from 'notabenda-cf';
import {settings} from './settings.mjs';

export function presentation(){return {
 workspaceLabel:settings.workspaceLabel,
 navigation:[['history','Document revisions'],['choices','Cookie choices'],['agreements','Terms agreements'],['processing','Processing opt-outs'],['permissions','Form permissions'],['contracts','Contract declarations'],['setup','Guided setup']].map(([path,label])=>({label,href:settings.basePath+'/'+path})),
};}
export function privateResponse(response){
 const headers=new Headers(response.headers);headers.set('Cache-Control','private, no-store');headers.set('Vary','Cookie, Authorization');headers.set('Referrer-Policy','no-referrer');headers.set('X-Content-Type-Options','nosniff');headers.set('X-Robots-Tag','noindex, nofollow');
 return new Response(response.body,{status:response.status,headers});
}
/** The supplied function is trusted host code, never a request parameter. */
export function createHost(authorize){
 return async function fetch(request,env){
  const reply=(text,status)=>privateResponse(new Response(request.method==='HEAD'?null:text,{status}));
  let access;try{access=await authorize(request,env);}catch{return reply('Access denied.',403);}
  if(!access||access.inspect!==true)return reply('Access denied.',403);
  if(!['GET','HEAD'].includes(request.method)){const response=reply('Method not allowed.',405);response.headers.set('Allow','GET, HEAD');return response;}
  const url=new URL(request.url),path=url.pathname;
  if(path.includes('%')||path.includes('\\')||request.url.length>4096)return reply('Invalid route.',400);
  if(path===settings.basePath||path===settings.basePath+'/'||path==='/')return privateResponse(new Response(null,{status:303,headers:{Location:settings.basePath+'/history'}}));
  if(path===settings.basePath+'/setup'||path===settings.basePath+'/setup/'){
   if(access.configure!==true)return reply('Configuration access denied.',403);
   return privateResponse(await createSetupWorker({...presentation(),basePath:settings.basePath+'/setup',authorize:()=>true,scriptUrl:'/assets/setup.mjs',stylesheetUrl:'/assets/notabenda.css'}).fetch(request,env));
  }
  if(['/assets/setup.mjs','/assets/notabenda.css'].includes(path)){
   if(access.configure!==true)return reply('Configuration access denied.',403);
   try{return privateResponse(await env.ASSETS.fetch(request));}catch{return reply('Assets unavailable.',503);}
  }
  const relative=path.slice(settings.basePath.length);
  if(!path.startsWith(settings.basePath+'/')||!/^\/(?:history|choices|agreements|processing|permissions|contracts)(?:\/(?:record|diff|source|source-diff|export|export\.json))?\/?$/u.test(relative))return reply('Not found.',404);
  try{
   // The stable site comes from host configuration. URL/body/header values cannot select a DO.
   const workspace=env.EVIDENCE.getByName('notabenda:'+settings.siteId);
   return privateResponse(await workspace.inspect(request,{allowExport:access.export===true,allowSource:access.source===true}));
  }catch{return reply('Evidence unavailable.',503);}
 };
}
