import {readFile,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';

globalThis.window=globalThis;
await import('../js/local-images.js');

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const entries=Object.entries(US_COIN_LOCAL_IMAGES||{});
const failures=[];

const isImage=buffer=>
  (buffer[0]===0xff&&buffer[1]===0xd8&&buffer[2]===0xff)||
  buffer.subarray(0,8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]))||
  (buffer.subarray(0,4).toString()==='RIFF'&&buffer.subarray(8,12).toString()==='WEBP');

for(const [source,local] of entries){
  const path=resolve(root,local);
  try{
    const info=await stat(path);
    const bytes=await readFile(path);
    if(!info.isFile()||info.size<256||!isImage(bytes))failures.push({source,local,error:'not a valid image file'});
  }catch(error){
    failures.push({source,local,error:error.code||error.message});
  }
}

const localPaths=entries.map(([,local])=>local);
const duplicates=localPaths.length-new Set(localPaths).size;
console.log(JSON.stringify({mappedSources:entries.length,localFiles:new Set(localPaths).size,duplicates,passed:entries.length-failures.length,failed:failures.length,failures},null,2));
process.exitCode=failures.length?1:0;
