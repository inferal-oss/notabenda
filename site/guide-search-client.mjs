// @requirements REQ-PRODUCT-DOCS-SEARCH REQ-PRODUCT-A11Y
import {prepareGuideSearch,searchGuides,maxSearchIndexBytes} from './guide-search.mjs';
export function mountGuideSearch(root,{loadIndex}={}){
 const doc=root.ownerDocument,form=root.querySelector('form'),input=root.querySelector('input'),submit=form.querySelector('button'),status=root.querySelector('[data-search-status]'),browse=root.querySelector('[data-guide-search-browse]'),results=root.querySelector('[data-search-results]'),list=results.querySelector('ul'),more=root.querySelector('[data-search-more]'),retry=root.querySelector('[data-search-retry]');
 const abort=new doc.defaultView.AbortController();let index,rows=[],limit=12,destroyed=false,loading=false;
 const element=(tag,value)=>{const n=doc.createElement(tag);if(value)n.textContent=value;return n;};
 function render(){
  list.replaceChildren();const query=input.value.trim();browse.hidden=!!query;results.hidden=!query;more.hidden=true;
  if(!query){status.textContent=`Search ${index.pages.length} published guides, or browse by topic below.`;return;}
  if(query.length<2){status.textContent='Enter at least two characters.';return;}
  rows=searchGuides(index,query);
  for(const row of rows.slice(0,limit)){
   const li=element('li'),a=element('a'),title=element('h3',row.title),where=element('span',row.area+(row.heading!==row.title?' · '+row.heading:'')),snippet=element('p',row.snippet);
   where.className='guide-search-location';a.href=row.url;a.append(where,title,snippet);li.append(a);list.append(li);
  }
  more.hidden=rows.length<=limit;
  status.textContent=rows.length?`${rows.length} ${rows.length===1?'guide':'guides'} found${rows.length>limit?`; showing ${limit}`:''}.`:'No matching guides. Try fewer words, an API name or a requirement ID.';
 }
 async function load(){
  if(loading||destroyed)return;loading=true;retry.hidden=true;status.textContent='Loading search…';
  try{
   const value=await (loadIndex?loadIndex({signal:abort.signal}):(async()=>{const response=await doc.defaultView.fetch('/assets/guide-search-index.json',{signal:abort.signal,credentials:'omit',referrerPolicy:'no-referrer'});if(!response.ok)throw Error();const text=await response.text();if(text.length>maxSearchIndexBytes)throw Error();return JSON.parse(text);})());
   if(destroyed)return;index=prepareGuideSearch(value);input.disabled=false;submit.disabled=false;render();
  }catch{if(!destroyed){status.textContent='Search could not load. The full guide list is available below.';browse.hidden=false;results.hidden=true;retry.hidden=false;}}
  finally{loading=false;}
 }
 const changed=()=>{if(index){limit=12;render();}};
 const submitted=event=>{event.preventDefault();changed();};
 const showMore=()=>{const previous=limit;limit+=12;render();list.children[previous]?.querySelector('a')?.focus();};
 input.addEventListener('input',changed);form.addEventListener('submit',submitted);more.addEventListener('click',showMore);retry.addEventListener('click',load);void load();
 return {destroy(){destroyed=true;abort.abort();input.removeEventListener('input',changed);form.removeEventListener('submit',submitted);more.removeEventListener('click',showMore);retry.removeEventListener('click',load);input.disabled=true;submit.disabled=true;}};
}
if(typeof document!=='undefined'){const root=document.querySelector('[data-guide-search]');if(root)mountGuideSearch(root);}
