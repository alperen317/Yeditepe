import 'server-only'
import {bannerCopy} from './bannerPresentation'
import {latestVideoIDs} from './latestVideos'
import {contentPreviewEnabled} from './previewState'
import {eventPresentation} from './eventPresentation'
import {relatedTitles, readingMinutes, articleAuthor, facilityDescription, directionsURL} from './cardPresentation'
import { getPayload, type CollectionSlug, type Where } from 'payload'
import config from '../payload.config'
export type Locale = 'tr' | 'en'
export type Card = { id: number; title: string; href: string; titleField?: string; descriptionField?: string; imageField?: string; image?: string; description?: string; specialties?: string[]; hospitals?: string[]; location?: string; directions?: string; category?: string; readingMinutes?: number; author?: string; authorRole?: 'author' | 'reviewer' }
export const isPreview = process.env.NODE_ENV === 'development'
export const cms = () => getPayload({ config })
export const localHref = (url: string, locale: Locale) => {
  try { const u = new URL(url, 'https://yeditepehastaneleri.com'); if(u.hostname === 'yeditepehastaneleri.com') return u.pathname + u.search + u.hash; return /^https?:$/.test(u.protocol) ? u.href : '#' } catch { return locale === 'en' ? '/en' : '/' }
}
export const textOnly = (html: string) => html.replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim()
export async function cards(collection: CollectionSlug, locale: Locale, limit = 6, ids?: number[], extraWhere?: Where): Promise<Card[]> {
  const p=await cms();const preview=await contentPreviewEnabled()
  const result=await p.find({ collection, locale, fallbackLocale:false, depth:1, limit, overrideAccess:true,
    where:{and:[...(preview?[]:[{status:{equals:'published'}}]),...(ids?.length?[{id:{in:ids}}]:[]),...(extraWhere?[extraWhere]:[])]},
    populate:{'medical-units':{title:true},facilities:{title:true},categories:{title:true},doctors:{display_name:true,full_name:true}},
    select:{title:true,full_name:true,display_name:true,slug:true,summary:true,cover_image:true,photo:true,seo_description:true,...(collection==='doctors'?{facilities:true,medical_units:true}:{}),...(collection==='facilities'?{address:true,google_maps_url:true}:{}),...(collection==='articles'?{categories:true,reading_minutes:true,doctors:true,reviewer_id:true,content:true}:{})}, sort:'sort' })
  const list=result.docs.map(raw=>{
    const d=raw as unknown as Record<string,unknown>; const image=(d.cover_image||d.photo) as {url?:string}|null
    const title=String(d.title||d.display_name||d.full_name||'')
    const card:Card={id:Number(d.id),title,titleField:d.title?'title':d.display_name?'display_name':'full_name',descriptionField:typeof d.summary==='string'?'summary':'seo_description',href:(locale==='en'?'/en/':'/')+String(d.slug||''),image:image?.url,description:typeof d.summary==='string'?textOnly(d.summary):typeof d.seo_description==='string'?d.seo_description:''}
    if(collection==='doctors'){card.specialties=relatedTitles(d.medical_units);card.hospitals=relatedTitles(d.facilities)}
    if(collection==='facilities'){
      card.description=facilityDescription(d.summary,d.seo_description,locale)
      card.location=typeof d.address==='string'?d.address:undefined
      card.directions=directionsURL(d.google_maps_url,d.address,title)
    }
    if(collection==='articles'){
      card.category=relatedTitles(d.categories)[0]
      card.readingMinutes=typeof d.reading_minutes==='number'&&d.reading_minutes>0?Math.ceil(d.reading_minutes):readingMinutes(d.content)
      Object.assign(card,articleAuthor(d.doctors,d.reviewer_id))
    }
    return card
  }).filter(d=>d.title&&d.href!=='/'&&d.href!=='/en/')
  return ids?.length ? list.sort((a,b)=>ids.indexOf(a.id)-ids.indexOf(b.id)):list
}
// Include records available only in the other language, linking to that language's detail page.
export async function allCards(collection:CollectionSlug,locale:Locale):Promise<Card[]> {
  const [primary,other]=await Promise.all([cards(collection,locale,0),cards(collection,locale==='tr'?'en':'tr',0)])
  const ids=new Set(primary.map(card=>card.id))
  const merged=[...primary,...other.filter(card=>!ids.has(card.id))]
  if(collection==='facilities'){for(const card of merged){const alternate=other.find(item=>item.id===card.id);if(!card.location&&alternate?.location){card.location=alternate.location;card.directions=alternate.directions}}}
  return merged
}
export async function homepageDoctors(locale:Locale):Promise<Card[]> {
  const where:Where={show_on_homepage:{equals:true}}
  const [primary,other]=await Promise.all([cards('doctors',locale,10,undefined,where),cards('doctors',locale==='tr'?'en':'tr',10,undefined,where)])
  const ids=new Set(primary.map(card=>card.id))
  return [...primary,...other.filter(card=>!ids.has(card.id))].slice(0,10)
}
export async function homepageEvents(locale:Locale):Promise<(Card&{date?:string})[]> {
 const p=await cms();const preview=await contentPreviewEnabled()
 const result=await p.find({collection:'events',locale,fallbackLocale:false,depth:1,limit:0,overrideAccess:true,
  where:{and:[...(preview?[]:[{status:{equals:'published'}}]),{slug:{exists:true}}]},
  select:{title:true,slug:true,starts_at:true,cover_image:true},sort:'sort'})
 return result.docs.filter(d=>d.title&&d.slug).map(d=>({id:d.id,title:d.title||'',href:(locale==='en'?'/en/':'/')+d.slug,...eventPresentation(d as unknown as Record<string,unknown>)}))
  .sort((a,b)=>(b.date?Date.parse(b.date):-Infinity)-(a.date?Date.parse(a.date):-Infinity)).slice(0,3)
}
export async function homepageVideos(locale:Locale):Promise<(Card&{duration?:string})[]> {
  const p=await cms();const preview=await contentPreviewEnabled()
  const find=async(language:Locale)=>{
    const result=await p.find({collection:'videos',locale:language,fallbackLocale:false,depth:1,limit:latestVideoIDs.length,overrideAccess:true,sort:'-id',
      where:{and:[...(preview?[]:[{status:{equals:'published'}}]),{title:{exists:true}},{slug:{exists:true}},{provider_video_id:{exists:true}},{id:{in:latestVideoIDs}}]},
      select:{title:true,slug:true,thumbnail:true,provider:true,provider_video_id:true,duration_seconds:true}})
    return result.docs.sort((a,b)=>latestVideoIDs.indexOf(a.id)-latestVideoIDs.indexOf(b.id)).flatMap(video=>{
      if(!video.title||!video.slug||!video.provider_video_id)return []
      const thumbnail=typeof video.thumbnail==='object'?video.thumbnail?.url:undefined
      const youtube=video.provider==='youtube'&&/^[\w-]{11}$/.test(video.provider_video_id)
      if(!youtube&&video.provider!=='vimeo')return []
      const seconds=video.duration_seconds
      return [{id:video.id,title:video.title,href:(language==='en'?'/en/':'/')+video.slug,
        imageField:thumbnail?'thumbnail':'provider_video_id',image:thumbnail||(youtube?`https://i.ytimg.com/vi/${video.provider_video_id}/hqdefault.jpg`:undefined),
        duration:typeof seconds==='number'&&seconds>0?`${Math.floor(seconds/60)}:${String(Math.floor(seconds%60)).padStart(2,'0')}`:undefined}]
    }).slice(0,10)
  }
  const primary=await find(locale)
  return primary.length?primary:find(locale==='en'?'tr':'en')
}
export const routes = (locale: Locale) => locale==='tr' ? {home:'/',doctors:'/doktorlar',units:'/tibbi-birimler',hospitals:'/hastaneler',articles:'/saglik-rehberi',corporate:'/kurumsal',events:'/etkinlikler',videos:'/videolar'} : {home:'/en',doctors:'/en/doctors',units:'/en/services',hospitals:'/en/hospitals',articles:'/en/health-guide',corporate:'/en/corporate',events:'/en/events',videos:'/en/videos'}
export async function homeData(locale: Locale) {
  const p=await cms();const preview=await contentPreviewEnabled()
  const h=await p.findGlobal({slug:'homepage',locale,fallbackLocale:false,depth:0,overrideAccess:true})
  const ids=(v:unknown)=>(Array.isArray(v)?v:[]).map(x=>typeof x==='object'?x.id:x) as number[]
  const slideIDs=ids(h.heroSlides)
  const [sliderResult,units,facilities,articles,doctors,events,trustPages,videos]=await Promise.all([
    p.find({collection:'sliders',locale,fallbackLocale:false,depth:1,limit:10,sort:'sort',overrideAccess:true,where:{and:[...(preview?[]:[{status:{equals:'published'}}]),...(slideIDs.length?[{id:{in:slideIDs}}]:[])]},select:{title:true,summary:true,desktop_image:true,mobile_image:true,link:true}}),
    cards('medical-units',locale,6,ids(h.featuredUnits)),allCards('facilities',locale),cards('articles',locale,3,ids(h.featuredArticles)),homepageDoctors(locale),homepageEvents(locale),cards('pages',locale,2,[86,16]),homepageVideos(locale),
  ])
  const slides=sliderResult.docs.filter(s=>s.title&&s.desktop_image&&typeof s.desktop_image==='object').map(s=>({id:s.id,...bannerCopy(s.title||'',s.summary||''),image:typeof s.desktop_image==='object'?s.desktop_image?.url||'':'',mobileImage:typeof s.mobile_image==='object'?s.mobile_image?.url||'':'',href:localHref(s.link||'',locale),width:typeof s.desktop_image==='object'?s.desktop_image?.width||720:720,height:typeof s.desktop_image==='object'?s.desktop_image?.height||440:440,mobileWidth:typeof s.mobile_image==='object'?s.mobile_image?.width||720:720,mobileHeight:typeof s.mobile_image==='object'?s.mobile_image?.height||440:440}))
  if(slideIDs.length)slides.sort((a,b)=>slideIDs.indexOf(a.id)-slideIDs.indexOf(b.id))
  const preferredFacilities=ids(h.featuredFacilities)
  facilities.sort((a,b)=>(preferredFacilities.includes(a.id)?preferredFacilities.indexOf(a.id):Infinity)-(preferredFacilities.includes(b.id)?preferredFacilities.indexOf(b.id):Infinity))
  const mediaURL=async(value:unknown)=>{
    const id=typeof value==='object'&&value!==null?(value as {id:number}).id:value
    if(typeof id!=='number')return undefined
    const media=await p.findByID({collection:'media',id,depth:0,overrideAccess:true})
    return media.url||undefined
  }
  const [heroVideo,heroVideoPoster]=await Promise.all([mediaURL(h.heroVideo),mediaURL(h.heroVideoPoster)])
  return {h,slides,units,facilities,articles,doctors,events,trustPages,videos,heroVideo,heroVideoPoster}
}
