import {NextResponse,type NextRequest} from 'next/server'
export function proxy(request:NextRequest){
 const headers=new Headers(request.headers)
 headers.set('x-website-locale',request.nextUrl.pathname==='/en'||request.nextUrl.pathname.startsWith('/en/')?'en':'tr')
 // An authenticated preview query selects the server context. The client also
 // requires a same-origin admin iframe before showing editing controls.
 headers.set('x-website-admin-preview',request.nextUrl.searchParams.has('__preview')?'1':'0')
 return NextResponse.next({request:{headers}})
}
export const config={matcher:['/((?!admin|api|_next|.*\\..*).*)']}
