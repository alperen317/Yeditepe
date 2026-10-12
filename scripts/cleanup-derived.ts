import 'dotenv/config'
import {createReadStream} from 'node:fs'
import {createInterface} from 'node:readline'
import {writeFile} from 'node:fs/promises'
import {getPayload} from 'payload'
import config from '../src/payload.config'
if(!process.env.DATABASE_URL?.startsWith('file:'))throw Error('Local database only')
const wanted=new Set<string>()
for await(const line of createInterface({input:createReadStream('imports/full/normalized.jsonl'),crlfDelay:Infinity})){if(!line.trim())continue;for(const d of JSON.parse(line).derived)if(d.collection==='doctor-cv-entries')wanted.add(d.source_key)}
const p=await getPayload({config});const obsolete=[]
try{
 let page=1
 while(true){const r=await p.find({collection:'doctor-cv-entries',limit:1000,page,depth:0});for(const d of r.docs)if(d.source_key?.startsWith('public:')&&!wanted.has(d.source_key)&&(d.source_metadata as {import_state?:string}|null)?.import_state!=='reviewed')obsolete.push(d);if(!r.hasNextPage)break;page++}
 // Preserve an exact local JSON backup before removing obsolete importer-created entries.
 await writeFile('imports/full/obsolete-cv-backup.json',JSON.stringify(obsolete,null,2)+'\n')
 for(const d of obsolete)await p.delete({collection:'doctor-cv-entries',id:d.id,depth:0})
 console.log(JSON.stringify({expected:wanted.size,obsoleteRemoved:obsolete.length,backup:'imports/full/obsolete-cv-backup.json'}))
}finally{await p.destroy()}
