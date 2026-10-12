import 'dotenv/config'
import { readFile, writeFile } from 'node:fs/promises'
import { getPayload } from 'payload'
import config from '../src/payload.config'
if(!process.env.DATABASE_URL?.startsWith('file:'))throw new Error('Local SQLite only')
const root=process.argv[2]||'imports/full'
const assets=JSON.parse(await readFile(root+'/asset-index.json','utf8')) as Record<string,{url:string;path:string;sha256:string}>
const p=await getPayload({config});const hashes=new Set<string>();const grouped=new Map<string,{path:string;urls:string[]}>()
for(const a of Object.values(assets)){const old=grouped.get(a.sha256);if(old)old.urls.push(a.url);else grouped.set(a.sha256,{path:a.path,urls:[a.url]})}
const report={created:0,existing:0,errors:[] as {url:string;error:string}[]}
try{
 let page=1;while(true){const res=await p.find({collection:'media',limit:1000,page,depth:0,select:{source_sha256:true}});for(const m of res.docs)if(m.source_sha256)hashes.add(m.source_sha256);if(!res.hasNextPage)break;page++}
 for(const [hash,a] of grouped){if(hashes.has(hash)){report.existing++;continue}try{await p.create({collection:'media',filePath:a.path,data:{source_sha256:hash,source_urls:a.urls},depth:0});hashes.add(hash);report.created++}catch(e){report.errors.push({url:a.urls[0],error:String(e)})}if(report.created%100===0)console.log('Media imported '+report.created)}
 await writeFile(root+'/media-import-report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report))
}finally{await p.destroy()}
