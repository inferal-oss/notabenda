// @requirements REQ-PRODUCT-SERVICE-DETECTION REQ-PRODUCT-SERVICE-CATALOG
/** Static lexical readers only. No Go toolchain, build graph or project code is run. */
import {isGoImportPath} from './catalog-go-policy.js';
export interface GoProjectIdentifiers {identifiers:{identifier:string;context:'dependency'|'indirect-dependency'|'source-import'|'test-source-import'}[];limited:boolean}
type Token={kind:'word'|'string'|'punct'|'line';value:string};
/** Skip comments, rune literals and whole strings before interpreting import declarations. */
function goTokens(source:string):{tokens:Token[];limited:boolean}{
 const tokens:Token[]=[];let i=0,limited=false;
 while(i<source.length){
  if(tokens.length>=65536){limited=true;break;}
  const c=source[i]!;
  if(c==='\n'||c===';'){tokens.push({kind:'line',value:c});i++;continue;}
  if(/\s/u.test(c)){i++;continue;}
  if(source.startsWith('//',i)){const end=source.indexOf('\n',i+2);i=end<0?source.length:end;continue;}
  if(source.startsWith('/*',i)){const end=source.indexOf('*/',i+2);if(end<0){limited=true;break;}if(source.slice(i,end).includes('\n'))tokens.push({kind:'line',value:'\n'});i=end+2;continue;}
  if(c==='"'||c==='`'||c==="'"){
   const start=++i;let closed=false;
   while(i<source.length){if(source[i]===c){closed=true;break;}if(c!=='`'&&source[i]==='\\'){i+=2;continue;}if(c!=='`'&&source[i]==='\n')break;i++;}
   if(!closed){limited=true;break;}
   tokens.push({kind:c==="'"?'punct':'string',value:source.slice(start,i)});i++;continue;
  }
  if(/[\p{L}_]/u.test(c)){const start=i++;while(i<source.length&&/[\p{L}\p{N}_]/u.test(source[i]!))i++;tokens.push({kind:'word',value:source.slice(start,i)});continue;}
  tokens.push({kind:'punct',value:c});i++;
 }
 return {tokens,limited};
}
export function goSourceIdentifiers(source:string,testFile=false):GoProjectIdentifiers {
 const result=goTokens(source),identifiers:GoProjectIdentifiers['identifiers']=[];let limited=result.limited;
 const tokens=result.tokens,context=testFile?'test-source-import':'source-import';
 const spec=(position:number):number=>{
  let i=position;
  if(tokens[i]?.kind==='word'||tokens[i]?.kind==='punct'&&tokens[i]?.value==='.')i++;
  const token=tokens[i];
  if(token?.kind!=='string'){limited=true;return i;}
  if(isGoImportPath(token.value))identifiers.push({identifier:token.value,context});else limited=true;
  return i+1;
 };
 for(let i=0;i<tokens.length;i++){
  if(tokens[i]!.kind!=='word'||tokens[i]!.value!=='import')continue;
  i++;
  while(tokens[i]?.kind==='line'&&tokens[i]?.value==='\n')i++;
  if(tokens[i]?.value==='('&&tokens[i]?.kind==='punct'){
   i++;let closed=false;
   while(i<tokens.length){if(tokens[i]!.kind==='line'){i++;continue;}if(tokens[i]!.kind==='punct'&&tokens[i]!.value===')'){closed=true;break;}
    const next=spec(i);i=next;if(tokens[i]&&tokens[i]!.kind!=='line'&&tokens[i]!.value!==')'){limited=true;while(i<tokens.length&&tokens[i]!.kind!=='line'&&tokens[i]!.value!==')')i++;}
   }
   if(!closed)limited=true;
  }else{
   const next=spec(i);i=next-1;if(tokens[next]&&tokens[next]!.kind!=='line')limited=true;
  }
 }
 return {identifiers,limited};
}
/** go.mod is line-oriented; quoted paths are accepted without interpreting escapes. */
export function goModuleIdentifiers(source:string):GoProjectIdentifiers {
 const identifiers:GoProjectIdentifiers['identifiers']=[];let limited=false,block:string|undefined;
 for(const line of source.split(/\r?\n/u)){
  const tokens:string[]=[];let i=0,comment='';
  while(i<line.length){
   if(/\s/u.test(line[i]!)){i++;continue;}
   if(line.startsWith('//',i)){comment=line.slice(i+2).trim();break;}
   if(line.startsWith('/*',i)||line.startsWith('*/',i))return {identifiers,limited:true};
   if(line[i]==='"'){
    const start=++i;while(i<line.length&&line[i]!=='"'){if(line[i]==='\\')i++;i++;}
    if(i>=line.length){limited=true;break;}tokens.push(line.slice(start,i++));
   }else if(line[i]==='('||line[i]===')')tokens.push(line[i++]!);
   else{const start=i++;while(i<line.length&&!/\s|[()]/u.test(line[i]!)&&!line.startsWith('//',i))i++;tokens.push(line.slice(start,i));}
  }
  if(!tokens.length)continue;
  if(tokens[0]===')'){if(tokens.length!==1||!block)limited=true;block=undefined;continue;}
  let directive=block;
  if(!directive){directive=tokens.shift();if(directive==='replace'||directive==='exclude')limited=true;if(tokens.length===1&&tokens[0]==='('){block=directive;continue;}}
  if(directive!=='require')continue;
  if(tokens.length!==2||!isGoImportPath(tokens[0]!)||!tokens[1]||/["'`\\]/u.test(tokens[1]!)){limited=true;continue;}
  const fields=comment.split(/\s+/u),indirect=fields.length===1&&fields[0]==='indirect'||fields.length>1&&fields[0]==='indirect;';
  identifiers.push({identifier:tokens[0]!,context:indirect?'indirect-dependency':'dependency'});
 }
 if(block)limited=true;
 return {identifiers,limited};
}
