"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"

import { Suspense } from "react"

function CallbackContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
    const [message, setMessage] = useState("Connecting your account...")

    useEffect(() => {
        const code = searchParams.get("code")
        const state = searchParams.get("state")

        if (!code) {
            setStatus("error")
            setMessage("No authorization code received.")
            return
        }

        const connect = async () => {
            try {
                let config = {}
                if (state) {
                    try {
                        config = JSON.parse(state)
                    } catch (e) {
                        console.error("Failed to parse state", e)
                    }
                }

                await api.post("/api/integrations/google/connect", {
                    code,
                    config
                })

                setStatus("success")
                setMessage("Successfully connected your Google account!")

                // Redirect back to integrations after 2 seconds
                setTimeout(() => {
                    router.push("/integrations")
                }, 2000)

            } catch (error) {
                console.error("Connection failed:", error)
                setStatus("error")
                setMessage("Failed to connect. Please try again.")
            }
        }

        connect()
    }, [searchParams, router])

    return (
        <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
            {status === "loading" && (
                <>
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                    <h2 className="text-xl font-semibold text-slate-900">{message}</h2>
                </>
            )}

            {status === "success" && (
                <>
                    <CheckCircle className="h-12 w-12 text-green-600" />
                    <h2 className="text-xl font-semibold text-slate-900">{message}</h2>
                    <p className="text-muted-foreground">Redirecting you back...</p>
                </>
            )}

            {status === "error" && (
                <>
                    <XCircle className="h-12 w-12 text-red-600" />
                    <h2 className="text-xl font-semibold text-slate-900">{message}</h2>
                    <Button onClick={() => router.push("/integrations")} variant="outline">
                        Return to Integrations
                    </Button>
                </>
            )}
        </div>
    )
}

export default function IntegrationCallbackPage() {
    return (
        <Suspense fallback={
            <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                <h2 className="text-xl font-semibold text-slate-900">Loading...</h2>
            </div>
        }>
            <CallbackContent />
        </Suspense>
    )
}
