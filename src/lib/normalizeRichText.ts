/** Lexical requires at least one child of root, even for an empty document. */
export function normalizeRichText<T>(value:T):T {
 if(!value||typeof value!=='object'||Array.isArray(value))return value
 const state=value as Record<string,unknown>
 const root=state.root
 if(root&&typeof root==='object'&&!Array.isArray(root)){
  const node=root as Record<string,unknown>
  if(Array.isArray(node.children)&&node.children.length===0){
   return {...state,root:{...node,children:[{
    children:[],direction:null,format:'',indent:0,type:'paragraph',version:1,
    textFormat:0,textStyle:'',
   }]}} as T
  }
 }
 // Payload may return all localized values together (locale: 'all').
 if(!root&&('tr' in state||'en' in state)){
  const tr=normalizeRichText(state.tr),en=normalizeRichText(state.en)
  if(tr!==state.tr||en!==state.en)return {...state,...('tr' in state?{tr}:{}),...('en' in state?{en}:{})} as T
 }
 return value
}
