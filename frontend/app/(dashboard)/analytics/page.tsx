"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import api from "@/lib/api"
import { Loader2, FileText, HardDrive, TrendingUp, PieChart as PieChartIcon } from "lucide-react"
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    AreaChart, Area
} from "recharts"

export default function AnalyticsPage() {
    const [summary, setSummary] = useState<any>(null)
    const [trends, setTrends] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [summaryRes, trendsRes] = await Promise.all([
                    api.get("/api/analytics/summary"),
                    api.get("/api/analytics/trends")
                ])
                setSummary(summaryRes.data)
                setTrends(trendsRes.data)
            } catch (error) {
                console.error("Failed to fetch analytics:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        )
    }

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b']

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    return (
        <div className="space-y-8 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Analytics</h2>
                    <p className="text-slate-500">Insights into your document library</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
                        <FileText className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary?.total_documents}</div>
                        <p className="text-xs text-slate-500">Active files in library</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
                        <HardDrive className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatBytes(summary?.total_storage_bytes || 0)}</div>
                        <p className="text-xs text-slate-500">Total file size</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Categories</CardTitle>
                        <PieChartIcon className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary?.category_distribution.length}</div>
                        <p className="text-xs text-slate-500">Distinct document types</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Upload Activity</CardTitle>
                        <TrendingUp className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{trends.length}</div>
                        <p className="text-xs text-slate-500">Active days recorded</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Category Distribution Chart */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Document Categories</CardTitle>
                        <CardDescription>Distribution of documents by type</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={summary?.category_distribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {summary?.category_distribution.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Source Distribution Chart */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Upload Sources</CardTitle>
                        <CardDescription>Where your documents come from</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={summary?.source_distribution}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" tickLine={false} axisLine={false} />
                                    <YAxis tickLine={false} axisLine={false} />
                                    <RechartsTooltip cursor={{ fill: 'transparent' }} />
                                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Upload Trends Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Upload Trends</CardTitle>
                    <CardDescription>Document volume over time</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trends}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="date" tickLine={false} axisLine={false} />
                                <YAxis tickLine={false} axisLine={false} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <RechartsTooltip />
                                <Area type="monotone" dataKey="count" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCount)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
