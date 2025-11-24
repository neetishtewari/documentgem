"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Receipt, FileCheck, File } from "lucide-react"
import api from "@/lib/api"

interface Stats {
    total_documents: number
    category_counts: Record<string, number>
}

export function DashboardStats({ refreshTrigger }: { refreshTrigger: number }) {
    const [stats, setStats] = useState<Stats | null>(null)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get("/api/documents/stats")
                setStats(response.data)
            } catch (error) {
                console.error("Failed to fetch stats:", error)
            }
        }

        fetchStats()
    }, [refreshTrigger])

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
                    <div className="text-4xl font-bold tracking-tight">{stats.total_documents}</div>
                    <p className="text-xs text-blue-100/80 mt-1 font-medium">Across all categories</p>
                </CardContent>
            </Card>

            {Object.entries(stats.category_counts).map(([category, count]) => (
                <Card key={category} className="border-none bg-white shadow-lg shadow-slate-200/50 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">{category}s</CardTitle>
                        <div className="rounded-full bg-slate-50 p-2">
                            {getIcon(category)}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-900">{count}</div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
