"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Zap, ShieldCheck } from "lucide-react"

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Navigation */}
            <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-extrabold tracking-tight text-brand-navy">
                            Document<span className="text-blue-600">Gem</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/login">
                            <Button variant="ghost" className="text-slate-600 hover:text-brand-navy">
                                Sign In
                            </Button>
                        </Link>
                        <Link href="/signup">
                            <Button className="bg-brand-navy hover:bg-brand-navy/90 text-white">
                                Get Started
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative overflow-hidden pt-20 pb-32 md:pt-32">
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100 via-slate-50 to-slate-50 opacity-50"></div>

                    <div className="container mx-auto px-4 text-center">
                        <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                            <Sparkles className="mr-2 h-3.5 w-3.5" />
                            AI-Powered Document Intelligence
                        </div>

                        <h1 className="mx-auto max-w-4xl text-5xl font-extrabold tracking-tight text-brand-navy sm:text-7xl mb-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
                            Your Documents, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Decoded.</span>
                        </h1>

                        <p className="mx-auto max-w-2xl text-lg text-slate-600 mb-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                            Stop drowning in files. DocumentGem uses advanced AI to automatically organize, analyze, and extract actionable insights from your business documents.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                            <Link href="/signup">
                                <Button size="lg" className="h-12 px-8 text-lg bg-brand-navy hover:bg-brand-navy/90 text-white shadow-lg shadow-blue-900/20 transition-transform hover:scale-105">
                                    Start for Free <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </Link>
                            <Link href="/login">
                                <Button variant="outline" size="lg" className="h-12 px-8 text-lg border-slate-300 text-slate-700 hover:bg-slate-100">
                                    Live Demo
                                </Button>
                            </Link>
                        </div>

                        {/* Dashboard Visual with Screenshot */}
                        <div className="mt-20 relative mx-auto max-w-5xl rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/50 p-2 animate-in fade-in zoom-in duration-1000 delay-500 transform transition-transform hover:scale-[1.01]">
                            <div className="aspect-[16/9] rounded-lg bg-slate-100 overflow-hidden relative group">
                                <img
                                    src="/dashboard-preview.png"
                                    alt="DocumentGem Dashboard Interface"
                                    className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                                />
                                {/* Overlay Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent pointer-events-none"></div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Grid */}
                <section className="py-24 bg-white">
                    <div className="container mx-auto px-4">
                        <div className="grid gap-12 md:grid-cols-3">
                            <div className="group relative rounded-2xl border border-slate-100 bg-slate-50 p-8 transition-all hover:shadow-xl hover:-translate-y-1">
                                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
                                    <Zap className="h-6 w-6" />
                                </div>
                                <h3 className="mb-2 text-xl font-bold text-brand-navy">Instant Extraction</h3>
                                <p className="text-slate-600">
                                    Upload an invoice, and we'll extract the total, due date, and vendor instantly. No manual data entry required.
                                </p>
                            </div>

                            <div className="group relative rounded-2xl border border-slate-100 bg-slate-50 p-8 transition-all hover:shadow-xl hover:-translate-y-1">
                                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
                                    <Sparkles className="h-6 w-6" />
                                </div>
                                <h3 className="mb-2 text-xl font-bold text-brand-navy">Chat with Data</h3>
                                <p className="text-slate-600">
                                    "How much did we spend on marketing?" Ask your documents questions in plain English and get cited answers.
                                </p>
                            </div>

                            <div className="group relative rounded-2xl border border-slate-100 bg-slate-50 p-8 transition-all hover:shadow-xl hover:-translate-y-1">
                                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-teal-600 text-white shadow-lg shadow-teal-600/30">
                                    <ShieldCheck className="h-6 w-6" />
                                </div>
                                <h3 className="mb-2 text-xl font-bold text-brand-navy">Auto-Organization</h3>
                                <p className="text-slate-600">
                                    We automatically categorize your files into Invoices, Contracts, and Receipts. Keep your digital life tidy.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-24 bg-brand-navy relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
                    <div className="container mx-auto px-4 text-center relative z-10">
                        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-6">
                            Ready to organize your chaos?
                        </h2>
                        <p className="mx-auto max-w-2xl text-lg text-blue-100 mb-10">
                            Join thousands of users who trust DocumentGem to manage their critical business documents.
                        </p>
                        <Link href="/signup">
                            <Button size="lg" className="h-12 px-8 text-lg bg-white text-brand-navy hover:bg-blue-50">
                                Get Started Now
                            </Button>
                        </Link>
                    </div>
                </section>
            </main>

            <footer className="border-t border-slate-200 bg-white py-12">
                <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-brand-navy">
                            Document<span className="text-blue-600">Gem</span>
                        </span>
                    </div>
                    <p className="text-sm text-slate-500">
                        © 2024 DocumentGem Inc. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        <a href="#" className="text-sm text-slate-500 hover:text-brand-navy">Privacy</a>
                        <a href="#" className="text-sm text-slate-500 hover:text-brand-navy">Terms</a>
                        <a href="#" className="text-sm text-slate-500 hover:text-brand-navy">Twitter</a>
                    </div>
                </div>
            </footer>
        </div>
    )
}
