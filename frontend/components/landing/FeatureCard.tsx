"use client"

import { motion, useMotionTemplate, useMotionValue } from "framer-motion"
import { MouseEvent } from "react"
import { cn } from "@/lib/utils"

interface FeatureCardProps {
    title?: string
    description?: string
    icon?: React.ReactNode
    children?: React.ReactNode
    className?: string
    delay?: number
}

export function FeatureCard({ title, description, icon, children, className, delay = 0 }: FeatureCardProps) {
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)

    function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
        const { left, top } = currentTarget.getBoundingClientRect()
        mouseX.set(clientX - left)
        mouseY.set(clientY - top)
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay }}
            className={cn(
                "group relative border border-slate-200 bg-white shadow-sm transition-all hover:shadow-xl rounded-3xl overflow-hidden",
                className
            )}
            onMouseMove={handleMouseMove}
        >
            {/* Spotlight Effect */}
            <motion.div
                className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100"
                style={{
                    background: useMotionTemplate`
                        radial-gradient(
                            650px circle at ${mouseX}px ${mouseY}px,
                            rgba(59, 130, 246, 0.1),
                            transparent 80%
                        )
                    `,
                }}
            />

            <div className="p-8 relative z-10 h-full flex flex-col justify-between">
                <div>
                    {icon && title && (
                        <>
                            {icon}
                            <h3 className="text-xl font-bold text-brand-navy mb-2 mt-4">{title}</h3>
                            <p className="text-slate-600 leading-relaxed">
                                {description}
                            </p>
                        </>
                    )}
                    {children}
                </div>
            </div>
        </motion.div>
    )
}
