// @requirements REQ-PRODUCT-SERVICE-DETECTION REQ-PRODUCT-SERVICE-CATALOG
import {parse} from 'smol-toml';
/** Node-only static input. Callers suppress parser diagnostics, which may include source values. */
export function readProjectToml(source:string):Record<string,unknown>{
 if(Buffer.byteLength(source)>262144)throw Error();
 return parse(source,{maxDepth:32,unsafeKeyBehaviour:'throw',integersAsBigInt:'asNeeded'});
}
