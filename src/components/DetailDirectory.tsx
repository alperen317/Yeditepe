'use client'
import {PreviewText,PreviewRegion} from './PreviewFields'
import {UIIcon} from './UIIcon'
import Link from 'next/link'
import {useState} from 'react'
import type {DetailCard} from '../lib/detailData'
export function DetailDirectory({items,title,locale,portraits=false,id}:{items:DetailCard[];title:string;locale:'tr'|'en';portraits?:boolean;id:string}){
 const kind=({'detail-hospitals':'facilities','detail-units':'medical-units','detail-doctors':'doctors','detail-technologies':'medical-technologies','detail-videos':'videos','detail-articles':'articles','detail-events':'events'} as Record<string,string>)[id]
 const [query,setQuery]=useState(''),[expanded,setExpanded]=useState(false)
 if(!items.length)return null
 const term=query.toLocaleLowerCase(locale==='tr'?'tr-TR':'en-GB'),filtered=items.filter(card=>card.title.toLocaleLowerCase(locale==='tr'?'tr-TR':'en-GB').includes(term))
 const visible=expanded||query?filtered:filtered.slice(0,6),en=locale==='en'
 return <section className="detail-directory" id={id} aria-labelledby={id+'-heading'}><div className="detail-section-heading"><div><p className="eyebrow">{en?'EXPLORE':'YAKINDAN TANIYIN'}</p><h2 id={id+'-heading'}>{title}</h2></div>{items.length>6&&<div className="detail-directory-search"><label className="sr-only" htmlFor={id+'-search'}>{en?'Search '+title:title+' içinde ara'}</label><input id={id+'-search'} type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder={en?'Search by name':'İsim ile arayın'}/></div>}</div>
 <div className={`detail-related-grid${portraits?' portrait-cards':''}`}>{visible.map(card=><Link className={`detail-related-card${card.image?'':' no-image'}`} href={card.href} key={card.id}>{card.image&&<div className="detail-related-image"><PreviewRegion kind={kind} id={card.id} field={card.imageField||(portraits?"photo":kind==="videos"?"thumbnail":"cover_image")}><img src={card.image} alt="" loading="lazy" width={480} height={portraits?540:320}/></PreviewRegion></div>}<div><h3><PreviewText kind={kind} id={card.id} field={card.titleField||(portraits?"display_name":"title")}>{card.title}</PreviewText></h3>{card.summary&&<p><PreviewText kind={kind} id={card.id} field="summary">{card.summary}</PreviewText></p>}<span className="detail-card-link">{en?'Explore':'Detayları inceleyin'} <span aria-hidden="true"><UIIcon name="arrow-up-right"/></span></span></div></Link>)}</div>
 {!filtered.length&&<p className="detail-empty">{en?'No matching results.':'Aramanızla eşleşen sonuç bulunamadı.'}</p>}
 {!query&&items.length>6&&<button className="detail-expand" type="button" aria-expanded={expanded} onClick={()=>setExpanded(!expanded)}>{expanded?(en?'Show fewer':'Daha az göster'):(en?`View all ${items.length}`:`Tümünü göster (${items.length})`)} <span aria-hidden="true"><UIIcon name={expanded?'minus':'plus'}/></span></button>}
 </section>
}
