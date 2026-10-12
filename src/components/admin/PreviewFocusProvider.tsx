'use client'
import {useEffect,type ReactNode} from 'react'
import {usePathname,useRouter,useSearchParams} from 'next/navigation'
import editableFields from '../../lib/previewEditableFields.json'
import {previewCollections} from '../../lib/previewURLs'

export function PreviewFocusProvider({children}:{children:ReactNode}){
 const pathname=usePathname(),router=useRouter(),query=useSearchParams()
 useEffect(()=>{
  let timer:ReturnType<typeof setTimeout>|undefined,stop:ReturnType<typeof setTimeout>|undefined,observer:MutationObserver|undefined
  const selectField=(field:string)=>{
   if(!/^\w+(\.\w+)*$/.test(field))return
   observer?.disconnect();clearTimeout(stop)
   const attempt=()=>{
    const input=document.getElementById(`field-${field.replace(/\./g,'__')}`)
    const label=document.querySelector<HTMLLabelElement>(`label[for="field-${CSS.escape(field)}"]`)
    const richText=document.querySelector<HTMLElement>(`[data-field-path="${CSS.escape(field)}"]`)
    const container=richText||input?.closest<HTMLElement>('.field-type')||label?.closest<HTMLElement>('.field-type')||input
    if(!container)return false
    // Reveal a collapsed field group before scrolling and focusing its editor.
    let ancestor:HTMLElement|null=container.parentElement
    while(ancestor){if(ancestor instanceof HTMLDetailsElement)ancestor.open=true;ancestor=ancestor.parentElement}
    if(!container.getClientRects().length)return false
    container.scrollIntoView({behavior:'smooth',block:'center'})
    const editable=container.matches('input,textarea,[contenteditable="true"]')?container:container.querySelector<HTMLElement>('input:not([type="hidden"]):not([disabled]),textarea:not([disabled]),[contenteditable="true"],[role="combobox"],button')
    editable?.focus({preventScroll:true})
    document.querySelectorAll('.preview-focused-field').forEach(node=>node.classList.remove('preview-focused-field'))
    container.classList.add('preview-focused-field')
    clearTimeout(timer);timer=setTimeout(()=>container.classList.remove('preview-focused-field'),1800)
    return true
   }
   if(attempt())return
   observer=new MutationObserver(()=>{if(attempt()){observer?.disconnect();clearTimeout(stop)}})
   observer.observe(document.body,{subtree:true,childList:true})
   stop=setTimeout(()=>observer?.disconnect(),10000)
  }
  const focus=(event:MessageEvent)=>{
   const frame=document.querySelector<HTMLIFrameElement>('#live-preview-iframe')
   if(event.origin!==window.location.origin||event.source!==frame?.contentWindow||event.data?.type!=='yeditepe-preview-focus')return
   const {field,kind,id}=event.data
   if(typeof field!=='string'||!/^\w+(\.\w+)*$/.test(field))return
   const validKind=kind==='homepage'||previewCollections.includes(kind)
   if(kind&&!validKind)return
   if(kind&&!(editableFields as Record<string,string[]>)[kind]?.includes(field))return
   if(kind&&kind!=='homepage'&&(typeof id!=='string'||!/^\d+$/.test(id)))return
   const destination=kind?kind==='homepage'?'/admin/globals/homepage':`/admin/collections/${kind}/${id}`:pathname
   if(destination!==pathname){
    const params=new URLSearchParams({previewField:field})
    const locale=query.get('locale');if(locale)params.set('locale',locale)
    router.push(destination+'?'+params.toString())
   }else selectField(field)
  }
  const initialField=query.get('previewField');if(initialField)selectField(initialField)
  window.addEventListener('message',focus)
  return()=>{window.removeEventListener('message',focus);clearTimeout(timer);clearTimeout(stop);observer?.disconnect()}
 },[pathname,query,router])
 return children
}
