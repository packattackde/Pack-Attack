'use client'

import { useEffect, useRef, useState } from 'react'

export function useCountUp(target: number, duration: number = 800): number {
  const [current, setCurrent] = useState(0)
  const prevTarget = useRef(target)

  useEffect(() => {
    const start = prevTarget.current
    prevTarget.current = target

    if (start === target) {
      setCurrent(target)
      return
    }

    const startTime = performance.now()
    let rafId: number

    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic

      setCurrent(Math.round(start + (target - start) * eased))

      if (progress < 1) {
        rafId = requestAnimationFrame(animate)
      }
    }

    rafId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafId)
  }, [target, duration])

  return current
}
