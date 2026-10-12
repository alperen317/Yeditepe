// Events render from explicit CMS fields; source HTML remains an import archive.
export function eventPresentation(event:Record<string,unknown>){
 const raw=typeof event.starts_at==='string'?event.starts_at:undefined
 const date=raw&&!Number.isNaN(Date.parse(raw))?raw:undefined
 const cover=event.cover_image as {url?:string}|null|undefined
 const image=cover?.url
 return {date,image}
}
export function eventDate(date:string,locale:'tr'|'en'){
 return new Intl.DateTimeFormat(locale==='tr'?'tr-TR':'en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Istanbul'}).format(new Date(date))
}
