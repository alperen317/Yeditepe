'use client'
import {UIIcon} from './UIIcon'
import {Children,isValidElement,useEffect,useId,useMemo,useRef,useState,type ReactNode} from 'react'
import {PreviewRegion,usePreviewData} from './PreviewFields'
import {useBlurFade} from './BlurFade'

export function ContentCarousel({children,label,locale,className}:{children:ReactNode;label:string;locale:'tr'|'en';className:string}) {
 const preview=usePreviewData('homepage')
 const featuredFacilities=preview?.data.featuredFacilities
 const cards=useMemo(()=>{
  if(className!=='facility-carousel'||!Array.isArray(featuredFacilities))return children
  const selected=featuredFacilities.map((item:unknown)=>typeof item==='object'&&item!==null&&'id' in item?Number(item.id):Number(item))
  return Children.toArray(children).sort((a,b)=>{
   const rank=(item:ReactNode)=>{const id=isValidElement<{"data-facility-id"?:number}>(item)?item.props['data-facility-id']:undefined;const index=selected.indexOf(Number(id));return index<0?Infinity:index}
   return rank(a)-rank(b)
  })
 },[children,className,featuredFacilities])
 const track=useRef<HTMLDivElement>(null)
 useBlurFade(track,cards)
 const id=useId()
 const [edges,setEdges]=useState({start:true,end:false})
 const en=locale==='en'
 useEffect(()=>{
  const element=track.current
  if(!element)return
  const update=()=>{
   const start=element.scrollLeft<=2,end=element.scrollLeft+element.clientWidth>=element.scrollWidth-2
   setEdges(previous=>previous.start===start&&previous.end===end?previous:{start,end})
  }
  update()
  element.addEventListener('scroll',update,{passive:true})
  const resize=new ResizeObserver(update)
  resize.observe(element)
  return ()=>{element.removeEventListener('scroll',update);resize.disconnect()}
 },[cards])
 const move=(direction:number)=>{
  const element=track.current
  if(!element)return
  const card=element.firstElementChild
  const step=card?card.getBoundingClientRect().width+parseFloat(getComputedStyle(element).columnGap||'0'):element.clientWidth
  const count=Math.max(1,Math.floor(element.clientWidth/step))
  element.scrollBy({left:direction*step*count,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})
 }
 return <div className={`content-carousel ${className}`} role="region" aria-label={label} aria-roledescription={en?'carousel':'kaydırılabilir içerikler'}>
  <div className="carousel-viewport">
   <div className="carousel-track" id={id} ref={track} tabIndex={0} aria-label={en?'Use arrow keys to browse':'Gezinmek için ok tuşlarını kullanın'} onKeyDown={e=>{if(e.target!==e.currentTarget)return;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();move(e.key==='ArrowLeft'?-1:1)}}}>{cards}</div>
  </div>
  <div className="carousel-navigation"><span>{en?'Scroll to explore':'Kaydırarak keşfedin'}{className==='facility-carousel'&&preview?.edit&&<PreviewRegion kind="homepage" field="featuredFacilities"><span className="preview-selection-label">{en?'Edit hospital order':'Hastane sıralamasını düzenle'}</span></PreviewRegion>}</span><button type="button" aria-controls={id} aria-label={en?'Previous items':'Önceki içerikler'} disabled={edges.start} onClick={()=>move(-1)}><UIIcon name="arrow-left"/></button><button type="button" aria-controls={id} aria-label={en?'Next items':'Sonraki içerikler'} disabled={edges.end} onClick={()=>move(1)}><UIIcon name="arrow-right"/></button></div>
 </div>
}
