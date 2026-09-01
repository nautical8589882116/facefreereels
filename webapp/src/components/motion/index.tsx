import { forwardRef, type ReactNode } from 'react'
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useMotionTemplate,
  type HTMLMotionProps,
  type Variants,
} from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  useTiltEnabled,
  tiltSpring,
  springIso,
  springSoft,
  staggerContainer,
  staggerFast,
  riseItem,
} from '@/lib/motion'

/* ──────────────────────────────────────────────────────────────────────────
 * TiltCard — pointer-driven 3D tilt with a soft cursor glow and hover "pop".
 * On touch / small screens / reduced-motion it degrades to a gentle flat lift.
 * ────────────────────────────────────────────────────────────────────────── */
type TiltCardProps = HTMLMotionProps<'div'> & {
  intensity?: number       // max tilt in degrees
  lift?: number            // hover translateY (px)
  liftZ?: number           // hover translateZ (px) — parallax pop toward viewer
  scaleOnHover?: number
  glow?: boolean
  children?: ReactNode
}

export const TiltCard = forwardRef<HTMLDivElement, TiltCardProps>(function TiltCard(
  {
    className,
    children,
    intensity = 7,
    lift = 7,
    liftZ = 36,
    scaleOnHover = 1.012,
    glow = true,
    style,
    onPointerMove,
    onPointerLeave,
    ...rest
  },
  ref,
) {
  const enabled = useTiltEnabled()
  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [intensity, -intensity]), tiltSpring)
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-intensity, intensity]), tiltSpring)
  const gx = useTransform(px, [-0.5, 0.5], ['14%', '86%'])
  const gy = useTransform(py, [-0.5, 0.5], ['10%', '90%'])
  const glowBg = useMotionTemplate`radial-gradient(240px circle at ${gx} ${gy}, rgba(124,58,237,0.14), transparent 60%)`

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (enabled) {
      const r = e.currentTarget.getBoundingClientRect()
      px.set((e.clientX - r.left) / r.width - 0.5)
      py.set((e.clientY - r.top) / r.height - 0.5)
    }
    onPointerMove?.(e)
  }
  const handleLeave = (e: React.PointerEvent<HTMLDivElement>) => {
    px.set(0)
    py.set(0)
    onPointerLeave?.(e)
  }

  return (
    <motion.div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      whileHover={
        enabled
          ? { y: -lift, z: liftZ, scale: scaleOnHover, transition: springIso }
          : { y: -3, transition: springIso }
      }
      style={
        enabled
          ? { rotateX, rotateY, transformPerspective: 1100, transformStyle: 'preserve-3d', ...style }
          : style
      }
      className={cn('group/tilt relative will-change-transform', className)}
      {...rest}
    >
      {enabled && glow && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[1] rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover/tilt:opacity-100"
        >
          <motion.span className="absolute inset-0 rounded-[inherit]" style={{ background: glowBg }} />
        </span>
      )}
      {children}
    </motion.div>
  )
})

/* ──────────────────────────────────────────────────────────────────────────
 * Stage — perspective canvas with a resting plane tilt (the "isometric
 * projected" look) AND a stagger orchestrator for its children. Flat on mobile.
 * Children should use item variants (scaleItem / riseItem) with no own initial.
 * ────────────────────────────────────────────────────────────────────────── */
type StageProps = {
  tilt?: number
  stagger?: number
  delay?: number
  perspective?: number
  className?: string          // applied to the inner plane (put grid classes here)
  children: ReactNode
}

export function Stage({
  tilt = 2.5,
  stagger = 0.06,
  delay = 0.05,
  perspective = 1600,
  className,
  children,
}: StageProps) {
  const enabled = useTiltEnabled()
  const variants: Variants = {
    initial: {},
    animate: {
      rotateX: enabled ? tilt : 0,
      transition: { ...springSoft, staggerChildren: stagger, delayChildren: delay },
    },
  }
  return (
    <div style={{ perspective: `${perspective}px` }}>
      <motion.div
        className={className}
        style={{ transformStyle: 'preserve-3d', transformOrigin: '50% 0%' }}
        variants={variants}
        initial="initial"
        animate="animate"
      >
        {children}
      </motion.div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
 * Stagger — plain container that orchestrates child item variants.
 * ────────────────────────────────────────────────────────────────────────── */
type StaggerProps = HTMLMotionProps<'div'> & { fast?: boolean; children: ReactNode }

export function Stagger({ children, className, fast = false, ...rest }: StaggerProps) {
  return (
    <motion.div
      className={className}
      variants={fast ? staggerFast : staggerContainer}
      initial="initial"
      animate="animate"
      {...rest}
    >
      {children}
    </motion.div>
  )
}

/* ──────────────────────────────────────────────────────────────────────────
 * Reveal — scroll-triggered entrance (once) for flat sections (charts, tables).
 * ────────────────────────────────────────────────────────────────────────── */
type RevealProps = HTMLMotionProps<'div'> & {
  children: ReactNode
  once?: boolean
  amount?: number
}

export function Reveal({
  children,
  once = true,
  amount = 0.18,
  variants = riseItem,
  ...rest
}: RevealProps) {
  return (
    <motion.div
      variants={variants}
      initial="initial"
      whileInView="animate"
      viewport={{ once, amount }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}
