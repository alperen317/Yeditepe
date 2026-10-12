import type { Access, CollectionConfig, Field } from 'payload'
import schema from './content-schema.json'
import {previewCollections,previewURL,type PreviewCollection} from '../lib/previewURLs'
import {normalizeRichText} from '../lib/normalizeRichText'

const authenticated: Access = ({ req }) => Boolean(req.user)
export const Content: CollectionConfig[] = (schema as unknown as CollectionConfig[]).map(collection => ({
  ...collection,
  admin: {...collection.admin, ...(previewCollections.includes(collection.slug as PreviewCollection) ? {preview:(doc,options)=>previewURL(doc,options.locale,collection.slug)} : {})},
  fields: [...collection.fields, ...(collection.slug === 'medical-technologies' ? [{name:'content',type:'richText',localized:true,label:'İçerik / Content'} as Field] : [])].map(field => field.type==='textarea'&&field.name==='body'?{...field,admin:{...field.admin,hidden:true,readOnly:true}}:field.type === 'richText' ? {
    ...field,
    hooks: {
      ...field.hooks,
      afterRead: [...(field.hooks?.afterRead || []), ({value}) => normalizeRichText(value)],
      beforeValidate: [({value}) => normalizeRichText(value), ...(field.hooks?.beforeValidate || [])],
    },
  } : field),
  access: { read: authenticated, create: authenticated, update: authenticated, delete: authenticated },
}))
