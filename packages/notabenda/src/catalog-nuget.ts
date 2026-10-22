// @requirements REQ-PRODUCT-SERVICE-DETECTION REQ-PRODUCT-SERVICE-CATALOG
import {SaxesParser} from 'saxes';
import {isNugetPackageName} from './catalog-nuget-policy.js';
type Context='dependency'|'conditional-dependency'|'package-update'|'central-package-version'|'global-package-reference'|'legacy-package-entry';
export interface NugetIdentifiers {identifiers:{identifier:string;context:Context}[];limited:boolean}
/** Static XML declarations only. No DTD/entities, MSBuild evaluation, imports, restore or remote access. */
export function nugetIdentifiers(source:string,kind:'project'|'central'|'build'|'legacy'):NugetIdentifiers{
 const identifiers:NugetIdentifiers['identifiers']=[];let limited=kind==='central'||kind==='build',nodes=0,attributes=0;
 if(Buffer.byteLength(source)>262144)return {identifiers,limited:true};
 const stack:{name:string;uri:string;understood:boolean;conditional:boolean;eligible:boolean}[]=[],parser=new SaxesParser({xmlns:true});
 const namespaces=new Set(['','http://schemas.microsoft.com/developer/msbuild/2003']);
 try{
  parser.on('error',()=>{throw Error();});parser.on('doctype',()=>{throw Error();});
  parser.on('xmldecl',decl=>{if(decl.version!=='1.0'||decl.encoding&&!/^utf-?8$/iu.test(decl.encoding))throw Error();});
  parser.on('processinginstruction',()=>{limited=true;});
  parser.on('opentag',tag=>{
   if(++nodes>10000||stack.length>=32)throw Error();
   const parent=stack.at(-1),root=stack[0],attrs:Record<string,string>=Object.create(null);
   for(const attr of Object.values(tag.attributes)){if(++attributes>20000)throw Error();if(attr.uri==='')attrs[attr.local]=attr.value;}
   if(!parent&&(tag.local!==(kind==='legacy'?'packages':'Project')||!namespaces.has(tag.uri)||kind==='legacy'&&tag.uri!==''))throw Error();
   const understood=(!parent||parent.understood)&&tag.uri===(root?.uri??tag.uri),conditional=!!parent?.conditional||Object.hasOwn(attrs,'Condition')||['Choose','When','Otherwise','Target'].includes(tag.local);
   const containers:Record<string,string[]>= {ItemGroup:['Project','When','Otherwise','Target'],Choose:['Project','When','Otherwise','Target'],When:['Choose'],Otherwise:['Choose'],Target:['Project']};
   const eligible=!parent||parent.eligible&&(containers[tag.local]?.includes(parent.name)??false);
   stack.push({name:tag.local,uri:tag.uri,understood,conditional,eligible});
   if(!understood){limited=true;return;}if(conditional||attrs.Sdk!==undefined)limited=true;
   if(['Import','ImportGroup','ProjectReference','UsingTask','Target','Sdk','RestoreSources','RestoreAdditionalProjectSources','RestoreConfigFile','RestoreFallbackFolders','RestoreAdditionalProjectFallbackFolders','ManagePackageVersionsCentrally','CentralPackageTransitivePinningEnabled','CentralPackageVersionOverrideEnabled'].includes(tag.local))limited=true;
   if(kind==='legacy'){
    if(tag.local==='package'&&parent?.name==='packages'&&stack.length===2){
     const id=attrs.id?.toLowerCase();if(!isNugetPackageName(id)||!attrs.version){limited=true;return;}if(attrs.developmentDependency!==undefined||attrs.targetFramework!==undefined)limited=true;
     identifiers.push({identifier:id,context:'legacy-package-entry'});
    }else if(parent)limited=true;
    return;
   }
   if(!['PackageReference','PackageVersion','GlobalPackageReference'].includes(tag.local))return;
   if(parent?.name!=='ItemGroup'||!parent.eligible){limited=true;return;}
   const include=attrs.Include,update=attrs.Update,remove=attrs.Remove;
   if(remove!==undefined||include!==undefined&&update!==undefined||include===undefined&&update===undefined){limited=true;return;}
   let context:Context;
   if(tag.local==='PackageVersion'){context='central-package-version';limited=true;}
   else if(tag.local==='GlobalPackageReference'){context='global-package-reference';limited=true;}
   else if(update!==undefined){context='package-update';limited=true;}
   else context=conditional?'conditional-dependency':'dependency';
   if(attrs.Exclude!==undefined||attrs.IsImplicitlyDefined!==undefined)limited=true;
   for(const part of (include??update)!.split(';')){const identifier=part.trim().toLowerCase();if(!isNugetPackageName(identifier)){limited=true;continue;}if(identifiers.length>=10000)throw Error();identifiers.push({identifier,context});}
  });
  parser.on('closetag',()=>{stack.pop();});
  parser.write(source).close();
 }catch{return {identifiers:[],limited:true};}
 return {identifiers,limited};
}
