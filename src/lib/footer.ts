import 'server-only'
import {contentPreviewEnabled} from './previewState'
import {cms,type Locale} from './website'

export type FooterLink = {id:number;title:string;href:string}
const popularIDs=[1153,417,557,562,369,566,1132,72,577,880,889,470,893,892,726,1394,617,1076,897,356,1399,593,826,890]
const pageIDs=[9,11,16,86,89,90,95,100,101,116,119,123,124,129,134]
export async function footerData(locale:Locale){
 const payload=await cms();const preview=await contentPreviewEnabled()
 const find=async(collection:'pages'|'articles',ids:number[]):Promise<FooterLink[]>=>{
  const {docs}=await payload.find({collection,locale,fallbackLocale:false,depth:0,limit:ids.length,overrideAccess:true,select:{title:true,slug:true},where:{and:[{id:{in:ids}},...(preview?[]:[{status:{equals:'published'}}])]}})
  return docs.flatMap(doc=>doc.title&&doc.slug?[{id:doc.id,title:doc.title,href:(locale==='en'?'/en/':'/')+doc.slug}]:[]).sort((a,b)=>ids.indexOf(a.id)-ids.indexOf(b.id))
 }
 const [pages,popular]=await Promise.all([find('pages',pageIDs),find('articles',popularIDs)])
 return {pages,popular}
}
