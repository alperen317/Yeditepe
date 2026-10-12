// Regenerate after changing collection/global fields.
import {readFileSync,writeFileSync} from 'node:fs'
const root=new URL('../src/',import.meta.url)
const schema=JSON.parse(readFileSync(new URL('collections/content-schema.json',root),'utf8'))
const fields=Object.fromEntries(schema.map(collection=>[collection.slug,collection.fields.filter(field=>field.name&&field.name!=='body'&&!field.admin?.hidden&&!field.admin?.readOnly).map(field=>field.name)]))
fields['medical-technologies'].push('content')
fields.homepage=[...readFileSync(new URL('collections/Homepage.ts',root),'utf8').matchAll(/name: '([^']+)'/g)].map(match=>match[1])
writeFileSync(new URL('lib/previewEditableFields.json',root),JSON.stringify(fields,null,2)+'\n')
