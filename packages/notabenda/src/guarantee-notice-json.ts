// @requirements REQ-EU-GUARANTEE-NOTICE REQ-PRODUCT-GUARANTEE-NOTICE REQ-EU-GUARANTEE-LABEL
/** Bounded JSON data inspection before serialization; never invokes getters or inherited toJSON. */
export function copyGuaranteeNoticeData(input:unknown):unknown {
  const seen=new Set<object>();let nodes=0,bytes=0;
  const fail=():never=>{throw Error('Invalid guarantee notice data.');};
  function walk(v:unknown,depth:number):void {
    if(++nodes>1000||depth>8||bytes>24576)return fail();
    if(v===null||typeof v==='boolean'||typeof v==='number'&&Number.isFinite(v)){bytes+=20;return;}
    if(typeof v==='string'){if(v.length>16000)return fail();bytes+=new TextEncoder().encode(JSON.stringify(v)).length;return;}
    if(!v||typeof v!=='object'||seen.has(v))return fail();
    if(Array.isArray(v)?Object.getPrototypeOf(v)!==Array.prototype:Object.getPrototypeOf(v)!==Object.prototype&&Object.getPrototypeOf(v)!==null)return fail();
    const ds=Object.getOwnPropertyDescriptors(v),keys=Reflect.ownKeys(ds);
    if(keys.length>30||keys.some(k=>typeof k!=='string')||Array.isArray(v)&&(v.length>20||Object.keys(v).length!==v.length))return fail();
    seen.add(v);bytes+=2;
    for(const key of keys){if(Array.isArray(v)&&key==='length')continue;const d=ds[key as string]!;if(!Object.hasOwn(d,'value')||!d.enumerable)return fail();bytes+=String(key).length*4+4;walk(d.value,depth+1);}
    seen.delete(v);
  }
  walk(input,0);if(bytes>24576)return fail();
  const json=JSON.stringify(input);if(new TextEncoder().encode(json).length>24576)return fail();
  return JSON.parse(json);
}
