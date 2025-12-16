"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Receipt, FileCheck, File } from "lucide-react"
import { AnimatedCounter } from "@/components/ui/animated-counter"
import api from "@/lib/api"

import { DateRange } from "@/components/DateFilter"

interface Stats {
    total_documents: number
    category_counts: Record<string, number>
}

export function DashboardStats({ refreshTrigger, dateRange }: { refreshTrigger: number, dateRange?: DateRange }) {
    const router = useRouter()
    const [stats, setStats] = useState<Stats | null>(null)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                let url = "/api/documents/stats"
                const params = new URLSearchParams()
                if (dateRange?.from) params.append("start_date", dateRange.from.toISOString())
                if (dateRange?.to) params.append("end_date", dateRange.to.toISOString())

                if (params.toString()) url += `?${params.toString()}`

                const response = await api.get(url)
                setStats(response.data)
            } catch (error) {
                console.error("Failed to fetch stats:", error)
            }
        }

        fetchStats()
    }, [refreshTrigger, dateRange])

    if (!stats) return null

    const getIcon = (category: string) => {
        switch (category.toLowerCase()) {
            case "invoice": return <Receipt className="h-4 w-4 text-muted-foreground" />
            case "contract": return <FileCheck className="h-4 w-4 text-muted-foreground" />
            default: return <FileText className="h-4 w-4 text-muted-foreground" />
        }
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="relative overflow-hidden border-none bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/20">
                <div className="absolute right-0 top-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-blue-100">Total Documents</CardTitle>
                    <File className="h-4 w-4 text-blue-100" />
                </CardHeader>
                <CardContent>
                    <div className="text-4xl font-bold tracking-tight">
                        <AnimatedCounter value={stats.total_documents} />
                    </div>
                    <p className="text-xs text-blue-100/80 mt-1 font-medium">Across all categories</p>
                </CardContent>
            </Card>

            {Object.entries(stats.category_counts).map(([category, count]) => (
                <Card
                    key={category}
                    onClick={() => router.push(`?category=${category}`)}
                    className="border-none bg-white shadow-lg shadow-slate-200/50 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60 cursor-pointer hover:ring-2 hover:ring-blue-500/20"
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">{category}s</CardTitle>
                        <div className="rounded-full bg-slate-50 p-2">
                            {getIcon(category)}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-900">
                            <AnimatedCounter value={count} />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
