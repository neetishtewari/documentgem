"use client"

import { useEffect, useState } from "react"
import { AuthGuard } from "@/components/AuthGuard"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, RefreshCw, FileText, AlertTriangle } from "lucide-react"
import api from "@/lib/api"
import { cn } from "@/lib/utils"

interface Document {
    id: string
    name: string
    size: number
    deleted_at: string
    type: string
}

export default function TrashPage() {
    const [documents, setDocuments] = useState<Document[]>([])
    const [loading, setLoading] = useState(true)

    const fetchTrash = async () => {
        try {
            setLoading(true)
            const response = await api.get("/api/documents/trash")
            setDocuments(response.data)
        } catch (error) {
            console.error("Failed to fetch trash:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTrash()
    }, [])

    const handleRestore = async (id: string) => {
        try {
            await api.post(`/api/documents/${id}/restore`)
            fetchTrash()
        } catch (error) {
            console.error("Failed to restore:", error)
        }
    }

    const handlePermanentDelete = async (id: string) => {
        if (!confirm("Are you sure? This cannot be undone.")) return

        try {
            await api.delete(`/api/documents/${id}/permanent`)
            fetchTrash()
        } catch (error) {
            console.error("Failed to delete permanently:", error)
        }
    }

    return (
        <AuthGuard>
            <div className="container mx-auto py-10 space-y-8">
                <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Trash</h1>
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
                            <Trash2 className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">Trash is empty</h3>
                        <p className="text-sm text-slate-500 mt-1">
                            Deleted documents will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {documents.map((doc) => (
                            <Card key={doc.id} className="group relative overflow-hidden border-none bg-white shadow-sm shadow-slate-200/50 transition-all hover:shadow-md">
                                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                    <div className="flex items-start gap-4">
                                        <div className="rounded-xl bg-red-50 p-3">
                                            <FileText className="h-6 w-6 text-red-500" />
                                        </div>
                                        <div className="space-y-1">
                                            <CardTitle className="text-base font-semibold leading-none tracking-tight text-slate-900 line-clamp-1" title={doc.name}>
                                                {doc.name}
                                            </CardTitle>
                                            <CardDescription className="text-xs font-medium text-slate-500">
                                                Deleted {new Date(doc.deleted_at).toLocaleDateString()}
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="mt-4 flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 gap-2 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                                            onClick={() => handleRestore(doc.id)}
                                        >
                                            <RefreshCw className="h-3 w-3" />
                                            Restore
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                            onClick={() => handlePermanentDelete(doc.id)}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                            Delete
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AuthGuard>
    )
}
