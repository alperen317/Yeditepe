import 'server-only'
import {cache} from 'react'
import type {CollectionSlug,Where,PopulateType} from 'payload'
import {cms,routes,type Locale} from './website'
import {contentPreviewEnabled} from './previewState'
import {rootNodes,nodeText,type LinkMap} from './detailContent'
import type {SerializedEditorState} from 'lexical'
import {eventPresentation} from './eventPresentation'
export const detailPopulate:PopulateType={
 media:{url:true,filename:true,mimeType:true,alt:true,width:true,height:true},
 facilities:{title:true,slug:true,cover_image:true},
 doctors:{display_name:true,full_name:true,slug:true,photo:true},
 'medical-units':{title:true,slug:true,cover_image:true},
 articles:{title:true,slug:true,cover_image:true,summary:true},
 videos:{title:true,slug:true,thumbnail:true,provider:true,provider_video_id:true},
 events:{title:true,slug:true,cover_image:true},
}
export type DetailRecord=Record<string,unknown>&{id:number;content?:SerializedEditorState}
export type DetailCard={id:number;title:string;href:string;image?:string;summary?:string;titleField?:string;imageField?:string}
export const recordTitle=(d:Record<string,unknown>)=>String(d.title||d.display_name||d.full_name||'')
export const mediaURL=(v:unknown)=>v&&typeof v==='object'&&'url' in v?String(v.url||''):undefined
export const relatedRecords=(v:unknown):DetailRecord[]=>Array.isArray(v)?v.flatMap(x=>x&&typeof x==='object'?'item' in x?relatedRecords([x.item]):[x as DetailRecord]:[]):[]
export const detailCard=(d:Record<string,unknown>,locale:Locale):DetailCard=>({id:Number(d.id),title:recordTitle(d),titleField:d.title?'title':d.display_name?'display_name':'full_name',imageField:d.photo?'photo':d.cover_image?'cover_image':d.thumbnail?'thumbnail':'provider_video_id',href:(locale==='en'?'/en/':'/')+String(d.slug||''),image:mediaURL(d.photo||d.cover_image||d.thumbnail)||eventPresentation(d).image||(d.provider==='youtube'&&typeof d.provider_video_id==='string'&&/^[\w-]{11}$/.test(d.provider_video_id)?'https://i.ytimg.com/vi/'+d.provider_video_id+'/hqdefault.jpg':undefined),summary:typeof d.summary==='string'?d.summary:undefined})
const collections:CollectionSlug[]=['facilities','doctors','medical-units','articles','videos','events','pages','medical-technologies']
export const detailIndex=cache(async(locale:Locale,pathsJSON:string)=>{
 const paths=JSON.parse(pathsJSON) as string[]
 const slugs=paths.map(path=>path.replace(/^\/(en\/)?/,''))
 const urls=paths.flatMap(path=>['https://yeditepehastaneleri.com'+path,'https://yeditepehastaneleri.com'+path+'/','https://www.yeditepehastaneleri.com'+path])
 const p=await cms(),preview=await contentPreviewEnabled()
 const all=await Promise.all(collections.map(async collection=>{
  if(!paths.length)return []
  const {docs}=await p.find({collection,locale,fallbackLocale:false,limit:0,depth:0,overrideAccess:true,where:{and:[{or:[{slug:{in:slugs}},...(collection==='medical-technologies'?[]:[{source_url:{in:urls}}])]},...(preview?[]:[{status:{equals:'published'}}])]},select:{title:true,full_name:true,display_name:true,slug:true,source_url:true}})
  return docs.map(d=>({...d,collection}) as unknown as DetailRecord&{collection:CollectionSlug})
 }))
 const entries=all.flat(),map:LinkMap={}
 for(const d of entries){const href=detailCard(d,locale).href;map['/'+String(d.slug).replace(/^\//,'')]=href;if(locale==='en')map['/en/'+String(d.slug).replace(/^\//,'')]=href;try{if(typeof d.source_url==='string')map[new URL(d.source_url).pathname.replace(/\/$/,'')]=href}catch{}}
 const r=routes(locale)
 Object.assign(map,{'/':r.home,'/hastaneler':r.hospitals,'/doktorlar':r.doctors,'/tibbi-birimler':r.units,'/saglik-rehberi':r.articles,'/videolar':r.videos,'/etkinlikler':r.events,'/kurumsal':r.corporate,'/en':r.home,'/en/hospitals':r.hospitals,'/en/doctors':r.doctors,'/en/services':r.units,'/en/health-guide':r.articles,'/en/videos':r.videos,'/en/events':r.events,'/en/corporate':r.corporate})
 return {map,entries}
})
export async function detailRelations(doc:DetailRecord,kind:CollectionSlug,locale:Locale){
 const paths=new Set<string>()
 function collect(n:import('./detailContent').DetailNode){if(n.fields?.url)try{const u=new URL(n.fields.url,'https://yeditepehastaneleri.com');if(['yeditepehastaneleri.com','www.yeditepehastaneleri.com'].includes(u.hostname))paths.add(u.pathname.replace(/\/$/,''))}catch{};n.children?.forEach(collect)}
 rootNodes(doc.content).forEach(collect)
 const p=await cms(),preview=await contentPreviewEnabled(),index=await detailIndex(locale,JSON.stringify([...paths].sort()))
 const status:Where[]=preview?[]:[{status:{equals:'published'}}]
 const find=async(collection:CollectionSlug,where:Where,limit=12)=>{
  const {docs}=await p.find({collection,locale,fallbackLocale:false,depth:1,populate:detailPopulate,limit,overrideAccess:true,where:{and:[...status,{slug:{exists:true}},where]},sort:'sort',select:{title:true,display_name:true,full_name:true,slug:true,photo:true,cover_image:true,thumbnail:true,summary:true,provider:true,provider_video_id:true}})
  return (docs as unknown as DetailRecord[]).filter(d=>recordTitle(d)&&d.slug).map(d=>detailCard(d,locale))
 }
 const fromLinks=async(collection:CollectionSlug)=>{
  const paths=new Set<string>()
  function walk(n:import('./detailContent').DetailNode){if(n.fields?.url)try{paths.add(new URL(n.fields.url,'https://yeditepehastaneleri.com').pathname.replace(/\/$/,''))}catch{};n.children?.forEach(walk)}
  rootNodes(doc.content).forEach(walk)
  const ids=index.entries.filter(d=>d.collection===collection&&([...paths].some(path=>index.map[path]===detailCard(d,locale).href))).map(d=>d.id)
  return ids.length?find(collection,{id:{in:ids}},12):[]
 }
 let doctors:DetailCard[]=[],facilities:DetailCard[]=[],units:DetailCard[]=[],articles:DetailCard[]=[],videos:DetailCard[]=[],technologies:DetailCard[]=[],events:DetailCard[]=[]
 if(kind==='facilities'){
  [doctors,technologies]=await Promise.all([find('doctors',{facilities:{contains:doc.id}},0),find('medical-technologies',{facilities:{contains:doc.id}},6)])
  units=relatedRecords(doc.medical_units).filter(d=>d.slug).map(d=>detailCard(d,locale))
 }else if(kind==='doctors'){
  facilities=relatedRecords(doc.facilities).filter(d=>d.slug).map(d=>detailCard(d,locale));units=relatedRecords(doc.medical_units).filter(d=>d.slug).map(d=>detailCard(d,locale))
  ;[articles,videos]=await Promise.all([fromLinks('articles'),find('videos',{doctors:{contains:doc.id}},6)])
  if(!videos.length)videos=await fromLinks('videos')
 }else if(kind==='medical-units'){
  [doctors,facilities,articles,videos]=await Promise.all([find('doctors',{medical_units:{contains:doc.id}},0),find('facilities',{medical_units:{contains:doc.id}},0),find('articles',{medical_units:{contains:doc.id}},6),find('videos',{medical_units:{contains:doc.id}},6)])
 }else if(kind==='articles'){
  doctors=[...relatedRecords(doc.doctors),...relatedRecords(doc.reviewer_id?[doc.reviewer_id]:[])].filter(d=>d.slug).map(d=>detailCard(d,locale))
  units=relatedRecords(doc.medical_units).filter(d=>d.slug).map(d=>detailCard(d,locale))
  const selected=relatedRecords(doc.related_articles).filter(d=>d.slug)
  articles=selected.length?selected.map(d=>detailCard(d,locale)):await find('articles',{and:[{id:{not_equals:doc.id}},...(relatedRecords(doc.categories).length?[{categories:{in:relatedRecords(doc.categories).map(d=>d.id)}}]:[])]},3)
 }else if(kind==='videos'){
  doctors=relatedRecords(doc.doctors).filter(d=>d.slug).map(d=>detailCard(d,locale));units=relatedRecords(doc.medical_units).filter(d=>d.slug).map(d=>detailCard(d,locale))
  videos=relatedRecords(doc.related_videos).filter(d=>d.slug).map(d=>detailCard(d,locale))
  if(!videos.length)videos=await find('videos',{id:{not_equals:doc.id}},3)
 }else if(kind==='events')events=await find('events',{id:{not_equals:doc.id}},3)
 return {doctors,facilities,units,articles,videos,technologies,events,map:index.map}
}
export function importedEventInfo(doc:DetailRecord){
 const nodes=rootNodes(doc.content),texts=nodes.map(nodeText)
 const next=(label:RegExp)=>{const i=texts.findIndex(t=>label.test(t.trim()));return i>=0?texts[i+1]?.trim():undefined}
 return {venue:typeof doc.venue_description==='string'?doc.venue_description:next(/^(Etkinlik Yeri|Venue|Event venue)$/i),time:typeof doc.information_text==='string'?doc.information_text:next(/^(Saat|Time)$/i)}
}
