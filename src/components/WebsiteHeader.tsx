'use client'
import {UIIcon} from './UIIcon'
import Link from 'next/link'
import {PreviewText,usePreviewData} from './PreviewFields'
import {useState,useEffect} from 'react'
import {usePathname} from 'next/navigation'

function SearchIcon(){return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="10.5" cy="10.5" r="7.5"/><path d="m16 16 5 5"/></svg>}
export function WebsiteHeader({locale,phone,overlay=false}:{locale:'tr'|'en';phone?:string|null;overlay?:boolean}) {
 const preview=usePreviewData('homepage')
 if(typeof preview?.data.phone==='string')phone=preview.data.phone
 const [open,setOpen]=useState(false)
 const [scrolled,setScrolled]=useState(false)
 useEffect(()=>{
  if(!overlay)return
  const update=()=>setScrolled(window.scrollY>48)
  update();window.addEventListener('scroll',update,{passive:true})
  return ()=>window.removeEventListener('scroll',update)
 },[overlay])
 const en=locale==='en',base=en?'/en':'',pathname=usePathname()
 const number=phone?.split('/')[0].trim(),tel=number?'tel:'+number.replace(/[^+\d]/g,''):undefined
 useEffect(()=>{document.documentElement.lang=locale},[locale])
 const doctors=`${base}/${en?'doctors':'doktorlar'}`
 const hospitals=`${base}/${en?'hospitals':'hastaneler'}`
 const corporate=`${base}/${en?'corporate':'kurumsal'}`
 const links=en?[['Hospitals','hospitals'],['Our doctors','doctors'],['Medical units','services'],['Medical technologies','medical-technology'],['Health guide','health-guide']]:[['Hastaneler','hastaneler'],['Doktorlarımız','doktorlar'],['Tıbbi Birimler','tibbi-birimler'],['Medikal Teknolojiler','medikal-teknoloji'],['Sağlık Rehberi','saglik-rehberi']]

 return <><a className="skip-link" href="#main-content">{en?'Skip to content':'İçeriğe geç'}</a><header className={`masthead${overlay?' masthead-overlay':''}${scrolled?' is-scrolled':''}${open?' menu-open':''}`}>
  <div className="masthead-shell">
  <div className="container masthead-top">
   <Link className="masthead-brand" href={base||'/'} aria-label={en?'Yeditepe home page':'Yeditepe ana sayfa'}><img src="/brand/03_logo_yatay_beyaz_seffaf.svg" width="796" height="159" alt="Yeditepe Üniversitesi Hastaneleri"/></Link>
   <nav className="masthead-utility" aria-label={en?'Information links':'Bilgi bağlantıları'}><Link href={corporate}>{en?'About us':'Kurumsal'}</Link>{tel&&<a href={tel}>{en?'Contact':'Bize Ulaşın'} <span><PreviewText kind="homepage" field="phone">{number}</PreviewText></span></a>}<Link className="masthead-language" href={en?'/':'/en'} lang={en?'tr':'en'} aria-label={en?'Switch to Turkish':'İngilizceye geç'}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><circle cx="12" cy="12" r="10"/><ellipse cx="12" cy="12" rx="4.5" ry="10"/><path d="M2 12h20"/></svg>{en?'TR':'EN'}</Link></nav>
   <button className="masthead-toggle" aria-label={en?'Menu':'Menü'} aria-controls="main-navigation" aria-expanded={open} onClick={()=>setOpen(!open)}><UIIcon name={open?'close':'menu'}/></button>
  </div>
  <div className="container masthead-menu"><nav id="main-navigation" className={`masthead-navigation${open?' is-open':''}`} aria-label={en?'Main navigation':'Ana menü'}>{links.map(([title,path])=><Link key={path} href={`${base}/${path}`} aria-current={pathname===`${base}/${path}`||pathname.startsWith(`${base}/${path}/`)?'page':undefined} onClick={()=>setOpen(false)}>{title}</Link>)}{overlay&&<Link className="compact-corporate" href={corporate} onClick={()=>setOpen(false)}>{en?'About us':'Kurumsal'}</Link>}</nav>
   <form className="masthead-search" action={doctors} role="search"><button type="submit" aria-label={en?'Search doctors':'Doktor ara'}><SearchIcon/></button><label className="sr-only" htmlFor="masthead-query">{en?'Doctor name or specialty':'Doktor adı veya uzmanlık'}</label><input id="masthead-query" type="search" name="q" placeholder={en?'Doctor name or specialty':'Doktor adı veya uzmanlık arayın'}/></form>
  </div>

 </div></header></>
}
