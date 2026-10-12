'use client'
import {useEffect,useRef,useState} from 'react'
import {PreviewText,PreviewRegion,usePreviewData} from './PreviewFields'
import type {Locale} from '../lib/website'

function StatisticIcon({kind}:{kind:'experience'|'staff'|'clinics'|'beds'}){
 return <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
  {kind==='experience'?<><circle cx="16" cy="12" r="8"/><path d="m12 19-3 10 7-4 7 4-3-10M16 7v5l3 2"/></>:kind==='staff'?<><circle cx="12" cy="10" r="4"/><path d="M3 27v-3a9 9 0 0 1 18 0v3M22 6a4 4 0 0 1 0 8M24 19a7 7 0 0 1 5 7"/></>:kind==='clinics'?<><path d="M6 28V7h20v21M3 28h26M13 28v-7h6v7M13 3h6M16 1v5M10 12h3M19 12h3M10 16h3M19 16h3"/></>:<><path d="M3 9v20M3 23h26v6M3 19h26v4M14 19V11h11a4 4 0 0 1 4 4v4"/><circle cx="8" cy="14" r="3"/></>}
 </svg>
}
function StatisticCounter({target}:{target:number}){
 const element=useRef<HTMLElement>(null)
 const [value,setValue]=useState(0)
 useEffect(()=>{
  const node=element.current
  if(!node)return
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)')
  let frame=0,started=false
  const finish=()=>{cancelAnimationFrame(frame);setValue(target)}
  const animate=()=>{
   if(started)return
   started=true
   if(motion.matches){finish();return}
   let beginning:number|undefined
   const tick=(time:number)=>{
    beginning??=time
    const progress=Math.min((time-beginning)/1600,1)
    setValue(Math.round(target*(1-Math.pow(1-progress,3))))
    if(progress<1)frame=requestAnimationFrame(tick)
   }
   frame=requestAnimationFrame(tick)
  }
  const observer=new IntersectionObserver(entries=>{
   if(entries.some(entry=>entry.isIntersecting)){observer.disconnect();animate()}
  },{threshold:.6})
  observer.observe(node)
  const updateMotion=()=>{if(motion.matches)finish()}
  motion.addEventListener('change',updateMotion)
  if(motion.matches)finish()
  return()=>{observer.disconnect();cancelAnimationFrame(frame);motion.removeEventListener('change',updateMotion)}
 },[target])
 return <dd ref={element} aria-label={`${target}+`}><span className="statistic-count-value" aria-hidden="true">{value}</span><span aria-hidden="true">+</span></dd>
}
export function HospitalStatistics({locale,data={}}:{locale:Locale;data?:Record<string,unknown>}){
 const preview=usePreviewData('homepage'),values={...data,...preview?.data}
 const en=locale==='en'
 const statistics=[
  {value:'25',kind:'experience' as const,label:en?'Years of Experience':'Yıllık deneyim'},
  {value:'1500',kind:'staff' as const,label:en?'Staff Count':'Çalışan'},
  {value:'100',kind:'clinics' as const,label:en?'Clinics':'Klinik'},
  {value:'300',kind:'beds' as const,label:en?'Bed Capacity':'Yatak kapasitesi'},
 ]
 return <section className="hospital-statistics container" aria-labelledby="hospital-statistics-heading"><div className="hospital-statistics-intro"><p className="eyebrow">{en?'YEDITEPE UNIVERSITY HOSPITALS':'YEDİTEPE ÜNİVERSİTESİ HASTANELERİ'}</p><h2 id="hospital-statistics-heading"><PreviewText kind="homepage" field="statisticsHeading">{typeof values.statisticsHeading==='string'?values.statisticsHeading:en?'University expertise. Care you can trust.':'Bilimsel birikim, güven veren bakım.'}</PreviewText></h2><p><PreviewText kind="homepage" field="statisticsDescription">{typeof values.statisticsDescription==='string'?values.statisticsDescription:en?'Yeditepe University Hospitals brings together academic expertise, specialist teams and medical technology to provide care across a wide range of disciplines.':'Yeditepe Üniversitesi Hastaneleri; akademik birikimi, uzman ekipleri ve tıbbi teknolojileri bir araya getirerek farklı uzmanlık alanlarında sağlık hizmeti sunar.'}</PreviewText></p></div><dl className="hospital-statistics-grid">{statistics.map(item=><div className="hospital-statistic" key={item.kind}><dt><span className="hospital-statistic-icon"><StatisticIcon kind={item.kind}/></span><span><PreviewText kind="homepage" field={item.kind+'Label'}>{typeof values[item.kind+'Label']==='string'?String(values[item.kind+'Label']):item.label}</PreviewText></span></dt><PreviewRegion kind="homepage" field={item.kind+'Count'}><StatisticCounter target={typeof values[item.kind+'Count']==='number'?Number(values[item.kind+'Count']):Number(item.value)}/></PreviewRegion></div>)}</dl></section>
}
