/** Regression: preview sorting and repeated resize/scroll events must settle. */
import assert from 'node:assert/strict'
import React,{act} from 'react'
import {JSDOM} from 'jsdom'
import {ContentCarousel} from '../src/components/ContentCarousel'
import {PreviewProvider} from '../src/components/PreviewFields'
const dom=new JSDOM('<div id="root"></div>',{url:'http://127.0.0.1:3000/'})
let observations=0
const callbacks=new Set<()=>void>()
class ResizeObserverMock{
 constructor(private callback:()=>void){}
 observe(){observations++;callbacks.add(this.callback)}
 disconnect(){callbacks.delete(this.callback)}
}
Object.assign(globalThis,{React,window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,ResizeObserver:ResizeObserverMock,IS_REACT_ACT_ENVIRONMENT:true})
const {createRoot}=await import('react-dom/client')
const root=createRoot(document.getElementById('root')!)
const cards=[<article key="1" data-facility-id={1}>One</article>,<article key="2" data-facility-id={2}>Two</article>]
await act(async()=>root.render(<PreviewProvider target={{kind:'homepage'}} locale="tr"><ContentCarousel label="Hospitals" locale="tr" className="facility-carousel">{cards}</ContentCarousel></PreviewProvider>))
await act(async()=>window.dispatchEvent(new dom.window.MessageEvent('message',{origin:window.location.origin,source:dom.window as unknown as Window,data:{type:'payload-live-preview',globalSlug:'homepage',data:{featuredFacilities:[]}}})))
const track=document.querySelector('.carousel-track') as HTMLElement
Object.defineProperties(track,{scrollWidth:{value:1000,configurable:true},clientWidth:{value:400,configurable:true},scrollLeft:{value:0,writable:true,configurable:true}})
await act(async()=>{for(const callback of callbacks)callback()})
const settled=observations
await act(async()=>{for(let i=0;i<30;i++){for(const callback of callbacks)callback();track.dispatchEvent(new dom.window.Event('scroll'))}})
assert.equal(observations,settled,'Unchanged measurements must not reinstall observers')
track.scrollLeft=600
await act(async()=>track.dispatchEvent(new dom.window.Event('scroll')))
assert.equal(document.querySelector('button[aria-label="Önceki içerikler"]')?.hasAttribute('disabled'),false)
assert.equal(document.querySelector('button[aria-label="Sonraki içerikler"]')?.hasAttribute('disabled'),true)
assert.equal(track.children.length,2)
await act(async()=>root.unmount());assert.equal(callbacks.size,0);dom.window.close()
console.log('PASS: preview carousel settles; repeated measurements, scroll edges and observer cleanup')
