import assert from 'node:assert/strict'
import type {TextareaField} from 'payload'
import {Content} from '../src/collections/Content'
import {eventPresentation} from '../src/lib/eventPresentation'
import {facilityDescription,readingMinutes} from '../src/lib/cardPresentation'
import {legacyEventFields,legacyFacilitySummary,legacyReadingMinutes} from './body-legacy'
const archivedFields=Content.flatMap(c=>c.fields.filter((f):f is TextareaField=>f.type==='textarea'&&f.name==='body'))
assert.equal(archivedFields.length,7)
for(const field of archivedFields){assert.equal(field.admin?.hidden,true);assert.equal(field.admin?.readOnly,true)}
const html='<time datetime="2026-10-03T09:00:00+03:00"></time><img src="/api/media/file/afis%20test.png">'
const fields=legacyEventFields(html)
assert.equal(fields.date,'2026-10-03T06:00:00.000Z')
assert.equal(decodeURIComponent(fields.filename!),'afis test.png')
assert.deepEqual(eventPresentation({body:html}),{date:undefined,image:undefined})
assert.deepEqual(eventPresentation({starts_at:fields.date,cover_image:{url:'/api/media/file/afis%20test.png'},body:'removed'}),{date:fields.date,image:'/api/media/file/afis%20test.png'})
const paragraph='Hastanemiz bilimsel birikim ve uzman hekimler ile güvenilir sağlık hizmeti sunmaktadır. '.repeat(3)
const summary=legacyFacilitySummary(null,null,`<p>${paragraph}</p>`,'Hastanemiz','tr')
assert.ok(summary&&summary.length<=190)
assert.equal(facilityDescription(summary,null,'tr'),summary)
assert.equal(legacyFacilitySummary('Editörün açıklaması',null,paragraph,'Hastanemiz','tr'),undefined)
const content={root:{children:[{type:'paragraph',children:[{type:'text',text:'kelime '.repeat(201)}]}]}}
assert.equal(readingMinutes(content),2)
assert.equal(legacyReadingMinutes(undefined,'<p>'+('kelime '.repeat(201))+'</p>'),2)
assert.equal(readingMinutes(undefined),undefined)
console.log('PASS: migration extraction, preserved descriptions/read times, no frontend Body fallback')
