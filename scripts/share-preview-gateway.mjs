import http from 'node:http'
import {previewURL} from './share-preview-policy.mjs'
const port=Number(process.env.SHARE_PREVIEW_PORT||3100)
const upstream=new URL(process.env.SHARE_PREVIEW_UPSTREAM||'http://127.0.0.1:3000')
if(!['127.0.0.1','localhost'].includes(upstream.hostname))throw new Error('Preview upstream must stay local.')
const server=http.createServer((req,res)=>{
 const path=previewURL(req.url||'/',req.method)
 if(!path){res.writeHead(403,{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'});res.end('Bu bağlantı yalnızca web sitesi ön izlemesi içindir.');return}
 // No browser session, authorization, origin or forwarded host reaches Payload.
 const headers={host:upstream.host}
 for(const name of ['accept','accept-language','range','if-range','if-none-match','if-modified-since','rsc','next-router-state-tree','next-router-prefetch','next-url'])if(typeof req.headers[name]==='string')headers[name]=req.headers[name]
 const outgoing=http.request(upstream.origin+path,{method:req.method,headers},response=>{
  const responseHeaders={...response.headers,'x-robots-tag':'noindex, nofollow','cache-control':'no-store'}
  delete responseHeaders['set-cookie']
  delete responseHeaders['x-powered-by']
  if(responseHeaders.location){
   const location=new URL(responseHeaders.location,upstream)
   if(location.origin===upstream.origin){const redirect=previewURL(location.pathname+location.search);if(!redirect){response.destroy();res.writeHead(403);res.end();return}responseHeaders.location=redirect}
  }
  res.writeHead(response.statusCode||502,responseHeaders);response.pipe(res)
 })
 outgoing.setTimeout(180000,()=>outgoing.destroy(new Error('Local preview timed out')))
 outgoing.on('error',()=>{if(!res.headersSent)res.writeHead(502,{'Content-Type':'text/plain; charset=utf-8'});res.end('Yerel ön izleme şu anda hazır değil.')})
 res.on('close',()=>outgoing.destroy())
 outgoing.end()
})
server.on('upgrade',(req,socket)=>socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n'))
server.listen(port,'127.0.0.1',()=>console.log(`Read-only website preview: http://127.0.0.1:${port}`))
