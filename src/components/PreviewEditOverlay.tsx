'use client'
import {useEffect,useState} from 'react'
import {createPortal} from 'react-dom'

type Marker={field:string;kind:string;id?:string;label:string;left:number;top:number;key:string;visible:boolean}
export const fieldLabels:Record<string,string>={title:'Başlık',full_name:'Ad soyad',display_name:'Görünen ad',summary:'Özet',content:'İçerik',body:'İçerik',photo:'Fotoğraf',cover_image:'Kapak görseli',thumbnail:'Video kapağı',heroVideo:'Üst alan videosu',heroVideoPoster:'Video kapak görseli',heroSlides:'Banner seçimi',desktop_image:'Banner görseli',mobile_image:'Mobil banner',link:'Banner bağlantısı',eyebrow:'Üst başlık',phone:'Telefon',email:'E-posta',address:'Adres',transport_information:'Ulaşım bilgisi',facilities:'Hastaneler',medical_units:'Tıbbi birimler',featuredFacilities:'Hastane sıralaması',featuredUnits:'Öne çıkan birimler',featuredArticles:'Öne çıkan yazılar',facilitiesHeading:'Hastaneler başlığı',unitsHeading:'Birimler başlığı',unitsDescription:'Birimler açıklaması',articlesHeading:'Rehber başlığı',device_type:'Teknoloji türü',starts_at:'Etkinlik tarihi',facility_id:'Etkinlik hastanesi',venue_description:'Etkinlik yeri',information_text:'Etkinlik bilgileri',attachment:'Etkinlik dosyası',provider_video_id:'Video',video_file:'Video dosyası',transcript:'Video metni',categories:'Kategoriler',reviewed_at:'İnceleme tarihi',published_at:'Yayın tarihi',doctors:'Doktorlar',reviewer_id:'İnceleyen hekim',biography:'Özgeçmiş'}

export function PreviewEditOverlay({active,locale,onSelect}:{active:boolean;locale:'tr'|'en';onSelect:(marker:Marker)=>void}){
 const [markers,setMarkers]=useState<Marker[]>([])
 useEffect(()=>{
  if(!active){setMarkers([]);return}
  let scheduled=0,hovered:HTMLElement|null=null
  const lingering=new Map<HTMLElement,ReturnType<typeof setTimeout>>()
  const sources=new Map<string,HTMLElement>()
  const update=()=>{
   scheduled=0
   const next:Marker[]=[]
   sources.clear()
   const focused=document.activeElement?.matches(':focus-visible')?document.activeElement:null
   document.querySelectorAll<HTMLElement>('[data-preview-field][data-preview-kind]').forEach((el,index)=>{
    let r=el.getBoundingClientRect()
    if(!r.width||!r.height){const range=document.createRange();range.selectNodeContents(el);r=range.getBoundingClientRect()}
    if(!r.width||!r.height||r.bottom<12||r.top>window.innerHeight-48||r.right<0||r.left>window.innerWidth)return
    const field=el.dataset.previewField!,kind=el.dataset.previewKind!,id=el.dataset.previewId
    const key=`${kind}-${id}-${field}-${index}`
    sources.set(key,el)
    const visible=el===hovered||lingering.has(el)||focused?.closest('[data-preview-field][data-preview-kind]')===el||(focused instanceof HTMLElement&&focused.closest<HTMLElement>('[data-preview-button]')?.dataset.previewButton===key)
    let top=Math.max(8,r.top),left=Math.max(8,Math.min(r.left,window.innerWidth-160))
    // Nested regions get separate controls rather than overlapping buttons.
    while(visible&&next.some(m=>m.visible&&Math.abs(m.top-top)<28&&Math.abs(m.left-left)<160))top+=29
    if(top>Math.min(r.bottom,window.innerHeight-60))return
    next.push({field,kind,id,label:fieldLabels[field]||field,left,top,key,visible})
   })
   setMarkers(previous=>JSON.stringify(previous)===JSON.stringify(next)?previous:next)
  }
  const schedule=()=>{if(!scheduled)scheduled=requestAnimationFrame(update)}
  const setHovered=(next:HTMLElement|null)=>{
   if(next===hovered)return
   if(hovered){
    const previous=hovered
    clearTimeout(lingering.get(previous))
    lingering.set(previous,setTimeout(()=>{lingering.delete(previous);schedule()},10000))
   }
   hovered=next
   if(next){clearTimeout(lingering.get(next));lingering.delete(next)}
   schedule()
  }
  const point=(event:PointerEvent)=>{
   const target=event.target instanceof Element?event.target:null
   const button=target?.closest<HTMLElement>('[data-preview-button]')
   // Re-entering either the field or its floating button cancels the hide timer.
   const next=button?sources.get(button.dataset.previewButton!)||null:target?.closest<HTMLElement>('[data-preview-field][data-preview-kind]')||null
   setHovered(next)
  }
  const leave=(event:PointerEvent)=>{if(!event.relatedTarget)setHovered(null)}
  document.addEventListener('pointerover',point);document.addEventListener('pointermove',point);document.addEventListener('pointerout',leave)
  document.addEventListener('focusin',schedule);document.addEventListener('focusout',schedule)
  const resize=new ResizeObserver(schedule);resize.observe(document.body)
  const mutations=new MutationObserver(schedule)
  mutations.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['data-preview-field','data-preview-kind','data-preview-id']})
  window.addEventListener('scroll',schedule,true);window.addEventListener('resize',schedule);document.addEventListener('load',schedule,true)
  schedule()
  return()=>{lingering.forEach(timer=>clearTimeout(timer));lingering.clear();sources.clear();cancelAnimationFrame(scheduled);resize.disconnect();mutations.disconnect();window.removeEventListener('scroll',schedule,true);window.removeEventListener('resize',schedule);document.removeEventListener('load',schedule,true);document.removeEventListener('pointerover',point);document.removeEventListener('pointermove',point);document.removeEventListener('pointerout',leave);document.removeEventListener('focusin',schedule);document.removeEventListener('focusout',schedule)}
 },[active])
 if(!active)return null
 return createPortal(<div className="preview-edit-overlay">{markers.map(marker=><button type="button" key={marker.key} data-preview-button={marker.key} className={`preview-edit-button${marker.visible?' is-visible':''}`} style={{left:marker.left,top:marker.top}} onClick={()=>onSelect(marker)} title={marker.label} aria-label={`${locale==='en'?'Edit':'Düzenle'}: ${marker.label}`}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m16 3 5 5L8 21H3v-5L16 3Zm-2 2 5 5"/></svg><span>{locale==='en'?'Edit':'Düzenle'} · {marker.label}</span></button>)}</div>,document.body)
}
