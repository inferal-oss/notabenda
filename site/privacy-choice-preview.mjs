// @requirements REQ-PRODUCT-PRIVACY-CHOICE-LINK REQ-US-CA-ALTERNATIVE-LINK
import {fromMarkdown} from 'mdast-util-from-markdown';
import {renderPrivacyChoicesLink} from '@notabenda/core/privacy-choices';
/** Trusted guide-only presentation preview. Its destination is an installation checklist, not a request endpoint. */
export function expandPrivacyChoicePreview(markdown,{graphical=false}={}){
 const marker='<!-- notabenda:privacy-choice-links -->',edits=[];
 const visit=node=>{if(node.type==='html'&&node.value.trim()===marker)edits.push({start:node.position.start.offset,end:node.position.end.offset});for(const child of node.children??[])visit(child);};visit(fromMarkdown(markdown));
 const text=graphical?`<section class="guide-first-steps" aria-label="California link presentation preview"><p><strong>Link presentation preview</strong></p><p>These links lead to the destination checklist below. They do not submit a privacy request.</p>${['Your Privacy Choices','Your California Privacy Choices'].map((label,i)=>'<p>'+renderPrivacyChoicesLink({schemaVersion:1,revision:'guide-preview-'+i,href:'/guide/privacy-choice-links/#california-destination-checklist',label,presentation:'california-alternative-2026',reviewStatus:'draft'},{allowPreview:true})+'</p>').join('')}</section>`:'Presentation preview: “Your Privacy Choices” or “Your California Privacy Choices”, with the official opt-out icon. The graphical guide links to the destination checklist; it does not submit a privacy request.';
 for(const edit of edits.reverse())markdown=markdown.slice(0,edit.start)+text+markdown.slice(edit.end);return markdown;
}
