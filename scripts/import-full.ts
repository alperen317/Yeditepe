import 'dotenv/config'
import {execFileSync} from 'node:child_process'
import { createReadStream } from 'node:fs'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createInterface } from 'node:readline'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { getPayload, type CollectionSlug, type RequiredDataFromCollectionSlug } from 'payload'
import { convertHTMLToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import { JSDOM } from 'jsdom'
import config from '../src/payload.config'
import {numericUploadIDs} from './lexical-utils'
import {legacyEventFields,legacyFacilitySummary,legacyReadingMinutes} from './body-legacy'

type Data = Record<string, unknown>
type Entry = { collection: CollectionSlug; source_key: string; identity: string; locale: 'tr' | 'en'; aliases: string[]; data: Data; body_html: string; relations: Record<string,string[]>; assets: string[]; field_assets: Record<string,string>; derived: { collection: CollectionSlug; source_key: string; data: Data; owner_field: string | null; field_assets?: Record<string,string>; parent_field?: string }[]; source_url: string }
type Asset = { url: string; path: string; sha256: string; mime: string; bytes: number }
const root = process.argv[2] || 'imports/full'
if (!process.env.DATABASE_URL?.startsWith('file:')) throw new Error('This importer is restricted to the local SQLite project.')
const payload = await getPayload({ config })
const editorConfig = await editorConfigFactory.default({ config: payload.config, parentIsLocalized: true })
const report = { staged: 0, created: {} as Record<string,number>, updated: {} as Record<string,number>, unchanged: 0, mediaCreated: 0, relationships: 0, errors: [] as Data[], unresolved: [] as Data[], completeDrupalMigration: false }
const cache = new Map<string,{ id: number | string; source_metadata?: Data | null }>()
const aliasMap = new Map<string,{ collection: CollectionSlug; id: number | string }>()
const mediaMap = new Map<string,{id:number;filename:string}>()
function errorDetail(e: unknown): string { const x=e as {message?:string;cause?:unknown}; return String(x.message||e).slice(0,500)+(x.cause?' | cause: '+String(x.cause).slice(0,500):'') }
const canon = (url: string) => url.split('#')[0].replace(/\/$/,'')
async function* lines(file: string) { const r=createInterface({input:createReadStream(file),crlfDelay:Infinity}); for await (const line of r) if(line.trim()) yield JSON.parse(line) }
const fields = new Map(Object.entries(payload.collections).map(([slug,c])=>[slug,new Set(c.config.fields.flatMap(f=>'name' in f?[f.name]:[]))]))
function filtered(collection: CollectionSlug, data: Data) { return Object.fromEntries(Object.entries(data).filter(([k,v])=>fields.get(collection)?.has(k)&&v!==undefined)) }
async function upsert(collection: CollectionSlug, key: string, data: Data, locale: 'tr' | 'en') {
  const old=cache.get(collection+':'+key)
  const meta=old?.source_metadata
  if(meta?.import_state==='reviewed') return old
  const merged = {...filtered(collection,data),source_key:key}
  if(old) {
    const doc=await payload.update({collection,id:old.id,locale,data:merged as RequiredDataFromCollectionSlug<CollectionSlug>,depth:0})
    cache.set(collection+':'+key,{id:doc.id,source_metadata:(doc as unknown as {source_metadata?:Data}).source_metadata})
    report.updated[collection]=(report.updated[collection]||0)+1
    return cache.get(collection+':'+key)!
  }
  const doc=await payload.create({collection,locale,data:merged as RequiredDataFromCollectionSlug<CollectionSlug>,depth:0})
  const result={id:doc.id,source_metadata:(doc as unknown as {source_metadata?:Data}).source_metadata};cache.set(collection+':'+key,result)
  report.created[collection]=(report.created[collection]||0)+1
  return result
}
async function saveReport(){await writeFile(path.join(root,process.env.ONLY_KEYS?'repair-import-report.json':'full-import-report.json'),JSON.stringify(report,null,2)+'\n')}
try {
  for(const collection of Object.keys(payload.collections) as CollectionSlug[]) {
    if(!fields.get(collection)?.has('source_key'))continue
    let page=1
    while(true){const res=await payload.find({collection,locale:'all',depth:0,limit:1000,page,select:{source_key:true,source_metadata:true}})
      for(const d of res.docs){const doc=d as unknown as {id:number|string;source_key?:string;source_metadata?:Data};if(doc.source_key)cache.set(collection+':'+doc.source_key,{id:doc.id,source_metadata:doc.source_metadata})}
      if(!res.hasNextPage)break;page++
    }
  }
  let assets:Record<string,Asset>={}
  try{assets=JSON.parse(await readFile(path.join(root,'asset-index.json'),'utf8'))}catch{}
  const hashes=new Map<string,{id:number;filename:string}>();let page=1
  while(true){const res=await payload.find({collection:'media',limit:1000,page,depth:0});for(const m of res.docs)if(m.source_sha256&&m.filename)hashes.set(m.source_sha256,{id:m.id,filename:m.filename});if(!res.hasNextPage)break;page++}
  for(const [url,a] of Object.entries(assets)) {
    try{
      let found=hashes.get(a.sha256)
      if(!found){const doc=await payload.create({collection:'media',data:{source_sha256:a.sha256,source_urls:Object.values(assets).filter(v=>v.sha256===a.sha256).map(v=>v.url),alt:path.basename(new URL(url).pathname)},filePath:a.path,depth:0});found={id:doc.id,filename:doc.filename!};hashes.set(a.sha256,found);report.mediaCreated++}
      mediaMap.set(url,found)
    }catch(e){report.errors.push({phase:'media',url,error:errorDetail(e)})}
  }
  for(const [url,a] of Object.entries(assets)){const found=hashes.get(a.sha256);if(found)mediaMap.set(url,found)}
  console.log(`Media ready: ${mediaMap.size} URL mappings, ${report.mediaCreated} new files`)
  // Stage every source page, including content that needs additional field mapping.
  const stageCache=new Map<string,{id:number;hash?:string;review?:string}>();page=1
  while(true){const res=await payload.find({collection:'migration-records',limit:1000,page,depth:0,select:{source_url:true,extraction:true,review_status:true}});for(const d of res.docs)stageCache.set(d.source_url,{id:d.id,hash:(d.extraction as {rendered_sha256?:string}|null)?.rendered_sha256,review:d.review_status||undefined});if(!res.hasNextPage)break;page++}
  for(const rawFile of [path.join(root,'records.jsonl'),'imports/extra/records.jsonl'])for await(const r of lines(rawFile)){try{const renderedHash=createHash('sha256').update(r.main_html).digest('hex');r.extraction.rendered_sha256=renderedHash;const old=stageCache.get(r.source_url);if(old?.review==='reviewed'||old?.hash===renderedHash){report.staged++;continue}
    const data=filtered('migration-records',{...r,review_status:'pending'});if(old)await payload.update({collection:'migration-records',id:old.id,data,depth:0});else {const d=await payload.create({collection:'migration-records',data:data as unknown as RequiredDataFromCollectionSlug<'migration-records'>,depth:0});stageCache.set(r.source_url,{id:d.id,hash:renderedHash})}report.staged++
  }catch(e){report.errors.push({phase:'stage',url:r.source_url,error:errorDetail(e)})}}
  let i=0
  for await(const e of lines(path.join(root,'normalized.jsonl')) as AsyncGenerator<Entry>){
    if(process.env.ONLY_KEYS&&!process.env.ONLY_KEYS.split(',').includes(e.source_key))continue
    try{
      const old=cache.get(e.collection+':'+e.source_key);const sources=(old?.source_metadata?.sources||{}) as Record<string,Data>;const incoming=(e.data.source_metadata as Data).sources as Record<string,Data>
      if(typeof e.data.spoken_languages==='string')e.data.spoken_languages=e.data.spoken_languages?[e.data.spoken_languages]:[]
      const data:Data={...e.data,source_metadata:{...old?.source_metadata,...e.data.source_metadata as Data,sources:{...sources,...incoming}}}
      // Keep original HTML for audit; replace only downloaded asset URLs with local upload URLs.
      let html=e.body_html
      for(const assetURL of e.assets){const m=mediaMap.get(assetURL);if(m){const local='/api/media/file/'+encodeURIComponent(m.filename);html=html.split(assetURL).join(local);try{const rel=new URL(assetURL).pathname+new URL(assetURL).search;html=html.split(rel).join(local)}catch{}}}
      if(fields.get(e.collection)?.has('body'))data.body=html
      if(fields.get(e.collection)?.has('content')){try{
        const dom=new JSDOM(html)
        for(const a of dom.window.document.querySelectorAll('a[href]')){const href=a.getAttribute('href')||'';try{const u=new URL(href,e.source_url);if(['https:','http:','mailto:','tel:'].includes(u.protocol))a.setAttribute('href',u.href);else a.removeAttribute('href')}catch{a.removeAttribute('href')}}
        for(const a of dom.window.document.querySelectorAll('a:not([href]),a[href=""]'))a.replaceWith(...Array.from(a.childNodes))
        for(const img of dom.window.document.querySelectorAll('img')){
          const src=img.getAttribute('src')||'';let asset=mediaMap.get(src)||mediaMap.get(new URL(src,e.source_url).href)
          if(!asset&&src.startsWith('/api/media/file/'))asset=[...mediaMap.values()].find(m=>m.filename===decodeURIComponent(src.split('/').pop()||''))
          if(asset){img.setAttribute('data-lexical-upload-id',String(asset.id));img.setAttribute('data-lexical-upload-relation-to','media')}
          else{if(img.getAttribute('alt'))img.replaceWith(dom.window.document.createTextNode(img.getAttribute('alt')!));else img.remove();report.unresolved.push({phase:'richtext-media',url:src,parent:e.source_url})}
        }
        data.content=numericUploadIDs(convertHTMLToLexical({editorConfig,html:dom.window.document.body.innerHTML,JSDOM}))
      }catch(err){report.errors.push({phase:'lexical',url:e.source_url,error:errorDetail(err)})}}
      for(const [field,url] of Object.entries(e.field_assets)){const m=mediaMap.get(url);if(m&&fields.get(e.collection)?.has(field))data[field]=m.id}
      // Populate presentation fields during import so the website never needs source HTML.
      if(e.collection==='events'){
        const source=legacyEventFields(html)
        if(!data.starts_at&&source.date)data.starts_at=source.date
        if(!data.cover_image&&source.filename){const filename=decodeURIComponent(source.filename);const asset=[...mediaMap.values()].find(m=>m.filename===filename);if(asset)data.cover_image=asset.id}
      }
      if(e.collection==='facilities'){
        const summary=legacyFacilitySummary(data.summary,data.seo_description,html,String(data.title||''),e.locale)
        if(summary)data.summary=summary
      }
      if(e.collection==='articles'&&!(typeof data.reading_minutes==='number'&&data.reading_minutes>0)){
        const minutes=legacyReadingMinutes(data.content,html);if(minutes)data.reading_minutes=minutes
      }
      const doc=await upsert(e.collection,e.source_key,data,e.locale)
      for(const url of e.aliases)if(doc)aliasMap.set(canon(url),{collection:e.collection,id:doc.id})
      const faqIDs:(number|string)[]=[];const derivedParentData:Data={}
      for(const child of e.derived){const d:Data={...child.data,source_metadata:{mode:'public_rendered',import_state:'needs_review',source_url:e.source_url}};if(child.owner_field&&doc)d[child.owner_field]=doc.id;for(const [field,url] of Object.entries(child.field_assets||{})){const m=mediaMap.get(url);if(m)d[field]=m.id}const result=await upsert(child.collection,child.source_key,d,e.locale);if(result&&child.collection==='faqs')faqIDs.push(result.id);if(result&&child.parent_field)derivedParentData[child.parent_field]=result.id}
      if(faqIDs.length&&fields.get(e.collection)?.has('faqs'))derivedParentData.faqs=faqIDs
      if(doc&&Object.keys(derivedParentData).length)await payload.update({collection:e.collection,id:doc.id,locale:e.locale,data:derivedParentData as RequiredDataFromCollectionSlug<CollectionSlug>,depth:0})
    }catch(err){report.errors.push({phase:'content',url:e.source_url,collection:e.collection,error:errorDetail(err)})}
    if(++i%100===0){await saveReport();console.log(`Content ${i}, errors ${report.errors.length}`)}
  }
  // Public menus keep their observed locale and order; no Drupal configuration is changed.
  const menus=JSON.parse(await readFile(path.join(root,'menus-public.json'),'utf8')) as {key:string;locale:'tr'|'en';items:{title:string;url:string;sort:number}[]}[]
  for(const m of menus){const menu=await upsert('menus','menu:'+m.key,{key:m.key,source_metadata:{mode:'public_rendered',import_state:'needs_review'}},m.locale);for(const item of m.items)await upsert('menu-items','menu-item:'+m.key+':'+createHash('sha256').update(item.url+item.title).digest('hex'),{...item,menu_id:menu?.id,status:'draft',source_metadata:{mode:'public_rendered',import_state:'needs_review'}},m.locale)}
  // Relations use the validated SQLite mapping, avoiding repeated localized array expansion.
  await saveReport();await writeFile(path.join(root,'url-id-map.json'),JSON.stringify(Object.fromEntries(aliasMap),null,2)+'\n');console.log(JSON.stringify(report))
}finally{await payload.destroy()}
console.log(execFileSync('python3',['scripts/link-local.py'],{encoding:'utf8'}))
