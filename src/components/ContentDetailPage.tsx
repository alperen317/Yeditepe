import {UIIcon} from './UIIcon'
import Link from 'next/link'
import type {CollectionSlug} from 'payload'
import {WebsiteHeader} from './WebsiteHeader'
import {WebsiteFooter} from './WebsiteFooter'
import {PreviewText,PreviewImage,PreviewRelationships,PreviewRegion} from './PreviewFields'
import {DetailBody} from './DetailBody'
import {DetailDirectory} from './DetailDirectory'
import {EventPoster} from './EventPoster'
import {DetailVideoPlayer} from './DetailVideoPlayer'
import {importedTransport} from '../lib/detailContent'
import {ReadingProgress} from './ReadingProgress'
import {footerData} from '../lib/footer'
import {routes,type Locale} from '../lib/website'
import {recordTitle,mediaURL,detailRelations,relatedRecords,importedEventInfo,type DetailRecord} from '../lib/detailData'
import {readingMinutes,plainText,directionsURL} from '../lib/cardPresentation'
import {eventPresentation,eventDate} from '../lib/eventPresentation'

export async function ContentDetailPage({doc,kind,locale,phone}:{doc:DetailRecord;kind:CollectionSlug;locale:Locale;phone?:string|null}){
 const [related,footer]=await Promise.all([detailRelations(doc,kind,locale),footerData(locale)])
 const en=locale==='en',r=routes(locale),title=recordTitle(doc),id=doc.id
 const labels:Record<string,[string,string,string]>={doctors:['Doktorlarımız','Our doctors',r.doctors],facilities:['Hastanelerimiz','Our hospitals',r.hospitals],'medical-units':['Tıbbi birimler','Medical units',r.units],articles:['Sağlık rehberi','Health guide',r.articles],events:['Etkinliklerimiz','Our events',r.events],videos:['Sağlıklı videolar','Health videos',r.videos],pages:['Kurumsal','About us',r.corporate]}
 const group=labels[kind]||labels.pages,label=group[en?1:0],titleField=doc.title!==undefined?'title':doc.display_name!==undefined?'display_name':'full_name'
 const image=mediaURL(doc.photo||doc.cover_image),summary=typeof doc.summary==='string'?plainText(doc.summary):''
 const number=String(doc.phone||phone||'').split('/')[0].trim(),tel=number?'tel:'+number.replace(/[^+\d]/g,''):undefined
 const date=eventPresentation(doc).date,event=importedEventInfo(doc),venue=doc.facility_id&&typeof doc.facility_id==='object'?recordTitle(doc.facility_id as Record<string,unknown>):event.venue
 const categories=relatedRecords(doc.categories).map(recordTitle),minutes=typeof doc.reading_minutes==='number'&&doc.reading_minutes>0?doc.reading_minutes:readingMinutes(doc.content)
 const transport=kind==='facilities'?importedTransport(doc.content):[]
 const completed=date?new Date(date).getTime()+86400000<Date.now():false
 const body=<DetailBody kind={kind} id={id} content={doc.content} summaryField={summary?'summary':kind==='doctors'?'biography':'summary'} summary={summary||(typeof doc.biography==='string'?doc.biography:undefined)} locale={locale} map={related.map}/>
 const author=relatedRecords(doc.doctors).map(recordTitle).filter(Boolean),reviewer=doc.reviewer_id&&typeof doc.reviewer_id==='object'?recordTitle(doc.reviewer_id as Record<string,unknown>):''
 const published=typeof doc.reviewed_at==='string'?doc.reviewed_at:typeof doc.published_at==='string'?doc.published_at:undefined
 const titleElement=<h1><PreviewText kind={kind} id={id} field={titleField}>{title}</PreviewText></h1>
 const lead=summary&&<p className="detail-lead"><PreviewText kind={kind} id={id} field="summary">{summary}</PreviewText></p>
 const chips=(items:typeof related.units,field:string)=><div className="detail-chips"><PreviewRelationships kind={kind} id={id} field={field} locale={locale} items={items}/></div>
 return <><WebsiteHeader locale={locale} phone={phone}/><main id="main-content" className={`content-detail detail-${kind}`}>
  <nav className="container detail-breadcrumb" aria-label={en?'Breadcrumb':'Sayfa yolu'}><Link href={r.home}>{en?'Home':'Ana sayfa'}</Link><span aria-hidden="true">/</span><Link href={group[2]}>{label}</Link><span aria-hidden="true">/</span><span aria-current="page">{title}</span></nav>
  {kind==='doctors'?<section className="container detail-profile-hero"><div className="detail-profile-photo"><PreviewImage kind={kind} id={id} field="photo" src={image} alt={title}/>{!image&&<span className="detail-initials" aria-hidden="true">{String(doc.full_name||title).split(' ').map(w=>w[0]).slice(0,2).join('')}</span>}</div><div className="detail-profile-intro"><p className="eyebrow">{en?'OUR SPECIALISTS':'UZMAN HEKİMLERİMİZ'}</p>{titleElement}{chips(related.units,'medical_units')}<div className="detail-profile-location"><p>{en?'OUR HOSPITALS':'HASTANELERİMİZ'}</p>{chips(related.facilities,'facilities')}</div>{lead}<div className="detail-hero-actions">{tel&&<a className="detail-primary-link" href={tel}>{en?'Contact us':'Bize ulaşın'} <span>{number} <UIIcon name="arrow-up-right"/></span></a>}<a className="detail-secondary-link" href="#detail-biography">{en?'Professional background':'Hekim özgeçmişi'} <UIIcon name="arrow-down"/></a></div></div></section>:<>
  <header className="container detail-heading"><p className="eyebrow">{label.toLocaleUpperCase(en?'en-GB':'tr-TR')}</p>{titleElement}{lead}{kind==='articles'&&<div className="detail-meta">{categories[0]&&<span>{categories[0]}</span>}{minutes&&<span>{minutes} {en?'min read':'dk okuma'}</span>}{published&&!Number.isNaN(Date.parse(published))&&<time dateTime={published}>{en?'Updated: ':'Güncelleme: '}<PreviewText kind={kind} id={id} field={doc.reviewed_at?'reviewed_at':'published_at'} dateLocale={locale}>{eventDate(published,locale)}</PreviewText></time>}</div>}{kind==='events'&&date&&<div className="detail-meta"><time dateTime={date}><PreviewText kind={kind} id={id} field="starts_at" dateLocale={locale}>{eventDate(date,locale)}</PreviewText></time><span className={'detail-status'+(completed?' is-completed':'')}>{completed?(en?'Completed':'Tamamlandı'):(en?'Upcoming event':'Yaklaşan etkinlik')}</span></div>}</header>
  {kind==='videos'?<div className="container"><DetailVideoPlayer id={id} provider={typeof doc.provider==='string'?doc.provider:undefined} videoID={typeof doc.provider_video_id==='string'?doc.provider_video_id:undefined} file={mediaURL(doc.video_file)} poster={mediaURL(doc.thumbnail)} title={title} locale={locale}/></div>:kind==='events'?<section className="container detail-event-hero"><div className="detail-event-poster"><EventPoster id={id} src={eventPresentation(doc).image} title={title} locale={locale}/></div><div className="detail-event-info"><p className="eyebrow">{en?'EVENT DETAILS':'ETKİNLİK BİLGİLERİ'}</p><h2>{en?'A meeting for health':'Sağlık için bir aradayız'}</h2><dl>{date&&<><dt>{en?'Date':'Tarih'}</dt><dd><time dateTime={date}><PreviewText kind={kind} id={id} field="starts_at" dateLocale={locale}>{eventDate(date,locale)}</PreviewText></time></dd></>}{event.time&&<><dt>{en?'Time':'Saat'}</dt><dd><PreviewText kind={kind} id={id} field={typeof doc.information_text==='string'?'information_text':'content'} preserveDisplay>{event.time}</PreviewText></dd></>}{venue&&<><dt>{en?'Venue':'Etkinlik yeri'}</dt><dd><PreviewText kind={kind} id={id} field={doc.facility_id?"facility_id":typeof doc.venue_description==='string'?"venue_description":"content"} preserveDisplay>{venue}</PreviewText></dd></>}</dl>{tel&&<a className="detail-primary-link" href={tel}>{en?'Information':'Bilgi için'} <span>{number} <UIIcon name="arrow-up-right"/></span></a>}{mediaURL(doc.attachment)&&<a className="detail-secondary-link" href={mediaURL(doc.attachment)} target="_blank" rel="noopener noreferrer"><PreviewText kind={kind} id={id} field="attachment">{en?'Event document':'Etkinlik dokümanı'}</PreviewText> <UIIcon name="arrow-up-right"/></a>}</div></section>:image&&<div className="container detail-cover"><PreviewImage kind={kind} id={id} field="cover_image" src={image} alt={title}/></div>}
  </>}
  <div className="container detail-main-content" id="detail-biography">
  {kind==='facilities'&&<section className="detail-contact-grid" aria-label={en?'Hospital contact details':'Hastane iletişim bilgileri'}><div><p className="eyebrow">{en?'VISIT US':'BİZE ULAŞIN'}</p><h2>{en?'Your journey to our hospital':'Hastanemize ulaşım'}</h2>{typeof doc.address==='string'&&<p><PreviewText kind={kind} id={id} field="address">{doc.address}</PreviewText></p>}<a className="detail-directions" href={directionsURL(doc.google_maps_url,doc.address,title)} target="_blank" rel="noopener noreferrer">{en?'Get directions':'Yol tarifi alın'} <UIIcon name="arrow-up-right"/></a></div><div><p className="eyebrow">{en?'CONTACT':'İLETİŞİM'}</p>{tel&&<a className="detail-contact-phone" href={tel}><PreviewText kind={doc.phone?kind:"homepage"} id={doc.phone?id:undefined} field="phone">{number}</PreviewText></a>}{typeof doc.email==='string'&&<a href={'mailto:'+doc.email}><PreviewText kind={kind} id={id} field="email">{doc.email}</PreviewText></a>}{typeof doc.transport_information==='string'&&<p className="detail-transport"><PreviewText kind={kind} id={id} field="transport_information">{plainText(doc.transport_information)}</PreviewText></p>}</div></section>}
  {transport.length>0&&<div className="detail-transport-grid">{transport.map(item=><div key={item.label}><p>{item.label}</p><span>{item.value}</span></div>)}</div>}
  {kind==='articles'&&(author.length>0||reviewer)&&<div className="detail-editorial">{author.length>0&&<span>{en?'Author: ':'Yazar: '}{author.join(', ')}</span>}{reviewer&&<span>{en?'Reviewed by: ':'İnceleyen hekim: '}{reviewer}</span>}</div>}
  {kind==='pages'&&<nav className="detail-corporate-nav" aria-label={en?'Corporate pages':'Kurumsal sayfalar'}>{footer.pages.filter(p=>[86,89,16,100,11].includes(p.id)).map(p=><Link key={p.id} href={p.href} aria-current={p.href===(en?'/en/':'/')+doc.slug?'page':undefined}>{p.title} <UIIcon name="arrow-up-right"/></Link>)}</nav>}
  {kind==='articles'?<ReadingProgress locale={locale}>{body}</ReadingProgress>:body}
  {kind==='videos'&&typeof doc.transcript==='string'&&doc.transcript&&<details className="detail-transcript"><summary>{en?'Video transcript':'Video metni'}</summary><p><PreviewText kind={kind} id={id} field="transcript">{doc.transcript}</PreviewText></p></details>}
  {related.facilities.length>0&&kind!=='doctors'&&<DetailDirectory id="detail-hospitals" items={related.facilities} title={en?'Our hospitals':'Hastanelerimiz'} locale={locale}/>}
  {related.units.length>0&&kind!=='doctors'&&<DetailDirectory id="detail-units" items={related.units} title={en?'Medical units':'Tıbbi birimlerimiz'} locale={locale}/>}
  <DetailDirectory id="detail-doctors" items={related.doctors} title={en?'Meet our doctors':'Doktorlarımızı tanıyın'} locale={locale} portraits/>
  <DetailDirectory id="detail-technologies" items={related.technologies} title={en?'Medical technologies':'Medikal teknolojilerimiz'} locale={locale}/>
  <DetailDirectory id="detail-videos" items={related.videos} title={kind==='videos'?(en?'More videos':'Diğer videolar'):(en?'Related videos':'İlgili videolar')} locale={locale}/>
  <DetailDirectory id="detail-articles" items={related.articles} title={en?'From our health guide':'Sağlık rehberimizden'} locale={locale}/>
  <DetailDirectory id="detail-events" items={related.events} title={en?'Other events':'Diğer etkinlikler'} locale={locale}/>
  <div className="detail-bottom-nav"><Link href={group[2]}>← {en?'Back to '+label:label+' listesine dön'}</Link><a href="#main-content">{en?'Back to top':'Yukarı dön'} ↑</a></div>
  </div>
 </main><WebsiteFooter locale={locale} phone={phone?.split('/')[0].trim()} pages={footer.pages}/></>
}
