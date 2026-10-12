import {PreviewText} from './PreviewFields'
import {UIIcon} from './UIIcon'
import Link from 'next/link'
import {routes,type Locale} from '../lib/website'
import type {FooterLink} from '../lib/footer'
import {InteractiveHoverButton} from './InteractiveHoverButton'

export function PopularContent({locale,items}:{locale:Locale;items:FooterLink[]}){
 if(!items.length)return null
 const en=locale==='en'
 return <section className="popular-content-section popular-content-featured" aria-labelledby="popular-content-heading"><div className="container"><div className="popular-feature-panel">
  <div className="popular-content-heading"><span className="popular-feature-icon" aria-hidden="true"><svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5h22v30H9zM14 12h12M14 26h12M14 30h8M23 18h3M23 22h3M14 18h5v5h-5z"/></svg></span><span className="popular-feature-line" aria-hidden="true"/><p className="eyebrow">{en?'HEALTH & KNOWLEDGE':'SAĞLIK VE BİLGİ'}</p><h2 id="popular-content-heading">{en?'Popular topics':'Popüler içerikler'}</h2><p className="popular-feature-intro">{en?'Explore the health topics you want to know more about.':'Sağlıklı yaşam için merak ettiğiniz konuları keşfedin.'}</p><Link className="popular-feature-all" href={routes(locale).articles}>{en?'All articles':'Tüm içerikler'}<UIIcon name="arrow-up-right"/></Link></div>
  <nav aria-label={en?'Popular health topics':'Popüler sağlık içerikleri'}><ul className="popular-content-links">{items.slice(0,10).map(item=><li key={item.id}><Link href={item.href}><span className="popular-feature-dot" aria-hidden="true"/><span><PreviewText kind="articles" id={item.id} field="title">{item.title}</PreviewText></span><span className="popular-link-arrow" aria-hidden="true"><UIIcon name="arrow-up-right"/></span></Link></li>)}</ul></nav>
 </div></div></section>
}
const socialLinks=[
 {name:'Instagram',symbol:'◎',href:'https://www.instagram.com/yeditepeunihst'},
 {name:'YouTube',symbol:'▶',href:'https://www.youtube.com/channel/UCzFc9zkqW3lhobCgozFXH4w'},
 {name:'LinkedIn',symbol:'in',href:'https://www.linkedin.com/company/yeditepeunihst/'},
 {name:'Facebook',symbol:'f',href:'https://www.facebook.com/yeditepeunihst/'},
 {name:'X',symbol:'𝕏',href:'https://x.com/yeditepeunihst'},
]
export function WebsiteFooter({locale,phone,pages}:{locale:Locale;phone?:string|null;pages:FooterLink[]}){
 const en=locale==='en',r=routes(locale)
 const selected=(ids:number[])=>ids.flatMap(id=>{const page=pages.find(p=>p.id===id);return page?[{...page,title:id===95?(en?'Frequently asked questions':'Sıkça sorulan sorular'):id===100?(en?'Careers':'İnsan kaynakları'):page.title}]:[]})
 const groups=[
  {title:en?'Corporate':'Kurumsal',links:selected([86,89,16,100,11])},
  {title:en?'Quick access':'Hızlı erişim',links:[{id:1,title:en?'Our hospitals':'Hastanelerimiz',href:r.hospitals},{id:2,title:en?'Our doctors':'Doktorlarımız',href:r.doctors},{id:3,title:en?'Medical units':'Tıbbi birimler',href:r.units},...selected([9])]},
  {title:en?'Health & knowledge':'Sağlık ve bilgi',links:[{id:1,title:en?'Health guide':'Sağlık rehberi',href:r.articles},{id:2,title:en?'Health videos':'Sağlıklı videolar',href:r.videos},{id:3,title:en?'Our events':'Etkinliklerimiz',href:r.events},...selected([95])]},
  {title:en?'For patients':'Hastalar için',links:[...selected([101,116,129,90,119]),{id:160,title:en?'Medical technologies':'Medikal teknolojiler',href:en?'/en/medical-technology':'/medikal-teknoloji'}]},
 ]
 return <footer className="hospital-footer"><div className="container">
  <div className="hospital-footer-brandrow"><Link className="hospital-footer-logo" href={r.home} aria-label={en?'Yeditepe home page':'Yeditepe ana sayfa'}><img src="/brand/03_logo_yatay_beyaz_seffaf.svg" width="796" height="159" alt="Yeditepe Üniversitesi Hastaneleri" loading="lazy"/></Link><p>{en?'The trusted name in healthcare.':'Sağlıkta güvenilirliğin adresi.'}</p><a className="footer-back-top" href="#main-content">{en?'Back to top':'Yukarı dön'}<span aria-hidden="true"><UIIcon name="arrow-up"/></span></a></div>
  <div className="hospital-footer-columns">{groups.map(group=><nav key={group.title} aria-label={group.title}><h2>{group.title}</h2><ul>{group.links.map(link=><li key={link.id}><Link href={link.href}>{pages.some(page=>page.id===link.id&&page.href===link.href)?<PreviewText kind="pages" id={link.id} field="title">{link.title}</PreviewText>:link.title}</Link></li>)}</ul></nav>)}
   <div className="hospital-footer-contact"><h2>{en?'Contact':'İletişim'}</h2>{phone&&<a className="hospital-footer-phone" href={'tel:'+phone.replace(/[^+\d]/g,'')}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m7 3 3 5-2 2c1 3 3 5 6 6l2-2 5 3c0 3-2 4-4 4C9 20 4 15 3 7c0-2 1-4 4-4Z"/></svg><PreviewText kind="homepage" field="phone">{phone}</PreviewText></a>}<a className="hospital-footer-email" href="mailto:infohastane@yeditepe.edu.tr">infohastane@yeditepe.edu.tr</a>{selected([134]).map(page=><Link key={page.id} href={page.href}>{en?'Contact details':'İletişim bilgileri'} <span aria-hidden="true"><UIIcon name="arrow-up-right"/></span></Link>)}<p>{en?'Istanbul, Türkiye':'İstanbul, Türkiye'}</p><h2 className="footer-social-heading">{en?'Follow us':'Bizi takip edin'}</h2><div className="hospital-footer-social">{socialLinks.map(social=><a key={social.name} href={social.href} target="_blank" rel="noopener noreferrer" aria-label={social.name}><span aria-hidden="true">{social.symbol}</span></a>)}</div></div>
  </div>
  <div className="hospital-footer-bottom"><span>© {new Date().getFullYear()} {en?'Yeditepe University Hospitals':'Yeditepe Üniversitesi Hastaneleri'}</span><nav aria-label={en?'Legal and language':'Yasal bilgiler ve dil'}>{selected([123,124]).map(page=><Link key={page.id} href={page.href}>{page.id===123?(en?'Privacy & cookies':'Gizlilik ve çerezler'):(en?'Personal data':'KVKK')}</Link>)}<Link href={en?'/':'/en'} lang={en?'tr':'en'}>{en?'Türkçe':'English'} <span aria-hidden="true"><UIIcon name="arrow-up-right"/></span></Link></nav></div>
 </div></footer>
}
