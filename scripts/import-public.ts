import 'dotenv/config'
import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import {convertHTMLToLexical,editorConfigFactory} from '@payloadcms/richtext-lexical'
import {JSDOM} from 'jsdom'
import {legacyReadingMinutes} from './body-legacy'

// Writes only to the project's local SQLite database; source website is never mutated.
if (!process.env.DATABASE_URL?.startsWith('file:')) throw new Error('Public pilot import is restricted to a local SQLite database.')
const file = process.argv[2] || 'imports/public/records.jsonl'
const records = (await readFile(file, 'utf8')).split('\n').filter(Boolean).map(line => JSON.parse(line))
const payload = await getPayload({ config })
const editorConfig = await editorConfigFactory.default({config:payload.config,parentIsLocalized:true})
const report = { staged: 0, articlesCreated: 0, articlesUpdated: 0, skipped: [] as string[], completeDrupalMigration: false }
for (const record of records) {
  const found = await payload.find({ collection: 'migration-records', where: { source_url: { equals: record.source_url } }, limit: 1, depth: 0 })
  const data = { ...record, review_status: 'pending' as const }
  if (found.docs[0]) await payload.update({ collection: 'migration-records', id: found.docs[0].id, data })
  else await payload.create({ collection: 'migration-records', data })
  report.staged++
  // Promote only a positively identified article body, never guess entity type from its title.
  const u = new URL(record.source_url)
  if (!record.body_html || record.extraction.body_selector !== '.blog-body' || !/^\/(en\/health-guide|saglik-rehberi)\//.test(u.pathname)) {
    report.skipped.push(record.source_url); continue
  }
  const identity = record.translations?.tr || record.canonical || record.source_url
  const key = 'public:' + createHash('sha256').update(identity).digest('hex')
  const existing = await payload.find({ collection: 'articles', where: { source_key: { equals: key } }, limit: 1, depth: 0, locale: 'all' })
  const dom=new JSDOM(record.body_html)
  // The pilot does not import media; retain their source URLs in the audit record.
  for(const image of dom.window.document.querySelectorAll('img'))image.remove()
  const content=convertHTMLToLexical({editorConfig,html:dom.window.document.body.innerHTML,JSDOM})
  const article = {
    content,reading_minutes:legacyReadingMinutes(content,record.body_html),
    source_key: key, source_url: identity, kind: 'health_guide' as const, status: 'draft' as const,
    title: record.title, body: record.body_html, slug: u.pathname.replace(/^\/en\//,'/').replace(/^\//,''),
    translation_status: 'draft' as const,
    source_metadata: { mode: 'public_rendered', translations: record.translations,
      sources: { ...((existing.docs[0]?.source_metadata as { sources?: object } | null)?.sources || {}),
        [record.language]: { url: record.source_url, media_urls: record.source_images, source_links: record.source_links } },
      complete_entity: false, missing_relationships: true, import_state: 'needs_review' },
  }
  if (existing.docs[0]) {
    // A repeat run must not overwrite a manually reviewed record.
    const metadata = existing.docs[0].source_metadata as { import_state?: string } | null
    if (metadata?.import_state !== 'needs_review') { report.skipped.push(record.source_url); continue }
    await payload.update({ collection: 'articles', id: existing.docs[0].id, locale: record.language, data: article })
    report.articlesUpdated++
  } else {
    await payload.create({ collection: 'articles', locale: record.language, data: article })
    report.articlesCreated++
  }
}
await writeFile('imports/public/import-report.json', JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify(report))
await payload.destroy()
