import 'server-only'
import {cache} from 'react'
import {draftMode,headers} from 'next/headers'
import {getPayload} from 'payload'
import config from '../payload.config'
export const previewSession=cache(async()=>{
 if(!(await draftMode()).isEnabled)return false
 const payload=await getPayload({config})
 const {user}=await payload.auth({headers:await headers()})
 return Boolean(user)
})
export const contentPreviewEnabled=async()=>process.env.NODE_ENV==='development'||await previewSession()
