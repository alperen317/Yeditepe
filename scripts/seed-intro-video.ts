import 'dotenv/config'
import {getPayload} from 'payload'
import config from '../src/payload.config'
if(!process.env.DATABASE_URL?.startsWith('file:'))throw Error('Local setup only')
const p=await getPayload({config})
try {
 const upload=async(filename:string,filePath:string,alt:string)=>{
  const existing=await p.find({collection:'media',where:{filename:{equals:filename}},limit:1,depth:0})
  return existing.docs[0]||await p.create({collection:'media',filePath,depth:0,data:{is_public:true,alt}})
 }
 const video=await upload('drone_01.mp4','/Volumes/NO NAME/drone_01.mp4','Yeditepe hastanesi drone tanıtım videosu')
 const poster=await upload('drone-poster.jpg','work/drone-poster.jpg','Hastanenin havadan görünümü')
 const current=await p.findGlobal({slug:'homepage',depth:0})
 if(!current.heroVideo)await p.updateGlobal({slug:'homepage',depth:0,data:{heroVideo:video.id,heroVideoPoster:poster.id}})
 console.log('Intro video media IDs:',{video:video.id,poster:poster.id})
}finally{await p.destroy()}
