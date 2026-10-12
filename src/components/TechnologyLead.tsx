'use client'
import {UIIcon} from './UIIcon'
import {useState} from 'react'
import {PreviewText,usePreviewData} from './PreviewFields'
export function TechnologyLead({id,summary,locale}:{id:number;summary:string;locale:'tr'|'en'}){
 const preview=usePreviewData('medical-technologies',id),[expanded,setExpanded]=useState(false)
 const text=typeof preview?.data.summary==='string'?preview.data.summary:summary,long=text.length>260,en=locale==='en'
 return <div className="technology-lead-wrap"><p id={'technology-summary-'+id} className={`technology-detail-lead${long&&!expanded?' is-collapsed':''}`}><PreviewText kind="medical-technologies" id={id} field="summary">{summary}</PreviewText></p>{long&&<button type="button" className="technology-lead-toggle" aria-controls={'technology-summary-'+id} aria-expanded={expanded} onClick={()=>setExpanded(!expanded)}>{expanded?(en?'Show less':'Daha az göster'):(en?'Read more':'Devamını oku')} <span aria-hidden="true"><UIIcon name={expanded?'minus':'plus'}/></span></button>}</div>
}
