import Link from 'next/link'
import {PreviewText,PreviewRegion} from './PreviewFields'
import {BlurFade} from './BlurFade'
import {UIIcon} from './UIIcon'
import {ServiceIcon} from './ServiceIcon'
import {InteractiveHoverButton} from './InteractiveHoverButton'
import {eventDate} from '../lib/eventPresentation'

type EventCard={id:number;title:string;href:string;image?:string;date?:string}

export function HomeEvents({events,locale,href}:{events:EventCard[];locale:'tr'|'en';href:string}){
 const en=locale==='en'
 if(!events.length)return null
 return <section className="home-events" aria-labelledby="homepage-events-heading">
  <div className="section container">
   <div className="section-heading">
    <div><p className="eyebrow">{en?'TOGETHER FOR HEALTH':'SAĞLIK İÇİN BİR ARADAYIZ'}</p><h2 id="homepage-events-heading">{en?'Our events':'Etkinliklerimiz'}</h2></div>
    <InteractiveHoverButton href={href}>{en?'All events':'Tüm etkinlikler'}</InteractiveHoverButton>
   </div>
   <p className="home-events-intro">{en?'Explore our educational programmes, gatherings and scientific events.':'Eğitimlerimiz, buluşmalarımız ve bilimsel etkinliklerimizi keşfedin.'}</p>
   <BlurFade className="home-events-grid">
    {events.map(event=><Link className="home-event-card" key={event.id} href={event.href}>
     <PreviewRegion kind="events" id={event.id} field="cover_image"><div className="home-event-artwork">
      {event.image?<img src={event.image} alt="" loading="lazy"/>:<ServiceIcon name="guide"/>}
     </div></PreviewRegion>
     <div className="home-event-body">
      <div className="home-event-meta">
       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18M7 15h3m4 0h3"/></svg>
       {event.date?<time dateTime={event.date}><PreviewText kind="events" id={event.id} field="starts_at" dateLocale={locale}>{eventDate(event.date,locale)}</PreviewText></time>:<span>{en?'Yeditepe events':'Yeditepe etkinlikleri'}</span>}
      </div>
      <h3><PreviewText kind="events" id={event.id} field="title">{event.title}</PreviewText></h3>
      <div className="home-event-action"><span>{en?'Explore event':'Etkinliği inceleyin'}</span><span className="home-event-arrow"><UIIcon name="arrow-up-right"/></span></div>
     </div>
    </Link>)}
   </BlurFade>
  </div>
 </section>
}
