// @requirements REQ-PRODUCT-CONFIG-SOURCES
// Universal ESM bundle loaded only by an explicit YAML/Markdown configuration action.
import {isAlias,isPair,isScalar,LineCounter,parseDocument,stringify,visit} from 'yaml';

export function parseConfigYaml(source:string):unknown {
 const lines=new LineCounter();
 try {
  const doc=parseDocument(source,{schema:'core',version:'1.2',uniqueKeys:true,prettyErrors:false,lineCounter:lines});
  const issue=doc.errors[0]??doc.warnings[0];
  if(issue){const position=lines.linePos(issue.pos[0]);throw Error(`Invalid YAML configuration at line ${position.line}, column ${position.col}. Check indentation, quoting and duplicate keys.`);}
  if(doc.directives.yaml.explicit||(Object.keys(doc.directives.tags).some(key=>key!=='!!')||doc.directives.tags['!!']!=='tag:yaml.org,2002:'))throw Error('YAML directives are not supported. Use plain YAML 1.2 configuration.');
  let count=0;
  visit(doc,(_key,node,path)=>{
   if(++count>50000||path.length>64)throw Error('Keep configuration within 50,000 nodes and 64 nesting levels.');
   if(isAlias(node)||node&&typeof node==='object'&&('tag' in node&&node.tag||'anchor' in node&&node.anchor))throw Error('YAML tags, anchors and aliases are not supported. Write explicit configuration values.');
   if(isPair(node)&&(!isScalar(node.key)||typeof node.key.value!=='string'||node.key.value==='<<'))throw Error('YAML mapping keys must be text; merge keys are not supported.');
   if(isScalar(node)&&typeof node.value==='number'&&!Number.isFinite(node.value))throw Error('YAML numbers must be finite JSON-compatible values.');
  });
  return doc.toJS({maxAliasCount:0});
 }catch(error){
  // No excerpts or parser-generated messages: configuration can contain private notes.
  if(error instanceof Error&&/^(?:Invalid YAML configuration at line|YAML |Keep configuration)/u.test(error.message))throw error;
  throw Error('Invalid YAML configuration. Use one mapping with plain JSON-compatible values.');
 }
}

export function formatConfigYaml(value:unknown):string {
 return stringify(value,{schema:'core',version:'1.2',aliasDuplicateObjects:false,lineWidth:100});
}
