/** Imported campaigns sometimes store the description in the title field. */
export function bannerCopy(rawTitle:string,rawSummary:string){
 const end=rawTitle.indexOf('!')
 if(rawTitle.length>150&&end>5&&end<100)return {
  title:rawTitle.slice(0,end+1),description:rawSummary||rawTitle.slice(end+1).trim(),descriptionField:rawSummary?'summary':'title',rawTitle,rawSummary,
 }
 return {title:rawTitle,description:rawSummary,descriptionField:'summary',rawTitle,rawSummary}
}
