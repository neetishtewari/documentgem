"use client"

import { useEffect, useState } from "react"
import { AuthGuard } from "@/components/AuthGuard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, FileText, Trash2, AlertTriangle, RefreshCw, Upload } from "lucide-react"
import api from "@/lib/api"
import { formatDistanceToNow } from "date-fns"

interface ActivityLog {
    id: string
    action: string
    entity_type: string
    entity_id: string
    details: any
    created_at: string
}

export default function ActivityPage() {
    const [logs, setLogs] = useState<ActivityLog[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await api.get("/api/activity/")
                setLogs(response.data)
            } catch (error) {
                console.error("Failed to fetch activity logs:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchLogs()
    }, [])

    const getIcon = (action: string) => {
        switch (action) {
            case "UPLOAD": return <Upload className="h-4 w-4 text-blue-500" />
            case "DELETE": return <Trash2 className="h-4 w-4 text-red-500" />
            case "RESTORE": return <RefreshCw className="h-4 w-4 text-green-500" />
            case "ALERT": return <AlertTriangle className="h-4 w-4 text-orange-500" />
            default: return <Activity className="h-4 w-4 text-slate-500" />
        }
    }

    const getMessage = (log: ActivityLog) => {
        const name = log.details?.name || "Unknown Item"
        switch (log.action) {
            case "UPLOAD": return <span>Uploaded document <span className="font-medium text-slate-900">{name}</span></span>
            case "DELETE": return <span>Moved <span className="font-medium text-slate-900">{name}</span> to trash</span>
            case "RESTORE": return <span>Restored <span className="font-medium text-slate-900">{name}</span> from trash</span>
            case "PERMANENT_DELETE": return <span>Permanently deleted <span className="font-medium text-slate-900">{name}</span></span>
            case "ALERT": return <span>Alert triggered for <span className="font-medium text-slate-900">{name}</span></span>
            default: return <span>Performed {log.action} on {log.entity_type}</span>
        }
    }

    return (
        <AuthGuard>
            <div className="container mx-auto py-10 space-y-8">
                <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Activity Log</h1>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-medium">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-center gap-4 animate-pulse">
                                        <div className="h-10 w-10 rounded-full bg-slate-100" />
                                        <div className="space-y-2 flex-1">
                                            <div className="h-4 w-1/3 bg-slate-100 rounded" />
                                            <div className="h-3 w-1/4 bg-slate-100 rounded" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="text-center py-10 text-slate-500">
                                No activity recorded yet.
                            </div>
                        ) : (
                            <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                                {logs.map((log) => (
                                    <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">

                                        {/* Icon */}
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 bg-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                            {getIcon(log.action)}
                                        </div>

                                        {/* Content Card */}
                                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-100 bg-white shadow-sm">
                                            <div className="flex items-center justify-between space-x-2 mb-1">
                                                <div className="font-bold text-slate-900 text-sm">
                                                    {log.action.replace("_", " ")}
                                                </div>
                                                <time className="font-caveat font-medium text-xs text-slate-500">
                                                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                                                </time>
                                            </div>
                                            <div className="text-slate-600 text-sm">
                                                {getMessage(log)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AuthGuard>
    )
}
