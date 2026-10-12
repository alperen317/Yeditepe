import 'dotenv/config'
import assert from 'node:assert/strict'
import {readFile,writeFile} from 'node:fs/promises'
import {getPayload} from 'payload'
import {convertHTMLToLexical,editorConfigFactory} from '@payloadcms/richtext-lexical'
import {JSDOM} from 'jsdom'
import config from '../src/payload.config'
import {normalizeRichText} from '../src/lib/normalizeRichText'
if(!process.env.DATABASE_URL?.startsWith('file:'))throw new Error('Local database only.')
type Entry={url:string;locale:'tr'|'en';summary:string;category:string;coverID:number;facilitySlugs:string[];contentHTML:string}
const entries:Entry[]=JSON.parse(await readFile('work/medical-technologies-prepared.json','utf8'))
assert.equal(entries.length,54)
const payload=await getPayload({config})
try{
 const editorConfig=await editorConfigFactory.default({config:payload.config,parentIsLocalized:true})
 const original=await payload.find({collection:'medical-technologies',locale:'all',depth:0,limit:0,overrideAccess:true})
 await writeFile('work/medical-technologies-before.json',JSON.stringify(original.docs,null,2))
 const typeMap:Record<string,string>={Tanı:'diagnosis',Diagnosis:'diagnosis',Cerrahi:'surgery',Surgical:'surgery',Tedavi:'treatment',Treatment:'treatment'}
 for(const entry of entries){
  const slug=new URL(entry.url).pathname.replace(/^\/en\//,'/').slice(1)
  const {docs}=await payload.find({collection:'medical-technologies',locale:entry.locale,fallbackLocale:false,limit:1,depth:0,where:{slug:{equals:slug}},overrideAccess:true})
  assert.equal(docs.length,1,entry.url)
  const facilities=entry.facilitySlugs.length?await payload.find({collection:'facilities',locale:entry.locale,fallbackLocale:false,limit:10,depth:0,where:{slug:{in:entry.facilitySlugs}},overrideAccess:true}):{docs:[]}
  assert.equal(facilities.docs.length,entry.facilitySlugs.length,'Facility links: '+entry.url)
  const content=normalizeRichText(convertHTMLToLexical({editorConfig,html:entry.contentHTML,JSDOM}))
  await payload.update({collection:'medical-technologies',id:docs[0].id,locale:entry.locale,overrideAccess:true,depth:0,data:{summary:entry.summary,cover_image:entry.coverID,device_type:typeMap[entry.category]||null,facilities:facilities.docs.map(doc=>doc.id),content}})
 }
 console.log('PASS: 27 technologies, 54 translations, local cover images, facilities and editable detail content prepared.')
}finally{await payload.destroy()}
