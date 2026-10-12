import 'dotenv/config'
import fs from 'node:fs'
import {getPayload} from 'payload'
import config from '../src/payload.config'
if(!process.env.DATABASE_URL?.startsWith('file:'))throw Error('Local setup only')
const plan=JSON.parse(fs.readFileSync('work/banner-size-plan.json','utf8'))
const p=await getPayload({config})
try {
 const getMedia=async(a:{sha256:string;url:string;path:string})=>{
  const existing=await p.find({collection:'media',where:{source_sha256:{equals:a.sha256}},depth:0,limit:1})
  return existing.docs[0]||await p.create({collection:'media',filePath:a.path,depth:0,data:{source_sha256:a.sha256,source_urls:[a.url],is_public:true,alt:'Yeditepe banner'}})
 }
 for(const row of plan){
  const desktop=await getMedia(row.desktop),mobile=await getMedia(row.mobile)
  await p.update({collection:'sliders',id:row.id,locale:row.locale,depth:0,data:{desktop_image:desktop.id,mobile_image:mobile.id}})
 }
 console.log('Banner image dimensions updated:',plan.length)
}finally{await p.destroy()}
