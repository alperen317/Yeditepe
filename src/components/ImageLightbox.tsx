'use client'
import {UIIcon} from './UIIcon'
import {useEffect,useId,useRef,useState} from 'react'

export function ImageLightbox({src,alt,locale='tr'}:{src:string;alt:string;locale?:'tr'|'en'}){
 const dialog=useRef<HTMLDialogElement>(null),[open,setOpen]=useState(false),titleID=useId(),en=locale==='en'
 useEffect(()=>{
  if(!open)return
  const previous=document.body.style.overflow
  document.body.style.overflow='hidden'
  return()=>{document.body.style.overflow=previous}
 },[open])
 const close=()=>dialog.current?.close()
 return <>
  <button className="image-zoom-trigger" type="button" aria-haspopup="dialog" aria-label={en?'View image full screen: '+alt:'Görseli tam ekran görüntüle: '+alt} onClick={event=>{event.preventDefault();event.stopPropagation();dialog.current?.showModal();setOpen(true)}}>
   <img src={src} alt={alt}/><span className="image-zoom-hint" aria-hidden="true"><UIIcon name="expand"/>{en?'Enlarge':'Büyüt'}</span>
  </button>
  <dialog ref={dialog} className="image-lightbox" aria-labelledby={titleID} onClose={()=>setOpen(false)} onClick={event=>{event.preventDefault();event.stopPropagation();if(event.target===event.currentTarget)close()}}>
   <h2 id={titleID} className="sr-only">{alt||(en?'Event image':'Etkinlik görseli')}</h2>
   <button className="image-lightbox-close" type="button" autoFocus onClick={close} aria-label={en?'Close image':'Görseli kapat'}><span aria-hidden="true"><UIIcon name="close"/></span></button>
   {open&&<img src={src} alt={alt} className="image-lightbox-photo"/>}
  </dialog>
 </>
}
