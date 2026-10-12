import Link from 'next/link'
import {UIIcon} from './UIIcon'
import {accreditations} from '../lib/accreditations'
export function AccreditationsV2({locale}:{locale:'tr'|'en'}){
 const en=locale==='en'
 return <section className="v2-accreditations container" aria-labelledby="v2-accreditations-title"><div className="v2-accreditation-heading"><span className="v2-quality-mark" aria-hidden="true"><svg viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m14 2 9 4v7c0 6-4 10-9 13-5-3-9-7-9-13V6l9-4Z"/><path d="m9 13 3 3 7-7"/></svg></span><h2 id="v2-accreditations-title">{en?'Patient safety & documented quality':'Hasta güvenliği ve belgelenmiş kalite'}</h2><Link className="v2-all-certificates" href={en?'/en/documented-quality':'/belgelenmis-kalite'}>{en?'View all':'Tüm belgeler'}<UIIcon name="arrow-up-right"/></Link></div><div className="v2-accreditation-grid">{accreditations[locale].map(item=><Link href={item.href} className="v2-accreditation-card" key={item.code+item.edition}><span className={`v2-certificate-mark ${item.code==='SAS'?'is-gold':''}`} aria-hidden="true"><span>{item.code}</span><small>{item.edition}</small></span><div><span className="v2-certificate-category">{item.category}</span><h3>{item.title}</h3></div><UIIcon name="arrow-up-right"/></Link>)}</div></section>
}
