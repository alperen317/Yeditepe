'use client'
import {UIIcon} from './UIIcon'
import {useState} from 'react'
import {PreviewRegion,usePreviewData} from './PreviewFields'
export function videoEmbed(provider:unknown,id:unknown){
 if(typeof id!=='string')return undefined
 if(provider==='youtube'&&/^[\w-]{11}$/.test(id))return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`
 if(provider==='vimeo'&&/^\d+$/.test(id))return `https://player.vimeo.com/video/${id}?autoplay=1`
}
export function DetailVideoPlayer({id,provider,videoID,poster,title,locale,file}:{id:number;provider?:string;videoID?:string;poster?:string;title:string;locale:'tr'|'en';file?:string}){
 const [playing,setPlaying]=useState(false),preview=usePreviewData('videos',id)
 const liveID=typeof preview?.data.provider_video_id==='string'?preview.data.provider_video_id:videoID
 const liveProvider=typeof preview?.data.provider==='string'?preview.data.provider:provider
 const liveFileValue=preview?.data.video_file,livePosterValue=preview?.data.thumbnail
 const liveFile=liveFileValue===null?undefined:liveFileValue&&typeof liveFileValue==='object'&&'url' in liveFileValue?String(liveFileValue.url||''):file
 const livePoster=livePosterValue===null?undefined:livePosterValue&&typeof livePosterValue==='object'&&'url' in livePosterValue?String(livePosterValue.url||''):poster
 const embed=videoEmbed(liveProvider,liveID),image=livePoster||(liveProvider==='youtube'&&typeof liveID==='string'&&/^[\w-]{11}$/.test(liveID)?`https://i.ytimg.com/vi/${liveID}/hqdefault.jpg`:undefined)
 return <PreviewRegion kind="videos" id={id} field={liveFile?"video_file":"provider_video_id"}><div className="detail-video-player">{liveFile?<video key={liveFile} src={liveFile} poster={livePoster} controls playsInline preload="metadata"/>:playing&&embed?<iframe key={embed} src={embed} title={title} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen/>:embed?<button className="detail-video-poster" type="button" onClick={()=>setPlaying(true)} aria-label={locale==='en'?'Play '+title:title+' videosunu oynat'}>{image&&<img src={image} alt=""/>}<span className="detail-play"><span aria-hidden="true"><UIIcon name="play"/></span><small>{locale==='en'?'Play video':'Videoyu oynat'}</small></span></button>:<p>{locale==='en'?'Video is currently unavailable.':'Video şu anda kullanılamıyor.'}</p>}</div></PreviewRegion>
}
