export function ServiceIcon({name}:{name:string}) {
 const paths:Record<string,string[]>={doctor:['M6 3v7a6 6 0 0 0 12 0V3','M4 3h4M16 3h4','M12 16v3a6 6 0 0 0 12 0v-5','M27 11a3 3 0 1 1-6 0 3 3 0 0 1 6 0'],hospital:['M5 29V8h22v21M2 29h28','M13 29v-7h6v7','M13 5h6M16 2v6','M10 13h2M20 13h2M10 17h2M20 17h2'],care:['M16 27S3 19 3 11a7 7 0 0 1 13-3 7 7 0 0 1 13 3c0 8-13 16-13 16Z','M8 16h5l3-5 3 10 3-5h3'],guide:['M16 7v22M16 7C11 3 6 3 2 5v21c5-2 10-1 14 3 4-4 9-5 14-3V5c-4-2-9-2-14 2Z','M7 10l5 1M7 15l5 1M20 11l5-1M20 16l5-1']}
 return <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{(paths[name]||paths.guide).map((d,i)=><path key={i} d={d}/>)}</svg>
}
