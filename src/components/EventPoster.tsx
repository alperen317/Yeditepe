'use client'
import {ImageLightbox} from './ImageLightbox'
import {PreviewRegion,usePreviewData} from './PreviewFields'
export function EventPoster({id,src,title,locale}:{id:number;src?:string;title:string;locale:'tr'|'en'}){
 const preview=usePreviewData('events',id),value=preview?.data.cover_image
 const image=value===null?undefined:value&&typeof value==='object'&&'url' in value?String(value.url||''):src
 return <PreviewRegion kind="events" id={id} field="cover_image">{image?<ImageLightbox src={image} alt={title} locale={locale}/>:preview?.edit?<span className="preview-empty-media">cover_image</span>:null}</PreviewRegion>
}
