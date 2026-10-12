import {PreviewText,PreviewRegion} from './PreviewFields'
import {UIIcon} from './UIIcon'
import Link from 'next/link'
import type {Card, Locale} from '../lib/website'
import {ServiceIcon} from './ServiceIcon'
import {BlurFade} from './BlurFade'

/** The first CMS selection leads the layout; DOM and keyboard order stay identical. */
export function ContentBento({items, locale, variant}: {
  items: Card[]
  locale: Locale
  variant: 'units' | 'journal'
}) {
  const en = locale === 'en'
  const journal = variant === 'journal'
  return <BlurFade className={`content-bento content-bento-${variant}`}>
    {items.map((item, index) => {
      const lead = index === 0
      return <Link key={item.id} href={item.href}
        className={`bento-card${lead ? ' bento-lead' : ''}${item.image ? ' bento-has-image' : ''}`}>
        {(journal || lead) && <div className="bento-art" aria-hidden="true">
          {item.image ? <PreviewRegion kind={journal?"articles":"medical-units"} id={item.id} field="cover_image"><img src={item.image} alt="" loading="lazy"/></PreviewRegion> : <ServiceIcon name={journal ? 'guide' : 'care'}/>}
        </div>}
        {!journal && <div className="bento-unit-meta" aria-hidden="true">
          <span>{String(index + 1).padStart(2, '0')}</span>
          <ServiceIcon name="care"/>
        </div>}
        <div className="bento-copy">
          <span className="bento-kicker">{journal
            ? (item.category || (en ? 'HEALTH GUIDE' : 'SAĞLIK REHBERİ'))
            : (en ? 'MEDICAL UNIT' : 'TIBBİ BİRİM')}</span>
          <h3><PreviewText kind={journal?"articles":"medical-units"} id={item.id} field="title">{item.title}</PreviewText></h3>
          {item.description && (journal || lead) && <p><PreviewText kind={journal?"articles":"medical-units"} id={item.id} field={item.descriptionField||'summary'}>{item.description}</PreviewText></p>}
          {journal && (item.readingMinutes || item.author) && <div className="journal-meta">
            {item.readingMinutes && <span>{en ? `${item.readingMinutes} min read` : `${item.readingMinutes} dk okuma`}</span>}
            {item.author && <span>{item.authorRole === 'reviewer' ? (en ? 'Reviewed by: ' : 'İnceleyen: ') : (en ? 'Author: ' : 'Yazar: ')}{item.author}</span>}
          </div>}
          <span className="bento-cta">{journal
            ? (en ? 'Read the article' : 'Yazıyı okuyun')
            : (en ? 'Explore the unit' : 'Birimi keşfedin')}
            <span className="bento-arrow" aria-hidden="true"><UIIcon name="arrow-up-right"/></span>
          </span>
        </div>
      </Link>
    })}
  </BlurFade>
}
