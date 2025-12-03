"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import api from "@/lib/api"
import { Bell, Mail, Shield } from "lucide-react"

export default function SettingsPage() {
    const [settings, setSettings] = useState({
        notifications: {
            email: true,
            push: false,
            alerts: true
        },
        theme: "light"
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        try {
            const res = await api.get("/api/settings")
            setSettings(res.data)
        } catch (error) {
            console.error("Failed to fetch settings:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleToggle = (key: string, subKey?: string) => {
        setSettings(prev => {
            if (subKey) {
                return {
                    ...prev,
                    [key]: {
                        // @ts-ignore
                        ...prev[key],
                        // @ts-ignore
                        [subKey]: !prev[key][subKey]
                    }
                }
            }
            return { ...prev, [key]: !prev[key as keyof typeof prev] }
        })
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            await api.patch("/api/settings", settings)
            alert("Settings saved successfully!")
        } catch (error) {
            console.error("Failed to save settings:", error)
            alert("Failed to save settings.")
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return <div className="p-8">Loading settings...</div>
    }

    return (
        <div className="flex flex-col gap-6 max-w-4xl">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h1>
                <p className="text-muted-foreground">
                    Manage your preferences and account settings.
                </p>
            </div>

            <div className="grid gap-6">
                {/* Notifications */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Bell className="h-5 w-5 text-slate-500" />
                            <CardTitle>Notifications</CardTitle>
                        </div>
                        <CardDescription>
                            Configure how you want to receive alerts and updates.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between space-x-2">
                            <div className="flex flex-col space-y-1">
                                <Label htmlFor="email-notifications">Email Notifications</Label>
                                <span className="text-sm text-muted-foreground">Receive daily summaries and critical alerts via email.</span>
                            </div>
                            <Switch
                                id="email-notifications"
                                checked={settings.notifications.email}
                                onCheckedChange={() => handleToggle("notifications", "email")}
                            />
                        </div>
                        <div className="flex items-center justify-between space-x-2">
                            <div className="flex flex-col space-y-1">
                                <Label htmlFor="push-notifications">Push Notifications</Label>
                                <span className="text-sm text-muted-foreground">Receive real-time push notifications in the browser.</span>
                            </div>
                            <Switch
                                id="push-notifications"
                                checked={settings.notifications.push}
                                onCheckedChange={() => handleToggle("notifications", "push")}
                            />
                        </div>
                        <div className="flex items-center justify-between space-x-2">
                            <div className="flex flex-col space-y-1">
                                <Label htmlFor="app-alerts">In-App Alerts</Label>
                                <span className="text-sm text-muted-foreground">Show alerts on the dashboard for expiring documents.</span>
                            </div>
                            <Switch
                                id="app-alerts"
                                checked={settings.notifications.alerts}
                                onCheckedChange={() => handleToggle("notifications", "alerts")}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Security (Placeholder) */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-slate-500" />
                            <CardTitle>Security</CardTitle>
                        </div>
                        <CardDescription>
                            Manage your password and security preferences.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground">
                            Password change and 2FA settings are managed via your identity provider.
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>
        </div>
    )
}
