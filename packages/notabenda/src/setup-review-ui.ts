// @requirements REQ-PRODUCT-PACK-CONNECTION REQ-PRODUCT-SETUP REQ-PRODUCT-A11Y
import type {SetupPlan,SetupQuestionId,SetupRecommendation} from './setup.js';

/** Present current draft findings. No approval, installation or verification state is recorded. */
export function createSetupReviewSummary(doc:Document,options:{
  report:SetupPlan['report'];recommendations:readonly SetupRecommendation[];questionIds:readonly SetupQuestionId[];documentationBase:string;
  isCurrent:()=>boolean;reviewConfiguration:()=>void;reviewFacts:()=>void;reviewNotes:()=>void;
}):HTMLElement {
  const node=<K extends keyof HTMLElementTagNameMap>(tag:K,text?:string)=>{const el=doc.createElement(tag);if(text!==undefined)el.textContent=text;return el;};
  const root=node('section');root.className='nb-setup-draft-review';root.setAttribute('aria-label','Draft review');
  const heading=node('div');heading.className='nb-setup-draft-review-heading';heading.append(node('h3','Before connecting'),node('p','Review these draft findings. You can save the files or ask your agent to help resolve them.'));root.append(heading);
  const findings=options.report.diagnostics.filter(d=>d.severity==='error').length;
  const unknown=options.questionIds.filter(id=>!options.report.answers.answers[id]||options.report.answers.answers[id]!.choice==='unknown').length;
  const reviews=options.recommendations.filter(r=>r.status==='review');
  const actions=node('div');actions.className='nb-setup-draft-actions';root.append(actions);
  const button=(text:string,action:()=>void)=>{const b=node('button',text);b.type='button';b.className='nb-setup-review-action';b.addEventListener('click',()=>{if(b.isConnected&&options.isCurrent())action();});return b;};
  const metric=(kind:string,label:string,count:number,copy:string,action?:HTMLButtonElement)=>{const item=node('section');item.dataset.reviewKind=kind;item.className='nb-setup-draft-finding';const title=node('h4',label);const value=node('strong',String(count));value.className='nb-setup-finding-count';title.append(value);item.append(title,node('p',copy));if(action)item.append(action);actions.append(item);};
  metric('configuration','Configuration findings',findings,findings?'These checks found details to address before publishing. Several findings may concern the same issue.':'No errors in this validation pass. Wording, facts and application behavior still need review.',findings?button('Review configuration',options.reviewConfiguration):undefined);
  metric('practices','Practices marked Not sure',unknown,unknown?'These questions belong to your selected packs or their supporting foundations.':'Your selected practice answers are recorded. Supporting facts and justifications still need review.',button('Review selected facts',options.reviewFacts));
  const scope=node('section');scope.className='nb-setup-scope-reviews';scope.dataset.reviewKind='scope';const scopeTitle=node('h4','Scope reviews');scopeTitle.append(node('span',reviews.length+' topic'+(reviews.length===1?'':'s')));scope.append(scopeTitle,node('p',reviews.length?'Check these topics against your actual practices. This setup does not record legal approval.':'No additional scope-review topics are listed for this draft. Check the intended markets and applicable rules.'));
  for(const review of reviews){const detail=node('details');detail.dataset.reviewId=review.id;const summary=node('summary',review.title);detail.append(summary,node('p',review.reason));const links=node('p');links.className='nb-setup-review-links';for(const id of review.requirementIds){const link=node('a',id);link.href=options.documentationBase+'/requirements#'+id.toLowerCase();links.append(link);}const guide=node('a','Read the guide');guide.href=options.documentationBase+'/'+review.guide;links.append(guide);detail.append(links);scope.append(detail);}
  root.append(scope);
  const footer=node('div');footer.className='nb-setup-draft-review-footer';footer.append(button('All review notes ('+options.report.reviewItems.length+')',options.reviewNotes),node('p','These groups overlap and do not cover every review note. Installation and deployment have not been verified here.'));root.append(footer);
  return root;
}
