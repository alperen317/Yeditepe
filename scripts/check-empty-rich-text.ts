import assert from 'node:assert/strict'
import {createEditor} from 'lexical'
import {normalizeRichText} from '../src/lib/normalizeRichText'
import {numericUploadIDs} from './lexical-utils'
const empty={root:{children:[],direction:null,format:'',indent:0,type:'root',version:1}}
const editor=createEditor({onError:error=>{throw error}})
assert.throws(()=>editor.setEditorState(editor.parseEditorState(JSON.stringify(empty))),/editor state is empty/)
const repaired=normalizeRichText(empty)
assert.doesNotThrow(()=>editor.setEditorState(editor.parseEditorState(JSON.stringify(repaired))))
assert.equal(empty.root.children.length,0,'Do not mutate existing input')
assert.equal(normalizeRichText(repaired),repaired,'Valid content must remain unchanged')
assert.equal(normalizeRichText(null),null)
assert.equal(normalizeRichText(undefined),undefined)
const translated=normalizeRichText({tr:empty,en:repaired})
assert.equal(translated.tr.root.children.length,1)
assert.equal(translated.en,repaired)
assert.equal(numericUploadIDs(empty).root.children.length,1,'Future imports must also be valid')
console.log('PASS: original crash reproduced; repaired state opens in Lexical; existing content and locales preserved.')
