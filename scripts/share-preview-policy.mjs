export function previewURL(raw,method='GET'){
 if(!['GET','HEAD'].includes(method))return null
 let url
 try{url=new URL(raw,'http://127.0.0.1');let decoded=url.pathname;for(let i=0;i<4;i++){const next=decodeURIComponent(decoded);if(next===decoded)break;decoded=next}
  if(decoded.includes('\\')||decoded.includes('..')||/[\x00-\x1f]/.test(decoded))return null
  const normalized=new URL(decoded,'http://127.0.0.1').pathname
  if(/^\/admin(?:\/|$)/i.test(normalized))return null
  if(/^\/api(?:\/|$)/i.test(normalized)&&!/^\/api\/media\/file\/[^/]+$/i.test(normalized))return null
  if(normalized.startsWith('/_next/')&&!normalized.startsWith('/_next/static/'))return null
  if(normalized.startsWith('/_')&&!normalized.startsWith('/_next/static/'))return null
  if(normalized.endsWith('.map')||/\/\.(?:[^/]+)/.test(normalized))return null
  if(normalized.startsWith('/_next/static/')&&/\(payload\)|\/admin\//i.test(normalized))return null
 }catch{return null}
 for(const key of ['__preview','__preview_id','previewField'])url.searchParams.delete(key)
 return url.pathname+url.search
}
