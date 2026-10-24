// @requirements REQ-PRODUCT-MARKETING-AUTHORING
// @requirements REQ-PRODUCT-SOURCE-CANDIDATE
// @requirements REQ-PRODUCT-PROCESSING-WORKBENCH
// @requirements REQ-PRODUCT-COLLECTION-WORKBENCH
// @requirements REQ-PRODUCT-TERMS-RECOVERY
// @requirements REQ-PRODUCT-COLLECTION-FLOW REQ-TR-BASIS
// @requirements REQ-PRODUCT-DOCUMENT-EXPLANATION
// @requirements REQ-JP-RELATED-SCOPE REQ-JP-RECIPIENT-CONSENT REQ-JP-RELATED-FOREIGN
// @requirements REQ-SG-COOKIE-DATA REQ-SG-BROWSER-CHOICE REQ-SG-COOKIE-TARGETING
// @requirements REQ-PRODUCT-CF-ROLLOUT
// @requirements REQ-PRODUCT-CONSENT-NOTICE-FILES
// @requirements REQ-PRODUCT-EMBED-LOCALIZATION
// @requirements REQ-PRODUCT-CF-REMOTE-RECOVERY
// @requirements REQ-PRODUCT-INDIRECT-LOCALIZATION
// @requirements REQ-PRODUCT-SERVICE-LOCALIZATION
// @requirements REQ-PRODUCT-PROCESSING-LOCALIZATION
// @requirements REQ-PRODUCT-AUTHORED-PREVIEW
// @requirements REQ-PRODUCT-RECORDING-INSPECTION
// @requirements REQ-PRODUCT-PACK-EDUCATION
import {packLibrary} from '@notabenda/core/packs';
// @requirements REQ-PRODUCT-STORAGE-AUTHORING
// @requirements REQ-PRODUCT-RIGHTS-LOCALIZATION
// @requirements REQ-PRODUCT-RIGHTS-AUTHORING
// @requirements REQ-PRODUCT-SPECIALIST-PACKS
// @requirements REQ-PRODUCT-CONSUMER-PACKS
// @requirements REQ-PRODUCT-PRIVACY-PACKS
// @requirements REQ-PRODUCT-COMPLIANCE-MAP
// @requirements REQ-QC-PROFILING
// @requirements REQ-PRODUCT-CF-HOST REQ-PRODUCT-MOBILE REQ-PRODUCT-A11Y
// @requirements REQ-PRODUCT-AGENT-INTEGRATION
// Shared task groups keep website entry points, examples and guides in the same order.
const guide=(slug,label)=>({href:'/guide/'+slug,label});
const topic=(id,title,href,description,guideSlug,variants=[],section='')=>({id,title,href,description,guide:'/guide/'+guideSlug,variants:variants.map(([label,href])=>({label,href})),section});
export const siteSections=[
 {id:'start',title:'Start here',description:'Configure your site, identify services and choose the components you need.',guides:[guide('cartridges','Packs'),guide('packages','Package names & install'),guide('compliance-map','Compliance map'),guide('architecture','Software & storage'),guide('package','Package & configuration'),guide('configuration-sources','YAML & configuration documents'),guide('setup','Guided setup'),guide('storage-authoring','Declare storage'),guide('discovery','Project discovery'),guide('service-catalog','Service catalog')],topics:[
  topic('setup','Guided setup','/demo/admin/setup','Work through site practices and keep the reasons behind each configuration choice.','setup'),
  topic('discovery','Service discovery','/discovery','Inspect detected services and review what belongs in your site configuration.','discovery')
 ]},
 {id:'privacy-information',title:'Publish privacy information',description:'Legal pages, service disclosures and notices beside the point of collection.',guides:[guide('document-inputs','Review document inputs'),guide('authored-preview','Preview an authored release'),guide('privacy-packs','Privacy packs'),guide('services','Service directory'),guide('collection','Collection notices'),guide('collection-flow','Compose a collection form'),guide('collection-workbench','Prepare a form notice'),guide('indirect-collection','Indirect collection'),guide('technology-collection','Technology functions'),guide('rights','Privacy request links'),guide('rights-authoring','Configure request page')],topics:[
  topic('documents','Privacy, cookie & terms pages','/privacy','Static documents using the site’s typography, layout and declared processing.','package',[['Privacy policy','/privacy'],['Cookie policy','/cookies'],['Terms page','/terms'],['Dark','/dark/privacy']]),
  topic('services','Service directory','/services','Explain declared third parties and the purposes, data and storage associated with them.','services',[['Dark','/dark/services'],['Português','/localization/services/']]),
  topic('technology','Technology functions','/technology/','Disclose an optional interest profile and explain how visitors activate or stop it.','technology-collection'),
  topic('collection','Collection notice','/collection','Show privacy information beside a form, linked to an exact policy revision.','collection',[['Prepare a notice','/form-notice-workbench/'],['Combined form','/collection-flow/'],['Portuguese','/localization/collection/']]),
  topic('indirect-collection','Indirect collection notice','/indirect-collection','Explain information received from another source, including advance-notice text.','indirect-collection',[['Português','/localization/indirect/']]),
  topic('rights','Privacy request entry points','/rights','Give people clear contact and application routes for privacy requests.','rights',[['Portuguese','/localization/rights/']])
 ]},
 {id:'privacy-choices',title:'Manage privacy choices',description:'Cookie preferences, optional permissions and controls for tracking and processing.',guides:[guide('specialist-packs','Technology, storage & tags'),guide('consent','Cookie choices'),guide('connection-inspection','Inspect a connection'),guide('embeds','Gated media'),guide('storage-cleanup','Storage cleanup'),guide('form-permissions','Form permissions'),guide('south-africa-marketing','South African electronic marketing'),guide('marketing-approach-history','Shared approach history — proposed'),guide('marketing-workbench','Prepare a marketing request'),guide('privacy-signals','Global Privacy Control'),guide('processing-choices','Recorded opt-outs'),guide('processing-workbench','Prepare an opt-out notice'),guide('privacy-choice-links','Privacy-choice links'),guide('google-basic','Google Basic'),guide('regional-prompts','Consent timing'),guide('scope-guards','Scope guards')],topics:[
  topic('cookies','Cookie choices','/choices','Accept, reject or choose purposes, then see which declared services may run.','consent',[['Dark','/dark/choices']]),
  topic('embeds','Gated media','/embeds','Keep frames and images inert until their declared service is allowed.','embeds',[['Portuguese','/localization/embeds/']]),
  topic('storage','Storage cleanup','/storage-cleanup','Remove declared browser markers after withdrawal while leaving unrelated storage alone.','storage-cleanup'),
  topic('permissions','Form permissions','/form-permissions','Record an optional purpose and channel, with independent withdrawal and recovery.','form-permissions',[['Prepare a request','/marketing-request-workbench/'],['React','/form-permissions/react/'],['Astro','/form-permissions/astro/'],['Portuguese','/localization/permission/']]),
  topic('signals','Global Privacy Control','/privacy-signals','Apply a browser privacy signal independently of optional cookie preferences.','privacy-signals'),
  topic('opt-outs','Processing opt-outs','/processing-choices','Record restrictions and inspect their current state alongside the original request.','processing-choices',[['Português','/localization/processing/'],['Prepare a notice','/processing-notice-workbench/']]),
  topic('exceptions','UK storage settings','/storage-exceptions','Separate on/off settings for declared statistical and appearance exceptions.','storage-exceptions',[['Portuguese','/localization/storage/']],'Specialist controls'),
  topic('google','Google Basic simulator','/google-basic','Inspect the declared signals without loading a live Google tag.','google-basic',[],'Specialist controls'),
  topic('prompts','Consent timing','/repeat-prompts','Compare calendar grant expiry with independent rules for asking again.','regional-prompts',[],'Specialist controls'),
  topic('guards','Scope guards','/scope-guards','See how explicit site and purpose restrictions affect available controls.','scope-guards',[],'Specialist controls')
 ]},
 {id:'contracts',title:'Terms and purchases',description:'Version-bound terms agreements and separate consumer-contract information and actions.',guides:[guide('consumer-packs','Purchase & contract packs'),guide('terms','Terms agreements'),guide('guarantees','Guarantee notices'),guide('guarantee-labels','Product guarantee labels'),guide('guarantee-producer-example','Producer label example'),guide('paid-orders','Paid order reviews'),guide('contract-actions','Withdrawal & cancellation'),guide('contract-dispatch','Contract delivery runners')],topics:[
  topic('agreement','Terms agreement','/agreement','An unchecked statement tied to the exact terms version and action wording.','terms',[['Portuguese','/localization/agreement/'],['React','/agreement/react/'],['Astro','/agreement/astro/']]),
  topic('guarantee-notice','EU guarantee notice','/guarantees','Display the shop-level legal guarantee notice and its readable wording.','guarantees',[],'Consumer contracts'),
  topic('producer-label','Product guarantee label','/guarantees/product/','Place the complete producer guarantee label beside the product it covers.','guarantee-labels',[['Preparation & source','/guide/guarantee-producer-example']],'Consumer contracts'),
  topic('orders','Paid order review','/orders/mixed/','Present items, commitments and prices immediately before an explicit payment action.','paid-orders',[['Deposit & balance','/orders/deferred/'],['Conditional fee','/orders/conditional/'],['Dark','/dark/orders/mixed/']],'Consumer contracts'),
  topic('withdrawal','Contract withdrawal','/contract-actions/withdrawal','Inspect the declaration and its separate confirmation and application handoffs.','contract-actions',[],'Consumer contracts'),
  topic('cancellation','Contract cancellation','/contract-actions/cancellation','Try the German cancellation flow and review its retained request.','contract-actions',[],'Consumer contracts')
 ]},
 {id:'records',title:'Keep and inspect records',description:'Retained versions, recorded choices, private inspection, exports and lifecycle controls.',guides:[guide('recording-inspection','Recording setup'),guide('order-confirmations','Customer confirmations'),guide('releases','Retained releases'),guide('consent-evidence','Cookie-choice evidence'),guide('evidence-export','Evidence export'),guide('evidence-lifecycle','Retention & holds')],topics:[
  topic('confirmations','Customer confirmations','/demo/admin/orders','Inspect retained customer copies, exact attachments and current delivery status.','order-confirmations'),
  topic('history','Document revisions','/demo/admin/history','Compare policy versions, authored source and rendered differences.','authoring'),
  topic('recorded-cookies','Recorded cookie choices','/recorded-choices','Follow a browser report from its pinned notice to a matching server receipt.','consent-evidence'),
  topic('releases','Public retained releases','/releases','Read two retained document versions at their original immutable addresses.','releases'),
  topic('catalog-history','Retained service references','/catalog-releases','Compare service-catalog selections separately from published legal text.','service-catalog'),
  topic('exports','Evidence export','/demo/admin/history/export','Review a filtered segment before downloading its scoped record projection.','evidence-export'),
  topic('lifecycle','Retention and holds','/demo/admin/lifecycle','Inspect holds, resumable purge progress and restore barriers.','evidence-lifecycle')
 ]},
 {id:'integrations',title:'Integrate and deploy',description:'Choose a framework, author your documents and add a host-controlled backend when needed.',guides:[guide('authoring','Markdown & MDX'),guide('react','React'),guide('astro','Astro'),guide('cloudflare','Cloudflare backend'),guide('cloudflare-starter','Cloudflare starter'),guide('cloudflare-doctor','Deployment checks'),guide('cloudflare-recovery','Recovery rehearsal'),guide('publication-check','Check published releases'),guide('migration','Migration & removal'),guide('release-candidate','Package release checks'),guide('source-candidate','Build a source candidate'),guide('security','Security reporting')],topics:[
  topic('react','React integration','/react','Use the shared consent controller with hooks and hydration.','react'),
  topic('astro','Astro integration','/astro/','Build static legal pages with preferences that survive navigation.','astro'),
  topic('localization','Localized pages & choices','/localization','Supply versioned wording for legal pages and every consent-control state.','localization'),
  topic('authoring','Markdown and MDX','/authored/preview/','Read the compiled pages, inspect their versions and export the same public release.','authoring',[['Terms page','/authored/terms'],['Cookie addendum','/authored/cookies']]),
  topic('backend','Cloudflare workspace','/demo/admin','Inspect records in an isolated workspace with the same reusable admin components.','cloudflare',[['Starter guide','/guide/cloudflare-starter'],['Deployment checks','/guide/cloudflare-doctor']])
 ]}
];
// Each guide has one place in the learning path. Specialist and maintainer material
// belongs below its parent task rather than becoming another top-level destination.
// Pack listings share the installed explanation; record-specific topics keep their own descriptions.
const topicPacks={documents:'privacy-pages',cookies:'cookie-choices',agreement:'terms-agreement',collection:'collection-notices','indirect-collection':'indirect-collection',rights:'privacy-requests',technology:'technology-notices',permissions:'form-permissions',embeds:'gated-media',backend:'evidence-workspace','opt-outs':'processing-opt-outs',exceptions:'assessed-storage-settings',google:'google-basic',withdrawal:'contract-withdrawal',cancellation:'subscription-cancellation',orders:'paid-order-review',confirmations:'customer-confirmations','guarantee-notice':'guarantee-information'};
const installedPacks=new Map(packLibrary().map(pack=>[pack.id,pack]));
for(const section of siteSections)for(const topic of section.topics){const pack=installedPacks.get(topicPacks[topic.id]);if(pack){topic.title=pack.title;topic.description=pack.outcome;if(topic.id==='documents')topic.href=pack.preview;}}
const group=(title,description,slugs,topicIds=[],options={})=>({title,description,slugs,topicIds,...options});
const areaGroups={
 start:[group('Configure your site','Begin with an inventory, then review the setup recommendations.',['cartridges','packages','compliance-map','architecture','package','configuration-sources','setup','storage-authoring','agent-setup'],['setup']),group('Find the services you use','Discovery supplies findings for review; the catalog supplies reusable service descriptions.',['discovery','service-catalog'],['discovery'])],
 'privacy-information':[group('Publish your documents','Supply reviewed wording and describe the services behind it.',['authoring','document-inputs','authored-preview','services'],['documents','services']),group('Explain collection and contact routes','Put the relevant information where people provide data or ask for help.',['privacy-packs','collection','collection-flow','collection-workbench','indirect-collection','technology-collection','rights','rights-authoring'],['collection','indirect-collection','technology','rights'])],
 'privacy-choices':[group('Control optional services','Start with cookie preferences, then gate resources and clean up declared storage.',['consent','embeds','storage-cleanup'],['cookies','embeds','storage']),group('Offer separate permissions and opt-outs','Form permissions and processing restrictions have their own controls.',['form-permissions','marketing-workbench','privacy-signals','processing-choices','processing-workbench','privacy-choice-links'],['permissions','signals','opt-outs']),group('Specialist controls','Use these when your integration needs tag signals, grant expiry, repeat-prompt rules or explicit scope restrictions.',['specialist-packs','storage-exceptions','google-basic','regional-prompts','scope-guards','south-africa-marketing'],['exceptions','google','prompts','guards'],{specialist:true})],
 contracts:[group('Agree to terms','Bind the action and wording to the terms version people see.',['consumer-packs','terms'],['agreement']),group('Before a purchase','Review the offer, applicable guarantee information and the final payment action.',['guarantees','guarantee-labels','paid-orders'],['guarantee-notice','producer-label','orders']),group('After a purchase','Retain the customer copy and handle withdrawal, cancellation and host delivery.',['order-confirmations','contract-actions','contract-dispatch'],['withdrawal','cancellation']),group('Example source and artwork','For readers who need to inspect or reproduce the prepared producer-label example.',['guarantee-producer-example'],[],{specialist:true})],
 records:[group('Retain versions and choices','Keep the released wording and link recorded choices to it.',['releases','consent-evidence'],['history','recorded-cookies','releases','catalog-history']),group('Inspect and manage evidence','Review customer confirmations, export scoped records and manage retention or holds.',['recording-inspection','evidence-export','evidence-lifecycle'],['confirmations','exports','lifecycle'])],
 integrations:[group('Choose a frontend','The framework adapters use the same controllers. Authored documents are compiled at build time.',['react','astro','localization'],['react','astro','authoring','localization']),group('Add the backend when needed','Connect host-authorized records, then verify your deployment.',['cloudflare','cloudflare-starter','cloudflare-doctor','cloudflare-recovery','publication-check'],['backend']),group('Maintain a deployment','Move an existing site, prepare package artifacts and report security issues.',['migration','source-candidate','security'],[])]
};
// Cross-area references are links, not duplicate primary homes.
const primaryHome={authoring:'privacy-information','order-confirmations':'contracts','release-candidate':'integrations'};
export const referenceSection={id:'reference',title:'Reference and verification',description:'Requirements, primary sources, scope, verification reports and asset provenance.',guides:[guide('project','Project overview'),guide('changelog','Changelog'),guide('requirements','Requirements catalog'),guide('requirements/sources','Primary sources'),guide('features','Feature status'),guide('scope','Scope & limits'),guide('research','Research workflow'),guide('all','All guides & reports')]};
const labels=new Map([...siteSections.flatMap(s=>s.guides),...referenceSection.guides].map(g=>[g.href,g.label]));
labels.set('/guide/agent-setup','Agent setup');
labels.set('/guide/localization','Localization');
labels.set('/guide/storage-exceptions','UK storage settings');
for(const section of siteSections){
 section.groups=areaGroups[section.id].map(g=>({...g,guides:g.slugs.map(slug=>{
  const label=labels.get('/guide/'+slug);if(!label)throw Error('Missing guide navigation label: '+slug);
  return guide(slug,label);
 })}));
 section.guides=section.groups.flatMap(g=>g.guides);
}
// Stages are shared across the homepage and both directories. Areas keep stable URLs.
export const siteStages=[
 {id:'foundations',title:'Set up and publish',description:'Declare what your site does, then publish your reviewed legal wording.',areaIds:['start','privacy-information']},
 {id:'features',title:'Add the controls you need',description:'Choose the privacy and contract flows that apply to your site.',areaIds:['privacy-choices','contracts']},
 {id:'operations',title:'Integrate and keep records',description:'Choose your framework, connect the backend and inspect retained evidence.',areaIds:['integrations','records']}
];
export const orderedSiteSections=siteStages.flatMap(stage=>stage.areaIds.map(id=>siteSections.find(section=>section.id===id)));
export const guideSections=[...orderedSiteSections,referenceSection];
export const stageForSection=section=>siteStages.find(stage=>stage.areaIds.includes(section.id));
const guideParents={
 'turkey-processing':{slug:'collection-flow',label:'Compose a collection form',kind:'Jurisdiction review'},
 'processing-application':{slug:'processing-choices',label:'Recorded opt-outs',kind:'Application example'},
 'recorded-cookie-application':{slug:'consent-evidence',label:'Cookie evidence',kind:'Application example'},
 'terms-rehearsal':{slug:'terms',label:'Terms agreement',kind:'Try configured wording'},
 'cookie-rehearsal':{slug:'cartridges',label:'Packs',kind:'Try your draft'},
 'singapore-cookies':{slug:'consent',label:'Cookie choices',kind:'Jurisdiction review'},
 'japan-cookie-data':{slug:'consent',label:'Cookie choices',kind:'Jurisdiction review'},
 'terms-recovery':{slug:'terms',label:'Terms agreement',kind:'Retry after reload'},
 'terms-connection':{slug:'terms',label:'Terms agreement',kind:'Runtime inspection'},
 'cloudflare-remote-recovery':{slug:'cloudflare-recovery',label:'Recovery rehearsal',kind:'Remote maintainer check'},
 'cloudflare-rollout':{slug:'cloudflare-doctor',label:'Deployment checks',kind:'Remote maintainer check'},
 'guarantee-producer-example':{slug:'guarantee-labels',label:'Product guarantee labels',kind:'Example source',description:'This page explains the prepared example and its source files. Start with the integration guide to add a label to your own site.'},
 'guarantee-asset-notice':{slug:'guarantee-labels',label:'Product guarantee labels',kind:'Asset provenance'},
 'authoring-package':{slug:'authoring',label:'Markdown & MDX',kind:'Package reference'},
 'catalog-data':{slug:'service-catalog',label:'Service catalog',kind:'Catalog reference'}
};
export function parentForGuide(route){return guideParents[normalizeGuideRoute(route).replace(/^\/guide\//u,'')];}
export function guideOrientation(route){
 const parent=parentForGuide(route);if(!parent?.description)return '';
 return `<aside class="guide-orientation" aria-label="About this guide"><p class="eyebrow">${e(parent.kind)}</p><p>${e(parent.description)}</p><a href="/guide/${parent.slug}">Read ${e(parent.label.toLowerCase())} →</a></aside>`;
}
export function stageDirectory(kind='examples'){
 return `<div class="stage-directory">${siteStages.map((stage,index)=>`<section class="directory-stage" aria-labelledby="stage-${stage.id}"><header><span class="path-step">0${index+1}</span><div><h3 id="stage-${stage.id}">${e(stage.title)}</h3><p>${e(stage.description)}</p></div></header>${sectionDirectory(kind,stage.areaIds.map(id=>siteSections.find(s=>s.id===id)),4)}</section>`).join('')}</div>`;
}
// The landing page summarizes stages; the example directory carries the full descriptions.
export function stageOverview(){
 return `<div class="stage-overview">${siteStages.map((stage,i)=>`<article class="directory-stage"><header><span class="path-step">0${i+1}</span><div><h3>${e(stage.title)}</h3><p>${e(stage.description)}</p></div></header><nav class="stage-links" aria-label="${e(stage.title)}">${stage.areaIds.map(id=>siteSections.find(s=>s.id===id)).map(section=>`<a href="${exampleSectionUrl(section)}">${e(section.title)} <span aria-hidden="true">→</span></a>`).join('')}</nav></article>`).join('')}</div>`;
}
export function areaContinuation(section,kind='guide'){
 const index=orderedSiteSections.indexOf(section),next=orderedSiteSections[index+1];if(index<0||!next)return '';
 const href=kind==='examples'?exampleSectionUrl(next):guideSectionUrl(next);
 return `<a href="${href}"><small>Next area</small><span>${e(next.title)} →</span></a>`;
}
export const normalizeGuideRoute=route=>route.replace(/\/$/u,'');
export const guideSectionUrl=section=>'/guide/areas/'+section.id+'/';
export const exampleSectionUrl=section=>'/examples/'+section.id+'/';
const reportParents={'marketing-history-review':'south-africa-marketing','processing-workbench':'processing-workbench','form-permission-connection':'form-permissions','collection-workbench':'collection-workbench','publication-inspection':'recording-inspection','terms-rehearsal':'terms','nuget-discovery':'service-catalog','terms-recovery':'terms','collection-flow':'collection-flow','turkey-processing':'collection-flow','cargo-discovery':'service-catalog','california-choice-design':'consent','composer-discovery':'service-catalog','document-inputs':'document-inputs','python-project-discovery':'service-catalog','japan-cookie-data':'consent','singapore-cookies':'consent','cloudflare-rollout':'cloudflare-doctor','processing-application':'processing-choices','privacy-signal-reviews':'privacy-signals','recorded-cookie-application':'consent-evidence','transaction-recovery':'cloudflare-recovery','consent-notice-files':'consent-evidence','embed-localization':'embeds','cloudflare-remote-recovery':'cloudflare-recovery','cloudflare-recovery':'cloudflare-recovery',accessibility:'project','regional-consent':'consent','catalog-profiles':'service-catalog','catalog-release':'service-catalog','catalog-review':'service-catalog','consent-browser':'consent','consent-focus':'consent','consent-evidence-browser':'consent-evidence','controls-layout':'consent','demo-workspace':'cloudflare','design-pass':'project','embeds-browser':'embeds','privacy-signals-browser':'privacy-signals','processing-choices-browser':'processing-choices','react-browser':'react','retained-releases':'releases','rights-center':'rights','terms-browser':'terms','website-browser':'website','astro-browser':'astro'};
export function sectionForGuide(route){
 const current=normalizeGuideRoute(route),area=guideSections.find(s=>normalizeGuideRoute(guideSectionUrl(s))===current);
 if(area)return area;
 let slug=current.replace(/^\/guide\//u,'');
 if(guideParents[slug])slug=guideParents[slug].slug;
 if(slug.startsWith('verification/'))slug=reportParents[slug.slice(13)]??slug.slice(13);
 if(primaryHome[slug])return siteSections.find(s=>s.id===primaryHome[slug]);
 return guideSections.find(section=>section.guides.some(item=>item.href==='/guide/'+slug))??referenceSection;
}
const e=value=>String(value).replace(/[&<>"']/gu,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// @requirements REQ-PRODUCT-DOCS-SEARCH
export function guideNavigation(route,title,{mobile=false}={}){
 const current=normalizeGuideRoute(route),active=sectionForGuide(current),isArea=current===normalizeGuideRoute(guideSectionUrl(active));
 const link=item=>`<a href="${item.href}"${normalizeGuideRoute(item.href)===current?' aria-current="page"':''}>${e(item.label)}</a>`;
 return `<nav aria-label="Documentation"><a class="guide-search-link" href="/guide/search/"${current==='/guide/search'?' aria-current="page"':''}>Search documentation <span aria-hidden="true">⌕</span></a><a class="guide-overview" href="/guide"${current==='/guide'?' aria-current="page"':''}>Guide overview</a>${guideSections.map(section=>{
  const areaLink={href:guideSectionUrl(section),label:'Area overview'},isActive=active.id===section.id&&current!=='/guide'&&current!=='/guide/search',listed=section.guides.some(g=>g.href===current);
  const contents=section.groups?section.groups.map(group=>`<div class="guide-nav-subgroup"><p>${e(group.title)}</p>${group.guides.map(link).join('')}</div>`).join(''):section.guides.map(link).join('');
  const links=link(areaLink)+(isActive?contents+(!listed&&!isArea?link({href:current,label:title}):''):'');
  // Mobile has one disclosure for the menu; inactive areas are a single link.
  const stage=stageForSection(section),stageLabel=stage?.areaIds[0]===section.id?`<p class="guide-nav-stage">${e(stage.title)}</p>`:'';
  return stageLabel+(mobile?`<section class="guide-group"><h2>${isActive?e(section.title):`<a href="${guideSectionUrl(section)}">${e(section.title)}</a>`}</h2>${isActive?`<div>${links}</div>`:''}</section>`:`<details class="guide-group"${isActive?' open':''}><summary>${e(section.title)}</summary><div>${links}</div></details>`);
 }).join('')}</nav>`;
}
export function sectionDirectory(kind='examples',sections=orderedSiteSections,headingLevel=3){const h='h'+headingLevel;return `<div class="topic-directory">${sections.map(section=>`<a class="topic-destination"${kind==='examples'&&({'privacy-information':'interfaces',integrations:'frameworks',records:'evidence'}[section.id])?' id="'+({'privacy-information':'interfaces',integrations:'frameworks',records:'evidence'}[section.id])+'"':''} href="${kind==='examples'?exampleSectionUrl(section):guideSectionUrl(section)}"><span class="topic-number">${String(orderedSiteSections.indexOf(section)+1).padStart(2,'0')}</span><${h}>${e(section.title)} <span aria-hidden="true">↗</span></${h}><p>${e(section.description)}</p>${kind==='examples'?`<span class="topic-count">${section.topics.length} topics</span>`:''}</a>`).join('')}</div>`;}
export const starterSteps=[
 {title:'Configure your site',description:'Declare the services and purposes your site uses.',href:'/guide/package'},
 {title:'Publish legal pages',description:'Bring your reviewed wording as Markdown, MDX or structured content.',href:'/guide/authoring'},
 {title:'Add privacy choices',description:'Connect optional service loaders to the same controller.',href:'/guide/consent'}
];
export function starterPath(){return `<ol class="starter-path">${starterSteps.map((step,i)=>`<li><a href="${step.href}"><span class="path-step">0${i+1}</span><span><strong>${e(step.title)}</strong><span>${e(step.description)}</span></span><span aria-hidden="true">→</span></a></li>`).join('')}</ol>`;}
export function guideContext(route){
 const current=normalizeGuideRoute(route),section=sectionForGuide(current);
 if(current==='/guide'||current==='/guide/all'||current.includes('/areas/')||current.includes('/verification/')||section===referenceSection)return '';
 const parent=parentForGuide(current),parentRoute=parent?'/guide/'+parent.slug:current;
 const group=section.groups.find(g=>g.guides.some(guide=>guide.href===parentRoute));if(!group)return '';
 const path=section.groups.filter(g=>!g.specialist).flatMap(g=>g.guides),index=path.findIndex(g=>g.href===current),next=parent?null:path[index+1],previous=parent?{href:parentRoute,label:parent.label}:path[index-1];
 const topic=section.topics.find(t=>t.guide===parentRoute||t.variants.some(v=>v.href===current));
 return `<aside class="guide-context" aria-label="Related guides and examples"><p class="eyebrow">${e(section.title)} / ${e(group.title)}</p><nav aria-label="Continue in this area">${previous?`<a href="${previous.href}"><small>${parent?'Integration guide':'Previous guide'}</small><span>← ${e(previous.label)}</span></a>`:''}${next?`<a href="${next.href}"><small>Next guide</small><span>${e(next.label)} →</span></a>`:''}${topic?`<a href="${topic.href}"><small>Working example</small><span>${e(topic.title)} ↗</span></a>`:''}<a href="${guideSectionUrl(section)}"><small>In this area</small><span>All ${e(section.title.toLowerCase())} guides →</span></a></nav></aside>`;
}
