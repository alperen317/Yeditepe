import type {SerializedEditorState} from 'lexical'
export type DetailNode={type:string;text?:string;tag?:string;children?:DetailNode[];fields?:{url?:string;[key:string]:unknown};detailAnchor?:string;[key:string]:unknown}
export type LinkMap=Record<string,string>
export const nodeText=(node:DetailNode):string=>(node.text||'')+(node.children||[]).map(nodeText).join('')
export const rootNodes=(data:unknown):DetailNode[]=>data&&typeof data==='object'&&'root' in data?(data as {root:{children:DetailNode[]}}).root.children||[]:[]
export function localContentURL(value:string,map:LinkMap){
 try{const url=new URL(value,'https://yeditepehastaneleri.com');if(!['yeditepehastaneleri.com','www.yeditepehastaneleri.com'].includes(url.hostname))return value;const href=map[url.pathname.replace(/\/$/,'')];return href?href+url.search+url.hash:value}catch{return value}
}
const isHeading=(n:DetailNode)=>n.type==='heading'
export function prepareDetailContent(data:SerializedEditorState,kind:string,map:LinkMap={}){
 let nodes=rootNodes(data)
 if(kind==='facilities'){
  const mapEnd=nodes.findIndex(n=>isHeading(n)&&/^(haritada göster|show on map|view on map)$/i.test(nodeText(n).trim()))
  let start=mapEnd>=0?mapEnd+1:0
  if(mapEnd<0&&/^(bize ulaşın|contact)/i.test(nodeText(nodes[0]||{type:''}))){const narrative=nodes.findIndex((n,i)=>i>0&&isHeading(n)&&!/^(tıbbi birimlerimiz|doktorlarımız|our services|doctors)$/i.test(nodeText(n)));start=narrative>=0?narrative:0}
  if(/google maps|yandex|bing/i.test(nodeText(nodes[start]||{type:''})))start++
  const directory=nodes.findIndex(n=>isHeading(n)&&/^(tıbbi birimlerimiz|doktorlarımız|our (medical units|doctors|services)|medical units|doctors)$/i.test(nodeText(n).trim().toLocaleLowerCase('tr-TR')))
  const gallery=nodes.findIndex((n,i)=>i>directory&&isHeading(n)&&/^(galeri|gallery)$/i.test(nodeText(n).trim()))
  const faq=nodes.findIndex((n,i)=>i>directory&&isHeading(n)&&/^(sıkça|frequently asked)/i.test(nodeText(n).trim()))
  nodes=[...nodes.slice(start,directory>=start?directory:undefined),...(directory>=start&&gallery>directory?nodes.slice(gallery,faq>gallery?faq:undefined).map(n=>n.type==='list'?{...n,detailGallery:true}:n):[]),...(directory>=start&&faq>directory?nodes.slice(faq):[])]
 }else if(kind==='doctors'){
  const end=nodes.findIndex(n=>isHeading(n)&&/^(ilgili videolar|related videos|shorts|sağlıklı bilgiler|health(y)? (information|articles|guide))/i.test(nodeText(n).trim().toLocaleLowerCase('tr-TR')))
  if(end>=0)nodes=nodes.slice(0,end)
 }else if(kind==='events'){
  const start=nodes.findIndex(n=>isHeading(n)&&/^(etkinlik hakkında|about (the )?event)/i.test(nodeText(n).trim().toLocaleLowerCase('tr-TR')))
  const end=nodes.findIndex(n=>isHeading(n)&&/^(etkinlik bilgileri|event information|diğer etkinlikler|other events)/i.test(nodeText(n).trim().toLocaleLowerCase('tr-TR')))
  if(start>=0)nodes=nodes.slice(start,end>start?end:undefined)
  else nodes=nodes.filter(n=>!(isHeading(n)&&n.tag==='h1'))
 }else if(kind==='pages'){
  // The import may start with the original site's short corporate menu links.
  let count=0
  while(count<nodes.length&&nodes[count].type==='paragraph'&&nodeText(nodes[count]).trim().length<85&&JSON.stringify(nodes[count]).includes('"link"'))count++
  if(count)nodes=nodes.slice(count)
 }
 if(kind==='doctors'){
  const factLabel=/^(uzmanlık yılı ve yeri|doçentlik yeri ve yılı|profesörlük yeri ve yılı|yurt dışı eğitim|yabancı diller|yabancı yayın sayısı|mesleki ödüller|türkçe yayın sayısı|uluslararas[ıi] bildiri sayısı|ulusal bildiri sayısı|atıf sayısı|(place and year of )?(specialization|phd associate professorship).*|associate professorship.*|professorship.*|studying abroad|foreign languages|number of (foreign publications|publications in turkish|international papers|national papers)|professional awards|attribution number|international publications|awards|citations)$/i
  const grouped:DetailNode[]=[]
  for(let i=0;i<nodes.length;i++){
   const n=nodes[i],facts:{label:string;value:string}[]=[]
   while(n&&nodes[i]?.type==='paragraph'&&factLabel.test(nodeText(nodes[i]).trim().toLocaleLowerCase('tr-TR'))&&nodes[i+1]?.type==='paragraph'&&nodeText(nodes[i+1]).trim()){
    facts.push({label:nodeText(nodes[i]).trim(),value:nodeText(nodes[i+1]).trim()});i+=2
   }
   if(facts.length){grouped.push({...n,children:[],detailFacts:facts});i--}else grouped.push(n)
  }
  nodes=grouped
 }
 const toc:{id:string;title:string}[]=[]
 let headingIndex=0
 const visit=(n:DetailNode):DetailNode=>{
  let result={...n}
  if(n.children)result.children=n.children.map(visit)
  if(n.fields?.url)result.fields={...n.fields,url:localContentURL(n.fields.url,map)}
  if(isHeading(n)&&nodeText(n).trim()){
   const title=nodeText(n).trim(),id='detail-section-'+headingIndex++
   result.children=result.children?.flatMap(child=>child.type==='link'&&/#collapse[-\w]*/i.test(child.fields?.url||'')?child.children||[]:[child])
   result.detailAnchor=id;result.tag=n.tag==='h1'?'h2':n.tag
   if(['h1','h2','h3'].includes(n.tag||''))toc.push({id,title})
  }
  return result
 }
 nodes=nodes.filter(n=>nodeText(n).trim()||n.detailFacts||JSON.stringify(n).includes('"upload"')).map(visit)
 const prepared={...data,root:{...data.root,children:nodes}} as unknown as SerializedEditorState
 return {data:prepared,toc}
}

export function importedTransport(data:unknown){
 const nodes=rootNodes(data),end=nodes.findIndex(n=>n.type==='heading'&&/^(haritada göster|show on map|view on map)$/i.test(nodeText(n).trim()))
 return (end>=0?nodes.slice(0,end):[]).flatMap(n=>{
  const text=nodeText(n).trim(),match=n.type==='paragraph'&&text.match(/^(Otopark|Metro|Otobüs|Parking|Bus)(.+)$/i)
  return match?[{label:match[1],value:match[2]}]:[]
 })
}
