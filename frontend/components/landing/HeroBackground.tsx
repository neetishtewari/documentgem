"use client"

import { motion } from "framer-motion"

export function HeroBackground() {
    return (
        <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute inset-0 bg-slate-50/50 backdrop-blur-[100px]" />

            {/* Animated Blobs */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 90, 0],
                    x: [0, 100, 0],
                    y: [0, -50, 0]
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    repeatType: "reverse"
                }}
                className="absolute -top-[20%] -left-[10%] h-[600px] w-[600px] rounded-full bg-purple-200/40 blur-[80px]"
            />

            <motion.div
                animate={{
                    scale: [1, 1.3, 1],
                    rotate: [0, -60, 0],
                    x: [0, -80, 0],
                    y: [0, 100, 0]
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    repeatType: "reverse"
                }}
                className="absolute top-[10%] -right-[10%] h-[500px] w-[500px] rounded-full bg-blue-200/40 blur-[80px]"
            />

            <motion.div
                animate={{
                    scale: [1, 1.4, 1],
                    rotate: [0, 45, 0],
                    x: [0, 50, 0],
                    y: [0, 50, 0]
                }}
                transition={{
                    duration: 22,
                    repeat: Infinity,
                    repeatType: "reverse"
                }}
                className="absolute -bottom-[20%] left-[20%] h-[600px] w-[600px] rounded-full bg-indigo-200/40 blur-[80px]"
            />

            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
        </div>
    )
}
