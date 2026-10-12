'use client'
import Link from 'next/link'
import {PreviewText,usePreviewData} from './PreviewFields'
import {ServiceIcon} from './ServiceIcon'
import {InteractiveHoverButton} from './InteractiveHoverButton'
export function HomeIntro({locale,phone}:{locale:'tr'|'en';phone?:string|null}){
 const preview=usePreviewData('homepage')
 if(typeof preview?.data.phone==='string')phone=preview.data.phone
 const en=locale==='en',base=en?'/en':''
 const number=phone?.split('/')[0].trim(),tel=number?'tel:'+number.replace(/[^+\d]/g,''):undefined
 const doctors=`${base}/${en?'doctors':'doktorlar'}`,hospitals=`${base}/${en?'hospitals':'hastaneler'}`
 const shortcuts=[{href:doctors,icon:'doctor',title:en?'Find a doctor':'Doktor Bul'},{href:hospitals,icon:'hospital',title:en?'Find a hospital':'Hastane Bul'},{href:`${base}/${en?'services':'tibbi-birimler'}`,icon:'care',title:en?'Medical units':'Tıbbi Birimler'},{href:`${base}/${en?'health-guide':'saglik-rehberi'}`,icon:'guide',title:en?'Health guide':'Sağlık Rehberi'}]
 return <div className="container masthead-intro"><p className="masthead-slogan"><span>{en?'Your trusted':'Sağlıkta'}</span> {en?'partner in health':'güvenilirliğin adresi'}</p><div className="masthead-actions"><div className="masthead-primary"><InteractiveHoverButton href={doctors} variant="glass">{en?'Meet our doctors':'Doktorlarımızı Tanıyın'}</InteractiveHoverButton>{tel&&<a className="masthead-phone" href={tel}><PreviewText kind="homepage" field="phone">{number}</PreviewText><small>{en?'We are here for you':'Sağlığınız için yanınızdayız'}</small></a>}</div><nav className="masthead-shortcuts" aria-label={en?'Explore our services':'Hizmetlere hızlı erişim'}>{shortcuts.map(item=><Link key={item.icon} href={item.href}><ServiceIcon name={item.icon}/><span>{item.title}</span></Link>)}</nav></div></div>
}
