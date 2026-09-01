import { useEffect, useState } from 'react'
import { useReducedMotion, type Transition, type Variants } from 'framer-motion'

/* ──────────────────────────────────────────────────────────────────────────
 * Spring presets — realistic physics, no linear easing.
 * iso  → the signature "pronounced isometric" feel (springy, a little loose)
 * soft → page / surface transitions (settled, premium)
 * snappy → small UI affordances (toggles, chips)
 * ────────────────────────────────────────────────────────────────────────── */

export const springIso: Transition = { type: 'spring', stiffness: 220, damping: 22, mass: 0.6 }
export const springSoft: Transition = { type: 'spring', stiffness: 300, damping: 30 }
export const springSnappy: Transition = { type: 'spring', stiffness: 420, damping: 30 }

/* Tilt motion-value spring (used by TiltCard) */
export const tiltSpring = { stiffness: 220, damping: 22, mass: 0.6 } as const

/* ── Page transition: directional slide + scale + soft settle ────────────── */
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 18, scale: 0.99 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { ...springSoft, when: 'beforeChildren', staggerChildren: 0.06, delayChildren: 0.04 },
  },
  exit: { opacity: 0, y: -12, scale: 0.995, transition: { duration: 0.22, ease: [0.4, 0, 0.2, 1] } },
}

/* ── Stagger container (no visual change itself; orchestrates children) ───── */
export const staggerContainer: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
}

export const staggerFast: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.035, delayChildren: 0.02 } },
}

/* ── Item variants (inherit initial/animate names from a parent container) ── */
export const riseItem: Variants = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: springIso },
}

export const scaleItem: Variants = {
  initial: { opacity: 0, scale: 0.96, y: 12 },
  animate: { opacity: 1, scale: 1, y: 0, transition: springIso },
}

export const fadeItem: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: springSoft },
}

/* Slide-in from the side (e.g. nav items, list rows) */
export const slideRightItem: Variants = {
  initial: { opacity: 0, x: -14 },
  animate: { opacity: 1, x: 0, transition: springIso },
}

/* Hover affordance for flat cards (no 3D tilt) */
export const hoverLift = {
  rest: { y: 0, boxShadow: '0 1px 2px rgba(15,23,42,0.04), 0 10px 28px rgba(15,23,42,0.06)' },
  hover: { y: -4, boxShadow: '0 24px 60px -22px rgba(124,58,237,0.22)', transition: springIso },
}

/* ──────────────────────────────────────────────────────────────────────────
 * useTiltEnabled — gate the heavy 3D pointer-tilt.
 * Only ON when: fine pointer (mouse) AND >= 1024px AND motion allowed.
 * → touch + small screens stay clean & flat (responsive + a11y).
 * ────────────────────────────────────────────────────────────────────────── */
export function useTiltEnabled(): boolean {
  const reduced = useReducedMotion()
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(min-width: 1024px) and (pointer: fine)')
    const update = () => setMatches(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return matches && !reduced
}

/* Generic min-width media-query hook (used for responsive layout choices) */
export function useMinWidth(px: number): boolean {
  const [matches, setMatches] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia(`(min-width: ${px}px)`)
    const update = () => setMatches(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [px])
  return matches
}
