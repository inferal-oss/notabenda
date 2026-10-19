/** @requirements REQ-EU-GUARANTEE-LABEL
 * Conservative SVG clip graph: every declared reference must resolve, including possible class-style references.
 */
export interface LabelClipReference {owner:string|undefined;target:string}
export function verifyLabelClipGraph(ids:Map<string,string>,costs:Map<string,number>,references:LabelClipReference[],styleTargets:Set<string>):void {
 const fail=():never=>{throw Error('Unsupported producer label asset: unresolved, recursive or over-budget SVG clip graph.');};
 if(references.length>2048)return fail();
 const edges=new Map<string,string[]>();for(const id of costs.keys())edges.set(id,[]);
 for(const target of styleTargets)if(ids.get(target)!=='clipPath')return fail();
 for(const ref of references){if(ids.get(ref.target)!=='clipPath')return fail();if(ref.owner!==undefined){const list=edges.get(ref.owner);if(!list)return fail();list.push(ref.target);}}
 const visiting=new Set<string>(),memo=new Map<string,{cost:number;depth:number}>();
 function measure(id:string,stackDepth:number):{cost:number;depth:number} {
  if(stackDepth>8||visiting.has(id))return fail();const saved=memo.get(id);if(saved)return saved;
  visiting.add(id);let cost=costs.get(id)??0,depth=1;
  for(const child of edges.get(id)??[]){const result=measure(child,stackDepth+1);cost+=result.cost;depth=Math.max(depth,1+result.depth);if(cost>100000||depth>8)return fail();}
  visiting.delete(id);const result={cost,depth};memo.set(id,result);return result;
 }
 // Inspect definitions even when currently unused. Cache size/work is bounded by the input node budget.
 for(const id of costs.keys())measure(id,1);
 let total=0;for(const ref of references){total+=measure(ref.target,1).cost;if(total>100000)return fail();}
}
