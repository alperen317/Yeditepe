import {PreviewText,PreviewRegion} from './PreviewFields'
import {UIIcon} from './UIIcon'
import Link from 'next/link'
import type {Card, Locale} from '../lib/website'
import {ContentCarousel} from './ContentCarousel'
import {InteractiveHoverButton} from './InteractiveHoverButton'

export function HealthyVideos({locale, videos, href}: {
  locale: Locale
  videos: (Card & {duration?: string})[]
  href: string
}) {
  if (!videos.length) return null
  const en = locale === 'en'
  return <section className="healthy-videos-section" aria-labelledby="healthy-videos-heading">
    <div className="section container">
      <div className="section-heading">
        <div><p className="eyebrow">{en ? 'WATCH AND DISCOVER' : 'İZLEYEREK KEŞFEDİN'}</p>
          <h2 id="healthy-videos-heading">{en ? 'Healthy Videos' : 'Sağlıklı Videolar'}</h2></div>
        <InteractiveHoverButton href={href}>{en ? 'All videos' : 'Tüm videolar'}</InteractiveHoverButton>
      </div>
      <p className="healthy-videos-intro">{en ? 'Explore health topics through videos from Yeditepe University Hospitals.' : 'Yeditepe Üniversitesi Hastaneleri’nin video içerikleriyle sağlık konularını yakından keşfedin.'}</p>
      <ContentCarousel locale={locale} label={en ? 'Healthy videos' : 'Sağlıklı videolar'} className="healthy-video-carousel">
        {videos.map((video, index) => <Link key={video.id} href={video.href} className="healthy-video-card" aria-label={`${en ? 'Watch: ' : 'İzleyin: '}${video.title}`}>
          <div className="healthy-video-image">
            {video.image && <PreviewRegion kind="videos" id={video.id} field={video.imageField||'thumbnail'}><img src={video.image} alt="" loading="lazy"/></PreviewRegion>}
            <span className="healthy-video-play" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="m9 5 11 7-11 7V5Z"/></svg><span>{en ? 'Watch' : 'İzleyin'}</span></span>
            {video.duration && <span className="healthy-video-duration">{video.duration}</span>}
          </div>
          <div className="healthy-video-copy"><div className="healthy-video-meta"><span className="healthy-video-kicker">{en ? 'HEALTH VIDEO' : 'SAĞLIK VİDEOSU'}</span><span className="healthy-video-number" aria-hidden="true">{String(index + 1).padStart(2, '0')} / {videos.length}</span></div>
            <h3><PreviewText kind="videos" id={video.id} field="title">{video.title}</PreviewText></h3>
            <span className="text-link">{en ? 'Watch the video' : 'Videoyu izleyin'}<span aria-hidden="true"><UIIcon name="arrow-up-right"/></span></span>
          </div>
        </Link>)}
      </ContentCarousel>
    </div>
  </section>
}
