"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

const words = [
    "Business Intelligence",
    "Actionable Insights",
    "Strategic Clarity",
    "Competitive Advantage",
]

export function RotatingText() {
    const [currentWordIndex, setCurrentWordIndex] = useState(0)
    const [text, setText] = useState("")
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
        const currentWord = words[currentWordIndex]
        const typeSpeed = isDeleting ? 50 : 100 // Speed of typing/deleting
        const pauseTime = 2000 // Pause before deleting

        const handleTyping = () => {
            if (!isDeleting) {
                // Typing
                if (text !== currentWord) {
                    setText(currentWord.substring(0, text.length + 1))
                } else {
                    // Finished typing, wait then delete
                    setTimeout(() => setIsDeleting(true), pauseTime)
                }
            } else {
                // Deleting
                if (text !== "") {
                    setText(currentWord.substring(0, text.length - 1))
                } else {
                    // Finished deleting, move to next word
                    setIsDeleting(false)
                    setCurrentWordIndex((prev) => (prev + 1) % words.length)
                }
            }
        }

        const timer = setTimeout(handleTyping, typeSpeed)
        return () => clearTimeout(timer)
    }, [text, isDeleting, currentWordIndex])

    return (
        <span className="inline-block min-w-[320px] text-left align-top">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 animate-gradient-x">
                {text}
            </span>
            <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                className="inline-block w-[3px] h-[1em] bg-indigo-600 ml-1 align-middle"
            />
        </span>
    )
}
