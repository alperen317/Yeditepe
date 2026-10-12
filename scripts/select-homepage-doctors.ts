import 'dotenv/config'
import assert from 'node:assert/strict'
import {writeFile} from 'node:fs/promises'
import {getPayload} from 'payload'
import config from '../src/payload.config'

// Verified against the imported Turkish and English doctor records.
const selectedIDs=[138,141,19,142,143,26,144,150]
if(!process.env.DATABASE_URL?.startsWith('file:'))throw new Error('Only the local database may be updated.')
const payload=await getPayload({config})
try{
 const selected=await payload.find({collection:'doctors',locale:'tr',fallbackLocale:false,limit:8,depth:0,where:{id:{in:selectedIDs}},select:{full_name:true,display_name:true,show_on_homepage:true},overrideAccess:true})
 assert.equal(selected.docs.length,8,'All eight requested doctors must exist before updating.')
 const old=await payload.find({collection:'doctors',locale:'tr',limit:0,depth:0,where:{show_on_homepage:{equals:true}},select:{full_name:true,show_on_homepage:true},overrideAccess:true})
 const ids=new Set([...selectedIDs,...old.docs.map(doc=>doc.id)])
 await writeFile('work/homepage-doctor-selection-before.json',JSON.stringify({previous:old.docs.map(doc=>({id:doc.id,name:doc.full_name})),selected:selected.docs.map(doc=>({id:doc.id,name:doc.display_name||doc.full_name,previouslyShown:Boolean(doc.show_on_homepage)}))},null,2))
 for(const id of ids){
  await payload.update({collection:'doctors',id,locale:'tr',data:{show_on_homepage:selectedIDs.includes(id)},depth:0,overrideAccess:true})
 }
 const result=await payload.find({collection:'doctors',locale:'tr',limit:0,depth:0,where:{show_on_homepage:{equals:true}},select:{full_name:true,display_name:true},overrideAccess:true})
 assert.deepEqual(result.docs.map(doc=>doc.id).sort((a,b)=>a-b),[...selectedIDs].sort((a,b)=>a-b))
 console.log('Homepage selection verified:',result.docs.map(doc=>({id:doc.id,name:doc.display_name||doc.full_name})))
}finally{await payload.destroy()}
