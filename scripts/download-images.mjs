import {createHash} from 'node:crypto';
import {mkdir,writeFile,stat,unlink} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
globalThis.window=globalThis;
await import('../js/data.js');
await import('../js/image-map.js');
await import('../js/local-images.js');

const commons=file=>`https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(file)}?width=640`;
const tasks=[];
for(const coin of US_COINS){
  const fixed=US_COIN_IMAGE_MAP.map[US_COIN_IMAGE_MAP.key(coin.denomination,coin.year,coin.name)];
  for(const side of ['obverse','reverse']){
    const original=fixed?.[side]||(coin[`${side}File`]?commons(coin[`${side}File`]):'');
    if(!original)continue;
    const file=decodeURIComponent(new URL(original).pathname.split('/').pop());
    const downloads=[original];
    if(original.includes('usmint.gov/content/dam/'))downloads.push(commons(file));
    tasks.push({original,downloads,file});
  }
}
const matchAt=process.argv.indexOf('--match');
const match=matchAt>=0?process.argv[matchAt+1]||'':'';
const unique=[...new Map(tasks.map(x=>[x.original,x])).values()].filter(x=>!US_COIN_LOCAL_IMAGES[x.original]&&(!match||x.original.includes(match)));
await mkdir(new URL('../assets/coins/',import.meta.url),{recursive:true});
const manifest={...US_COIN_LOCAL_IMAGES};
const failed=[];
let cursor=0;
async function worker(){
  while(cursor<unique.length){
    const task=unique[cursor++];
    try{
      const ext=(task.file.split('.').pop()||'jpg').toLowerCase();
      const name=`${createHash('sha1').update(task.original).digest('hex').slice(0,16)}.${ext}`;
      const target=new URL(`../assets/coins/${name}`,import.meta.url);
      const path=fileURLToPath(target);
      let lastError;
      for(const download of task.downloads){
        try{
          await new Promise((resolve,reject)=>{
            const p=spawn('curl.exe',['-L','--fail','--silent','--show-error','--retry','3','--retry-delay','3','-A','Mozilla/5.0','--max-time','35','-o',path,download],{windowsHide:true});
            let error='';p.stderr.on('data',d=>error+=d);p.on('error',reject);p.on('close',c=>c===0?resolve(c):reject(new Error(error.trim()||`curl ${c}`)));
          });
          lastError=null;break;
        }catch(error){lastError=error;}
      }
      if(lastError)throw lastError;
      const info=await stat(target);
      if(info.size<1000){await unlink(target);throw new Error(`too small: ${info.size}`)}
      manifest[task.original]=`assets/coins/${name}`;
    }catch(error){failed.push({file:task.file,error:error.message});}
  }
}
await Promise.all(Array.from({length:2},worker));
await writeFile(new URL('../js/local-images.js',import.meta.url),`window.US_COIN_LOCAL_IMAGES=${JSON.stringify(manifest,null,2)};\n`);
console.log(JSON.stringify({remaining:unique.length,totalSaved:Object.keys(manifest).length,failed:failed.length,failures:failed},null,2));
