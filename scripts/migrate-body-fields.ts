import 'dotenv/config'
import {DatabaseSync} from 'node:sqlite'
import {mkdir,writeFile} from 'node:fs/promises'
import {legacyEventFields,legacyFacilitySummary,legacyReadingMinutes} from './body-legacy'

// A local, sparse data migration: no content, source HTML, relationships tables or editor state is rewritten.
const url=process.env.DATABASE_URL
if(!url?.startsWith('file:'))throw new Error('Body migration is restricted to the local SQLite project.')
const apply=process.argv.includes('--apply'),db=new DatabaseSync(url.slice(5),{readOnly:!apply})
db.exec('PRAGMA busy_timeout = 10000; PRAGMA foreign_keys = ON;')
const report={mode:apply?'apply':'dry-run',examined:0,updates:0,fields:{} as Record<string,number>,unresolved:[] as string[],errors:[] as string[]}
type Row=Record<string,unknown>
type Plan={collection:'events'|'facilities'|'articles';id:number;locale:string;field:string;column:string;value:string|number}
const plans:Plan[]=[],globals=new Set<string>(),documents=new Set<string>()
function plan(collection:Plan['collection'],row:Row,field:string,column:string,value:string|number){
 const id=Number(row._parent_id),locale=String(row._locale)
 plans.push({collection,id,locale,field,column,value})
 const key=`${collection}.${field}`;report.fields[key]=(report.fields[key]||0)+1
 documents.add(`${collection}:${id}:${collection==='events'?'':locale}`)
}
try{
 if(apply)db.exec('BEGIN IMMEDIATE')
 const media=new Map(db.prepare('SELECT filename,id FROM media').all().map(row=>[String(row.filename),Number(row.id)]))
 const events=db.prepare("SELECT l.*,e.starts_at,e.cover_image_id AS cover_image FROM events_locales l JOIN events e ON e.id=l._parent_id ORDER BY CASE l._locale WHEN 'tr' THEN 0 ELSE 1 END,l.id").all() as Row[]
 for(const row of events){
  if(typeof row.body!=='string'||!row.body)continue
  report.examined++
  const source=legacyEventFields(row.body)
  for(const [field,column,value] of [['starts_at','starts_at',source.date],['cover_image','cover_image_id',source.filename?media.get(decodeURIComponent(source.filename)):undefined]] as const){
   const key=`${row._parent_id}:${field}`
   if(!row[field]&&value&&!globals.has(key)){plan('events',row,field,column,value);globals.add(key)}
  }
  if(!row.cover_image&&source.filename&&!media.has(decodeURIComponent(source.filename)))report.unresolved.push(`events:${row._parent_id}:${row._locale}:cover_image`)
 }
 for(const row of db.prepare('SELECT * FROM facilities_locales').all() as Row[]){
  if(typeof row.body!=='string'||!row.body)continue
  report.examined++
  const value=legacyFacilitySummary(row.summary,row.seo_description,row.body,String(row.title||''),row._locale==='en'?'en':'tr')
  if(value)plan('facilities',row,'summary','summary',value)
 }
 for(const row of db.prepare('SELECT _parent_id,_locale,body,content,reading_minutes FROM articles_locales').all() as Row[]){
  if(typeof row.body!=='string'||!row.body)continue
  report.examined++
  if(typeof row.reading_minutes==='number'&&row.reading_minutes>0)continue
  const content=typeof row.content==='string'?JSON.parse(row.content):row.content
  const value=legacyReadingMinutes(content,row.body)
  if(value)plan('articles',row,'reading_minutes','reading_minutes',value)
 }
 if(report.unresolved.length)throw new Error('Unresolved media references; no updates applied.')
 if(apply){
  const now=new Date().toISOString()
  for(const p of plans){
   // Collection/column identifiers come only from the fixed calls above; all values are bound parameters.
   if(p.collection==='events')db.prepare(`UPDATE events SET ${p.column}=?,updated_at=? WHERE id=? AND ${p.column} IS NULL`).run(p.value,now,p.id)
   else{
    const condition=p.field==='summary'?"(summary IS NULL OR trim(summary)='')":"(reading_minutes IS NULL OR reading_minutes<=0)"
    db.prepare(`UPDATE ${p.collection}_locales SET ${p.column}=? WHERE _parent_id=? AND _locale=? AND ${condition}`).run(p.value,p.id,p.locale)
    db.prepare(`UPDATE ${p.collection} SET updated_at=? WHERE id=?`).run(now,p.id)
   }
  }
  db.exec('COMMIT')
 }
 report.updates=documents.size
 await mkdir('work/body-migration',{recursive:true})
 await writeFile(`work/body-migration/${report.mode}-report.json`,JSON.stringify(report,null,2))
 console.log(JSON.stringify(report,null,2))
}catch(error){
 if(apply)try{db.exec('ROLLBACK')}catch{}
 report.errors.push(String(error));await mkdir('work/body-migration',{recursive:true});await writeFile('work/body-migration/error-report.json',JSON.stringify(report,null,2));throw error
}finally{db.close()}
