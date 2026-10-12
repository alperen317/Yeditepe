import 'dotenv/config'
import {getPayload} from 'payload'
import config from '../src/payload.config'
if(!process.env.DATABASE_URL?.startsWith('file:'))throw Error('Local setup only')
const p=await getPayload({config})
try{
 for(const locale of ['tr','en'] as const){
  const current=await p.findGlobal({slug:'homepage',locale,depth:0,overrideAccess:true})
  if(current.eyebrow){console.log('Existing homepage preserved:',locale);continue}
  const slides=await p.find({collection:'sliders',locale,fallbackLocale:false,depth:0,limit:20,sort:'sort',select:{title:true,sort:true,desktop_image:true}})
  const preferred=slides.docs.filter(s=>s.title&&s.desktop_image).sort((a,b)=>(a.sort===2?-1:b.sort===2?1:0))
  const units=await p.find({collection:'medical-units',locale,fallbackLocale:false,depth:0,limit:100,select:{title:true,slug:true}})
  const terms=locale==='tr'?['kardiyoloji','tibbi-onkoloji','beyin-ve-sinir','kadin-hastaliklari','cocuk-sagligi','ortopedi']:['cardiology','medical-oncology','neurosurgery','gynecology','pediatrics','orthopedics']
  const unitIDs=terms.map(term=>(units.docs.find(u=>u.slug?.split('/').pop()===term)||units.docs.find(u=>u.slug?.includes(term)))?.id).filter(Boolean)
  const facilities=await p.find({collection:'facilities',locale,fallbackLocale:false,depth:0,limit:10,select:{title:true,slug:true,phone:true}})
  const facilityIDs=['kosuyolu','kozyatagi','goz-merkezi','eye-center'].map(term=>facilities.docs.find(f=>f.slug?.includes(term))?.id).filter(Boolean).slice(0,3)
  const articles=await p.find({collection:'articles',locale,fallbackLocale:false,depth:0,limit:60,where:{and:[{kind:{equals:'health_guide'}},{cover_image:{exists:true}}]},select:{title:true,slug:true,cover_image:true}})
  const articleIDs=articles.docs.filter(a=>a.title&&a.slug&&a.title.length<95).slice(0,3).map(a=>a.id)
  await p.updateGlobal({slug:'homepage',locale,depth:0,data:{
   eyebrow:locale==='tr'?'BİLİM. GÜVEN. YAŞAM.':'SCIENCE. TRUST. LIFE.',heroSlides:preferred.slice(0,5).map(s=>s.id),
   unitsHeading:locale==='tr'?'İhtiyacınıza özel uzmanlık.':'The right expertise, for you.',
   unitsDescription:locale==='tr'?'Sağlığınızın her adımında, farklı uzmanlık alanlarını bir araya getiren bir yaklaşım.':'A multidisciplinary approach that brings expertise together at every step of your care.',featuredUnits:unitIDs as number[],
   facilitiesHeading:locale==='tr'?'Her zaman yanınızdayız.':'Always by your side.',featuredFacilities:facilityIDs as number[],
   articlesHeading:locale==='tr'?'Sağlıklı yaşam için bilgi.':'Knowledge for a healthier life.',featuredArticles:articleIDs,
   aboutHeading:locale==='tr'?'Sağlığın merkezinde bilim var.':'Science at the heart of care.',
   aboutDescription:locale==='tr'?'Yeditepe Üniversitesi Hastaneleri’nde akademik birikim, farklı disiplinlerden uzmanlar ve insan odaklı bir yaklaşım bir araya geliyor. Hastanelerimizi, ekiplerimizi ve çalışmalarımızı yakından tanıyın.':'Yeditepe University Hospitals brings academic knowledge, multidisciplinary expertise and a people-centered approach together. Get to know our hospitals, teams and work.',
   phone:facilities.docs.find(f=>f.slug?.includes('kosuyolu'))?.phone?.split('/')[0].trim()||null,
  }})
  console.log('Homepage configured:',locale,{slides:preferred.slice(0,5).map(s=>s.id),units:unitIDs,facilities:facilityIDs,articles:articleIDs})
 }
}finally{await p.destroy()}
