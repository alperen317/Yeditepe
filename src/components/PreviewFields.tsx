'use client'
import {previewCollections} from '../lib/previewURLs'
import editableFields from '../lib/previewEditableFields.json'
import {UIIcon} from './UIIcon'
import {PreviewEditOverlay} from './PreviewEditOverlay'
import {eventDate} from '../lib/eventPresentation'
import {createContext,useContext,useEffect,useState,useMemo,type ReactNode} from 'react'
import {isLivePreviewEvent,mergeData,ready} from '@payloadcms/live-preview'
import {ContentRichText} from './ContentRichText'
import type {SerializedEditorState} from 'lexical'
type Document=Record<string,unknown>
type Target={kind:string;id?:string}
function editableTarget(kind:string,id:number|string|undefined,field:string){
 const fields=(editableFields as Record<string,string[]>)[kind]
 return Boolean((kind==='homepage'||previewCollections.some(collection=>collection===kind))&&fields?.includes(field)&&(kind==='homepage'||id!==undefined&&/^\d+$/.test(String(id))))
}
const Context=createContext<{data:Document;target:Target;edit:boolean}|null>(null)
function Subscription({children,target,origin,edit}:{children:ReactNode;target:Target;origin:string;edit:boolean}){
 const initialData=useMemo<Document>(()=>target.id?{id:Number(target.id)}:{},[target.id,target.kind])
 const [data,setData]=useState<Document>(initialData)
 useEffect(()=>{
  let sequence=0,timer:ReturnType<typeof setTimeout>|undefined,closed=false
  const update=(event:MessageEvent)=>{
   if(!isLivePreviewEvent(event,origin)||(event.source!==window.parent&&event.source!==window.opener))return
   const message=event.data
   if((message.collectionSlug||message.globalSlug)!==target.kind||target.id&&String(message.data?.id)!==target.id)return
   const incoming=message.data as Document,current=++sequence
   const relationships=new Set(['heroSlides','featuredUnits','featuredArticles','featuredFacilities','facilities','cover_image','photo','desktop_image','mobile_image','heroVideo','heroVideoPoster'])
   const immediate=Object.fromEntries(Object.entries(incoming).filter(([field,value])=>!relationships.has(field)||value===null||Array.isArray(value)&&value.length===0))
   setData(previous=>({...previous,...immediate}))
   clearTimeout(timer)
   timer=setTimeout(()=>{
    void mergeData({serverURL:origin,depth:2,initialData,incomingData:incoming,collectionSlug:message.collectionSlug,globalSlug:message.globalSlug,locale:message.locale}).then(populated=>{
     if(!closed&&sequence===current)setData(populated)
    }).catch(()=>{/* Text stays visible if a relationship lookup is unavailable. */})
   },250)
  }
  window.addEventListener('message',update)
  ready({serverURL:origin})
  return()=>{closed=true;clearTimeout(timer);window.removeEventListener('message',update)}
 },[origin,initialData,target.id,target.kind])
 const value=useMemo(()=>({data,target,edit}),[data,target,edit])
 return <Context.Provider value={value}>{children}</Context.Provider>
}
export function PreviewProvider({children,target,locale}:{children:ReactNode;target:Target;locale:'tr'|'en'}){
 const [activeTarget,setActiveTarget]=useState(target)
 const [origin,setOrigin]=useState(''),[edit,setEdit]=useState(true),[embedded,setEmbedded]=useState(false)
 useEffect(()=>{
  // Only Payload's same-origin admin iframe may subscribe or show editing controls.
  try{
   if(window.parent===window||window.parent.location.origin!==window.location.origin||!/^\/admin(?:\/|$)/.test(window.parent.location.pathname))return
  }catch{return}
  setOrigin(window.location.origin);setEmbedded(true)
  const query=new URLSearchParams(window.location.search)
  if(query.get('__preview'))setActiveTarget({kind:query.get('__preview')!,id:query.get('__preview_id')||undefined})
 },[])
 useEffect(()=>{
  if(!edit||!embedded)return
  const click=(event:MouseEvent)=>{
   const element=event.target instanceof Element?event.target.closest<HTMLElement>('[data-preview-field]'):null
   if(!element)return
   event.preventDefault();event.stopPropagation()
   window.parent.postMessage({type:'yeditepe-preview-focus',field:element.dataset.previewField,kind:element.dataset.previewKind,id:element.dataset.previewId},window.location.origin)
  }
  document.addEventListener('click',click,true)
  return()=>document.removeEventListener('click',click,true)
 },[edit,embedded])
 const en=locale==='en'
 const select=({field,kind,id}:{field:string;kind:string;id?:string})=>{
  if(embedded)window.parent.postMessage({type:'yeditepe-preview-focus',field,kind,id},origin)
 }
 if(!origin||!embedded)return <>{children}</>
 return <><Subscription target={activeTarget} origin={origin} edit={edit}>{children}</Subscription><PreviewEditOverlay active={edit} locale={locale} onSelect={select}/><div className="cms-preview-bar"><span><i aria-hidden="true"/>{en?'Live preview':'Canlı ön izleme'}<small>{en?'Unsaved changes • Preview only':'Kaydedilmemiş değişiklikler · Yalnızca ön izleme'}</small></span><button type="button" aria-pressed={edit} onClick={()=>setEdit(!edit)}>{edit?(en?'Hide edit buttons':'Düzenleme butonlarını gizle'):(en?'Show edit buttons':'Düzenleme butonlarını göster')}</button></div></>
}
export function usePreviewData(kind:string,id?:number|string){
 const ctx=useContext(Context)
 return ctx&&ctx.target.kind===kind&&(!id||ctx.target.id===String(id))?ctx:null
}
export function PreviewText({kind,id,field,children,dateLocale,preserveDisplay=false}:{kind:string;id?:number|string;field:string;children:ReactNode;dateLocale?:'tr'|'en';preserveDisplay?:boolean}){
 const context=useContext(Context),ctx=usePreviewData(kind,id),value=ctx?.data[field]
 if(!context)return <>{children}</>
 return <span data-preview-field={context.edit&&editableTarget(kind,id,field)?field:undefined} data-preview-kind={kind} data-preview-id={id===undefined?undefined:String(id)} className={context.edit&&editableTarget(kind,id,field)?'preview-edit-target':undefined}>{preserveDisplay?children:dateLocale&&typeof value==='string'&&!Number.isNaN(Date.parse(value))?eventDate(value,dateLocale):typeof value==='string'||typeof value==='number'?String(value):children}</span>
}
export function PreviewRegion({kind,id,field,children}:{kind:string;id?:number|string;field:string;children:ReactNode}){
 const ctx=useContext(Context)
 return ctx&&field?<div style={{display:'contents'}} data-preview-field={ctx.edit&&editableTarget(kind,id,field)?field:undefined} data-preview-kind={kind} data-preview-id={id===undefined?undefined:String(id)} className={ctx.edit&&editableTarget(kind,id,field)?'preview-edit-target':undefined}>{children}</div>:<>{children}</>
}
export function PreviewImage({kind,id,field,src,alt='',className}:{kind:string;id?:number|string;field:string;src?:string;alt?:string;className?:string}){
 const ctx=usePreviewData(kind,id),value=ctx?.data[field]
 const image=value===null?undefined:value&&typeof value==='object'&&'url' in value?String(value.url||''):src
 return <PreviewRegion kind={kind} id={id} field={field}>{image?<img src={image} alt={alt} className={className}/>:ctx?.edit?<span className="preview-empty-media">{field}</span>:null}</PreviewRegion>
}
export function PreviewRichText({kind,id,field,data}:{kind:string;id?:number|string;field:string;data?:SerializedEditorState|null}){
 const ctx=usePreviewData(kind,id),value=ctx?.data[field]
 const content=value&&typeof value==='object'&&'root' in value?value as SerializedEditorState:value===null?null:data
 return <PreviewRegion kind={kind} id={id} field={field}>{content?<ContentRichText data={content}/>:null}</PreviewRegion>
}
export function PreviewDetailBody({kind,id,data,summary}:{kind:string;id:string;data?:SerializedEditorState|null;summary?:string}){
 const ctx=usePreviewData(kind,id),content=ctx?.data.content===null?null:ctx?.data.content as SerializedEditorState|undefined||data
 return content?<PreviewRichText kind={kind} id={id} field="content" data={content}/>:<><PreviewRichText kind={kind} id={id} field="content"/><p><PreviewText kind={kind} id={id} field="summary">{summary}</PreviewText></p></>
}
export function PreviewRelationships({kind,id,field,locale,items}:{kind:string;id:number;field:string;locale:'tr'|'en';items:{id:number;href:string;title:string}[]}){
 const ctx=usePreviewData(kind,id),value=ctx?.data[field]
 const populated=Array.isArray(value)&&value.every(item=>item&&typeof item==='object')?value as Document[]:undefined
 const links=populated?populated.map(item=>({id:Number(item.id),title:String(item.title||''),href:(locale==='en'?'/en/':'/')+String(item.slug||'')})):items
 return <PreviewRegion kind={kind} id={id} field={field}>{links.map(item=><a key={item.id} href={item.href}>{item.title}<span aria-hidden="true"><UIIcon name="arrow-up-right"/></span></a>)}{!links.length&&<p>{locale==='en'?'Contact us for information.':'Bilgi almak için bize ulaşın.'}</p>}</PreviewRegion>
}
export function PreviewCategory({id,category,locale}:{id:number;category:string;locale:'tr'|'en'}){
 const ctx=usePreviewData('medical-technologies',id),live=typeof ctx?.data.device_type==='string'?ctx.data.device_type:category
 const labels:Record<string,string[]>={diagnosis:['Tanı','Diagnostics'],surgery:['Cerrahi','Surgery'],treatment:['Tedavi','Treatment']}
 return labels[live]?<PreviewRegion kind="medical-technologies" id={id} field="device_type"><span className="technology-detail-type">{labels[live][locale==='en'?1:0]}</span></PreviewRegion>:null
}
