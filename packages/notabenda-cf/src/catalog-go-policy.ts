// @requirements REQ-PRODUCT-SERVICE-DETECTION REQ-PRODUCT-SERVICE-CATALOG
/** Case-sensitive module/package tokens only; prefix rules validate their root separately. */
export const isGoImportPath=(value:string):boolean=>value.length>0&&value.length<=200&&value.split('/').every(part=>/^[A-Za-z0-9_~+-][A-Za-z0-9._~+-]*$/u.test(part)&&!part.endsWith('.'));
