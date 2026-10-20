// @requirements REQ-PRODUCT-AGENT-INTEGRATION REQ-PRODUCT-CONFIG
// Build-only, pinned TypeScript API. Unsupported types stop the build rather than
// silently widening a field to `{}`. No consumer project or config is read.
import {API,TypeFlags,SymbolFlags,SignatureKind} from 'typescript/unstable/sync';
import {fileURLToPath} from 'node:url';
import {readFile} from 'node:fs/promises';

export async function createConfigSchema(){
 const directory=fileURLToPath(new URL('../',import.meta.url));
 const metadata=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
 const api=new API({cwd:directory});
 try{
  const snapshot=api.updateSnapshot({openProjects:[directory+'tsconfig.json']});
  const project=snapshot.getProject(directory+'tsconfig.json');
  if(!project)throw Error('Configuration schema project is unavailable.');
  const checker=project.checker,file=project.program.getSourceFile(directory+'src/types.ts');
  const declaration=file?.statements.find(node=>node.name?.text==='SiteConfig');
  if(!declaration)throw Error('SiteConfig declaration is unavailable.');
  const root=checker.getTypeAtLocation(declaration),defs={},seen=new Map();let serial=0;
  const fail=type=>{throw Error('Unsupported configuration schema type: '+(type?checker.typeToString(type):'missing'));};
  function convert(type,path='SiteConfig',optional=false){
   if(!type||type.isErrorType()||type.flags&TypeFlags.Any)return fail(type);
   if(type.flags&TypeFlags.Unknown){if(!(path==='SiteConfig.private'||path.startsWith('SiteConfig.private.')))return fail(type);return {};} // private Record<string, unknown>, JSON values only
   if(type.flags&TypeFlags.StringLiteral||type.flags&TypeFlags.NumberLiteral||type.flags&TypeFlags.BooleanLiteral)return {const:type.value};
   if(type.flags&TypeFlags.String)return {type:'string'};
   if(type.flags&TypeFlags.Number)return {type:'number'};
   if(type.flags&TypeFlags.Boolean)return {type:'boolean'};
   if(type.flags&TypeFlags.Null)return {type:'null'};
   if(type.isUnionType()){
    if(!optional&&type.getTypes().some(t=>t.flags&TypeFlags.Undefined))return fail(type);
    const members=type.getTypes().filter(t=>!(t.flags&TypeFlags.Undefined));
    if(!members.length)return fail(type);
    const schemas=members.map(member=>convert(member,path));
    if(schemas.every(s=>Object.hasOwn(s,'const')))return {enum:schemas.map(s=>s.const)};
    return schemas.length===1?schemas[0]:{anyOf:schemas};
   }
   if(checker.isArrayType(type))return {type:'array',items:convert(checker.getTypeArguments(type)[0],path+'[]')};
   if(checker.isTupleType(type))return fail(type);
   if(!type.isObjectType()&&!type.isIntersectionType())return fail(type);
   if(checker.getSignaturesOfType(type,SignatureKind.Call).length||checker.getSignaturesOfType(type,SignatureKind.Construct).length)return fail(type);
   if(seen.has(type.id))return {$ref:'#/$defs/'+seen.get(type.id)};
   const symbolName=type.getAliasSymbol()?.name??type.getSymbol()?.name;
   const name=(symbolName&&!symbolName.startsWith('__')?symbolName:path).replace(/[^A-Za-z0-9_]/gu,'_')+'_'+(++serial);
   seen.set(type.id,name);
   const properties={},required=[];
   for(const symbol of checker.getPropertiesOfType(type)){
    const value=convert(checker.getTypeOfSymbol(symbol),path+'.'+symbol.name,!!(symbol.flags&SymbolFlags.Optional));
    const description=checker.getDocumentationCommentOfSymbol(symbol);
    properties[symbol.name]={...value,...(description?{description}:{})};
    if(!(symbol.flags&SymbolFlags.Optional))required.push(symbol.name);
   }
   const indexes=checker.getIndexInfosOfType(type);
   if(indexes.length>1||indexes.some(index=>!(index.keyType.flags&TypeFlags.String)))return fail(type);
   if(!Object.keys(properties).length&&!indexes.length)return fail(type);
   defs[name]={type:'object',properties,...(required.length?{required}:{}),additionalProperties:indexes.length?convert(indexes[0].valueType,path+'.*'):false};
   return {$ref:'#/$defs/'+name};
  }
  const shape=convert(root);
  return {$schema:'https://json-schema.org/draft/2020-12/schema',$id:`https://notabenda.org/schemas/${metadata.version}/site-config.schema.json`,
   title:'Notabenda SiteConfig',description:'Authoring shape generated from the installed SiteConfig type. Unknown fields are rejected to catch misspellings. No default values or legal decisions are supplied. Run notabenda check for cross-field, policy, URL, size and review rules.',
   'x-notabenda':{package:metadata.name,version:metadata.version,type:'SiteConfig',typeExport:'notabenda',kind:'authoring-shape',completeRuntimeValidation:false,validation:'notabenda check --config FILE --json',previewValidation:'notabenda check --config FILE --preview --json',requirementIds:['REQ-PRODUCT-AGENT-INTEGRATION','REQ-PRODUCT-CONFIG']},
   ...shape,$defs:defs};
 }finally{api.close();}
}
