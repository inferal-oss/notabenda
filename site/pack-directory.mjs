// @requirements REQ-PRODUCT-CONSUMER-PACKS
// @requirements REQ-PRODUCT-PRIVACY-PACKS
// @requirements REQ-PRODUCT-CARTRIDGES REQ-PRODUCT-MOBILE REQ-PRODUCT-A11Y
import {packLibrary,packGroups} from '@notabenda/core/packs';
import {fromMarkdown} from 'mdast-util-from-markdown';

const groups=packGroups().map(g=>[g.id,g.title]);
const e=value=>String(value).replace(/[&<>"']/gu,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
/** A script-free overview, using the installed registry rather than a second list. */
export function packDirectory(){
 const packs=packLibrary();
 return `<nav class="pack-directory" aria-label="All ${packs.length} packs">${groups.map(([id,title])=>{
  const items=packs.filter(p=>p.shelf===id);
  return `<section class="pack-directory-group" data-pack-group="${id}"><header><h3>${title}</h3><span>${items.length} packs</span></header><ul>${items.map(p=>`<li><a href="/start/#pack-${p.id}" data-pack-link="${p.id}"><span class="pack-token pack-token-${p.shelf} pack-token-${p.id}" aria-hidden="true"><span class="pack-token-number">${String(packs.indexOf(p)+1).padStart(2,'0')}</span><span class="pack-token-glyph"><i></i><i></i><i></i></span><span class="pack-token-contacts"><span></span><span></span></span></span><span><strong>${e(p.title)}</strong><span>${e(p.outcome)}</span></span><span class="pack-directory-arrow" aria-hidden="true">↗</span></a></li>`).join('')}</ul></section>`;
 }).join('')}<p class="pack-directory-note">Regional packs cover the named timing rules. Review applicability before enabling them.</p></nav>`;
}
export function packDirectoryMarkdown(){
 const packs=packLibrary();
 return groups.map(([id,title])=>`### ${title}\n\n`+packs.filter(p=>p.shelf===id).map(p=>`- [${p.title}](/start/#pack-${p.id}) — ${p.outcome}`).join('\n')).join('\n\n')+'\n\nRegional packs cover the named timing rules. Review applicability before enabling them.\n';
}
export function expandPackDirectory(markdown,{graphical=false}={}){
 const edits=[];
 function visit(node){
  if(node.type==='html'&&/^<!-- notabenda:packs -->\s*$/u.test(node.value))edits.push({start:node.position.start.offset,end:node.position.end.offset,text:graphical?packDirectory():packDirectoryMarkdown()});
  for(const child of node.children??[])visit(child);
 }
 visit(fromMarkdown(markdown));
 for(const edit of edits.reverse())markdown=markdown.slice(0,edit.start)+edit.text+markdown.slice(edit.end);
 return markdown;
}
