import 'dotenv/config'
import {getPayload} from 'payload'
import config from '../src/payload.config'
if(!process.env.DATABASE_URL?.startsWith('file:'))throw Error('Local setup only')
const p=await getPayload({config})
try {
 const existing=await p.find({collection:'doctors',depth:0,limit:1,where:{show_on_homepage:{equals:true}},select:{show_on_homepage:true}})
 if(existing.totalDocs){console.log('Existing homepage doctor selections preserved:',existing.totalDocs)}
 else {
  const doctors=await p.find({collection:'doctors',locale:'tr',fallbackLocale:false,depth:0,limit:10,sort:'id',where:{and:[{photo:{exists:true}},{slug:{exists:true}}]},select:{full_name:true}})
  for(const doctor of doctors.docs)await p.update({collection:'doctors',id:doctor.id,depth:0,data:{show_on_homepage:true}})
  console.log('Initial homepage doctor IDs:',doctors.docs.map(d=>d.id))
 }
}finally{await p.destroy()}
