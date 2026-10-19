// @requirements REQ-PRODUCT-CF-HOST REQ-PRODUCT-MOBILE REQ-PRODUCT-A11Y
// Shared task groups keep website entry points, examples and guides in the same order.
const guide=(slug,label)=>({href:'/guide/'+slug,label});
const topic=(id,title,href,description,guideSlug,variants=[],section='')=>({id,title,href,description,guide:'/guide/'+guideSlug,variants:variants.map(([label,href])=>({label,href})),section});
export const siteSections=[
 {id:'start',title:'Start here',description:'Configure your site, identify services and choose the components you need.',guides:[guide('package','Package & configuration'),guide('setup','Guided setup'),guide('discovery','Project discovery'),guide('service-catalog','Service catalog')],topics:[
  topic('setup','Guided setup','/demo/admin/setup','Work through site practices and keep the reasons behind each configuration choice.','setup'),
  topic('discovery','Service discovery','/discovery','Inspect detected services and review what belongs in your site configuration.','discovery')
 ]},
 {id:'privacy-information',title:'Publish privacy information',description:'Legal pages, service disclosures and notices beside the point of collection.',guides:[guide('services','Service directory'),guide('collection','Collection notices'),guide('indirect-collection','Indirect collection'),guide('rights','Privacy request links')],topics:[
  topic('documents','Privacy, cookie & terms pages','/privacy','Static documents using the site’s typography, layout and declared processing.','package',[['Cookie policy','/cookies'],['Terms page','/terms'],['Dark','/dark/privacy']]),
  topic('services','Service directory','/services','Explain declared third parties and the purposes, data and storage associated with them.','services',[['Dark','/dark/services']]),
  topic('collection','Collection notice','/collection','Show privacy information beside a form, linked to an exact policy revision.','collection'),
  topic('indirect-collection','Indirect collection notice','/indirect-collection','Explain information received from another source, including advance-notice text.','indirect-collection'),
  topic('rights','Privacy request entry points','/rights','Give people clear contact and application routes for privacy requests.','rights')
 ]},
 {id:'privacy-choices',title:'Manage privacy choices',description:'Cookie preferences, optional permissions and controls for tracking and processing.',guides:[guide('consent','Cookie choices'),guide('embeds','Gated media'),guide('storage-cleanup','Storage cleanup'),guide('form-permissions','Form permissions'),guide('privacy-signals','Global Privacy Control'),guide('processing-choices','Recorded opt-outs'),guide('google-basic','Google Basic'),guide('regional-prompts','Repeat-prompt rules'),guide('scope-guards','Scope guards')],topics:[
  topic('cookies','Cookie choices','/choices','Accept, reject or choose purposes, then see which declared services may run.','consent',[['Dark','/dark/choices']]),
  topic('embeds','Gated media','/embeds','Keep frames and images inert until their declared service is allowed.','embeds'),
  topic('storage','Storage cleanup','/storage-cleanup','Remove declared browser markers after withdrawal while leaving unrelated storage alone.','storage-cleanup'),
  topic('permissions','Form permissions','/form-permissions','Record an optional purpose and channel, with independent withdrawal and recovery.','form-permissions',[['React','/form-permissions/react/'],['Astro','/form-permissions/astro/']]),
  topic('signals','Global Privacy Control','/privacy-signals','Apply a browser privacy signal independently of optional cookie preferences.','privacy-signals'),
  topic('opt-outs','Processing opt-outs','/processing-choices','Record restrictions and inspect their current state alongside the original request.','processing-choices'),
  topic('google','Google Basic simulator','/google-basic','Inspect the declared signals without loading a live Google tag.','google-basic',[],'Specialist controls'),
  topic('prompts','Repeat-prompt rules','/repeat-prompts','Explore when a configured regional prompt policy allows another request.','regional-prompts',[],'Specialist controls'),
  topic('guards','Scope guards','/scope-guards','See how explicit site and purpose restrictions affect available controls.','scope-guards',[],'Specialist controls')
 ]},
 {id:'contracts',title:'Terms and purchases',description:'Version-bound terms agreements and separate consumer-contract information and actions.',guides:[guide('terms','Terms agreements'),guide('guarantees','Guarantee notices'),guide('guarantee-labels','Product guarantee labels'),guide('guarantee-producer-example','Producer label example'),guide('paid-orders','Paid order reviews'),guide('contract-actions','Withdrawal & cancellation'),guide('contract-dispatch','Contract delivery runners')],topics:[
  topic('agreement','Terms agreement','/agreement','An unchecked statement tied to the exact terms version and action wording.','terms'),
  topic('guarantee-notice','EU guarantee notice','/guarantees','Display the shop-level legal guarantee notice and its readable wording.','guarantees',[],'Consumer contracts'),
  topic('producer-label','Product guarantee label','/guarantees/product/','Place the complete producer guarantee label beside the product it covers.','guarantee-labels',[['Preparation & source','/guide/guarantee-producer-example']],'Consumer contracts'),
  topic('orders','Paid order review','/orders/mixed/','Present items, commitments and prices immediately before an explicit payment action.','paid-orders',[['Deposit & balance','/orders/deferred/'],['Conditional fee','/orders/conditional/'],['Dark','/dark/orders/mixed/']],'Consumer contracts'),
  topic('withdrawal','Contract withdrawal','/contract-actions/withdrawal','Inspect the declaration and its separate confirmation and application handoffs.','contract-actions',[],'Consumer contracts'),
  topic('cancellation','Contract cancellation','/contract-actions/cancellation','Try the German cancellation flow and review its retained request.','contract-actions',[],'Consumer contracts')
 ]},
 {id:'records',title:'Keep and inspect records',description:'Retained versions, recorded choices, private inspection, exports and lifecycle controls.',guides:[guide('releases','Retained releases'),guide('consent-evidence','Cookie-choice evidence'),guide('evidence-export','Evidence export'),guide('evidence-lifecycle','Retention & holds')],topics:[
  topic('history','Document revisions','/demo/admin/history','Compare policy versions, authored source and rendered differences.','authoring'),
  topic('recorded-cookies','Recorded cookie choices','/recorded-choices','Follow a browser report from its pinned notice to a matching server receipt.','consent-evidence'),
  topic('releases','Public retained releases','/releases','Read two retained document versions at their original immutable addresses.','releases'),
  topic('catalog-history','Retained service references','/catalog-releases','Compare service-catalog selections separately from published legal text.','service-catalog'),
  topic('exports','Evidence export','/demo/admin/history/export','Review a filtered segment before downloading its scoped record projection.','evidence-export'),
  topic('lifecycle','Retention and holds','/demo/admin/lifecycle','Inspect holds, resumable purge progress and restore barriers.','evidence-lifecycle')
 ]},
 {id:'integrations',title:'Integrate and deploy',description:'Choose a framework, author your documents and add a host-controlled backend when needed.',guides:[guide('authoring','Markdown & MDX'),guide('react','React'),guide('astro','Astro'),guide('cloudflare','Cloudflare backend'),guide('cloudflare-starter','Cloudflare starter'),guide('cloudflare-doctor','Deployment checks')],topics:[
  topic('react','React integration','/react','Use the shared consent controller with hooks and hydration.','react'),
  topic('astro','Astro integration','/astro/','Build static legal pages with preferences that survive navigation.','astro'),
  topic('authoring','Markdown and MDX','/authored/terms','Supply your wording and static custom components with revision metadata.','authoring'),
  topic('backend','Cloudflare workspace','/demo/admin','Inspect records in an isolated workspace with the same reusable admin components.','cloudflare',[['Starter guide','/guide/cloudflare-starter'],['Deployment checks','/guide/cloudflare-doctor']])
 ]}
];
export const referenceSection={id:'reference',title:'Reference and verification',description:'Requirements, primary sources, scope, verification reports and asset provenance.',guides:[guide('project','Project overview'),guide('requirements','Requirements catalog'),guide('requirements/sources','Primary sources'),guide('features','Feature status'),guide('scope','Scope & limits'),guide('research','Research workflow'),guide('all','All guides & reports')]};
export const guideSections=[...siteSections,referenceSection];
export const normalizeGuideRoute=route=>route.replace(/\/$/u,'');
export function sectionForGuide(route){return guideSections.find(section=>section.guides.some(item=>item.href===normalizeGuideRoute(route)))??referenceSection;}
export const exampleSectionUrl=section=>'/examples/'+section.id+'/';
const e=value=>String(value).replace(/[&<>"']/gu,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function guideNavigation(route,title,{mobile=false}={}){
 const current=normalizeGuideRoute(route),active=sectionForGuide(current),listed=guideSections.some(section=>section.guides.some(link=>link.href===current));
 return `<nav aria-label="Documentation"><a class="guide-overview" href="/guide"${current==='/guide'?' aria-current="page"':''}>Guide overview</a>${guideSections.map(section=>{const links=[...section.guides,...(!listed&&current!=='/guide'&&active.id===section.id?[{href:current,label:title}]:[])].map(link=>`<a href="${link.href}"${link.href===current?' aria-current="page"':''}>${e(link.label)}</a>`).join('');return mobile?`<section class="guide-group"><h2>${e(section.title)}</h2><div>${links}</div></section>`:`<details class="guide-group"${current!=='/guide'&&active.id===section.id||current==='/guide'&&section.id==='start'?' open':''}><summary>${e(section.title)}</summary><div>${links}</div></details>`;}).join('')}</nav>`;
}
export function sectionDirectory(kind='examples',sections=siteSections){return `<div class="topic-directory">${sections.map((section,index)=>`<a class="topic-destination"${kind==='examples'&&({'privacy-information':'interfaces',integrations:'frameworks',records:'evidence'}[section.id])?' id="'+({'privacy-information':'interfaces',integrations:'frameworks',records:'evidence'}[section.id])+'"':''} href="${kind==='examples'?exampleSectionUrl(section):'/guide#'+section.id}"><span class="topic-number">${String(index+1).padStart(2,'0')}</span><h3>${e(section.title)} <span aria-hidden="true">↗</span></h3><p>${e(section.description)}</p>${kind==='examples'?`<span class="topic-count">${section.topics.length} topics</span>`:''}</a>`).join('')}</div>`;}
