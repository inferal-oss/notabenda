// @requirements REQ-PRODUCT-RIGHTS-AUTHORING
// @requirements REQ-PRODUCT-PRIVACY-PACKS
// @requirements REQ-PRODUCT-CONSENT-AUTHORING
// @requirements REQ-PRODUCT-PACK-CONNECTION REQ-PRODUCT-CARTRIDGES REQ-PRODUCT-A11Y
import type {planCartridges,PackInputReview} from './cartridges.js';

/** Render the installed integration contract; no completion state or host actions are owned here. */
export function appendPackConnectionGuide(container:HTMLElement,scope:ReturnType<typeof planCartridges>,docs:string,options:{inputReview?:PackInputReview;hasConsent?:boolean;configureConsent?:()=>void;hasRights?:boolean;configureRights?:()=>void}={}):void {
 const doc=container.ownerDocument;
 const node=<K extends keyof HTMLElementTagNameMap>(tag:K,text?:string)=>{const el=doc.createElement(tag);if(text!==undefined)el.textContent=text;return el;};
 const list=(items:readonly string[])=>{const ul=node('ul');for(const copy of items)ul.append(node('li',copy));return ul;};
 const guideLink=(slug:string)=>{const a=node('a','Read integration guide');a.href=docs+'/'+slug;a.className='nb-setup-connection-guide';return a;};
 const root=node('section');root.className='nb-setup-connection';root.append(node('h3','Connect to your site'),node('p','Use these steps yourself or give the downloaded files to your coding agent. Run the checks in your application after connecting each pack.'));
 if(options.configureConsent&&scope.reference.targets.some(t=>t.id==='cookie-consent')){const controls=node('aside');controls.className='nb-setup-connection-settings';controls.append(node('h4','Cookie control settings'),node('p',options.hasConsent?'Control settings are present in this draft. Review the enrolled services, material versions and separate memory periods.':'This draft has no cookie control settings yet. Choose the actual services and their purpose versions, then enter the memory periods.'));const button=node('button',options.hasConsent?'Edit cookie controls':'Configure cookie controls');button.type='button';button.className='nb-choice-button';button.addEventListener('click',options.configureConsent);controls.append(button);root.append(controls);}
 if(options.configureRights&&scope.reference.targets.some(t=>t.id==='privacy-rights')){const settings=node('aside');settings.className='nb-setup-connection-settings';settings.append(node('h4','Privacy request page'),node('p',options.hasRights?'Review the real destinations, public fallback, page revision and privacy link.':'Configure actual request destinations and a public contact fallback; no workflow is inferred.'));const button=node('button',options.hasRights?'Edit request page':'Configure request page');button.type='button';button.className='nb-choice-button';button.addEventListener('click',options.configureRights);settings.append(button);root.append(settings);}
 for(const pack of scope.cartridges){
  const article=node('article');article.className='nb-setup-connection-pack';article.dataset.pack=pack.id;
  article.append(node('h4',pack.title),node('p',pack.lesson),guideLink(pack.guide));
  const targets=scope.reference.targets.filter(t=>pack.targetIds.some(id=>id===t.id));
  const inputs=options.inputReview?.packs.find(p=>p.id===pack.id);
  if(inputs){const review=node('section');review.className='nb-setup-pack-inputs';review.append(node('h5','Inputs and manual setup'),node('p','Declarations are unverified. Use the available editors for settings; supply the remaining builder inputs and application behavior in your project.'));const rows=(items:typeof inputs.items)=>{const ul=node('ul');for(const item of items){const li=node('li');li.dataset.input=item.id;li.dataset.state=item.state;li.append(node('strong',item.state==='declared'?'Declared · verify':item.state==='missing'?'Missing':item.state==='needs-review'?'Review needed':'In your project'),node('p',item.label));for(const path of item.paths)li.append(node('code',path),doc.createTextNode(' '));ul.append(li);}return ul;};const missing=inputs.items.filter(i=>i.state==='missing'||i.state==='needs-review'),manual=inputs.items.filter(i=>i.state==='declared'||i.state==='host-work');if(missing.length)review.append(rows(missing));else review.append(node('p','No missing declarations detected in this draft. Actual facts, builder inputs and host behavior still need verification.'));if(manual.length){const detail=node('details');detail.append(node('summary','Declared inputs and project work ('+manual.length+')'),rows(manual));review.append(detail);}article.append(review);}

  article.append(node('h5','Connect'),list([...new Set(targets.flatMap(t=>t.hostWork))]));
  const proposal=scope.policyProposals.find(p=>p.cartridgeId===pack.id);
  if(proposal){const policy=node('aside');policy.className='nb-setup-connection-policy';policy.append(node('strong','Assess this policy before enabling it'),node('p',proposal.path+' · '+proposal.profile),node('p','Required fields: '+proposal.requiredFields.join(', ')+'. Selection has not enabled this policy.'));article.append(policy);}
  const checks=node('details');checks.className='nb-setup-connection-checks';checks.append(node('summary','Checks to run in your application'),list([...new Set(targets.flatMap(t=>t.verify))]));article.append(checks);root.append(article);
 }
 const supporting=scope.reference.targets.filter(t=>t.selection==='prerequisite');
 if(supporting.length){
  const existing=node('details');existing.className='nb-setup-connection-foundations';existing.append(node('summary','Existing foundations to check'),node('p','Reuse the foundations your site already has. Check their behavior before adding another implementation.'));
  for(const target of supporting){const section=node('section');section.dataset.foundation=target.id;section.append(node('h4',target.title),list(target.hostWork));const checks=node('details');checks.append(node('summary','Foundation checks'),list(target.verify));section.append(checks);const slug=target.guides[0]!.replace('https://notabenda.org/guide/','').replace('/index.md','');section.append(guideLink(slug));existing.append(section);}root.append(existing);
 }
 container.append(root);
}
