"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, FileText, Calendar, DollarSign, Building, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import axios from "axios"
import { supabase } from "@/lib/supabase"
import { Chat } from "@/components/Chat"

interface Document {
    id: string
    name: string
    file_path: string
    type: string
    size: number
    category: string
    summary: string
    metadata: {
        dates?: string[]
        amounts?: string[]
        entities?: string[]
        invoice_number?: string
        action_items?: string[]
    }
    created_at: string
}

export default function DocumentDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [document, setDocument] = useState<Document | null>(null)
    const [loading, setLoading] = useState(true)
    const [fileUrl, setFileUrl] = useState<string | null>(null)

    useEffect(() => {
        const fetchDocument = async () => {
            try {
                // Fetch document metadata from our API (or directly from Supabase)
                const { data: docData, error } = await supabase
                    .from("documents")
                    .select("*")
                    .eq("id", params.id)
                    .single()

                if (error) throw error
                setDocument(docData)

                // Get signed URL for the file
                const { data: fileData } = await supabase
                    .storage
                    .from("documents")
                    .createSignedUrl(docData.file_path, 3600) // 1 hour expiry

                if (fileData) {
                    setFileUrl(fileData.signedUrl)
                }

            } catch (error) {
                console.error("Error fetching document:", error)
            } finally {
                setLoading(false)
            }
        }

        if (params.id) {
            fetchDocument()
        }
    }, [params.id])

    if (loading) return <div className="p-8">Loading...</div>
    if (!document) return <div className="p-8">Document not found</div>

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <Button variant="ghost" onClick={() => router.back()} className="gap-2">
                    <ArrowLeft className="h-4 w-4" /> Back to Documents
                </Button>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Left Column: File Preview */}
                    <div className="space-y-6">
                        <Card className="h-[80vh] overflow-hidden">
                            <CardContent className="h-full p-0">
                                {fileUrl && (
                                    <iframe
                                        src={fileUrl}
                                        className="h-full w-full border-none"
                                        title="Document Preview"
                                    />
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Insights & Metadata */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold">{document.name}</h1>
                            <div className="flex items-center gap-2">
                                <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                                    {document.category}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    {new Date(document.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>

                        {/* Chat Interface */}
                        <Chat documentId={document.id} />

                        {/* Summary Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    {document.summary || "No summary available."}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Key Insights Grid */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            {/* Dates */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <Calendar className="h-4 w-4" /> Important Dates
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="list-disc pl-4 text-sm">
                                        {document.metadata?.dates?.length ? (
                                            document.metadata.dates.map((date, i) => (
                                                <li key={i}>{date}</li>
                                            ))
                                        ) : (
                                            <li className="text-muted-foreground">None detected</li>
                                        )}
                                    </ul>
                                </CardContent>
                            </Card>

                            {/* Amounts */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <DollarSign className="h-4 w-4" /> Amounts
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="list-disc pl-4 text-sm">
                                        {document.metadata?.amounts?.length ? (
                                            document.metadata.amounts.map((amount, i) => (
                                                <li key={i}>{amount}</li>
                                            ))
                                        ) : (
                                            <li className="text-muted-foreground">None detected</li>
                                        )}
                                    </ul>
                                </CardContent>
                            </Card>

                            {/* Entities */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <Building className="h-4 w-4" /> Entities
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="list-disc pl-4 text-sm">
                                        {document.metadata?.entities?.length ? (
                                            document.metadata.entities.map((entity, i) => (
                                                <li key={i}>{entity}</li>
                                            ))
                                        ) : (
                                            <li className="text-muted-foreground">None detected</li>
                                        )}
                                    </ul>
                                </CardContent>
                            </Card>

                            {/* Action Items */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4" /> Action Items
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="list-disc pl-4 text-sm">
                                        {document.metadata?.action_items?.length ? (
                                            document.metadata.action_items.map((item, i) => (
                                                <li key={i}>{item}</li>
                                            ))
                                        ) : (
                                            <li className="text-muted-foreground">None detected</li>
                                        )}
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
