
"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, FileText, Calendar, DollarSign, Building, AlertCircle, Trash2, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { Chat } from "@/components/Chat"
import api from "@/lib/api"

interface Document {
    id: string
    name: string
    file_path: string
    type: string
    size: number
    category: string
    summary: string
    metadata: {
        dates?: ({ label: string, value: string } | string)[]
        amounts?: ({ label: string, value: string, currency?: string } | string)[]
        entities?: string[]
        invoice_number?: string
        action_items?: string[]
    }
    created_at: string
}

export default function DocumentDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [doc, setDoc] = useState<Document | null>(null)
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
                setDoc(docData)

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

    const handleDownloadCSV = () => {
        if (!doc) return

        const rows = [
            ["Type", "Label", "Value", "Currency"],
            ["Summary", "Summary", `"${doc.summary || ""}"`, ""],
            ["Category", "Category", doc.category, ""],
            ["Date", "Created At", new Date(doc.created_at).toLocaleDateString(), ""]
        ]

        // Add Dates
        doc.metadata?.dates?.forEach(d => {
            if (typeof d === 'string') {
                rows.push(["Date", "Date", d, ""])
            } else {
                rows.push(["Date", d.label, d.value, ""])
            }
        })

        // Add Amounts
        doc.metadata?.amounts?.forEach(a => {
            if (typeof a === 'string') {
                rows.push(["Amount", "Amount", a, ""])
            } else {
                rows.push(["Amount", a.label, a.value, a.currency || ""])
            }
        })

        // Add Entities
        doc.metadata?.entities?.forEach(e => {
            rows.push(["Entity", "Entity", `"${e}"`, ""])
        })

        // Add Action Items
        doc.metadata?.action_items?.forEach(ai => {
            rows.push(["Action Item", "Action Item", `"${ai}"`, ""])
        })

        const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n")
        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", `${doc.name.replace(/\.[^/.]+$/, "")}_data.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this document? This action cannot be undone.")) {
            return
        }

        try {
            setLoading(true)
            await api.delete(`/api/documents/${params.id}`)
            router.push("/")
        } catch (error) {
            console.error("Failed to delete document:", error)
            alert("Failed to delete document")
            setLoading(false)
        }
    }

    // ... (existing useEffect)

    if (loading) return <div className="p-8">Loading...</div>
    if (!doc) return <div className="p-8">Document not found</div>

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <div className="flex items-center justify-between">
                    <Button variant="ghost" onClick={() => router.back()} className="gap-2">
                        <ArrowLeft className="h-4 w-4" /> Back to Documents
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleDownloadCSV} className="gap-2">
                            <Download className="h-4 w-4" /> Download CSV
                        </Button>
                        <Button variant="destructive" size="sm" onClick={handleDelete} className="gap-2">
                            <Trash2 className="h-4 w-4" /> Delete Document
                        </Button>
                    </div>
                </div>

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
                            <h1 className="text-3xl font-bold">{doc.name}</h1>
                            <div className="flex items-center gap-2">
                                <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                                    {doc.category}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    {new Date(doc.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>

                        {/* Chat Interface */}
                        <Chat documentId={doc.id} />

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
                                    {doc.summary || "No summary available."}
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
                                    <ul className="space-y-1 text-sm">
                                        {doc.metadata?.dates?.length ? (
                                            doc.metadata.dates.map((date, i) => (
                                                <li key={i} className="flex justify-between">
                                                    {typeof date === 'string' ? (
                                                        <span>{date}</span>
                                                    ) : (
                                                        <>
                                                            <span className="text-muted-foreground">{date.label}:</span>
                                                            <span className="font-medium">{date.value}</span>
                                                        </>
                                                    )}
                                                </li>
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
                                    <ul className="space-y-1 text-sm">
                                        {doc.metadata?.amounts?.length ? (
                                            doc.metadata.amounts.map((amount, i) => (
                                                <li key={i} className="flex justify-between">
                                                    {typeof amount === 'string' ? (
                                                        <span>{amount}</span>
                                                    ) : (
                                                        <>
                                                            <span className="text-muted-foreground">{amount.label}:</span>
                                                            <span className="font-medium">
                                                                {amount.currency} {amount.value}
                                                            </span>
                                                        </>
                                                    )}
                                                </li>
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
                                        {doc.metadata?.entities?.length ? (
                                            doc.metadata.entities.map((entity, i) => (
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
                                        {doc.metadata?.action_items?.length ? (
                                            doc.metadata.action_items.map((item, i) => (
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
