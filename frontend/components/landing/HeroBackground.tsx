"use client"

import { motion } from "framer-motion"

export function HeroBackground() {
    return (
        <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute inset-0 bg-[#0F172A]" />

            {/* Background Image Overlay */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay" />

            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0F172A]/80 to-[#0F172A]" />

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
                className="absolute -top-[20%] -left-[10%] h-[600px] w-[600px] rounded-full bg-blue-600/20 blur-[100px]"
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
                className="absolute top-[10%] -right-[10%] h-[500px] w-[500px] rounded-full bg-indigo-500/20 blur-[100px]"
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
                className="absolute -bottom-[20%] left-[20%] h-[600px] w-[600px] rounded-full bg-purple-500/20 blur-[100px]"
            />

            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
        </div>
    )
}
