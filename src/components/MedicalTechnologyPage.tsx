import {UIIcon} from './UIIcon'
import Link from 'next/link'
import {PreviewText,PreviewImage,PreviewRichText,PreviewRelationships,PreviewCategory} from './PreviewFields'
import {notFound} from 'next/navigation'
import {technologyData,technologyRoute} from '../lib/medicalTechnologies'
import {footerData} from '../lib/footer'
import type {Locale} from '../lib/website'
import {WebsiteHeader} from './WebsiteHeader'
import {WebsiteFooter} from './WebsiteFooter'
import {TechnologyLead} from './TechnologyLead'
import {TechnologyExplorer} from './TechnologyExplorer'
import {InteractiveHoverButton} from './InteractiveHoverButton'
export async function MedicalTechnologyPage({locale,slug}:{locale:Locale;slug?:string}){
 const [{cards,detail,phone},footer]=await Promise.all([technologyData(locale,slug),footerData(locale)])
 if(slug&&!detail)notFound()
 const en=locale==='en',route=technologyRoute(locale)
 const feature=cards.find(card=>/da vinci/i.test(card.title))||cards.find(card=>card.image)
 return <><WebsiteHeader locale={locale} phone={phone}/><main id="main-content" className="technology-page">
  <div className="container technology-breadcrumb"><Link href={en?'/en':'/'}>{en?'Home':'Ana sayfa'}</Link><span aria-hidden="true">/</span>{detail?<><Link href={route}>{en?'Medical technologies':'Medikal teknolojiler'}</Link><span aria-hidden="true">/</span><span><PreviewText kind="medical-technologies" id={detail.card.id} field="title">{detail.card.title}</PreviewText></span></>:<span>{en?'Medical technologies':'Medikal teknolojiler'}</span>}</div>
  {detail?<><section className="container technology-detail-hero"><div><p className="eyebrow">{en?'MEDICAL TECHNOLOGY':'MEDİKAL TEKNOLOJİ'}</p><h1><PreviewText kind="medical-technologies" id={detail.card.id} field="title">{detail.card.title}</PreviewText></h1><PreviewCategory id={detail.card.id} category={detail.card.category} locale={locale}/><TechnologyLead id={detail.card.id} summary={detail.card.summary} locale={locale}/></div>{<div className="technology-detail-visual"><PreviewImage kind="medical-technologies" id={detail.card.id} field="cover_image" src={detail.card.image} alt={detail.card.title}/></div>}</section><div className="container technology-detail-layout"><article className="technology-article"><PreviewRichText kind="medical-technologies" id={detail.card.id} field="content" data={detail.content}/><InteractiveHoverButton href={route}>{en?'All technologies':'Tüm teknolojiler'}</InteractiveHoverButton></article><aside className="technology-availability"><p className="eyebrow">{en?'OUR HOSPITALS':'HASTANELERİMİZ'}</p><h2>{en?'Where is this technology available?':'Bu teknoloji hangi hastanelerimizde?'}</h2><PreviewRelationships kind="medical-technologies" id={detail.card.id} field="facilities" locale={locale} items={detail.card.facilities}/>{phone&&<a className="technology-contact" href={'tel:'+phone.split('/')[0].trim().replace(/[^+\d]/g,'')}>{phone.split('/')[0].trim()}<small>{en?'Contact us':'Bize ulaşın'}</small></a>}</aside></div><div className="technology-related"><TechnologyExplorer compact locale={locale} items={cards.filter(card=>card.id!==detail.card.id).slice(0,3)}/></div></>:<><section className="technology-intro"><div className="container technology-intro-inner"><div className="technology-intro-copy"><p className="eyebrow">{en?'SCIENCE & TECHNOLOGY':'BİLİM VE TEKNOLOJİ'}</p><h1>{en?'Medical technologies':'Medikal teknolojiler'}</h1><p>{en?'Explore the technologies used in diagnosis, treatment and surgery at Yeditepe University Hospitals.':'Yeditepe Üniversitesi Hastaneleri’nde tanı, tedavi ve cerrahi süreçlerinde kullanılan teknolojileri yakından tanıyın.'}</p><a className="technology-intro-anchor" href="#technology-directory-heading">{en?'Explore our technologies':'Teknolojileri keşfedin'}<span aria-hidden="true"><UIIcon name="arrow-down"/></span></a></div>{feature&&<Link className="technology-intro-feature" href={feature.href}>{feature.image&&<img src={feature.image} alt=""/>}<div><span>{en?'A CLOSER LOOK':'YAKINDAN TANIYIN'}</span><h2>{feature.title}</h2></div><span className="technology-feature-arrow" aria-hidden="true"><UIIcon name="arrow-up-right"/></span></Link>}</div></section><TechnologyExplorer items={cards} locale={locale}/></>}
 </main><WebsiteFooter locale={locale} phone={phone?.split('/')[0].trim()} pages={footer.pages}/></>
}
