import 'dotenv/config'
import assert from 'node:assert/strict'
import { getPayload } from 'payload'
// A separate disposable test database keeps synthetic test content out of the CMS.
process.env.DATABASE_URL = 'file:./imports/verification.db'
const { default: config } = await import('../src/payload.config')
const p = await getPayload({ config })
const key = `test-${Date.now()}`
try {
  const facility = await p.create({ collection: 'facilities', locale: 'tr', data: { internal_name: key, source_key: key, title: 'Test hastane' } })
  const doctor = await p.create({ collection: 'doctors', locale: 'tr', data: { full_name: key, source_key: key, facilities: [facility.id], biography: 'Türkçe' } })
  await p.update({ collection: 'doctors', id: doctor.id, locale: 'en', data: { facilities: [], biography: 'English' } })
  const tr = await p.findByID({ collection: 'doctors', id: doctor.id, locale: 'tr', fallbackLocale: false, depth: 0 })
  const en = await p.findByID({ collection: 'doctors', id: doctor.id, locale: 'en', fallbackLocale: false, depth: 0 })
  assert.equal(tr.biography, 'Türkçe'); assert.equal(en.biography, 'English')
  assert.deepEqual(tr.facilities, [facility.id]); assert.deepEqual(en.facilities || [], [])
  await assert.rejects(p.create({ collection: 'doctors', data: { full_name: key, source_key: key } }))
  await assert.rejects(p.find({ collection: 'doctors', overrideAccess: false, depth: 0 }), (error: unknown) => Boolean(error && typeof error === 'object' && 'status' in error && error.status === 403))
  console.log('PASS: TR/EN fields, localized relationships, unique source key, anonymous read restriction')
} finally { await p.destroy() }
