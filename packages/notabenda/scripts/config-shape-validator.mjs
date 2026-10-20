// @requirements REQ-PRODUCT-AGENT-INTEGRATION REQ-PRODUCT-CONFIG
// Compile at package build time; consumers need neither Ajv nor TypeScript.
import Ajv from 'ajv/dist/2020.js';
import standalone from 'ajv/dist/standalone/index.js';

export function createConfigShapeValidator(schema){
 const ajv=new Ajv({strict:true,allErrors:true,code:{source:true,esm:true}});
 ajv.addKeyword({keyword:'x-notabenda',schemaType:'object',valid:true});
 const source=standalone(ajv,ajv.compile(schema));
 // Current authoring shapes need no external runtime helpers. A new keyword
 // which requires one must be handled explicitly, not shipped as a broken import.
 if(/\brequire\s*\(|^import /mu.test(source))throw Error('Authoring validator requires an unsupported runtime helper.');
 return '// Generated from SiteConfig by Ajv (MIT) at package build time.\n'+source+'\n';
}
