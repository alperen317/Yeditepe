'use client'
import {UIIcon} from './UIIcon'
import {useMemo} from 'react'
import type {SerializedEditorState} from 'lexical'
import {ContentRichText} from './ContentRichText'
import {PreviewRegion,PreviewText,usePreviewData} from './PreviewFields'
import {prepareDetailContent,type LinkMap} from '../lib/detailContent'
export function DetailBody({kind,id,content,summary,summaryField,locale,map}:{kind:string;id:number;content?:SerializedEditorState;summary?:string;summaryField?:string;locale:'tr'|'en';map:LinkMap}){
 const preview=usePreviewData(kind,id),value=preview?.data.content
 const live=value===null?undefined:value&&typeof value==='object'&&'root' in value?value as SerializedEditorState:content
 const prepared=useMemo(()=>live?prepareDetailContent(live,kind,map):undefined,[live,kind,map])
 const en=locale==='en'
 return <div className={`detail-reading-layout${prepared?.toc.length?' has-toc':''}`}>
  {prepared&&prepared.toc.length>0&&<nav className="detail-toc" aria-label={en?'On this page':'Bu sayfada'}><p>{en?'ON THIS PAGE':'BU SAYFADA'}</p>{prepared.toc.map(item=><a key={item.id} href={'#'+item.id}>{item.title}<span aria-hidden="true"><UIIcon name="arrow-up-right"/></span></a>)}</nav>}
  <article className="detail-prose">{prepared&&prepared.data.root.children.length>0?<PreviewRegion kind={kind} id={id} field="content"><ContentRichText data={prepared.data} zoomImages={kind==='events'} locale={locale}/></PreviewRegion>:<p><PreviewText kind={kind} id={id} field={summaryField||'summary'}>{summary||''}</PreviewText></p>}</article>
 </div>
}
