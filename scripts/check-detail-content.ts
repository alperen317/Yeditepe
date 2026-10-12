import assert from 'node:assert/strict'
import type {SerializedEditorState} from 'lexical'
import {prepareDetailContent,localContentURL,nodeText,rootNodes} from '../src/lib/detailContent'
const text=(value:string)=>({type:'text',text:value,version:1,format:0,detail:0,mode:'normal',style:''})
const block=(type:string,value:string,tag?:string)=>({type,tag,children:[text(value)],version:1,format:'',indent:0,direction:null})
const state=(children:unknown[])=>({root:{type:'root',version:1,format:'',indent:0,direction:null,children}} as SerializedEditorState)
const hospital=state([block('heading','Bize Ulaşın','h2'),block('paragraph','Metro'),block('heading','Hastanemiz hakkında','h3'),block('paragraph','Clinical narrative'),block('heading','Tıbbi Birimlerimiz','h2'),block('paragraph','Old imported directory')])
const before=JSON.stringify(hospital),prepared=prepareDetailContent(hospital,'facilities')
assert.equal(JSON.stringify(hospital),before,'Source document must not be mutated')
assert.equal(rootNodes(prepared.data).map(nodeText).join('|'),'Hastanemiz hakkında|Clinical narrative')
assert.equal(prepared.toc[0].id,'detail-section-0')
const event=prepareDetailContent(state([block('heading','Duplicate title','h1'),block('heading','Etkinlik Hakkında','h2'),block('paragraph','Time, registration and event description'),block('heading','Etkinlik Bilgileri','h2'),block('paragraph','Duplicate details')]),'events')
assert.ok(rootNodes(event.data).map(nodeText).join(' ').includes('registration'))
assert.ok(!rootNodes(event.data).some(n=>nodeText(n)==='Duplicate title'))
assert.equal(localContentURL('https://yeditepehastaneleri.com/doktorlar/test?x=1#cv',{'/doktorlar/test':'/en/doctors/test'}),'/en/doctors/test?x=1#cv')
assert.equal(localContentURL('https://other.example/file',{}),'https://other.example/file')
assert.equal(localContentURL('https://yeditepehastaneleri.com/unmatched',{}),'https://yeditepehastaneleri.com/unmatched')

const doctor=prepareDetailContent(state([block('heading','CV','h2'),block('paragraph','Career retained'),block('heading','İlgili Videolar','h2'),block('paragraph','Old video list')]),'doctors')
assert.equal(rootNodes(doctor.data).map(nodeText).join('|'),'CV|Career retained')
const headings=prepareDetailContent(state([block('heading','Subheading','h4'),block('heading','Main heading','h2')]),'articles')
assert.equal(new Set(rootNodes(headings.data).map(n=>n.detailAnchor)).size,2)

const englishHospital=prepareDetailContent(state([block('heading','Contact Us','h2'),block('paragraph','Parking'),block('heading','View on Map','h3'),block('paragraph','Google Maps Yandex'),block('paragraph','Hospital narrative without heading'),block('heading','Our Services','h2'),block('paragraph','Old directory'),block('heading','Frequently Asked Questions','h2'),block('paragraph','FAQ retained')]),'facilities')
assert.equal(rootNodes(englishHospital.data).map(nodeText).join('|'),'Hospital narrative without heading|Frequently Asked Questions|FAQ retained')

const facts=prepareDetailContent(state([block('paragraph','Uzmanlık Yılı ve Yeri'),block('paragraph','Hacettepe Üniversitesi, 1997'),block('paragraph','Unpaired narrative retained'),block('heading','Health Guide','h2'),block('paragraph','Imported cards')]),'doctors')
assert.deepEqual(rootNodes(facts.data)[0].detailFacts,[{label:'Uzmanlık Yılı ve Yeri',value:'Hacettepe Üniversitesi, 1997'}])
assert.ok(rootNodes(facts.data).some(n=>nodeText(n)==='Unpaired narrative retained'))
assert.ok(!rootNodes(facts.data).some(n=>nodeText(n)==='Imported cards'))
const galleryNode={...block('list',''),children:[{...block('listitem',''),children:[{type:'upload',value:247,version:3}]}]}
const gallery=prepareDetailContent(state([block('paragraph','Narrative'),block('heading','Our Services','h2'),block('paragraph','Directory'),block('heading','Gallery','h2'),galleryNode,block('heading','Frequently Asked Questions','h2'),block('paragraph','Answer')]),'facilities')
assert.ok(rootNodes(gallery.data).some(n=>n.detailGallery))
assert.ok(rootNodes(gallery.data).some(n=>nodeText(n)==='Answer'))
console.log('PASS: non-mutating content sections, TR/EN narrative and FAQ preservation, academic fact grouping, unique TOC anchors and safe URL mapping')
