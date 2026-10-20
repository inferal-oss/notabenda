// @requirements REQ-PRODUCT-COMPLIANCE-MAP REQ-PRODUCT-A11Y REQ-PRODUCT-MOBILE REQ-PRODUCT-AGENT-INTEGRATION
// Maintained responsibility maps, shared by graphical HTML and text-only guides.
import {fromMarkdown} from 'mdast-util-from-markdown';
const node=(id,title,purpose,guide,tag)=>({id,title,purpose,guide:'/guide/'+guide,tag});
export const complianceViews={
 compliance:{title:'Information, actions and evidence',label:'Compliance responsibilities',intro:'Select components from the actual processing and business model. These groups show relationships, not a checklist or a mandatory sequence.',
  stages:[
   {id:'inform',title:'Explain',subtitle:'Make the relevant facts available',nodes:[
    node('privacy','Privacy & collection notices','Explain data use, purposes, recipients, retention and rights, including at the point of collection.','collection','Information'),
    node('cookies','Cookie & service information','Describe declared technologies, third parties and storage.','services','Information'),
    node('terms','Terms of service','Describe the service, commitments and contract conditions.','terms','Contract'),
    node('product','Purchase & guarantee information','Present product, price, commitment and applicable guarantee information.','paid-orders','Consumer information')
   ]},
   {id:'act',title:'Offer the relevant action',subtitle:'Keep different decisions separate',nodes:[
    node('cookie-choice','Optional-service choices','Control consent-managed scripts and storage; support refusal and withdrawal.','consent','Privacy choice'),
    node('marketing','Purpose/channel permission','Record an optional permission, such as email updates, separately from form submission.','form-permissions','Separate permission'),
    node('agreement','Terms agreement','Bind an explicit agreement to the exact terms version and the host workflow.','terms','Contract action'),
    node('opt-outs','Processing opt-outs','Apply separate sale, sharing or targeted-advertising restrictions and applicable browser signals.','processing-choices','Restriction'),
    node('rights','Privacy rights requests','Provide clear routes to request access, correction, erasure or other applicable privacy rights.','rights','Request route')
   ]},
   {id:'follow',title:'Retain & follow through',subtitle:'Evidence and actual operations',nodes:[
    node('versions','Released wording','Keep the exact policies, offers and revisions associated with an action.','releases','Version history'),
    node('records','Choice & action records','Retain scoped acknowledgements and inspect their history; evaluate current state again at use.','cloudflare','Evidence'),
    node('fulfilment','Application workflows','Stop restricted work, handle requests, send required confirmations and carry out contractual actions.','scope','Host responsibility')
   ]}
  ],relations:['Relevant information supports an informed action.','Action records reference their exact released wording.'],
  note:'Publishing a notice, recording a choice and carrying out a request are distinct responsibilities. Applicability, legal basis, wording review and fulfillment remain with the operator.'},
 purchase:{title:'Where a guarantee fits',label:'Product and contract responsibilities',intro:'A guarantee label is one part of the purchase information. The order, customer confirmation and later rights have separate roles.',
  stages:[
   {id:'before',title:'Before ordering',subtitle:'Understand the product and offer',nodes:[
    node('product-facts','Product & commitment','Identify what is supplied, its characteristics, price and ongoing commitments.','paid-orders','Offer information'),
    node('guarantee','Guarantees & consumer rights','Present applicable guarantee information and any qualifying producer label beside its product.','guarantee-labels','Product information')
   ]},
   {id:'order',title:'At the final action',subtitle:'Review the actual obligation',nodes:[
    node('review','Order review','Show the host-calculated total, amount due now, recurring or conditional charges and relevant documents.','paid-orders','Final review'),
    node('order-action','Payment-obligation action','Make the deliberate final action match the actual offer; the host handles admission and payment.','paid-orders','Explicit action')
   ]},
   {id:'after',title:'After the contract forms',subtitle:'Provide and carry out what applies',nodes:[
    node('confirmation','Customer confirmation','Prepare the required contract information for the customer and arrange its actual provision through the host.','order-confirmations','Customer copy'),
    node('contract-rights','Withdrawal & cancellation','Provide the applicable declaration routes, acknowledgements and application handling.','contract-actions','Later rights')
   ]}
  ],relations:['Product and guarantee information informs the final order review. Confirmation and later rights follow their own applicable requirements.'],
  note:'The host determines contract formation, takes payment, delivers confirmations and handles requests. An archived label or an order receipt alone does not complete these duties. Check the applicable profile and national requirements.'},
 storage:{title:'Where the software and records live',label:'Technical architecture and storage',intro:'The frontend can stand alone. Add a recording backend when the selected workflow needs durable evidence; the adopter supplies authorization and operations.',
  stages:[
   {id:'build',title:'Your build',subtitle:'Reviewed inputs → pinned output',nodes:[
    node('inputs','Inventory & authored content','Public processing facts, reviewed wording and optional Markdown/MDX sources.','authoring','Build inputs'),
    node('compile','Compile & release','Validate configuration, render documents and pin the released content and runtime settings.','package','notabenda / authoring'),
    node('public','Static public assets','Serve legal pages, selected runtime configuration and retained public revisions with the site.','releases','Site deployment')
   ]},
   {id:'browser',title:'Visitor browser',subtitle:'Information, controls and local state',nodes:[
    node('interfaces','Documents & controls','Display notices; keep cookie choices, form permissions, agreements and order actions separate.','compliance-map','Visitor interface'),
    node('local-state','Preferences & recovery','Browser storage remembers choices or objections; optional IndexedDB journals retain pending actions. The selected module determines storage.','form-permissions','localStorage / IndexedDB'),
    node('service-gates','Managed service lifecycles','Start only allowed work and stop owned producers and declared markers on restriction.','consent','Host integration')
   ]},
   {id:'backend',title:'Optional host backend',subtitle:'Authorize before reaching storage',nodes:[
    node('admission','Host authorization & admission','Resolve the site, person or session context, authorize access and validate bounded recording requests.','cloudflare-starter','Host application / Worker'),
    node('durable','Durable records & archives','Use scoped Durable Objects for evidence, released wording, private source and applicable delivery jobs.','cloudflare','notabenda-cf / SQLite DO'),
    node('operator','Operator workspace & lifecycle','Search and compare evidence, grant exports separately, and apply host retention, holds and erasure policy.','evidence-lifecycle','Authorized operator')
   ]}
  ],relations:['The build serves public assets to the browser.','Configured host transports connect selected actions to scoped backend recording.'],
  note:'Browser preferences are distinct from durable evidence. Public documents, private archives and operator access have different boundaries. Recording, scheduling, delivery and retention require explicit host integration.'}
};
const e=value=>String(value).replace(/[&<>"']/gu,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderComplianceDiagram(view,idPrefix){
 if(!Object.hasOwn(complianceViews,view)||typeof idPrefix!=='string'||!/^[a-z][a-z0-9-]{0,79}$/u.test(idPrefix))throw Error('Unknown compliance diagram or invalid instance prefix.');
 const m=complianceViews[view],title=idPrefix+'-title',caption=idPrefix+'-caption';
 const arrow='<svg viewBox="0 0 28 20" fill="none" aria-hidden="true" focusable="false"><path d="M2 10h23m-6-5 6 5-6 5"/></svg>';
 return `<figure class="compliance-map" data-compliance-view="${view}" aria-labelledby="${title}" aria-describedby="${caption}"><figcaption class="cm-heading"><p class="cm-eyebrow">${e(m.label)}</p><h3 id="${title}">${e(m.title)}</h3><p>${e(m.intro)}</p></figcaption><div class="cm-graph">${m.stages.map((stage,index)=>`${index?`<div class="cm-connector" aria-hidden="true">${arrow}</div>`:''}<section class="cm-stage cm-stage-${index+1}" aria-labelledby="${idPrefix}-${stage.id}"><header><span class="cm-step" aria-hidden="true">0${index+1}</span><div><h4 id="${idPrefix}-${stage.id}">${e(stage.title)}</h4><p>${e(stage.subtitle)}</p></div></header><div class="cm-nodes">${stage.nodes.map(n=>`<a class="cm-node" data-component="${n.id}" href="${e(n.guide)}"><span class="cm-node-tag">${e(n.tag)}</span><strong>${e(n.title)}<span aria-hidden="true">↗</span></strong><span class="cm-node-purpose">${e(n.purpose)}</span></a>`).join('')}</div></section>`).join('')}</div><p class="cm-relations">${m.relations.map(e).join(' ')}</p><p class="cm-note" id="${caption}">${e(m.note)}</p></figure>`;
}
export function complianceDiagramMarkdown(view){
 if(!Object.hasOwn(complianceViews,view))throw Error('Unknown compliance diagram.');
 const m=complianceViews[view];
 return `**${m.title}**\n\n${m.intro}\n\n`+m.stages.map(stage=>`### ${stage.title}\n\n${stage.subtitle}.\n\n`+stage.nodes.map(n=>`- [${n.title}](${n.guide}): ${n.purpose}`).join('\n')).join('\n\n')+`\n\n${m.relations.join(' ')}\n\n${m.note}\n`;
}
/** Only explicit trusted documentation markers expand; code examples are untouched. */
export function expandComplianceDiagrams(markdown,{graphical=false}={}){
 let instance=0;const edits=[];
 function visit(node){
  if(node.type==='html'){
   const match=/^<!-- notabenda:diagram ([a-z-]+) -->\s*$/u.exec(node.value);
   if(match){const view=match[1];if(!Object.hasOwn(complianceViews,view))throw Error('Unknown documentation diagram.');edits.push({start:node.position.start.offset,end:node.position.end.offset,text:graphical?renderComplianceDiagram(view,'component-map-'+view+'-'+(++instance)):complianceDiagramMarkdown(view)});}
  }
  for(const child of node.children??[])visit(child);
 }
 visit(fromMarkdown(markdown));
 for(const edit of edits.reverse())markdown=markdown.slice(0,edit.start)+edit.text+markdown.slice(edit.end);
 return markdown;
}
export function complianceMapLink(){return '<aside class="component-map-link"><div><p class="eyebrow">Understand the components</p><h2>What each part is for</h2><p>Notices, permissions, contract actions and evidence have different jobs. See how they fit together before choosing an integration.</p></div><a class="text-link" href="/guide/compliance-map/">Explore the compliance map <span aria-hidden="true">↗</span></a></aside>';}
