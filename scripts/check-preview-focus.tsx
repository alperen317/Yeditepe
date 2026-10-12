/** Isolated DOM test: focus routing accepts only the live preview iframe. */
import assert from 'node:assert/strict'
import React,{act} from 'react'
import {JSDOM} from 'jsdom'
import {PreviewFocusProvider} from '../src/components/admin/PreviewFocusProvider'
const dom=new JSDOM('<div id="root"></div>',{url:'http://127.0.0.1:3000/admin'})
Object.assign(globalThis,{React,window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true,CSS:{escape:(value:string)=>value}})
const {createRoot}=await import('react-dom/client')
let scrolled:HTMLElement|null=null
Object.assign(dom.window.HTMLElement.prototype,{scrollIntoView(this:HTMLElement){scrolled=this}})
const root=createRoot(document.getElementById('root')!)
await act(async()=>root.render(<PreviewFocusProvider><iframe id="live-preview-iframe"/><div className="field-type"><input id="field-title"/></div><div className="field-type" data-field-path="content"><div contentEditable="true"/></div></PreviewFocusProvider>))
const frame=document.querySelector('iframe')!
const send=(field:string,origin='http://127.0.0.1:3000',source:Window=frame.contentWindow!)=>window.dispatchEvent(new dom.window.MessageEvent('message',{origin,source,data:{type:'yeditepe-preview-focus',field}}))
send('title','https://untrusted.example');assert.equal(scrolled,null)
send('title','http://127.0.0.1:3000',dom.window as unknown as Window);assert.equal(scrolled,null)
send('title');assert.equal(document.activeElement?.id,'field-title');assert.ok(document.querySelector('.preview-focused-field'))
send('content');assert.equal(document.activeElement?.getAttribute('contenteditable'),'true');assert.equal(document.querySelectorAll('.preview-focused-field').length,1)
send('title"]');assert.equal(document.activeElement?.getAttribute('contenteditable'),'true')
await act(async()=>root.unmount());dom.window.close()
console.log('PASS: iframe origin/source, title focus, rich text focus and invalid field rejection')
