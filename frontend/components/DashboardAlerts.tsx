"use client"

import { useState, useEffect } from "react"
import { AlertCircle, X } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

interface AlertItem {
    id: string
    type: string
    message: string
    created_at: string
}

export function DashboardAlerts() {
    const [alerts, setAlerts] = useState<AlertItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchAlerts()

        // Subscribe to realtime changes?
        // For now just fetch on mount.
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
            // Optimistic update
            setAlerts(prev => prev.filter(a => a.id !== id))

            const { error } = await supabase
                .from("alerts")
                .update({ is_read: true })
                .eq("id", id)

            if (error) throw error
        } catch (error) {
            console.error("Error dismissing alert:", error)
            fetchAlerts() // Revert on error
        }
    }

    if (loading || alerts.length === 0) {
        return null
    }

    return (
        <div className="space-y-4">
            {alerts.map(alert => (
                <Alert key={alert.id} variant={alert.type === 'expiry' ? 'destructive' : 'default'} className="bg-white shadow-sm border-l-4 border-l-red-500">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle className="ml-2 capitalize">{alert.type} Alert</AlertTitle>
                    <AlertDescription className="ml-2 flex items-center justify-between w-full">
                        <span>{alert.message}</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-transparent"
                            onClick={() => handleDismiss(alert.id)}
                        >
                            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        </Button>
                    </AlertDescription>
                </Alert>
            ))}
        </div>
    )
}
