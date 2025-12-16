"use client"

import { useInView } from "framer-motion"
import { useEffect, useState, useRef } from "react"

interface TypewriterTextProps {
    text: string
    delay?: number
    className?: string
    cursor?: boolean
}

export function TypewriterText({ text, delay = 0, className, cursor = false }: TypewriterTextProps) {
    const [displayedText, setDisplayedText] = useState("")
    const [started, setStarted] = useState(false)
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-50px" })

    useEffect(() => {
        if (!isInView) return

        const startTimeout = setTimeout(() => {
            setStarted(true)
        }, delay * 1000)

        return () => clearTimeout(startTimeout)
    }, [isInView, delay])

    useEffect(() => {
        if (!started) return

        let i = 0
        setDisplayedText("") // Reset text when starting/restarting

        const interval = setInterval(() => {
            if (i < text.length) {
                setDisplayedText(text.substring(0, i + 1))
                i++
            } else {
                clearInterval(interval)
            }
        }, 30) // 30ms per char

        return () => clearInterval(interval)
    }, [started, text])

    return (
        <span ref={ref} className={className}>
            {displayedText}
            {cursor && started && displayedText.length < text.length && (
                <span className="animate-pulse">|</span>
            )}
        </span>
    )
}
