/** @requirements REQ-PRODUCT-AUTHORING REQ-PRODUCT-CF-HISTORY */
export interface SourceRange {beforeStart:number;afterStart:number;before:string[];after:string[]}
export function sourceDiff(before:string,after:string):{ranges:SourceRange[];precise:boolean} {
  const a=before.split(/\r\n|\r|\n/u);const b=after.split(/\r\n|\r|\n/u);
  let prefix=0;while(prefix<a.length&&prefix<b.length&&a[prefix]===b[prefix])prefix++;
  let suffix=0;while(suffix<a.length-prefix&&suffix<b.length-prefix&&a[a.length-1-suffix]===b[b.length-1-suffix])suffix++;
  const n=a.length-prefix-suffix;const m=b.length-prefix-suffix;
  if(!n&&!m)return {ranges:[],precise:true};
  const range=(a0:number,a1:number,b0:number,b1:number):SourceRange=>{
    const startA=Math.max(0,a0-2);const startB=Math.max(0,b0-2);
    return {beforeStart:startA+1,afterStart:startB+1,before:a.slice(startA,Math.min(a.length,a1+2)),after:b.slice(startB,Math.min(b.length,b1+2))};
  };
  // Bound both memory and work for pathological many-line input. Source itself is already byte-bounded.
  if((n+1)*(m+1)>250000)return {ranges:[range(prefix,a.length-suffix,prefix,b.length-suffix)],precise:false};
  const width=m+1;const lcs=new Uint32Array((n+1)*width);
  for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)lcs[i*width+j]=a[prefix+i]===b[prefix+j]?lcs[(i+1)*width+j+1]!+1:Math.max(lcs[(i+1)*width+j]!,lcs[i*width+j+1]!);
  const gaps:{a0:number;a1:number;b0:number;b1:number}[]=[];
  let i=0,j=0,startI=0,startJ=0;
  const gap=()=>{if(i!==startI||j!==startJ)gaps.push({a0:prefix+startI,a1:prefix+i,b0:prefix+startJ,b1:prefix+j});};
  while(i<n&&j<m){
    if(a[prefix+i]===b[prefix+j]){gap();i++;j++;startI=i;startJ=j;}
    else if(lcs[(i+1)*width+j]!>=lcs[i*width+j+1]!)i++;
    else j++;
  }
  i=n;j=m;gap();
  const groups:typeof gaps=[];
  for(const entry of gaps){const last=groups.at(-1);if(last&&entry.a0-last.a1<=4&&entry.b0-last.b1<=4){last.a1=entry.a1;last.b1=entry.b1;}else groups.push({...entry});}
  if(groups.length>32)return {ranges:[range(prefix,a.length-suffix,prefix,b.length-suffix)],precise:false};
  return {ranges:groups.map(g=>range(g.a0,g.a1,g.b0,g.b1)),precise:true};
}
