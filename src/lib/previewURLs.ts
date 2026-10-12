export const previewCollections=['facilities','medical-units','doctors','articles','pages','events','videos','medical-technologies','sliders'] as const
export type PreviewCollection=typeof previewCollections[number]
export function previewPath(data:Record<string,unknown>,locale:string,kind:string):string|null {
 const en=locale==='en'
 if(kind==='homepage'||kind==='sliders')return en?'/en':'/'
 if(!previewCollections.includes(kind as PreviewCollection))return null
 const raw=data.slug
 const slug=typeof raw==='string'?raw:raw&&typeof raw==='object'?(raw as Record<string,unknown>)[en?'en':'tr']:null
 if(typeof slug!=='string'||!slug.trim()||slug.startsWith('/')||slug.includes('..')||/[\\?#\s]/.test(slug))return null
 return (en?'/en/':'/')+slug
}
export function previewURL(data:Record<string,unknown>,locale:string,kind:string):string|null {
 if(!previewPath(data,locale,kind))return null
 if(kind!=='homepage'&&(typeof data.id!=='number'&&typeof data.id!=='string'))return null
 const params=new URLSearchParams({locale:locale==='en'?'en':'tr'})
 if(kind==='homepage')params.set('global','homepage')
 else {params.set('collection',kind);params.set('id',String(data.id))}
 return '/api/preview?'+params.toString()
}
