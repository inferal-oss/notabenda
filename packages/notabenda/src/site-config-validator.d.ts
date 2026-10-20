// @requirements REQ-PRODUCT-AGENT-INTEGRATION REQ-PRODUCT-CONFIG
// Implementation generated into dist/ alongside the matching authoring schema.
interface ShapeError {instancePath:string; schemaPath:string; keyword:string; params:Record<string,unknown>}
declare const validate: ((input:unknown)=>boolean)&{errors?:ShapeError[]|null};
export default validate;
