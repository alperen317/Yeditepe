import 'dotenv/config'
import assert from 'node:assert/strict'
import { getPayload } from 'payload'
import {readFile} from 'node:fs/promises'
import { convertHTMLToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import { JSDOM } from 'jsdom'
import {numericUploadIDs} from './lexical-utils'
process.env.DATABASE_URL='file:./imports/verification.db'
const {default:config}=await import('../src/payload.config')
const p=await getPayload({config})
try{
 const editorConfig=await editorConfigFactory.default({config:p.config,parentIsLocalized:true})
 const converted=convertHTMLToLexical({editorConfig,html:'<h2>Başlık / Heading</h2><p>Türkçe <strong>kalın</strong> ve English.</p><ul><li>Birinci madde</li></ul>',JSDOM})
 const json=JSON.stringify(converted);assert(json.includes('Türkçe'));assert(json.includes('heading'));assert(json.includes('Birinci madde'));assert(json.includes('list'))
 const linkTest=convertHTMLToLexical({editorConfig,html:'<p><a href="https://yeditepehastaneleri.com/en">English</a> <a href="mailto:info@example.com">Email</a> <a href="tel:+902160000000">Phone</a></p>',JSDOM});await p.create({collection:'articles',locale:'tr',data:{title:'Link converter test',content:linkTest},depth:0});
 const index=JSON.parse(await readFile('imports/full/asset-index.json','utf8'));const asset=Object.values(index)[0] as {path:string};const image=await p.create({collection:'media',filePath:asset.path,data:{alt:'Test'},depth:0});const withImage=convertHTMLToLexical({editorConfig,html:`<p>Görsel</p><img data-lexical-upload-relation-to="media" data-lexical-upload-id="${image.id}" />`,JSDOM});await p.create({collection:'articles',locale:'tr',data:{title:'Converter test',content:numericUploadIDs(withImage)},depth:0});assert(JSON.stringify(withImage).includes('upload'));console.log('PASS: official HTML-to-Lexical converter retains headings, multilingual text and lists')
}finally{await p.destroy()}
