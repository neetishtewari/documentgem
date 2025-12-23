
"use client"

import { useState, useEffect } from "react"
import { Mail, HardDrive, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { IntegrationConfigDialog } from "@/components/IntegrationConfigDialog"
import api from "@/lib/api"

export default function IntegrationsPage() {
    const [isGmailDialogOpen, setIsGmailDialogOpen] = useState(false)
    const [integrations, setIntegrations] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set())

    // Fetch status on mount
    useEffect(() => {
        fetchStatus()
        // Poll for status updates every 5 seconds if syncing
        const interval = setInterval(() => {
            fetchStatus()
        }, 5000)
        return () => clearInterval(interval)
    }, [])

    const fetchStatus = async () => {
        try {
            const response = await api.get("/api/integrations/status")
            setIntegrations(response.data)
        } catch (error) {
            console.error("Failed to fetch integration status:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleDisconnect = async (integrationId: string) => {
        if (!confirm("Are you sure you want to disconnect? This will stop future syncs.")) {
            return
        }

        try {
            await api.delete(`/api/integrations/${integrationId}`)
            // Refresh status
            fetchStatus()
        } catch (error) {
            console.error("Failed to disconnect:", error)
            alert("Failed to disconnect. Please try again.")
        }
    }

    const handleSync = async (integrationId: string) => {
        try {
            setSyncingIds(prev => new Set(prev).add(integrationId))
            await api.post(`/api/integrations/${integrationId}/sync`)
            fetchStatus()
        } catch (error) {
            console.error("Failed to trigger sync:", error)
            alert("Failed to start sync.")
        } finally {
            // We don't remove from syncingIds immediately, we let the status poll handle it
            // or we can remove it after a timeout to re-enable the button
            setTimeout(() => {
                setSyncingIds(prev => {
                    const next = new Set(prev)
                    next.delete(integrationId)
                    return next
                })
            }, 2000)
        }
    }

    const [targetProvider, setTargetProvider] = useState<'gmail' | 'google_drive'>('gmail')

    const handleConnect = async (config: { lookbackDays: number; customDate?: Date }) => {
        try {
            // Construct query params
            const params = new URLSearchParams()
            params.append("lookback_days", config.lookbackDays.toString())
            params.append("provider", targetProvider) // Pass provider
            if (config.customDate) {
                params.append("custom_date", config.customDate.toISOString())
            }

            console.log("Fetching auth URL with params:", params.toString())
            const response = await api.get(`/api/auth/google/url?${params.toString()}`)
            console.log("Auth URL response:", response.data)

            if (response.data.url) {
                window.location.href = response.data.url
            } else {
                console.error("No URL returned from backend")
                alert("Failed to initiate connection. Please check console for details.")
            }
        } catch (error) {
            console.error("Failed to get auth URL:", error)
            alert("Failed to connect to backend. Please ensure the server is running.")
        }
    }

    const gmailIntegration = integrations.find(i => i.provider === 'google' || i.provider === 'gmail')
    const driveIntegration = integrations.find(i => i.provider === 'google_drive')

    // Helper to determine active state (exists AND not disconnected)
    const isGmailActive = !!gmailIntegration && gmailIntegration.sync_status !== 'disconnected'
    const isDriveActive = !!driveIntegration && driveIntegration.sync_status !== 'disconnected'

    // Helper to determine if we should show the "Reconnect" UI (exists BUT disconnected)
    const isGmailDisconnected = !!gmailIntegration && gmailIntegration.sync_status === 'disconnected'
    const isDriveDisconnected = !!driveIntegration && driveIntegration.sync_status === 'disconnected'

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Integrations</h1>
                <p className="text-muted-foreground">
                    Connect your external accounts to automatically fetch and process documents.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Gmail Integration Card */}
                <Card className={isGmailActive ? "border-green-200 bg-green-50/50" : (isGmailDisconnected ? "border-red-200 bg-red-50/10" : "")}>
                    <CardHeader>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-red-100 rounded-lg">
                                    <Mail className="h-6 w-6 text-red-600" />
                                </div>
                                <CardTitle>Gmail</CardTitle>
                            </div>
                            {isGmailActive && (
                                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                    Connected
                                </span>
                            )}
                            {isGmailDisconnected && (
                                <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                                    Disconnected
                                </span>
                            )}
                        </div>
                        <CardDescription>
                            Automatically fetch invoices, contracts, and receipts from your inbox.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground">
                            {gmailIntegration ? (
                                <div className="space-y-2">
                                    {isGmailActive && (
                                        <p className="text-slate-700 font-medium flex items-center gap-2">
                                            Sync Status:
                                            <span className={gmailIntegration.sync_status === 'syncing' ? 'text-blue-600 animate-pulse' : ''}>
                                                {gmailIntegration.sync_status || 'Idle'}
                                            </span>
                                        </p>
                                    )}
                                    {gmailIntegration.sync_status === 'scanning' || gmailIntegration.sync_status === 'syncing' ? (
                                        <div className="p-3 bg-blue-50 text-blue-700 rounded-md text-xs">
                                            Scanning your emails. This may take a few hours to fully load. You can navigate away from this page.
                                        </div>
                                    ) : isGmailDisconnected ? (
                                        <div className="p-3 bg-red-50 text-red-700 rounded-md text-xs flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                                            Connection lost. Please reconnect to resume syncing.
                                        </div>
                                    ) : (
                                        <p>Last synced: {gmailIntegration.last_synced_at ? new Date(gmailIntegration.last_synced_at).toLocaleString('en-US', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: 'numeric',
                                            minute: 'numeric',
                                            timeZoneName: 'short'
                                        }) : 'Never'}</p>
                                    )}
                                </div>
                            ) : (
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Scans for attachments (PDF, JPG, PNG)</li>
                                    <li>Filters by "invoice", "receipt", etc.</li>
                                    <li>Configurable lookback period</li>
                                </ul>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                        {isGmailActive ? (
                            <>
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => handleSync(gmailIntegration.id)}
                                    disabled={gmailIntegration.sync_status === 'syncing' || syncingIds.has(gmailIntegration.id)}
                                >
                                    <RefreshCw className={`mr-2 h-4 w-4 ${gmailIntegration.sync_status === 'syncing' ? 'animate-spin' : ''}`} />
                                    Sync Now
                                </Button>
                                <Button
                                    variant="outline"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleDisconnect(gmailIntegration.id)}
                                >
                                    Disconnect
                                </Button>
                            </>
                        ) : isGmailDisconnected ? (
                            // Reconnect State
                            <Button className="w-full bg-red-600 hover:bg-red-700" onClick={() => { setTargetProvider('gmail'); setIsGmailDialogOpen(true); }}>
                                Reconnect Gmail
                            </Button>
                        ) : (
                            // Connect State
                            <Button className="w-full" onClick={() => { setTargetProvider('gmail'); setIsGmailDialogOpen(true); }}>
                                Connect Gmail
                            </Button>
                        )}
                    </CardFooter>
                </Card>

                {/* Google Drive Integration Card */}
                <Card className={isDriveActive ? "border-blue-200 bg-blue-50/50" : (isDriveDisconnected ? "border-red-200 bg-red-50/10" : "")}>
                    <CardHeader>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <HardDrive className="h-6 w-6 text-blue-600" />
                                </div>
                                <CardTitle>Google Drive</CardTitle>
                            </div>
                            {isDriveActive && (
                                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                    Connected
                                </span>
                            )}
                            {isDriveDisconnected && (
                                <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                                    Disconnected
                                </span>
                            )}
                        </div>
                        <CardDescription>
                            Sync documents from your Google Drive.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground">
                            {driveIntegration ? (
                                <div className="space-y-2">
                                    {isDriveActive && (
                                        <p className="text-slate-700 font-medium flex items-center gap-2">
                                            Sync Status:
                                            <span className={driveIntegration.sync_status === 'syncing' ? 'text-blue-600 animate-pulse' : ''}>
                                                {driveIntegration.sync_status || 'Idle'}
                                            </span>
                                        </p>
                                    )}
                                    {isDriveDisconnected ? (
                                        <div className="p-3 bg-red-50 text-red-700 rounded-md text-xs flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                                            Connection lost. Please reconnect to resume syncing.
                                        </div>
                                    ) : (
                                        <p>Last synced: {driveIntegration.last_synced_at ? new Date(driveIntegration.last_synced_at).toLocaleString('en-US', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: 'numeric',
                                            minute: 'numeric',
                                            timeZoneName: 'short'
                                        }) : 'Never'}</p>
                                    )}
                                </div>
                            ) : (
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Scans for PDF, JPG, PNG</li>
                                    <li>Auto-sync every 5 minutes</li>
                                    <li>Supports shared drives</li>
                                </ul>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                        {isDriveActive ? (
                            <>
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => handleSync(driveIntegration.id)}
                                    disabled={driveIntegration.sync_status === 'syncing' || syncingIds.has(driveIntegration.id)}
                                >
                                    <RefreshCw className={`mr-2 h-4 w-4 ${driveIntegration.sync_status === 'syncing' ? 'animate-spin' : ''}`} />
                                    Sync Now
                                </Button>
                                <Button
                                    variant="outline"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleDisconnect(driveIntegration.id)}
                                >
                                    Disconnect
                                </Button>
                            </>
                        ) : isDriveDisconnected ? (
                            <Button className="w-full bg-red-600 hover:bg-red-700" onClick={() => { setTargetProvider('google_drive'); setIsGmailDialogOpen(true); }}>
                                Reconnect Drive
                            </Button>
                        ) : (
                            <Button className="w-full" onClick={() => { setTargetProvider('google_drive'); setIsGmailDialogOpen(true); }}>
                                Connect Drive
                            </Button>
                        )}
                    </CardFooter>
                </Card>

            </div>

            <IntegrationConfigDialog
                isOpen={isGmailDialogOpen}
                onOpenChange={setIsGmailDialogOpen}
                onConnect={handleConnect}
                providerName={targetProvider === 'gmail' ? 'Gmail' : 'Google Drive'}
            />
        </div >
    )
}
