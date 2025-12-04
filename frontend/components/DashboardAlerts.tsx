"use client"

import { useState, useEffect } from "react"
import { AlertCircle, X, Bell } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

interface AlertItem {
    id: string
    type: string
    message: string
    created_at: string
}

export function DashboardAlerts() {
    const [alerts, setAlerts] = useState<AlertItem[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    useEffect(() => {
        fetchAlerts()
    }, [])

    const fetchAlerts = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from("alerts")
                .select("*")
                .eq("user_id", user.id)
                .eq("is_read", false)
                .order("created_at", { ascending: false })

            if (error) throw error
            setAlerts(data || [])
        } catch (error) {
            console.error("Error fetching alerts:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleDismiss = async (id: string) => {
        try {
            setAlerts(prev => prev.filter(a => a.id !== id))
            await supabase.from("alerts").update({ is_read: true }).eq("id", id)
        } catch (error) {
            console.error("Error dismissing alert:", error)
            fetchAlerts()
        }
    }

    if (loading || alerts.length === 0) {
        return null
    }

    const getIconColor = (type: string) => {
        switch (type) {
            case 'compliance_mismatch':
                return 'text-red-600'
            case 'expiry':
            case 'missing_signature':
                return 'text-orange-500'
            case 'high_value':
            case 'auto_renewal':
                return 'text-yellow-600'
            default:
                return 'text-blue-500'
        }
    }

    const displayedAlerts = alerts.slice(0, 5)

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Bell className="h-4 w-4 text-orange-500" />
                        Alerts
                        <span className="ml-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800">
                            {alerts.length}
                        </span>
                    </CardTitle>
                    {alerts.length > 5 && (
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-muted-foreground hover:text-primary">
                                    View All
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>All Alerts</DialogTitle>
                                    <DialogDescription>
                                        Review all your pending notifications.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 mt-4">
                                    {alerts.map(alert => (
                                        <AlertItemView key={alert.id} alert={alert} onDismiss={handleDismiss} />
                                    ))}
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {displayedAlerts.map(alert => (
                    <div key={alert.id} className="flex items-start gap-3 text-sm border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                        <AlertCircle className={`h-4 w-4 mt-0.5 shrink-0 ${getIconColor(alert.type)}`} />
                        <div className="flex-1 space-y-1">
                            <p className="leading-tight text-slate-700 line-clamp-2">{alert.message}</p>
                            <p className="text-xs text-muted-foreground capitalize">{alert.type.replace('_', ' ')}</p>
                        </div>
                        <button
                            onClick={() => handleDismiss(alert.id)}
                            className="text-slate-400 hover:text-slate-600"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}

function AlertItemView({ alert, onDismiss }: { alert: AlertItem, onDismiss: (id: string) => void }) {
    const getIconColor = (type: string) => {
        switch (type) {
            case 'compliance_mismatch':
                return 'text-red-600'
            case 'expiry':
            case 'missing_signature':
                return 'text-orange-500'
            case 'high_value':
            case 'auto_renewal':
                return 'text-yellow-600'
            default:
                return 'text-blue-500'
        }
    }

    return (
        <Alert className="bg-white shadow-sm border-l-4 border-l-transparent">
            <AlertCircle className={`h-4 w-4 ${getIconColor(alert.type)}`} />
            <AlertTitle className="ml-2 capitalize flex items-center gap-2">
                {alert.type.replace('_', ' ')} Alert
            </AlertTitle>
            <AlertDescription className="ml-2 flex items-center justify-between w-full">
                <span className="text-slate-700">{alert.message}</span>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-transparent"
                    onClick={() => onDismiss(alert.id)}
                >
                    <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </Button>
            </AlertDescription>
        </Alert>
    )
}
