/** @requirements REQ-EU-GUARANTEE-LABEL
 * Build-only supported image subset. Reject unsupported files; never sanitize or re-encode producer art.
 */
import {inflateSync} from 'node:zlib';
import {verifyLabelClipGraph} from './guarantee-label-clips.js';
import type {LabelClipReference} from './guarantee-label-clips.js';
import {PNG} from 'pngjs';
import {decode} from 'jpeg-js';
import {DOMParser} from '@xmldom/xmldom';
import type {Element as XmlElement,Node as XmlNode} from '@xmldom/xmldom';
export interface LabelImage {mediaType:'image/png'|'image/jpeg'|'image/svg+xml';extension:'png'|'jpg'|'svg';width:number;height:number}
function bad(reason:string):never {throw Error('Unsupported producer label asset: '+reason+'. Export a finished static colour PNG, JPEG or supported outlined SVG without private metadata.');}
function dimensions(width:number,height:number){if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0||width>4096||height>4096||width*height>8000000)bad('dimensions exceed the supported 4096px / 8 megapixel limits');return {width,height};}
const crcTable=Array.from({length:256},(_,n)=>{let c=n;for(let i=0;i<8;i++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
function crc32(bytes:Uint8Array){let c=0xffffffff;for(const byte of bytes)c=crcTable[(c^byte)&255]!^(c>>>8);return (c^0xffffffff)>>>0;}
const pngSignature=Buffer.from([137,80,78,71,13,10,26,10]);
function png(bytes:Buffer,embedded=false):LabelImage {
 if(bytes.length<33||!bytes.subarray(0,8).equals(pngSignature))bad('invalid PNG signature');
 let offset=8,chunks=0,width=0,height=0,depth=0,color=0,seenData=false,endedData=false,ended=false;const seen=new Set<string>(),data:Buffer[]=[];
 while(offset<bytes.length){if(++chunks>4096||offset+12>bytes.length)bad('invalid PNG chunk bounds');const length=bytes.readUInt32BE(offset),type=bytes.toString('ascii',offset+4,offset+8);if(length>2097152||offset+12+length>bytes.length)bad('invalid PNG chunk length');const body=bytes.subarray(offset+8,offset+8+length);if(crc32(bytes.subarray(offset+4,offset+8+length))!==bytes.readUInt32BE(offset+8+length))bad('PNG chunk checksum mismatch');
  if(!/^[A-Za-z]{4}$/u.test(type)||!['IHDR','IDAT','IEND','PLTE','tRNS','sRGB','gAMA','cHRM','pHYs'].includes(type))bad('PNG animation, metadata, colour profiles or unsupported chunks');
  if(chunks===1&&type!=='IHDR'||type!=='IDAT'&&seen.has(type))bad('invalid PNG chunk order');
  if(type==='IHDR'){if(length!==13||chunks!==1)bad('invalid PNG header');width=body.readUInt32BE(0);height=body.readUInt32BE(4);dimensions(width,height);depth=body[8]!;color=body[9]!;if(![1,2,4,8,16].includes(depth)||![2,3,6,...(embedded?[0,4]:[])].includes(color)||color!==3&&color!==0&&depth<8||body[10]!==0||body[11]!==0||body[12]!==0)bad('PNG must be static non-interlaced colour');}
  else if(type==='IDAT'){if(endedData)bad('noncontiguous PNG image data');seenData=true;data.push(body);}
  else if(type==='IEND'){if(length!==0||!seenData||offset+12!==bytes.length)bad('incomplete or trailing PNG data');ended=true;}
  else {if(seenData){endedData=true;if(type!=='pHYs')bad('PNG chunk after image data');}if(type==='sRGB'&&(length!==1||body[0]!>3)||type==='gAMA'&&(length!==4||body.readUInt32BE(0)===0)||type==='cHRM'&&length!==32||type==='pHYs'&&(length!==9||body[8]!>1))bad('invalid PNG colour or density chunk');}
  seen.add(type);offset+=length+12;
 }
 if(!ended)bad('truncated PNG');
 // Check the entire bounded decompressed stream before pngjs (which otherwise permits overlong scan data).
 const channels=color===0||color===3?1:color===2?3:color===4?2:4,row=1+Math.ceil(width*channels*depth/8),expected=row*height,compressed=Buffer.concat(data);
 const inflated=inflateSync(compressed,{maxOutputLength:expected,info:true}) as unknown as {buffer:Buffer;engine:{bytesWritten:number}};if(inflated.buffer.length!==expected||inflated.engine.bytesWritten!==compressed.length)bad('invalid PNG compressed stream');
 const decoded=PNG.sync.read(bytes,{checkCRC:true});if(decoded.width!==width||decoded.height!==height||decoded.data.length!==width*height*4)bad('PNG decode mismatch');
 return {mediaType:'image/png',extension:'png',width,height};
}
function jpeg(bytes:Buffer):LabelImage {
 let pos=2,width=0,height=0,frames=0,scans=0,segments=0,ended=false;
 while(pos<bytes.length){if(++segments>4096||bytes[pos++]!==255)bad('invalid JPEG marker');while(bytes[pos]===255)pos++;const marker=bytes[pos++];if(marker===217){if(pos!==bytes.length||frames!==1||!scans)bad('incomplete or trailing JPEG data');ended=true;break;}
  if(marker===undefined||marker===216||marker===0||marker>=208&&marker<=215||pos+2>bytes.length)bad('invalid JPEG structure');
  const length=bytes.readUInt16BE(pos);if(length<2||pos+length>bytes.length)bad('truncated JPEG segment');const body=bytes.subarray(pos+2,pos+length);pos+=length;
  if(marker===224){if(body.length!==14||body.toString('ascii',0,5)!=='JFIF\0'||body[12]!==0||body[13]!==0)bad('JPEG must omit thumbnails and application metadata');}
  else if(marker===238){if(body.length!==12||body.toString('ascii',0,5)!=='Adobe'||! [0,1].includes(body[11]!))bad('unsupported JPEG colour transform');}
  else if([192,193,194].includes(marker)){if(++frames!==1||body.length!==15||body[0]!==8||body[5]!==3)bad('JPEG must contain one 8-bit three-component frame');height=body.readUInt16BE(1);width=body.readUInt16BE(3);dimensions(width,height);}
  else if(marker===218){if(!frames||++scans>128)bad('invalid JPEG scan');let found=false;while(pos<bytes.length){if(bytes[pos++]!==255)continue;const start=pos-1;while(bytes[pos]===255)pos++;const next=bytes[pos];if(next===0||next!==undefined&&next>=208&&next<=215){pos++;continue;}pos=start;found=true;break;}if(!found)bad('truncated JPEG scan');}
  else if(![196,219,221].includes(marker))bad('JPEG metadata or unsupported segment');
 }
 if(!ended)bad('truncated JPEG');
 const decoded=decode(bytes,{useTArray:true,tolerantDecoding:false,maxResolutionInMP:8,maxMemoryUsageInMB:128});if(decoded.width!==width||decoded.height!==height||decoded.data.length!==width*height*4)bad('JPEG decode mismatch');
 return {mediaType:'image/jpeg',extension:'jpg',width,height};
}
const number='[+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:[eE][+-]?\\d+)?';
const scalar=new RegExp('^'+number+'$','u'),numbers=new RegExp('^'+number+'(?:[ ,]+'+number+')*$','u');
const geometry=new Set(['path','rect','circle','ellipse','line','polyline','polygon']);
const common=new Set(['id','class','fill','stroke','stroke-width','stroke-linecap','stroke-linejoin','stroke-miterlimit','fill-rule','clip-rule','opacity','fill-opacity','stroke-opacity','transform','clip-path']);
const tagAttributes:Record<string,string[]>={svg:['viewBox','width','height','version'],g:[],defs:[],clipPath:['clipPathUnits'],path:['d'],rect:['x','y','width','height','rx','ry'],circle:['cx','cy','r'],ellipse:['cx','cy','rx','ry'],line:['x1','y1','x2','y2'],polyline:['points'],polygon:['points'],image:['x','y','width','height','href','preserveAspectRatio'],style:['type']};
function svg(bytes:Buffer):LabelImage {
 let source:string;try{source=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{return bad('SVG must be UTF-8');}
 if(/<!DOCTYPE|<!ENTITY/iu.test(source)||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(source))bad('SVG declarations or control characters');
 const document=new DOMParser({onError:()=>bad('malformed XML')}).parseFromString(source,'image/svg+xml'),root=document.documentElement;
 if(!root||root.tagName!=='svg'||root.namespaceURI!=='http://www.w3.org/2000/svg')bad('invalid SVG root');
 const viewBox=root.getAttribute('viewBox')??'';if(!numbers.test(viewBox.trim()))bad('SVG needs a numeric viewBox');const box=viewBox.trim().split(/[ ,]+/u).map(Number);if(box.length!==4||box.some(x=>!Number.isFinite(x))||box[0]!==0||box[1]!==0)bad('SVG viewBox must begin at 0 0');const size=dimensions(box[2]!,box[3]!);
 let nodes=0,pathBytes=0,embeddedBytes=0,embeddedPixels=0,embeddedCount=0,cssBytes=0,cssRules=0,cssSelectors=0,cssDeclarations=0,clipAssociations=0,clipAttempts=0;const ids=new Map<string,string>(),clipCosts=new Map<string,number>(),references:LabelClipReference[]=[],styleTargets=new Set<string>(),classClips=new Map<string,Set<string>>(),classes=new Set<string>(),classUsers:{names:string[];owner:string|undefined}[]=[];
 function reference(owner:string|undefined,target:string){if(references.length>=2048)bad('SVG clip reference limit');references.push({owner,target});}
 function property(name:string,value:string):string|undefined {
  if(name==='fill'||name==='stroke'){if(!/^(?:none|black|white|#[a-fA-F0-9]{3}|#[a-fA-F0-9]{6})$/u.test(value))bad('unsupported SVG paint');}
  else if(['stroke-width','stroke-miterlimit','opacity','fill-opacity','stroke-opacity'].includes(name)){if(!scalar.test(value)||!Number.isFinite(Number(value))||Number(value)<0||Number(value)>10000)bad('invalid SVG numeric style');}
  else if(name==='stroke-linecap'){if(!['butt','round','square'].includes(value))bad('invalid SVG line cap');}
  else if(name==='stroke-linejoin'){if(!['miter','round','bevel'].includes(value))bad('invalid SVG line join');}
  else if(name==='fill-rule'||name==='clip-rule'){if(!['nonzero','evenodd'].includes(value))bad('invalid SVG fill rule');}
  else if(name==='clip-path'){const match=/^url\(#([a-zA-Z_][a-zA-Z0-9_.-]{0,119})\)$/u.exec(value);if(!match)bad('unsupported SVG clip reference');return match[1]!;}
  else bad('unsupported SVG style property');
 }
 function visit(n:XmlNode,depth:number,clipOwner?:string):void {
  if(++nodes>20000||depth>32)bad('SVG tree limit');
  if(n.nodeType===3){if(n.nodeValue?.trim())bad('SVG live text must be outlined');return;}
  if(n.nodeType===7){if(n.parentNode!==document||n.nodeName!=='xml')bad('SVG processing instruction');return;}
  if(n.nodeType!==1)bad('SVG comments, metadata or unsupported nodes');
  const el=n as XmlElement,tag=el.tagName;if(el.namespaceURI!=='http://www.w3.org/2000/svg'||!Object.hasOwn(tagAttributes,tag)||tag==='svg'&&el!==root||clipOwner!==undefined&&tag!=='g'&&!geometry.has(tag))bad('SVG contains live text, external resources or unsupported elements');
  if(tag==='clipPath'){const id=el.getAttribute('id');if(!id||!/^[a-zA-Z_][a-zA-Z0-9_.-]{0,119}$/u.test(id))bad('clip definitions need a bounded ID');clipOwner=id;clipCosts.set(id,0);}
  if(clipOwner!==undefined)clipCosts.set(clipOwner,(clipCosts.get(clipOwner)??0)+1);
  for(let index=0;index<el.attributes.length;index++){const attr=el.attributes.item(index)!,name=attr.localName??attr.name,value=attr.value;if(attr.namespaceURI==='http://www.w3.org/2000/xmlns/'){if(el!==root||!['xmlns','xmlns:xlink'].includes(attr.name)||attr.value!==(attr.name==='xmlns'?'http://www.w3.org/2000/svg':'http://www.w3.org/1999/xlink'))bad('unsupported SVG namespace');continue;}
   if(attr.namespaceURI&&!(attr.namespaceURI==='http://www.w3.org/1999/xlink'&&tag==='image'&&name==='href')||!common.has(name)&&!tagAttributes[tag]!.includes(name)||value.length>500000)bad('unsupported SVG attribute');
   if(name==='id'){if(!/^[a-zA-Z_][a-zA-Z0-9_.-]{0,119}$/u.test(value)||ids.has(value))bad('duplicate or invalid SVG ID');ids.set(value,tag);}
   else if(name==='class'){if(value.length>1024||!/^[a-zA-Z_][a-zA-Z0-9_-]*(?:\s+[a-zA-Z_][a-zA-Z0-9_-]*)*$/u.test(value))bad('invalid SVG class');classUsers.push({names:value.split(/\s+/u),owner:clipOwner});}
   else if(name==='transform'){
    if(value.length>4000)bad('SVG transform bounds');const pattern=/\s*(matrix|translate|scale|rotate|skewX|skewY)\(([+\-0-9.eE, ]+)\)\s*/gy;let offset=0,count=0;
    while(offset<value.length){pattern.lastIndex=offset;const match=pattern.exec(value);if(!match||++count>16||!numbers.test(match[2]!.trim()))bad('unsupported SVG transform');const values=match[2]!.trim().split(/[ ,]+/u).map(Number),arity:Record<string,number[]>={matrix:[6],translate:[1,2],scale:[1,2],rotate:[1,3],skewX:[1],skewY:[1]};
     if(!arity[match[1]!]!.includes(values.length)||values.some(x=>!Number.isFinite(x)||Math.abs(x)>1000000))bad('SVG transform bounds');offset=pattern.lastIndex;
    }if(!count)bad('empty SVG transform');
   }
   else if(common.has(name)){const target=property(name,value);if(target)reference(clipOwner,target);}
   else if(name==='viewBox'){/* checked above */}
   else if(name==='d'){if(clipOwner!==undefined)clipCosts.set(clipOwner,clipCosts.get(clipOwner)!+Math.ceil(value.length/64));pathBytes+=value.length;if(pathBytes>1000000||!value||!/^[MmZzLlHhVvCcSsQqTtAa0-9eE.,+\-\s]+$/u.test(value))bad('SVG path data limit or syntax');}
   else if(name==='points'){if(clipOwner!==undefined)clipCosts.set(clipOwner,clipCosts.get(clipOwner)!+Math.ceil(value.length/64));if(!numbers.test(value.trim()))bad('invalid SVG points');}
   else if(name==='href'){if(el.hasAttribute('href')&&el.hasAttribute('xlink:href'))bad('duplicate SVG image source');const match=/^data:image\/png;base64,([A-Za-z0-9+/]+={0,2})$/u.exec(value);if(!match)bad('SVG images must be inline metadata-free PNG');const embedded=Buffer.from(match[1]!,'base64');embeddedBytes+=embedded.length;if(embedded.toString('base64')!==match[1]||embeddedBytes>524288||++embeddedCount>16||embedded.length<33||!embedded.subarray(0,8).equals(pngSignature))bad('SVG embedded image limit');const imageSize=dimensions(embedded.readUInt32BE(16),embedded.readUInt32BE(20));embeddedPixels+=imageSize.width*imageSize.height;if(embeddedPixels>8000000)bad('SVG aggregate embedded pixel limit');png(embedded,true);}
   else if(name==='preserveAspectRatio'){if(!['xMidYMid meet','none'].includes(value))bad('unsupported SVG image scaling');}
   else if(name==='clipPathUnits'){if(value!=='userSpaceOnUse')bad('unsupported SVG clip units');}
   else if(name==='version'){if(value!=='1.1'&&value!=='2.0')bad('unsupported SVG version');}
   else if(name==='type'){if(value!=='text/css')bad('unsupported SVG style type');}
   else {if(!scalar.test(value)||!Number.isFinite(Number(value))||Math.abs(Number(value))>1000000)bad('invalid SVG geometry');if(el===root&&(name==='width'||name==='height')&&Number(value)!==size[name])bad('SVG viewport must agree with viewBox');}
  }
  if(tag==='image'&&!el.hasAttribute('href')&&!el.hasAttribute('xlink:href'))bad('missing SVG image source');
  if(tag==='style'){
   for(let child=el.firstChild;child;child=child.nextSibling){if(++nodes>20000||![3,4].includes(child.nodeType))bad('SVG style contains non-text content');}
   if(clipOwner!==undefined)bad('SVG styles within clip');const css=el.textContent??'';cssBytes+=css.length;
   if(cssBytes>100000||/[^a-zA-Z0-9_.#{}:;,()\-\s]/u.test(css))bad('unsupported SVG stylesheet');
   // Cursor scanning is linear even for a long malformed suffix with no opening brace.
   let position=0;while(position<css.length){while(position<css.length&&/\s/u.test(css[position]!))position++;if(position===css.length)break;
    const open=css.indexOf('{',position),close=open<0?-1:css.indexOf('}',open+1);if(open<0||close<0||++cssRules>512)bad('malformed SVG stylesheet or rule limit');
    const selectors=css.slice(position,open),declarations=css.slice(open+1,close);if(/[{}]/u.test(selectors+declarations))bad('malformed SVG CSS rule');
    const ruleClasses=new Set<string>();for(const selector of selectors.split(',')){if(++cssSelectors>2048)bad('SVG CSS selector limit');const c=/^\.([a-zA-Z_][a-zA-Z0-9_-]{0,119})$/u.exec(selector.trim());if(!c)bad('SVG supports simple class selectors only');classes.add(c[1]!);ruleClasses.add(c[1]!);}
    for(const declaration of declarations.split(';')){if(!declaration.trim())continue;if(++cssDeclarations>2048)bad('SVG CSS declaration limit');const parts=declaration.split(':');if(parts.length!==2)bad('invalid SVG CSS declaration');const target=property(parts[0]!.trim(),parts[1]!.trim());if(target){styleTargets.add(target);for(const name of ruleClasses){if(++clipAttempts>8192)bad('SVG CSS clip expansion limit');if(!classClips.get(name)?.has(target)){if(++clipAssociations>2048)bad('SVG CSS clip association limit');if(!classClips.has(name))classClips.set(name,new Set());classClips.get(name)!.add(target);}}}}
    position=close+1;
   }return;
  }
  for(let child=el.firstChild;child;child=child.nextSibling)visit(child,depth+1,clipOwner);
 }
 for(let child=document.firstChild;child;child=child.nextSibling){if(child.nodeType===3&&!child.nodeValue?.trim())continue;visit(child,0);}
 for(const user of classUsers)for(const name of user.names){if(!classes.has(name))bad('unresolved SVG class');for(const target of classClips.get(name)??[])reference(user.owner,target);}
 verifyLabelClipGraph(ids,clipCosts,references,styleTargets);
 return {mediaType:'image/svg+xml',extension:'svg',...size};
}
/** Input must already be an owned copy. No fetching, filename inference, pixel edits or visual-conformity claim. */
export function inspectDurabilityGuaranteeImage(bytes:Uint8Array):LabelImage {
 if(!(bytes instanceof Uint8Array)||bytes.byteLength===0||bytes.byteLength>2097152)bad('file must contain 1–2097152 bytes');
 const buffer=Buffer.from(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 try{if(buffer.subarray(0,8).equals(pngSignature))return png(buffer);if(buffer[0]===255&&buffer[1]===216)return jpeg(buffer);return svg(buffer);}catch(error){if(error instanceof Error&&error.message.startsWith('Unsupported producer label asset:'))throw error;return bad('image could not be decoded within the supported limits');}
}
