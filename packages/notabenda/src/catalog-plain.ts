/** @requirements REQ-PRODUCT-SERVICE-CATALOG REQ-PRODUCT-STORAGE-AUTHORING */
function fail():never{throw Error('Use bounded plain catalog data without accessors or executable values.');}
// Inspect data descriptors before serialization: an imported object must not execute getters or toJSON.
export function assertPlainCatalogData(value:unknown,seen=new Set<object>(),depth=0,budget={nodes:0}):void {
 if(++budget.nodes>300000||depth>16)fail();
 if(value===null||typeof value==='boolean'||typeof value==='number'&&Number.isFinite(value)||typeof value==='string'&&value.length<=16384)return;
 if(!value||typeof value!=='object'||seen.has(value))fail();seen.add(value);
 const array=Array.isArray(value),proto=Object.getPrototypeOf(value);
 if(array?proto!==Array.prototype:proto!==Object.prototype&&proto!==null)fail();
 if(Reflect.ownKeys(value).some(k=>typeof k!=='string'))fail();
 if(Array.isArray(value)&&(value.length>20000||Object.keys(value).length!==value.length))fail();
 for(const [key,d] of Object.entries(Object.getOwnPropertyDescriptors(value))){if(Array.isArray(value)&&key==='length')continue;if(!Object.hasOwn(d,'value')||!d.enumerable)fail();assertPlainCatalogData(d.value,seen,depth+1,budget);}
 seen.delete(value);
}
