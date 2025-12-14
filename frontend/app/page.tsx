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
                        <Link href="/login?signup=true">
                            <Button className="bg-brand-navy hover:bg-brand-navy/90 text-white">
                                Get Started
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative overflow-hidden pt-20 pb-20 md:pt-32">
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100 via-slate-50 to-slate-50 opacity-50"></div>

                    {/* Floating Elements / Grid Background */}
                    <div className="absolute inset-0 -z-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>

                    <div className="container mx-auto px-4 text-center">
                        <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                            <Sparkles className="mr-2 h-3.5 w-3.5" />
                            AI-Powered Document Intelligence
                        </div>

                        <h1 className="mx-auto max-w-5xl text-5xl font-extrabold tracking-tight text-brand-navy sm:text-7xl mb-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100 leading-tight">
                            Turn Document Chaos into <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Business Intelligence.</span>
                        </h1>

                        <p className="mx-auto max-w-2xl text-lg text-slate-600 mb-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                            The AI-powered workspace that organizes, analyzes, and extracts insights from your files automatically. Stop searching, start knowing.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                            <Link href="/login?signup=true">
                                <Button size="lg" className="h-14 px-8 text-lg bg-brand-navy hover:bg-brand-navy/90 text-white shadow-xl shadow-blue-900/20 transition-all hover:scale-105 hover:shadow-blue-900/30">
                                    Start for Free <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </Link>
                            <Link href="/login">
                                <Button variant="outline" size="lg" className="h-14 px-8 text-lg border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-brand-navy">
                                    View Live Demo
                                </Button>
                            </Link>
                        </div>

                        {/* Social Proof */}
                        <div className="mt-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-400">
                            <p className="text-sm font-medium text-slate-500 mb-4">TRUSTED BY INNOVATIVE TEAMS</p>
                            <div className="flex flex-wrap justify-center gap-8 opacity-60 grayscale transition-all hover:grayscale-0">
                                {/* Placeholders for logos - using text for now but styled like logos */}
                                <span className="text-xl font-bold text-slate-400 flex items-center gap-2"><div className="w-6 h-6 bg-slate-300 rounded-full"></div> Acme Corp</span>
                                <span className="text-xl font-bold text-slate-400 flex items-center gap-2"><div className="w-6 h-6 bg-slate-300 rounded-md"></div> Globex</span>
                                <span className="text-xl font-bold text-slate-400 flex items-center gap-2"><div className="w-6 h-6 bg-slate-300 rounded-sm"></div> Soylent</span>
                                <span className="text-xl font-bold text-slate-400 flex items-center gap-2"><div className="w-6 h-6 bg-slate-300 rounded-full"></div> Initech</span>
                            </div>
                        </div>

                        {/* Dashboard Visual with Screenshot */}
                        <div className="mt-20 relative mx-auto max-w-6xl rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/50 p-2 animate-in fade-in zoom-in duration-1000 delay-500 transform transition-transform hover:scale-[1.01]">
                            <div className="aspect-[16/9] rounded-lg bg-slate-100 overflow-hidden relative group">
                                <img
                                    src="/dashboard-preview.png"
                                    alt="DocumentGem Dashboard Interface"
                                    className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                                />
                                {/* Overlay Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent pointer-events-none"></div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section - Bento Grid */}
                <section className="py-24 bg-slate-50">
                    <div className="container mx-auto px-4">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <h2 className="text-3xl font-bold tracking-tight text-brand-navy sm:text-4xl mb-4">
                                Everything you need to master your documents
                            </h2>
                            <p className="text-lg text-slate-600">
                                Powerful features designed to save you hours of manual work every week.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                            {/* Feature 1: Chat (Large - Spans 2 cols) */}
                            <div className="md:col-span-2 group relative rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 overflow-hidden">
                                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-blue-100 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity"></div>

                                <div className="relative z-10 flex flex-col h-full justify-between">
                                    <div className="mb-6">
                                        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
                                            <Sparkles className="h-6 w-6" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-brand-navy mb-2">Chat with your Data</h3>
                                        <p className="text-slate-600 text-lg">
                                            "How much did we spend on marketing in Q3?" <br />
                                            Ask your documents questions in plain English and get instant, cited answers. It's like having a dedicated analyst.
                                        </p>
                                    </div>

                                    {/* Mock Chat Bubble Visual */}
                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mt-4">
                                        <div className="flex gap-3 mb-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600"><Sparkles className="w-4 h-4" /></div>
                                            <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm text-sm text-slate-700 border border-slate-100">
                                                Based on your invoices, the total marketing spend for Q3 was <strong>$12,450.00</strong>.
                                            </div>
                                        </div>
                                        <div className="flex gap-2 items-center">
                                            <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                            <span className="text-xs text-slate-400">AI Analyst is active</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Feature 2: Extraction (Medium) */}
                            <div className="group relative rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
                                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
                                    <Zap className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold text-brand-navy mb-2">Instant Extraction</h3>
                                <p className="text-slate-600">
                                    Upload an invoice, and we'll extract the total, due date, and vendor instantly. No manual data entry required.
                                </p>
                                <div className="mt-6 space-y-2">
                                    <div className="flex justify-between text-sm p-2 bg-slate-50 rounded border border-slate-100">
                                        <span className="text-slate-500">Total</span>
                                        <span className="font-mono font-bold text-brand-navy">$1,200.50</span>
                                    </div>
                                    <div className="flex justify-between text-sm p-2 bg-slate-50 rounded border border-slate-100">
                                        <span className="text-slate-500">Date</span>
                                        <span className="font-mono font-bold text-brand-navy">Oct 24, 2024</span>
                                    </div>
                                </div>
                            </div>

                            {/* Feature 3: Organization (Medium) */}
                            <div className="group relative rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
                                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-teal-600 text-white shadow-lg shadow-teal-600/30">
                                    <ShieldCheck className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl font-bold text-brand-navy mb-2">Auto-Organization</h3>
                                <p className="text-slate-600">
                                    We automatically categorize your files into Invoices, Contracts, and Receipts. Keep your digital life tidy without lifting a finger.
                                </p>
                            </div>

                            {/* Feature 4: Security (Large - Spans 2 cols) */}
                            <div className="md:col-span-2 group relative rounded-3xl border border-slate-200 bg-brand-navy p-8 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 overflow-hidden">
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
                                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                                    <div className="flex-1">
                                        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-sm">
                                            <ShieldCheck className="h-6 w-6" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-white mb-2">Bank-Grade Security</h3>
                                        <p className="text-blue-100 text-lg">
                                            Your data is encrypted at rest and in transit. We use industry-standard security protocols to ensure your sensitive business documents remain private and secure.
                                        </p>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 hover:text-white">
                                            Read Security Policy
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How it Works Section */}
                <section className="py-24 bg-white border-t border-slate-100">
                    <div className="container mx-auto px-4">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <h2 className="text-3xl font-bold tracking-tight text-brand-navy sm:text-4xl mb-4">
                                From Chaos to Clarity in 3 Steps
                            </h2>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto relative">
                            {/* Connecting Line (Desktop) */}
                            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-blue-200 via-indigo-200 to-blue-200 -z-10"></div>

                            {/* Step 1 */}
                            <div className="relative flex flex-col items-center text-center">
                                <div className="w-24 h-24 bg-white rounded-2xl border border-blue-100 shadow-lg flex items-center justify-center mb-6 z-10">
                                    <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-bold text-2xl">1</div>
                                </div>
                                <h3 className="text-xl font-bold text-brand-navy mb-2">Upload Documents</h3>
                                <p className="text-slate-600">
                                    Drag & drop files or sync your Google Drive. We handle PDFs, images, and Word docs.
                                </p>
                            </div>

                            {/* Step 2 */}
                            <div className="relative flex flex-col items-center text-center">
                                <div className="w-24 h-24 bg-white rounded-2xl border border-indigo-100 shadow-lg flex items-center justify-center mb-6 z-10">
                                    <div className="w-16 h-16 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-bold text-2xl">2</div>
                                </div>
                                <h3 className="text-xl font-bold text-brand-navy mb-2">AI Analysis</h3>
                                <p className="text-slate-600">
                                    Our AI reads every line, extracting key data and categorizing files automatically.
                                </p>
                            </div>

                            {/* Step 3 */}
                            <div className="relative flex flex-col items-center text-center">
                                <div className="w-24 h-24 bg-white rounded-2xl border border-teal-100 shadow-lg flex items-center justify-center mb-6 z-10">
                                    <div className="w-16 h-16 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 font-bold text-2xl">3</div>
                                </div>
                                <h3 className="text-xl font-bold text-brand-navy mb-2">Get Insights</h3>
                                <p className="text-slate-600">
                                    Chat with your data, track spending, and never miss a deadline again.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-32 bg-brand-navy relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-900/50 via-transparent to-indigo-900/50"></div>

                    <div className="container mx-auto px-4 text-center relative z-10">
                        <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl mb-6">
                            Ready to organize your chaos?
                        </h2>
                        <p className="mx-auto max-w-2xl text-xl text-blue-100 mb-10">
                            Join thousands of users who trust DocumentGem to manage their critical business documents.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link href="/login?signup=true">
                                <Button size="lg" className="h-14 px-8 text-lg bg-white text-brand-navy hover:bg-blue-50 shadow-xl shadow-blue-900/50 transition-transform hover:scale-105">
                                    Start your Free Trial
                                </Button>
                            </Link>
                            <Link href="/login">
                                <Button variant="outline" size="lg" className="h-14 px-8 text-lg bg-transparent border-white text-white hover:bg-white hover:text-brand-navy transition-colors">
                                    Talk to Sales
                                </Button>
                            </Link>
                        </div>
                        <p className="mt-6 text-sm text-blue-200/60">
                            No credit card required · 14-day free trial · Cancel anytime
                        </p>
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
