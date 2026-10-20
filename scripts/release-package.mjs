// @requirements REQ-PRODUCT-RELEASE-CANDIDATE
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {posix} from 'node:path';
const MAX_ARCHIVE=32*1024*1024,MAX_EXPANDED=64*1024*1024,MAX_FILE=16*1024*1024,MAX_FILES=5000;
export class PackageCheckError extends Error {constructor(code,path){super(code);this.name='PackageCheckError';this.code=code;if(typeof path==='string'&&path.length<512&&!path.startsWith('/')&&/^[A-Za-z0-9@._/-]+$/u.test(path))this.path=path;}}
const fail=(code,path)=>{throw new PackageCheckError(code,path);};
/** Exact SemVer only: no range, tag, URL or local dependency resolution. */
export function isPinnedVersion(value){
 if(typeof value!=='string'||value.length>120)return false;
 const match=/^(\d+)\.(\d+)\.(\d+)(?:-([A-Za-z0-9.-]+))?(?:\+([A-Za-z0-9.-]+))?$/u.exec(value);if(!match||match.slice(1,4).some(n=>!/^(?:0|[1-9]\d*)$/u.test(n)))return false;
 const identifiers=text=>text.split('.').every(s=>/^[A-Za-z0-9-]+$/u.test(s));
 return (!match[4]||identifiers(match[4])&&match[4].split('.').every(s=>!/^\d+$/u.test(s)||/^(?:0|[1-9]\d*)$/u.test(s)))&&(!match[5]||identifiers(match[5]));
}
const canonical=v=>v&&typeof v==='object'?Array.isArray(v)?'['+v.map(canonical).join(',')+']':'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}':JSON.stringify(v);
export const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
const safePath=p=>typeof p==='string'&&p.length>0&&p.length<512&&/^[A-Za-z0-9@._/-]+$/u.test(p)&&p.split('/').every(s=>s&&s!=='.'&&s!=='..')&&!p.startsWith('/');
const forbidden=p=>p.split('/').some(s=>s.startsWith('.')||['node_modules','test','tests','.local','.git'].includes(s))||/(?:\.private\.|\.(?:pem|key)$|(?:^|\/)setup\.private\.json$)/u.test(p);
const string=bytes=>{const end=bytes.indexOf(0),body=end<0?bytes:bytes.subarray(0,end);if(end>=0&&bytes.subarray(end).some(b=>b!==0))return fail('invalid-tar-string');return body.toString('utf8');};
function octal(bytes){const text=bytes.toString('ascii').replace(/[\0 ]+$/u,'').trim();if(!/^[0-7]+$/u.test(text))return fail('invalid-tar-number');const value=parseInt(text,8);if(!Number.isSafeInteger(value))return fail('invalid-tar-number');return value;}
/** Strict npm ustar subset. Never extracts, follows links or executes archive content. */
export function readPackageArchive(compressed){
 if(!Buffer.isBuffer(compressed)||!compressed.length||compressed.length>MAX_ARCHIVE)return fail('archive-size');
 if(compressed.length<18||compressed[0]!==31||compressed[1]!==139||compressed[2]!==8||compressed[3]!==0)return fail('unsupported-gzip-header');
 let tar;try{tar=gunzipSync(compressed,{maxOutputLength:MAX_EXPANDED});}catch{return fail('invalid-gzip');}
 if(tar.length<1024||tar.length%512)return fail('invalid-tar-length');
 const files=new Map(),seen=new Set();let offset=0,ended=false,total=0;
 while(offset<tar.length){
  const header=tar.subarray(offset,offset+512);
  if(header.every(b=>b===0)){if(tar.length-offset<1024||tar.subarray(offset).some(b=>b!==0))return fail('invalid-tar-trailer');ended=true;break;}
  const checksum=octal(header.subarray(148,156));let sum=0;for(let i=0;i<512;i++)sum+=i>=148&&i<156?32:header[i];if(checksum!==sum)return fail('invalid-tar-checksum');
  if(header.subarray(257,262).toString('ascii')!=='ustar')return fail('unsupported-tar-format');
  if(header.subarray(108,116).some(b=>b!==0)&&octal(header.subarray(108,116))!==0||header.subarray(116,124).some(b=>b!==0)&&octal(header.subarray(116,124))!==0||string(header.subarray(265,297))||string(header.subarray(297,329)))return fail('unsupported-tar-owner');
  const name=string(header.subarray(0,100)),prefix=string(header.subarray(345,500)),type=header[156],size=octal(header.subarray(124,136)),mode=octal(header.subarray(100,108));
  let path=(prefix?prefix+'/':'')+name;if(type===53&&path.endsWith('/'))path=path.slice(0,-1);
  if(!safePath(path)||path!=='package'&&!path.startsWith('package/'))return fail('unsafe-tar-path');if(seen.has(path)||seen.size>=MAX_FILES)return fail('duplicate-or-excessive-files');seen.add(path);if(path!=='package'&&forbidden(path.slice(8)))return fail('private-or-unsupported-path');
  if(![0,48,53].includes(type)||string(header.subarray(157,257))||mode&0o7000)return fail('unsupported-tar-entry');
  if(size>MAX_FILE||type===53&&size!==0)return fail('file-size');offset+=512;const end=offset+size,padded=offset+Math.ceil(size/512)*512;if(end>tar.length||padded>tar.length)return fail('truncated-tar-entry');
  if(tar.subarray(end,padded).some(b=>b!==0))return fail('invalid-tar-padding');
  if(type!==53){const relative=path.slice('package/'.length);if(!relative||forbidden(relative))return fail('private-or-unsupported-path');files.set(relative,{data:tar.subarray(offset,end),mode});total+=size;}
  offset=padded;
 }
 if(!ended||!files.size)return fail('invalid-tar-trailer');return {files,unpackedBytes:total};
}
function exportFiles(value,files,targets=new Set()){
 if(value===null)return targets;
 if(typeof value==='string'){
  if(!value.startsWith('./')||!safePath(value.slice(2).replace('*','star'))||(value.match(/\*/gu)?.length??0)>1)return fail('unsafe-export');
  const target=value.slice(2);if(target.includes('*')){const [before,after]=target.split('*'),matches=[...files.keys()].filter(p=>p.startsWith(before)&&p.endsWith(after)&&p.length>before.length+after.length);if(!matches.length)return fail('missing-export');for(const p of matches)targets.add(p);}
  else{if(!files.has(target))return fail('missing-export',target);targets.add(target);}return targets;
 }
 if(!value||typeof value!=='object'||Array.isArray(value))return fail('invalid-exports');for(const item of Object.values(value))exportFiles(item,files,targets);return targets;
}
/** expected paths derive from maintained source/build inputs, never the archive's own files declaration. */
export function checkPackageArchive(compressed,{name,version,allowedFiles,sourceMaps=new Map(),license,metadata:expectedMetadata,requiredFiles=[],requiredContents=new Map()}){
 const {files,unpackedBytes}=readPackageArchive(compressed);for(const p of files.keys())if(!allowedFiles.has(p))return fail('unexpected-package-file',p);
 for(const p of ['package.json','LICENSE','README.md',...requiredFiles])if(!files.has(p))return fail('missing-package-file',p);
 for(const [path,bytes] of requiredContents)if(!files.get(path)?.data.equals(bytes))return fail('required-content-mismatch',path);
 let metadata;try{metadata=JSON.parse(files.get('package.json').data.toString('utf8'));}catch{return fail('invalid-package-json');}
 if(expectedMetadata&&canonical(metadata)!==canonical(expectedMetadata))return fail('package-metadata-mismatch');
 if(metadata.name!==name||metadata.version!==version||metadata.license!=='Apache-2.0'||metadata.type!=='module'||metadata.private===true)return fail('package-identity');
 if(!files.get('LICENSE').data.equals(license)||!license.toString('utf8').includes('Apache License'))return fail('license-mismatch');
 if(['preinstall','install','postinstall','prepare'].some(key=>metadata.scripts?.[key]!==undefined))return fail('consumer-lifecycle-script');
 if(Object.keys(metadata.optionalDependencies??{}).length||metadata.bundledDependencies?.length||metadata.bundleDependencies?.length)return fail('unsupported-dependency-class');
 const dependencies=metadata.dependencies??{};if(!dependencies||typeof dependencies!=='object'||Array.isArray(dependencies))return fail('invalid-dependencies');
 if(name!=='@notabenda/authoring'&&Object.keys(dependencies).length)return fail('unexpected-runtime-dependency');
 if(Object.values(dependencies).some(v=>!isPinnedVersion(v))||name==='@notabenda/authoring'&&dependencies['@notabenda/core']!==version)return fail('unpinned-dependency');
 const targets=exportFiles(metadata.exports,files),bins=new Set();for(const value of Object.values(metadata.bin??{})){if(typeof value!=='string'||!value.startsWith('./')||!safePath(value.slice(2))||!files.has(value.slice(2)))return fail('missing-bin');bins.add(value.slice(2));}
 if(name==='@notabenda/core'&&(metadata.peerDependenciesMeta?.react?.optional!==true||metadata.peerDependenciesMeta?.astro?.optional!==true))return fail('mandatory-framework-peer');
 for(const [path,file] of files){
  if(file.mode&0o022)return fail('writable-package-file');
  if(file.mode&0o111&&!bins.has(path))return fail('unexpected-executable');
  if(path.endsWith('.map')){let map;try{map=JSON.parse(file.data.toString('utf8'));}catch{return fail('invalid-source-map');}const source=sourceMaps.get(path);if(!source||map.version!==3||map.file!==posix.basename(path.slice(0,-4))||Object.keys(map).some(key=>!['version','file','sources','sourceRoot','names','mappings'].includes(key))||!Array.isArray(map.names)||map.names.some(name=>typeof name!=='string')||typeof map.mappings!=='string'||map.sourceRoot!==undefined&&map.sourceRoot!==''||map.sourcesContent!==undefined||!Array.isArray(map.sources)||map.sources.length!==1||typeof map.sources[0]!=='string'||map.sources[0]!==posix.relative(posix.dirname(path),source)||posix.isAbsolute(map.sources[0])||map.sources[0].includes('\\'))return fail('unsafe-source-map',path);}
 }
 return {name,version,license:metadata.license,tarballBytes:compressed.length,unpackedBytes,sha256:sha256(compressed),integrity:'sha512-'+createHash('sha512').update(compressed).digest('base64'),exportTargets:targets.size,binTargets:bins.size,directDependencies:dependencies,files:[...files].map(([path,file])=>({path,bytes:file.data.length,sha256:sha256(file.data)})).sort((a,b)=>a.path.localeCompare(b.path))};
}
