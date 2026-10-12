import 'server-only'
import {contentPreviewEnabled} from './previewState'
import {cms,type Locale} from './website'
import type {SerializedEditorState} from 'lexical'
export type TechnologyCard={id:number;title:string;href:string;summary:string;image?:string;category:string;facilities:{id:number;title:string;href:string}[]}
export const technologyRoute=(locale:Locale)=>locale==='en'?'/en/medical-technology':'/medikal-teknoloji'
export function technologyCategory(category:string,locale:Locale){
 const labels:Record<string,[string,string]>={diagnosis:['Tanı','Diagnostics'],surgery:['Cerrahi','Surgery'],treatment:['Tedavi','Treatment'],other:['Diğer','Other']}
 return (labels[category]||labels.other)[locale==='en'?1:0]
}
export async function technologyData(locale:Locale,slug?:string){
 const payload=await cms();const preview=await contentPreviewEnabled()
 const [records,settings]=await Promise.all([
  payload.find({collection:'medical-technologies',locale,fallbackLocale:false,depth:1,limit:0,overrideAccess:true,sort:'title',where:preview?{}:{status:{equals:'published'}},select:{title:true,slug:true,summary:true,cover_image:true,device_type:true,facilities:true,content:true},populate:{facilities:{title:true,slug:true}}}),
  payload.findGlobal({slug:'homepage',locale,depth:0,overrideAccess:true,select:{phone:true}}),
 ])
 const cards:TechnologyCard[]=records.docs.flatMap(doc=>!doc.title||!doc.slug?[]:[{id:doc.id,title:doc.title,href:(locale==='en'?'/en/':'/')+doc.slug,summary:doc.summary||'',image:typeof doc.cover_image==='object'?doc.cover_image?.url||undefined:undefined,category:doc.device_type||'other',facilities:(doc.facilities||[]).flatMap(f=>typeof f==='object'&&f.title&&f.slug?[{id:f.id,title:f.title,href:(locale==='en'?'/en/':'/')+f.slug}]:[])}])
 const detail=slug?records.docs.find(doc=>doc.slug===slug):undefined
 return {cards,phone:settings.phone?.split('/')[0].trim(),detail:detail?{card:cards.find(card=>card.id===detail.id)!,content:detail.content as SerializedEditorState|null}:undefined}
}
