/** @requirements REQ-PRODUCT-SETUP REQ-PRODUCT-SERVICE-CATALOG REQ-PRODUCT-SERVICE-DETECTION REQ-PRODUCT-DISCOVERY */
import {open,lstat} from 'node:fs/promises';
import {constants} from 'node:fs';
import {resolve} from 'node:path';
/** Explicit ordinary UTF-8 JSON only. Nonblocking open also closes a regular-to-FIFO replacement window. */
export async function readCliJson(path:string,max:number,message:string):Promise<unknown>{
 try{
  const file=resolve(path),before=await lstat(file);if(!before.isFile()||before.size>max)throw Error();
  const handle=await open(file,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);
  try{
   const stat=await handle.stat();if(!stat.isFile()||stat.size>max)throw Error();
   const chunks:Buffer[]=[];let size=0;
   for await(const chunk of handle.createReadStream()){size+=chunk.length;if(size>max)throw Error();chunks.push(chunk as Buffer);}
   return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks)));
  }finally{await handle.close();}
 }catch{throw Error(message);}
}
