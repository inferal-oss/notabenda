// @requirements REQ-PRODUCT-AUTHORED-PREVIEW
/** Deterministic stored ZIP, UTF-8 names, no ZIP64, extraction or executable file attributes. */
export function publicReleaseZip(files:Record<string,string>):Buffer {
 const names=Object.keys(files).sort();if(!names.length||names.length>16)throw Error('Unsupported public release file count.');
 const records:Buffer[]=[],central:Buffer[]=[];let offset=0,total=0;
 const crc32=(bytes:Buffer)=>{let c=0xffffffff;for(const b of bytes){c^=b;for(let i=0;i<8;i++)c=c&1?(c>>>1)^0xedb88320:c>>>1;}return (c^0xffffffff)>>>0;};
 for(const name of names){
  if(name.length>250||!name.split('/').every(p=>p&&!p.startsWith('.')&&!p.endsWith('.')&&!/^(?:CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)/iu.test(p))||!/^[A-Za-z0-9_./-]+$/u.test(name))throw Error('Unsupported public release path.');
  const path=Buffer.from(name),bytes=Buffer.from(files[name]!);total+=bytes.length;if(total>1024*1024)throw Error('The public release exceeds the preview export budget.');
  const crc=crc32(bytes),header=Buffer.alloc(30);header.writeUInt32LE(0x04034b50);header.writeUInt16LE(20,4);header.writeUInt16LE(0x800,6);header.writeUInt16LE(33,12);header.writeUInt32LE(crc,14);header.writeUInt32LE(bytes.length,18);header.writeUInt32LE(bytes.length,22);header.writeUInt16LE(path.length,26);records.push(header,path,bytes);
  const entry=Buffer.alloc(46);entry.writeUInt32LE(0x02014b50);entry.writeUInt16LE(20,4);entry.writeUInt16LE(20,6);entry.writeUInt16LE(0x800,8);entry.writeUInt16LE(33,14);entry.writeUInt32LE(crc,16);entry.writeUInt32LE(bytes.length,20);entry.writeUInt32LE(bytes.length,24);entry.writeUInt16LE(path.length,28);entry.writeUInt32LE(offset,42);central.push(entry,path);offset+=header.length+path.length+bytes.length;
 }
 const directory=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(names.length,8);end.writeUInt16LE(names.length,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);return Buffer.concat([...records,directory,end]);
}
