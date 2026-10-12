'use client'

import {useEffect, useRef, type ReactNode, type RefObject} from 'react'

/** Animate the actual cards, so carousel widths, snap points and links stay intact. */
export function useBlurFade(container: RefObject<HTMLDivElement | null>, children: ReactNode) {
  useEffect(() => {
    const element = container.current
    if (!element || typeof IntersectionObserver === 'undefined') return
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    if (motion.matches) return
    const cards = Array.from(element.children).filter((child): child is HTMLElement => child instanceof HTMLElement)
    const clear = (card: HTMLElement) => {
      delete card.dataset.blurFade
      card.style.removeProperty('--reveal-delay')
    }
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const card = entry.target as HTMLElement
        card.dataset.blurFade = 'entering'
        observer.unobserve(card)
      }
    }, {threshold: 0.08})
    cards.forEach((card, index) => {
      // Already passed content stays visible on restored scroll positions.
      if (card.getBoundingClientRect().bottom <= 0) return
      card.dataset.blurFade = 'pending'
      card.style.setProperty('--reveal-delay', `${(index % 4) * 55}ms`)
      observer.observe(card)
    })
    const finish = (event: AnimationEvent) => {
      if (event.animationName === 'card-blur-fade' && event.target instanceof HTMLElement && cards.includes(event.target)) clear(event.target)
    }
    const focus = (event: FocusEvent) => {
      const card = cards.find(card => event.target instanceof Node && card.contains(event.target))
      if (card) {observer.unobserve(card);clear(card)}
    }
    const stop = () => {
      if (motion.matches) {observer.disconnect();cards.forEach(clear)}
    }
    element.addEventListener('animationend', finish)
    element.addEventListener('focusin', focus)
    motion.addEventListener('change', stop)
    return () => {
      observer.disconnect()
      element.removeEventListener('animationend', finish)
      element.removeEventListener('focusin', focus)
      motion.removeEventListener('change', stop)
      cards.forEach(clear)
    }
  }, [container, children])
}

export function BlurFade({children, className}: {children: ReactNode; className: string}) {
  const container = useRef<HTMLDivElement>(null)
  useBlurFade(container, children)
  return <div ref={container} className={className}>{children}</div>
}
