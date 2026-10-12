import {headers,cookies} from 'next/headers'
import React from 'react'
import {previewSession} from '../../lib/previewState'
import {PreviewProvider} from '../../components/PreviewFields'
import './styles.css'
export const metadata={title:{default:'Yeditepe Üniversitesi Hastaneleri',template:'%s | Yeditepe'},description:'Yeditepe Üniversitesi Hastaneleri — hastanelerimiz, doktorlarımız, tıbbi birimlerimiz ve sağlık rehberimiz.',alternates:{languages:{tr:'/',en:'/en'}}}
export default async function RootLayout({children}:{children:React.ReactNode}){
 const requestHeaders=await headers()
 const locale=requestHeaders.get('x-website-locale')==='en'?'en':'tr'
 let target:{kind:string;id?:string}|null=null
 if(requestHeaders.get('x-website-admin-preview')==='1'&&await previewSession())try{target=JSON.parse((await cookies()).get('yeditepe-preview-target')?.value||'null')}catch{}
 return <html lang={locale}><body>{target?<PreviewProvider locale={locale} target={target}>{children}</PreviewProvider>:children}</body></html>
}
