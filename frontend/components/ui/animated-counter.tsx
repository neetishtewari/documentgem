"use client"

import { useEffect, useRef } from "react"
import { useInView, useMotionValue, useSpring } from "framer-motion"

export function AnimatedCounter({
    value,
    direction = "up",
}: {
    value: number
    direction?: "up" | "down"
}) {
    const ref = useRef<HTMLSpanElement>(null)
    const motionValue = useMotionValue(direction === "down" ? value : 0)
    const springValue = useSpring(motionValue, {
        damping: 20,
        stiffness: 100,
    })
    const isInView = useInView(ref, { once: true })

    useEffect(() => {
        if (isInView) {
            motionValue.set(direction === "down" ? 0 : value)
        }
    }, [motionValue, isInView, value, direction])

    useEffect(() => {
        springValue.on("change", (latest) => {
            if (ref.current) {
                ref.current.textContent = Intl.NumberFormat("en-US").format(
                    Math.floor(latest)
                )
            }
        })
    }, [springValue])

    return <span ref={ref} />
}
