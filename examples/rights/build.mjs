// @requirements REQ-PRODUCT-RIGHTS-CENTER REQ-PRODUCT-MOBILE REQ-PRODUCT-RETAINED-RELEASES
import {readFile} from 'node:fs/promises';
import {compileLegalDocuments,createRetainedReleaseFiles} from '@notabenda/core/content';
import {renderLegalLinks} from '@notabenda/core';
const entries=[
 ['access','access','Access your information','Ask about the personal information associated with your use of the studio.','For information relating to you; the operator handles any appropriate identity checks.','Explore the access workflow'],
 ['correction','correction','Correct information','Find the next step for correcting information that is incomplete or inaccurate.','Describe the information you want reviewed through the operator’s designated channel.','Explore the correction workflow'],
 ['erasure','erasure','Request deletion','Ask the operator to review information you would like removed.','The operator reviews the request and explains any applicable retention or other limits.','Explore the erasure workflow'],
 ['withdrawal','withdrawal','Withdraw consent','Find the operator’s process for withdrawing a consent given outside this browser’s cookie controls.','This does not cancel a contract or automatically delete information.','Explore consent withdrawal'],
 ['appeal','appeal','Appeal a response','Find a separate route for reviewing a response to a privacy request.','Use this route for an applicable appeal after a refusal; a complaint to an authority is a separate step.','Explore the appeal workflow'],
 ['other','other','Other privacy requests','Ask a question about your information or another privacy right.','The operator decides which process applies to your circumstances.','Explore the contact workflow'],
];
export function rightsExampleConfig(base,{prefix='',reviewed=false}={}){
 const config=structuredClone(base);config.site.id='juniper-rights';delete config.privacy.rightsUrl;
 for(const [kind,doc] of Object.entries(config.documents))doc.route=prefix+'/rights/'+kind;
 config.rightsCenter={schemaVersion:1,revision:'rights-2',route:prefix+'/rights',title:'Privacy requests',intro:'Find the contact or workflow for accessing, correcting or deleting information, withdrawing consent or appealing a response.',reviewStatus:reviewed?'reviewed':'draft',contact:{label:'Email the privacy team',description:'If a workflow does not fit, you can contact the operator directly. This fictional demonstration address does not receive messages.',href:'mailto:privacy@juniper.example.test'},actions:entries.map(([id,kind,title,description,scope,label])=>({id,kind,title,description,scope,link:{label,href:prefix+'/rights/workflow/'+id}})),nextSteps:['Choose a route to reach the operator’s next step. These fictional destinations explain the handoff and do not submit a request.','In a real integration, the operator handles appropriate identity checks, response timing, applicable exceptions and follow-up.','Cookie preferences, processing opt-outs and contract actions have their own controls. Following one of these links changes none of them.']};
 return config;
}
export async function rightsFiles(base){
 const retained=JSON.parse(await readFile(new URL('./retained-artifacts.json',import.meta.url),'utf8'));
 const files=createRetainedReleaseFiles(retained,{siteId:'juniper-rights',mode:'preview'});for(const prefix of ['', '/dark']){
  const config=rightsExampleConfig(base,{prefix}),css=prefix?'/assets/dark.css':'/assets/notabenda.css';
  const build=compileLegalDocuments(config,{mode:'preview',stylesheetUrl:css});
  Object.assign(files,Object.fromEntries(Object.entries(build.files).filter(([path])=>path.startsWith(prefix.slice(1)+(prefix?'/':'')+'rights/')||path.startsWith('artifacts/'))));
  for(const action of config.rightsCenter.actions){
   files[action.link.href.slice(1)+'/index.html']=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${action.title} · Juniper Notes</title><link rel="stylesheet" href="${css}"></head><body class="nb-page"><header class="nb-site-header"><a href="/">Juniper Notes</a></header><main class="nb-document"><p class="nb-eyebrow">Request workflow · ${action.kind}</p><h1>Privacy request links</h1><p>This is where the operator’s application would take over. It would explain this request’s next steps and provide the appropriate channel.</p><p class="nb-draft">This entry point hands the request to your application. Nothing has been submitted here.</p><section><h2>${action.title}</h2><p>${action.description}</p><p>${action.scope}</p><p><a href="${config.rightsCenter.route}">← Back to privacy requests</a></p></section><section><h2>Request handling</h2><p>The operator supplies its own request intake, appropriate authorization and identity checks, responses, fulfillment and any applicable appeal process. The toolkit’s entry page stays independent of those systems.</p><p><a href="/guide/rights">Read the integration guide ↗</a></p></section></main><footer class="nb-site-footer">${renderLegalLinks(build.publicConfig)}</footer></body></html>`;
  }
 }
 return files;
}
