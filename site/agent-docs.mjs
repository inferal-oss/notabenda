// @requirements REQ-PRODUCT-AGENT-INTEGRATION
import {fromMarkdown} from 'mdast-util-from-markdown';

export const skillFiles=['SKILL.md','agents/openai.yaml'];
export const markdownRoute=route=>route.replace(/\/$/u,'')+'/index.md';

// Edit parsed link destinations only, retaining authored prose, code and tables.
// Positional edits also preserve reference links and images nested in link labels.
export function rewriteMarkdown(markdown,rewrite){
 const edits=[];
 function visit(node){
  if(node.type==='html'){
   const start=node.position.start.offset,raw=markdown.slice(start,node.position.end.offset);
   for(const match of raw.matchAll(/\b(?:src|href)=(['"])(.*?)\1/gu)){
    const url=rewrite(match[2]);
    if(url!==match[2]){const offset=start+match.index+match[0].indexOf(match[1])+1;edits.push({start:offset,end:offset+match[2].length,text:url});}
   }
  }
  if(['link','image','definition'].includes(node.type)){
   const url=rewrite(node.url);
   if(url!==node.url){
    const start=node.position.start.offset,raw=markdown.slice(start,node.position.end.offset);
    let from;
    if(node.type==='definition')from=/^ {0,3}\[[\s\S]+?\]:\s*/u.exec(raw)?.[0].length;
    else{
     // Link child positions exclude the closing label bracket. Image alt text
     // has no child nodes, so scan its balanced, escaped label brackets.
     let close=node.children?.at(-1)?.position.end.offset-start;
     if(!Number.isInteger(close)){
      let depth=1;close=node.type==='image'?2:1;
      for(;close<raw.length;close++){if(raw[close]==='\\'){close++;continue;}if(raw[close]==='[')depth++;if(raw[close]===']'&&--depth===0)break;}
     }
     while(raw[close]!==']'&&close<raw.length)close++;
     if(raw[close+1]==='(')from=close+2;
    }
    if(!Number.isInteger(from))throw Error('Unsupported Markdown link destination.');
    while(/\s/u.test(raw[from]??''))from++;
    let end=from;
    if(raw[from]==='<'){end++;while(end<raw.length&&raw[end]!=='>'){if(raw[end]==='\\')end++;end++;}end++;}
    else{let depth=0;for(;end<raw.length;end++){const c=raw[end];if(c==='\\'){end++;continue;}if(/\s/u.test(c)||c===')'&&depth===0)break;if(c==='(')depth++;if(c===')')depth--;}}
    const destination='<'+url.replace(/</gu,'%3C').replace(/>/gu,'%3E')+'>';
    edits.push({start:start+from,end:start+end,text:destination});
   }
  }
  for(const child of node.children??[])visit(child);
 }
 visit(fromMarkdown(markdown));
 for(const edit of edits.sort((a,b)=>b.start-a.start))markdown=markdown.slice(0,edit.start)+edit.text+markdown.slice(edit.end);
 return markdown;
}

