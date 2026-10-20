// @requirements REQ-PRODUCT-DOCS-SEARCH
import {JSDOM} from 'jsdom';
import {searchIndexVersion,maxSearchIndexBytes,prepareGuideSearch} from './guide-search.mjs';
import {guideSections} from './navigation.mjs';
const e=value=>String(value).replace(/[&<>"']/gu,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function guideSearchPage(entry){
 const dom=new JSDOM(entry.html),sections=[];let heading=entry.title,url=entry.route.replace(/\/$/u,'')+'/',buffer='';
 const flush=()=>{if(buffer.trim())sections.push({heading,url,text:buffer.trim()});buffer='';};
 try{
  for(const el of dom.window.document.querySelectorAll('script,style,nav,button'))el.remove();
  for(const node of dom.window.document.body.childNodes){
   if(node.nodeType===1&&/^H[1-6]$/u.test(node.tagName)){
    flush();heading=node.textContent.trim().slice(0,300);url=entry.route.replace(/\/$/u,'')+'/'+(node.id?'#'+encodeURIComponent(node.id):'');
    continue;
   }
   // Separate text nodes keep table cells and inline code searchable as words.
   const walker=dom.window.document.createTreeWalker(node,dom.window.NodeFilter.SHOW_TEXT);let value='',item;
   if(node.nodeType===3)value=node.textContent;else while((item=walker.nextNode()))value+=' '+item.textContent;
   value=value.replace(/\s+/gu,' ').trim();if(!value)continue;
   buffer+=(buffer?' ':'')+value;
   while(buffer.length>3600){let end=buffer.lastIndexOf(' ',3500);if(end<3000)end=3500;sections.push({heading,url,text:buffer.slice(0,end)});buffer=buffer.slice(Math.max(0,end-160));}
  }
  flush();if(!sections.length)sections.push({heading,url,text:''});return {title:entry.title,area:entry.area,url:entry.route.replace(/\/$/u,'')+'/',sections};
 }finally{dom.window.close();}
}
export function buildGuideSearchIndex(pages){
 const index={version:searchIndexVersion,pages:[...pages].sort((a,b)=>a.url.localeCompare(b.url,'en'))};
 prepareGuideSearch(index);
 const json=JSON.stringify(index)+'\n';if(Buffer.byteLength(json)>maxSearchIndexBytes)throw Error('Published guide search index exceeds its delivery bound');
 return json;
}
export function guideSearchBody(pages){
 const groups=new Map(guideSections.map(section=>[section.title,[]]));for(const page of pages){if(!groups.has(page.area))groups.set(page.area,[]);groups.get(page.area).push(page);}
 return `<header class="guide-search-intro"><p class="eyebrow">Documentation</p><h1>Find the right guide</h1><p>Search by topic, API name or requirement ID.</p></header><div class="guide-search" data-guide-search><form role="search" aria-label="Documentation search"><label for="guide-query">Search documentation</label><div class="guide-search-field"><input id="guide-query" name="q" type="search" maxlength="160" placeholder="e.g. cookie expiry, MDX, REQ-IT-REPROMPT" autocomplete="off" spellcheck="false" aria-describedby="guide-search-help" disabled><button type="submit" disabled>Search</button></div><p id="guide-search-help">Search runs in your browser. Your query is not sent to a search service.</p></form><p class="guide-search-status" role="status" data-search-status>Browse the guides below. Search is available when JavaScript is enabled.</p><button type="button" data-search-retry hidden>Retry loading search</button><noscript><p>Use your browser’s Find command in the guide list below, or browse the <a href="/guide/">documentation by task</a>.</p></noscript><section data-search-results hidden aria-labelledby="guide-results-heading"><h2 id="guide-results-heading">Search results</h2><ul class="guide-search-results"></ul><button type="button" data-search-more hidden>Show more guides</button></section><section data-guide-search-browse><h2>All ${pages.length} guides</h2><div class="guide-search-directory">${[...groups].filter(([,items])=>items.length).map(([area,items])=>`<section><h3>${e(area)}</h3><ul>${items.sort((a,b)=>a.title.localeCompare(b.title,'en')).map(page=>`<li><a href="${e(page.url)}">${e(page.title)}</a></li>`).join('')}</ul></section>`).join('')}</div></section></div>`;
}
