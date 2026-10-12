import {plainText,readingMinutes} from '../src/lib/cardPresentation'
// Source HTML is used only during migration/import, never while rendering the site.
export function legacyEventFields(html:string){
 const raw=html.match(/<time\b[^>]*datetime=["']([^"']+)["']/i)?.[1]
 return {date:raw&&!Number.isNaN(Date.parse(raw))?new Date(raw).toISOString():undefined,
  filename:html.match(/<img\b[^>]*src=["']\/api\/media\/file\/([^"'?]+)[^"']*["']/i)?.[1]}
}
export function legacyFacilitySummary(summary:unknown,seo:unknown,html:string,title:string,locale:'tr'|'en'){
 if(typeof summary==='string'&&summary.trim())return undefined
 if(locale==='tr'&&typeof seo==='string'&&seo.trim())return plainText(seo).split(/(?<=[.!?])\s/)[0]
 const paragraphs=[...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map(m=>plainText(m[1])).filter(t=>t.length>70)
 const text=paragraphs.find(t=>t.includes(title))||paragraphs[0]||''
 return text?text.length>190?text.slice(0,187).replace(/\s+\S*$/,'')+'…':text:undefined
}
export function legacyReadingMinutes(content:unknown,html:string){
 const current=readingMinutes(content)
 if(current)return current
 const text=plainText(html)
 return text?Math.max(1,Math.ceil(text.split(/\s+/).length/200)):undefined
}
