// @requirements REQ-PRODUCT-DOCS-SEARCH
// Shared, browser-safe matching. The index contains published guides only.
export const searchIndexVersion=1;
export const maxSearchIndexBytes=3*1024*1024;
const normalize=value=>value.normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase();
const words=value=>normalize(value).match(/[\p{L}\p{N}]+/gu)??[];
const ignored=new Set(['a','an','the','to','and','for','of','in','how','do','i','with']);
const text=(value,max)=>typeof value==='string'&&value.length<=max;
const address=value=>text(value,1200)&&/^\/guide(?:\/[a-z0-9-]+)*\/(?:#[^\s<>"']+)?$/u.test(value);
export function prepareGuideSearch(index){
 if(!index||index.version!==searchIndexVersion||!Array.isArray(index.pages)||index.pages.length>512)throw Error('Invalid guide index');
 let total=0;
 const pages=index.pages.map(page=>{
  if(!page||!text(page.title,300)||!text(page.area,160)||!address(page.url)||page.url.includes('#')||!Array.isArray(page.sections)||page.sections.length>2048)throw Error('Invalid guide page');
  const sections=page.sections.map(section=>{
   if(!section||!text(section.heading,300)||!text(section.text,4096)||!address(section.url)||section.url.split('#')[0]!==page.url)throw Error('Invalid guide section');
   total+=section.text.length;if(total>maxSearchIndexBytes)throw Error('Guide index too large');
   return {...section,search:words(section.heading+' '+section.text).join(' '),headingSearch:words(section.heading).join(' ')};
  });
  return {...page,titleSearch:words(page.title).join(' '),sections};
 });
 return Object.freeze({pages});
}
export function searchGuides(index,query){
 if(typeof query!=='string'||query.length>160)return [];
 let terms=[...new Set(words(query))];
 const meaningful=terms.filter(t=>!ignored.has(t));if(meaningful.length)terms=meaningful;
 if(!terms.length||terms.length>12||normalize(query.trim()).length<2)return [];
 const phrase=terms.join(' '),results=[];
 for(const page of index.pages){
  let best;
  for(const section of page.sections){
   const haystack=page.titleSearch+' '+section.search;
   if(!terms.every(term=>haystack.includes(term)))continue;
   const titleHits=terms.filter(term=>page.titleSearch.includes(term)).length;
   const headingHits=terms.filter(term=>section.headingSearch.includes(term)).length;
   const requirement=/^REQ-[A-Z0-9-]+$/iu.test(query.trim())&&page.url==='/guide/requirements/'?60:0;
   const score=(page.titleSearch===phrase?300:0)+(page.titleSearch.includes(phrase)?100:0)+titleHits*20+headingHits*8+(section.search.includes(phrase)?6:0)+requirement-(page.url.includes('/verification/')?30:0);
   if(!best||score>best.score)best={title:page.title,area:page.area,url:section.url,heading:section.heading,snippet:excerpt(section.text,terms),score};
  }
  if(best)results.push(best);
 }
 return results.sort((a,b)=>b.score-a.score||a.title.localeCompare(b.title,'en')||a.url.localeCompare(b.url,'en'));
}
function excerpt(value,terms){
 const plain=value.replace(/\s+/gu,' ').trim(),normalized=normalize(plain);
 const hit=terms.toSorted((a,b)=>b.length-a.length).map(t=>normalized.indexOf(t)).find(n=>n>=0)??0;
 let start=Math.max(0,hit-75);if(start){const space=plain.indexOf(' ',start);if(space>=0&&space<start+30)start=space+1;}
 let end=Math.min(plain.length,start+230);if(end<plain.length){const space=plain.lastIndexOf(' ',end);if(space>start+150)end=space;}
 return (start?'… ':'')+plain.slice(start,end)+(end<plain.length?' …':'');
}
