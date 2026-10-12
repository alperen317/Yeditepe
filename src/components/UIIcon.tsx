type IconName='arrow-left'|'arrow-right'|'arrow-up'|'arrow-down'|'arrow-up-right'|'chevron-left'|'chevron-right'|'close'|'menu'|'expand'|'play'|'pause'|'plus'|'minus'|'search'
const paths:Record<IconName,string>={
 'arrow-left':'M19 12H5m6-6-6 6 6 6',
 'arrow-right':'M5 12h14m-6-6 6 6-6 6',
 'arrow-up':'M12 19V5m-6 6 6-6 6 6',
 'arrow-down':'M12 5v14m-6-6 6 6 6-6',
 'arrow-up-right':'M6 18 18 6M6 6h12v12',
 'chevron-left':'m15 6-6 6 6 6',
 'chevron-right':'m9 6 6 6-6 6',
 close:'m6 6 12 12M18 6 6 18',
 menu:'M4 6h16M4 12h16M4 18h16',
 expand:'M9 4H4v5m11-5h5v5M4 15v5h5m6 0h5v-5',
 play:'m9 5 11 7-11 7Z',
 pause:'M8 5v14M16 5v14',
 plus:'M12 5v14M5 12h14',
 minus:'M5 12h14',
 search:'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
}
export function UIIcon({name,className=''}:{name:IconName;className?:string}){
 return <svg className={`ui-icon ${className}`.trim()} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={paths[name]}/></svg>
}
