"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { LayoutGrid, List as ListIcon, FileText, Mail, UploadCloud } from "lucide-react"
import { DocumentTable } from "./DocumentTable"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import api from "@/lib/api"

import { DateRange } from "@/components/DateFilter"

interface Document {
    id: string
    name: string
    type: string
    size: number
    category: string
    created_at: string
    metadata?: any
    source?: string
    source_date?: string
}

interface DocumentListProps {
    refreshTrigger: number
    dateRange?: DateRange
}

export function DocumentList({ refreshTrigger, dateRange }: DocumentListProps) {
    const [documents, setDocuments] = useState<Document[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState("All")
    const [viewMode, setViewMode] = useState<"grid" | "table">("grid")

    useEffect(() => {
        const fetchDocuments = async () => {
            try {
                setLoading(true) // Set loading to true when fetching new data
                let url = "/api/documents/"
                const params = new URLSearchParams()

                if (filter !== "All") params.append("category", filter)
                if (dateRange?.from) params.append("start_date", dateRange.from.toISOString())
                if (dateRange?.to) params.append("end_date", dateRange.to.toISOString())

                if (params.toString()) url += `?${params.toString()}`

                const response = await api.get(url)
                setDocuments(response.data)
            } catch (error) {
                console.error("Failed to fetch documents:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchDocuments()
    }, [refreshTrigger, filter, dateRange])

    const categories = ["All", "Invoice", "Receipt", "Contract", "Policy", "Other"]

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold tracking-tight text-slate-900">Your Documents</h2>
                <div className="flex items-center gap-4">
                    <div className="flex gap-1 bg-slate-100/80 p-1 rounded-xl">
                        {categories.map((cat) => (
                            <Button
                                key={cat}
                                variant="ghost"
                                size="sm"
                                onClick={() => setFilter(cat)}
                                className={cn(
                                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 hover:bg-white/50",
                                    filter === cat
                                        ? "bg-white text-slate-900 shadow-sm ring-1 ring-black/5"
                                        : "text-slate-500 hover:text-slate-900"
                                )}
                            >
                                {cat}
                            </Button>
                        ))}
                    </div>
                    <div className="flex gap-1 bg-slate-100/80 p-1 rounded-xl">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewMode("grid")}
                            className={cn(
                                "h-8 w-8 rounded-lg transition-all duration-200",
                                viewMode === "grid"
                                    ? "bg-white text-slate-900 shadow-sm ring-1 ring-black/5"
                                    : "text-slate-500 hover:text-slate-900"
                            )}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewMode("table")}
                            className={cn(
                                "h-8 w-8 rounded-lg transition-all duration-200",
                                viewMode === "table"
                                    ? "bg-white text-slate-900 shadow-sm ring-1 ring-black/5"
                                    : "text-slate-500 hover:text-slate-900"
                            )}
                        >
                            <ListIcon className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-40 rounded-2xl bg-slate-100 animate-pulse" />
                    ))}
                </div>
            ) : documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    <div className="rounded-full bg-white p-4 shadow-sm mb-4">
                        <FileText className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">No documents found</h3>
                    <p className="text-sm text-slate-500 mt-1">Try adjusting your filters or upload a new document</p>
                </div>
            ) : viewMode === "table" ? (
                <DocumentTable documents={documents} category={filter} />
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {documents.map((doc) => (
                        <Link key={doc.id} href={`/documents/${doc.id}`}>
                            <Card className="group relative h-full overflow-hidden border-none bg-white shadow-sm shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/40">
                                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                    <div className="flex items-start gap-4">
                                        <div className="rounded-xl bg-blue-50 p-3 transition-colors group-hover:bg-blue-100/80 relative">
                                            <FileText className="h-6 w-6 text-blue-600" />
                                            {doc.source === 'Gmail' && (
                                                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-slate-100">
                                                    <Mail className="h-3 w-3 text-red-500" />
                                                </div>
                                            )}
                                            {doc.source === 'Upload' && (
                                                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-slate-100">
                                                    <UploadCloud className="h-3 w-3 text-slate-500" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-1.5">
                                            <CardTitle className="text-base font-semibold leading-none tracking-tight text-slate-900 line-clamp-1" title={doc.name}>
                                                {doc.name}
                                            </CardTitle>
                                            <CardDescription className="text-xs font-medium text-slate-500">
                                                {new Date(doc.source_date || doc.created_at).toLocaleDateString(undefined, {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                                <span className="mx-1">•</span>
                                                {doc.source || 'Upload'}
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-4">
                                        <span className={cn(
                                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase",
                                            "bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors"
                                        )}>
                                            {doc.category || "Uncategorized"}
                                        </span>
                                        <div className="text-[11px] font-medium text-slate-400">
                                            {(doc.size / 1024).toFixed(0)} KB
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
