import {draftMode} from 'next/headers'
import {NextRequest,NextResponse} from 'next/server'
import {getPayload} from 'payload'
import config from '../../../payload.config'
import {previewCollections,previewPath,type PreviewCollection} from '../../../lib/previewURLs'
export async function GET(request:NextRequest){
 const payload=await getPayload({config})
 const {user}=await payload.auth({headers:request.headers})
 if(!user)return new Response('Ön izleme için Payload yönetim paneline giriş yapın.',{status:401})
 const params=request.nextUrl.searchParams,locale=params.get('locale')==='en'?'en':'tr'
 let path:string|null=null
 if(params.get('global')==='homepage')path=previewPath({},locale,'homepage')
 else {
  const collection=params.get('collection')||'',id=params.get('id')||''
  if(!previewCollections.includes(collection as PreviewCollection)||!/^\d+$/.test(id))return new Response('Geçersiz ön izleme isteği.',{status:400})
  try{
   const doc=await payload.findByID({collection:collection as PreviewCollection,id:Number(id),locale,fallbackLocale:false,depth:0,user,overrideAccess:false})
   path=previewPath(doc as unknown as Record<string,unknown>,locale,collection)
  }catch{return new Response('İçerik bulunamadı.',{status:404})}
 }
 if(!path)return new Response('Bu dilde ön izlenebilir bir sayfa bulunamadı.',{status:404})
 ;(await draftMode()).enable()
 const response=new NextResponse(null,{status:307,headers:{Location:path+'?'+new URLSearchParams({__preview:params.get('global')==='homepage'?'homepage':params.get('collection')||'',...(params.get('id')?{__preview_id:params.get('id')!}:{})}).toString()}})
 response.cookies.set('yeditepe-preview-target',JSON.stringify({kind:params.get('global')==='homepage'?'homepage':params.get('collection'),id:params.get('id')||undefined}),{httpOnly:true,sameSite:'lax',secure:request.nextUrl.protocol==='https:',path:'/'})
 response.headers.set('Cache-Control','private, no-store')
 return response
}
