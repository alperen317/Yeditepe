import {ImageLightbox} from './ImageLightbox'
import {createElement} from 'react'
import {RichText, type JSXConvertersFunction} from '@payloadcms/richtext-lexical/react'
import type {SerializedEditorState} from 'lexical'

type Node = {type: string; children?: Node[]}
const inlineTypes = new Set(['text', 'linebreak', 'tab', 'link', 'autolink'])
function containsBlock(nodes: Node[]): boolean {
  return nodes.some(node => !inlineTypes.has(node.type) || containsBlock(node.children || []))
}

// Imported HTML links may contain entire paragraphs or media. Their outer
// Lexical paragraph needs a flow container, since <p> accepts inline content only.
const converters: JSXConvertersFunction = ({defaultConverters}) => ({
  ...defaultConverters,
  list: args => {
    if((args.node as unknown as {detailGallery?:boolean}).detailGallery)return <ul className="detail-gallery">{args.nodesToJSX({nodes:args.node.children})}</ul>
    const convert=defaultConverters.list
    return typeof convert==='function'?convert(args):convert
  },
  paragraph: args => {
    const facts=(args.node as unknown as {detailFacts?:{label:string;value:string}[]}).detailFacts
    if(facts)return <dl className="detail-academic-facts">{facts.map((fact,i)=><div key={i}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl>
    if (!containsBlock(args.node.children as Node[])) {
      const convert = defaultConverters.paragraph
      return typeof convert === 'function' ? convert(args) : convert
    }
    return <div className="rich-text-flow">{args.nodesToJSX({nodes: args.node.children})}</div>
  },
  heading: args => {
    const anchor=(args.node as unknown as {detailAnchor?:string}).detailAnchor
    if(anchor&&!containsBlock(args.node.children as Node[]))return createElement(args.node.tag,{id:anchor},args.nodesToJSX({nodes:args.node.children}))
    if (!containsBlock(args.node.children as Node[])) {
      const convert = defaultConverters.heading
      return typeof convert === 'function' ? convert(args) : convert
    }
    const level = Number(args.node.tag.slice(1)) || 1
    return <div id={anchor} className={`rich-text-flow rich-text-heading-${level}`} role="heading" aria-level={level}>
      {args.nodesToJSX({nodes: args.node.children})}
    </div>
  },
})

export function ContentRichText({data,zoomImages=false,locale='tr'}: {data: SerializedEditorState;zoomImages?:boolean;locale?:'tr'|'en'}) {
  const zoomConverters:JSXConvertersFunction=args=>({
    ...converters(args),
    upload: uploadArgs=>{
      const media=uploadArgs.node.value as {url?:string;mimeType?:string;alt?:string}|undefined
      if(media&&typeof media==='object'&&media.url&&media.mimeType?.startsWith('image/'))return <ImageLightbox src={media.url} alt={media.alt||(locale==='en'?'Event image':'Etkinlik görseli')} locale={locale}/>
      const convert=args.defaultConverters.upload
      return typeof convert==='function'?convert(uploadArgs):convert
    },
  })
  return <RichText data={data} converters={zoomImages?zoomConverters:converters}/>
}
