'use client'
import {ContentBento} from './ContentBento'
import {PreviewRegion,usePreviewData} from './PreviewFields'
import type {Card,Locale} from '../lib/website'
export function PreviewBento({items,locale,variant}:{items:Card[];locale:Locale;variant:'units'|'journal'}){
 const field=variant==='units'?'featuredUnits':'featuredArticles',preview=usePreviewData('homepage'),selection=preview?.data[field]
 const live=Array.isArray(selection)?selection.flatMap(raw=>{
  if(!raw||typeof raw!=='object')return []
  const doc=raw as Record<string,unknown>,media=doc.cover_image as {url?:string}|undefined
  if(!doc.slug)return []
  return [{id:Number(doc.id),title:String(doc.title||''),href:(locale==='en'?'/en/':'/')+String(doc.slug),image:media?.url,description:typeof doc.summary==='string'?doc.summary:undefined}]
 }):items
 return <><ContentBento items={live} locale={locale} variant={variant}/>{preview?.edit&&<PreviewRegion kind="homepage" field={field}><span className="preview-selection-label">{locale==='en'?'Edit featured selection':'Öne çıkan içerik seçimini düzenle'}</span></PreviewRegion>}</>
}
