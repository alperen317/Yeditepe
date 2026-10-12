import {draftMode} from 'next/headers'
import {NextRequest,NextResponse} from 'next/server'
export async function POST(request:NextRequest){
 const origin=request.headers.get('origin'),host=request.headers.get('host')
 if(!origin||!host||origin!==`${request.nextUrl.protocol}//${host}`)return new Response('Forbidden',{status:403})
 const form=await request.formData(),raw=form.get('path')
 const path=typeof raw==='string'&&raw.startsWith('/')&&!raw.startsWith('//')&&!/[\\?#]/.test(raw)&&!raw.startsWith('/api/')?raw:'/'
 ;(await draftMode()).disable()
 const response=new NextResponse(null,{status:303,headers:{Location:path}})
 response.cookies.delete('yeditepe-preview-target')
 return response
}
