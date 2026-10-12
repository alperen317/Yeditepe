import Link from 'next/link'

type Props = {
  children: string
  variant?: 'outline' | 'solid' | 'glass'
  className?: string
} & ({href: string; type?: never} | {href?: never; type: 'submit' | 'button'})

function Arrow() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg>
}

/** Real links and submit buttons, with one accessible label and a CSS-only hover treatment. */
export function InteractiveHoverButton({children, href, type, variant = 'outline', className = ''}: Props) {
  const content = <>
    <span className="hover-button-wash" aria-hidden="true"/>
    <span className="hover-button-label">{children}</span>
    <span className="hover-button-arrow" aria-hidden="true">
      <span className="hover-button-arrow-out"><Arrow/></span>
      <span className="hover-button-arrow-in"><Arrow/></span>
    </span>
  </>
  const classes = `interactive-hover-button hover-button-${variant} ${className}`.trim()
  return href !== undefined
    ? <Link href={href} className={classes}>{content}</Link>
    : <button type={type} className={classes}>{content}</button>
}
