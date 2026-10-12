'use client'
import {useEffect,useRef,useState,type CSSProperties} from 'react'
import {bannerCopy} from '../lib/bannerPresentation'
import {PreviewRegion,usePreviewData} from './PreviewFields'
import {WebsiteHeader} from './WebsiteHeader'
import {HomeIntro} from './HomeIntro'
import {UIIcon} from './UIIcon'
import Link from 'next/link'

type Slide={id:number;title:string;description:string;descriptionField?:string;rawTitle?:string;rawSummary?:string;image:string;mobileImage:string;href:string;width:number;height:number;mobileWidth:number;mobileHeight:number}
export function HeaderHeroV2({locale,phone,slides,videoSrc,poster}:{locale:'tr'|'en';phone?:string|null;slides:Slide[];videoSrc?:string;poster?:string}){
 const homepage=usePreviewData('homepage'),preview=usePreviewData('sliders')
 const incoming=homepage?.data.heroSlides
 if(Array.isArray(incoming)&&incoming.every(doc=>doc&&typeof doc==='object'))slides=incoming.map((doc:any)=>({id:doc.id,...bannerCopy(doc.title||'',doc.summary||''),image:doc.desktop_image?.url||'',mobileImage:doc.mobile_image?.url||'',width:doc.desktop_image?.width||1504,height:doc.desktop_image?.height||650,mobileWidth:doc.mobile_image?.width||720,mobileHeight:doc.mobile_image?.height||800,href:doc.link?.replace(/^https:\/\/yeditepehastaneleri.com/,'')||'#'}))
 if(preview)slides=slides.map(item=>String(item.id)===preview.target.id?{...item,...bannerCopy(typeof preview.data.title==='string'?preview.data.title:item.rawTitle||item.title,preview.data.summary===null?'':typeof preview.data.summary==='string'?preview.data.summary:item.rawSummary||''),...(preview.data.desktop_image&&typeof preview.data.desktop_image==='object'?{image:String((preview.data.desktop_image as any).url||''),width:Number((preview.data.desktop_image as any).width)||item.width,height:Number((preview.data.desktop_image as any).height)||item.height}:{}),...(preview.data.mobile_image&&typeof preview.data.mobile_image==='object'?{mobileImage:String((preview.data.mobile_image as any).url||'')}:{}),...(typeof preview.data.link==='string'?{href:preview.data.link}: {})}:item)
 const mediaURL=(value:unknown,fallback?:string)=>value===null?undefined:value&&typeof value==='object'&&'url' in value?String(value.url||''):fallback
 videoSrc=mediaURL(homepage?.data.heroVideo,videoSrc);poster=mediaURL(homepage?.data.heroVideoPoster,poster)
 const en=locale==='en',film=Boolean(videoSrc),count=slides.length+(film?1:0),editing=Boolean(homepage?.edit||preview?.edit)
 const [mobile,setMobile]=useState(false)
 useEffect(()=>{const media=window.matchMedia('(max-width: 700px)');const update=()=>setMobile(media.matches);update();media.addEventListener('change',update);return()=>media.removeEventListener('change',update)},[])
 const [active,setActive]=useState(0),[playing,setPlaying]=useState(false),[failed,setFailed]=useState(false)
 const [rotationCycle,setRotationCycle]=useState(0)
 const progressBorder=useRef<SVGRectElement>(null)
 const [imageRatios,setImageRatios]=useState<Record<string,number>>({})
 const video=useRef<HTMLVideoElement>(null),selectedThumb=useRef<HTMLButtonElement>(null),thumbnailTrack=useRef<HTMLElement>(null)
 const selectedIndex=preview?slides.findIndex(item=>String(item.id)===preview.target.id):-1
 const scene=selectedIndex>=0?selectedIndex+(film?1:0):count?active%count:0
 const isFilm=film&&scene===0,slide=slides[scene-(film?1:0)]
 const frameStyle=slide?{'--v2-desktop-ratio':imageRatios[slide.image]||slide.width/slide.height,'--v2-mobile-ratio':imageRatios[slide.mobileImage]||(slide.mobileImage?slide.mobileWidth/slide.mobileHeight:slide.width/slide.height)} as CSSProperties:undefined
 const change=(index:number)=>{if(!count)return;const next=(index+count)%count;if(film&&next===0&&video.current)video.current.currentTime=0;setActive(next);setRotationCycle(cycle=>cycle+1)}
 useEffect(()=>{
  const element=video.current
  if(!element)return
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)')
  if(isFilm)element.currentTime=0
  const update=()=>{if(isFilm&&!motion.matches)element.play().catch(()=>setPlaying(false));else element.pause()}
  update();motion.addEventListener('change',update)
  return()=>{motion.removeEventListener('change',update);element.pause()}
 },[isFilm,videoSrc])
 useEffect(()=>{
  const track=thumbnailTrack.current,selected=selectedThumb.current
  if(!track||!selected)return
  const viewport=track.getBoundingClientRect(),item=selected.getBoundingClientRect()
  const top=viewport.top+track.clientTop,left=viewport.left+track.clientLeft
  // Move only the thumbnail track; scrollIntoView also scrolls the page.
  if(item.top<top)track.scrollTop+=item.top-top
  else if(item.bottom>top+track.clientHeight)track.scrollTop+=item.bottom-top-track.clientHeight
  if(item.left<left)track.scrollLeft+=item.left-left
  else if(item.right>left+track.clientWidth)track.scrollLeft+=item.right-left-track.clientWidth
 },[scene])
 useEffect(()=>{
  const border=progressBorder.current
  if(border)border.style.strokeDashoffset='100'
  if(count<2||editing)return
  let frame=0,elapsed=0,last=performance.now()
  const visible=()=>{last=performance.now()}
  const tick=(now:number)=>{
   let progress=0
   if(isFilm&&!failed){
    const element=video.current
    if(element&&Number.isFinite(element.duration)&&element.duration>0)progress=element.currentTime/element.duration
   }else{
    if(!document.hidden)elapsed+=now-last
    progress=elapsed/10000
   }
   last=now
   if(border)border.style.strokeDashoffset=String(100*(1-Math.min(1,progress)))
   if((!isFilm||failed)&&elapsed>=10000){setActive(previous=>(previous+1)%count);return}
   frame=requestAnimationFrame(tick)
  }
  document.addEventListener('visibilitychange',visible)
  frame=requestAnimationFrame(tick)
  return()=>{cancelAnimationFrame(frame);document.removeEventListener('visibilitychange',visible)}
 },[scene,isFilm,failed,count,rotationCycle,editing])
 const countdown=(selected:boolean)=>selected?<svg className="v2-thumb-countdown" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><rect ref={progressBorder} x="2" y="2" width="96" height="96" rx="14" pathLength="100"/></svg>:null
 const label=isFilm?(en?'Discover Yeditepe':'Yeditepe’yi keşfedin'):slide?.title||''
 return <div className="v2-header-hero"><WebsiteHeader locale={locale} phone={phone} overlay/>
  <section className={`v2-hero ${isFilm?'v2-hero-film':'v2-hero-banner'}`} style={frameStyle} aria-label={en?'Yeditepe featured stories':'Yeditepe öne çıkan içerikler'} aria-roledescription={en?'carousel':'slayt gösterisi'} onKeyDown={event=>{if((event.target as HTMLElement).matches('input,textarea'))return;if(event.key==='ArrowRight'){event.preventDefault();change(scene+1)}if(event.key==='ArrowLeft'){event.preventDefault();change(scene-1)}}}>
   {film&&<PreviewRegion kind="homepage" field="heroVideo"><div className="v2-film" aria-hidden={!isFilm}>{poster&&<img src={poster} alt=""/>}<video ref={video} src={videoSrc} poster={poster} muted playsInline preload="metadata" onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onError={()=>setFailed(true)} onEnded={()=>{if(count>1&&!editing)change(scene+1)}}/></div></PreviewRegion>}
   <h1 className="sr-only">{en?'Yeditepe University Hospitals':'Yeditepe Üniversitesi Hastaneleri'}</h1><div className="v2-hero-shade" aria-hidden="true"/>
   {isFilm?<div className="v2-film-intro"><div className="container v2-hero-eyebrow"><span/>{en?'YEDITEPE UNIVERSITY HOSPITALS':'YEDİTEPE ÜNİVERSİTESİ HASTANELERİ'}</div><HomeIntro locale={locale} phone={phone}/></div>:slide&&<div className="v2-banner-art" key={slide.id}><div className="v2-banner-frame" style={frameStyle}><PreviewRegion kind="sliders" id={slide.id} field={mobile&&slide.mobileImage?"mobile_image":"desktop_image"}><Link href={slide.href} aria-label={label}><picture>{slide.mobileImage&&<source media="(max-width: 700px)" srcSet={slide.mobileImage}/>}<img src={slide.image} width={slide.width} height={slide.height} alt={slide.title} fetchPriority="high" onLoad={event=>{const image=event.currentTarget;if(!image.naturalWidth||!image.naturalHeight)return;const key=new URL(image.currentSrc,window.location.href).pathname;const ratio=image.naturalWidth/image.naturalHeight;setImageRatios(previous=>previous[key]===ratio?previous:{...previous,[key]:ratio})}}/></picture></Link></PreviewRegion><div className="v2-banner-story"><PreviewRegion kind="sliders" id={slide.id} field="title"><h2>{slide.title}</h2></PreviewRegion>{slide.description&&<PreviewRegion kind="sliders" id={slide.id} field={slide.descriptionField||"summary"}><p>{slide.description}</p></PreviewRegion>}<PreviewRegion kind="sliders" id={slide.id} field="link"><Link className="v2-banner-cta" href={slide.href}>{en?'Discover more':'Detaylı bilgi'}<UIIcon name="arrow-right"/></Link></PreviewRegion></div></div></div>}
   <nav ref={thumbnailTrack} className="v2-hero-thumbnails" aria-label={en?'Choose a video or story':'Video veya banner seçin'}>
    {film&&<button ref={scene===0?selectedThumb:undefined} className={scene===0?'is-selected':''} onClick={()=>change(0)} aria-pressed={scene===0} aria-label={en?'Show introduction video':'Tanıtım videosunu göster'}>{poster&&<img src={poster} alt=""/>}<span className="v2-thumb-play"><UIIcon name="play"/></span>{countdown(scene===0)}<span className="v2-thumb-label">{en?'Introduction':'Tanıtım filmi'}</span></button>}
    {slides.map((item,index)=>{const thumbnailScene=index+(film?1:0);return <button ref={scene===thumbnailScene?selectedThumb:undefined} key={item.id} className={scene===thumbnailScene?'is-selected':''} onClick={()=>change(thumbnailScene)} aria-pressed={scene===thumbnailScene} aria-label={(en?'Show story: ':'Bannerı göster: ')+item.title}><img src={item.image} alt="" loading="lazy"/>{countdown(scene===thumbnailScene)}<span className="v2-thumb-label">{item.title.split('!')[0]}</span></button>})}
   </nav>
   <div className="container v2-hero-toolbar"><div className="v2-scene-navigation">{homepage?.edit&&<PreviewRegion kind="homepage" field="heroSlides"><span className="preview-selection-label">{en?'Edit banner selection':'Banner seçimini düzenle'}</span></PreviewRegion>}<button onClick={()=>change(scene-1)} aria-label={en?'Previous story':'Önceki içerik'}><UIIcon name="chevron-left"/></button><span><strong>{String(scene+1).padStart(2,'0')}</strong><i/> {String(count).padStart(2,'0')}</span><button onClick={()=>change(scene+1)} aria-label={en?'Next story':'Sonraki içerik'}><UIIcon name="chevron-right"/></button></div>{isFilm&&!failed&&<button className="v2-video-toggle" onClick={()=>{const element=video.current;if(!element)return;if(element.paused)element.play().catch(()=>setPlaying(false));else element.pause()}}><UIIcon name={playing?'pause':'play'}/>{playing?(en?'Pause film':'Videoyu duraklat'):(en?'Play film':'Videoyu oynat')}</button>}<span className="sr-only" aria-live="polite">{scene+1} / {count}: {label}</span></div>
  </section>
 </div>
}
