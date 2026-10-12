import assert from 'node:assert/strict'
import {previewURL} from './share-preview-policy.mjs'
for(const path of ['/admin','/admin/login','/%61dmin','/%2561dmin','/api/users','/api/graphql','/api/preview','/api/media','/_next/server/app.js','/__nextjs_original-stack-frames','/.env','/_next/static/private.js.map','/api/media/file/../../users'])assert.equal(previewURL(path),null,path)
for(const method of ['POST','PUT','PATCH','DELETE','OPTIONS'])assert.equal(previewURL('/',method),null)
for(const path of ['/','/en','/hastaneler','/medikal-teknoloji','/api/media/file/drone_01.mp4','/brand/03_logo_yatay_beyaz_seffaf.svg','/_next/static/chunks/main.js'])assert.equal(previewURL(path),path)
assert.equal(previewURL('/?__preview=homepage&previewField=title&q=test'), '/?q=test')
console.log('PASS: public pages/media allowed; admin, APIs, cookies, source maps and write routes isolated by gateway')
