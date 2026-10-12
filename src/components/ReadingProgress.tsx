'use client'

import {useEffect, useRef, type ReactNode} from 'react'

export function ReadingProgress({children, locale}: {children: ReactNode; locale: 'tr' | 'en'}) {
  const content = useRef<HTMLDivElement>(null)
  const indicator = useRef<HTMLDivElement>(null)
  const fill = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const article = content.current
    const bar = indicator.current
    const line = fill.current
    if (!article || !bar || !line) return
    let frame = 0
    let disposed = false
    const update = () => {
      frame = 0
      const bounds = article.getBoundingClientRect()
      const start = bounds.top + window.scrollY
      // Complete when the last line enters the viewport, independent of the rest of the page.
      const range = bounds.height - window.innerHeight
      bar.hidden = range <= 0
      const progress = range > 0 ? Math.max(0, Math.min(1, (window.scrollY - start) / range)) : 0
      line.style.transform = `scaleX(${progress})`
      bar.setAttribute('aria-valuenow', String(Math.round(progress * 100)))
    }
    const schedule = () => {
      if (!disposed && !frame) frame = requestAnimationFrame(update)
    }
    const observer = new ResizeObserver(schedule)
    observer.observe(article)
    window.addEventListener('scroll', schedule, {passive: true})
    window.addEventListener('resize', schedule)
    document.fonts.ready.then(schedule)
    update()
    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [children])

  return <>
    <div ref={indicator} className="reading-progress" role="progressbar" hidden
      aria-label={locale === 'en' ? 'Article reading progress' : 'Yazıyı okuma ilerlemesi'}
      aria-valuemin={0} aria-valuemax={100} aria-valuenow={0}>
      <span ref={fill}/>
    </div>
    <div ref={content}>{children}</div>
  </>
}
