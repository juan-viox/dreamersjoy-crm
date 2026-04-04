'use client'

import { useRef, useEffect, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react'

type GradientVariant = 'accent' | 'success' | 'warning' | 'danger' | 'info'

export default function StatCard({
  label,
  value,
  numericValue,
  trend,
  trendLabel,
  icon: Icon,
  variant = 'accent',
  index = 0,
  prefix = '',
}: {
  label: string
  value: string
  numericValue?: number
  trend?: number
  trendLabel?: string
  icon?: LucideIcon
  variant?: GradientVariant
  index?: number
  prefix?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const countRef = useRef<HTMLSpanElement>(null)
  const [hasAnimated, setHasAnimated] = useState(false)

  useGSAP(() => {
    gsap.from(ref.current, {
      y: 24,
      opacity: 0,
      duration: 0.5,
      delay: index * 0.1,
      ease: 'power2.out',
    })
  }, [])

  // Animated count-up
  useEffect(() => {
    if (hasAnimated || numericValue === undefined || !countRef.current) return
    setHasAnimated(true)

    const target = numericValue
    const duration = 1200
    const start = performance.now()

    function step(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      const current = Math.round(target * eased)
      if (countRef.current) {
        countRef.current.textContent = prefix + current.toLocaleString()
      }
      if (progress < 1) requestAnimationFrame(step)
      else if (countRef.current) {
        countRef.current.textContent = value
      }
    }
    requestAnimationFrame(step)
  }, [numericValue, hasAnimated, prefix, value])

  const isPositive = trend !== undefined && trend >= 0

  return (
    <div ref={ref} className={`stat-card stat-card-${variant}`}>
      <div className="flex items-start justify-between relative z-[1]">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
            {label}
          </p>
          <p className="text-2xl font-bold tracking-tight">
            <span ref={countRef}>{value}</span>
          </p>
          {trend !== undefined && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <span
                className="flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full"
                style={{
                  background: isPositive ? 'rgba(0,184,148,0.1)' : 'rgba(225,112,85,0.1)',
                  color: isPositive ? 'var(--success)' : 'var(--danger)',
                }}
              >
                {isPositive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {isPositive ? '+' : ''}
                {trend}%
              </span>
              {trendLabel && (
                <span className="text-xs" style={{ color: 'var(--muted)' }}>
                  {trendLabel}
                </span>
              )}
            </div>
          )}
        </div>

        {Icon && (
          <div
            className="p-2.5 rounded-xl"
            style={{
              background: `var(--${variant === 'accent' ? 'accent' : variant})`,
              opacity: 0.12,
            }}
          >
            <Icon className="w-5 h-5" style={{ color: `var(--${variant === 'accent' ? 'accent-light' : variant})`, opacity: 1 }} />
          </div>
        )}
      </div>

      {/* Watermark icon */}
      {Icon && (
        <div className="stat-icon-bg">
          <Icon className="w-20 h-20" />
        </div>
      )}
    </div>
  )
}
