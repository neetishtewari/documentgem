import { Button } from "@/components/ui/button"
import { Download, FileText } from "lucide-react"
import Link from "next/link"

// Since we don't have the UI component yet, I'll define a simple one here or just use raw HTML.
// Actually, let's just use raw HTML with Tailwind for simplicity and speed, 
// matching the style of the rest of the app.

interface Document {
    id: string
    name: string
    type: string
    size: number
    category: string
    created_at: string
    metadata?: any
}

interface DocumentTableProps {
    documents: Document[]
    category: string
}

export function DocumentTable({ documents, category }: DocumentTableProps) {

    // Helper to extract value from metadata safely
    const getMetaValue = (doc: Document, key: string, label?: string) => {
        if (!doc.metadata) return "-"

        // Handle the structured metadata we added earlier
        // It might be under 'dates', 'amounts', 'entities' etc.

        // Flatten metadata for easier search
        const allItems = [
            ...(doc.metadata.dates || []),
            ...(doc.metadata.amounts || []),
            ...(doc.metadata.entities || []),
            ...(doc.metadata.action_items || []),
            // Add direct keys if any
            { label: 'Invoice Number', value: doc.metadata.invoice_number },
            { label: 'Contract Parties', value: doc.metadata.contract_parties }
        ]

        // Try to find by label
        const found = allItems.find(item => {
            if (typeof item === 'string') return false // Can't match label on string
            return item?.label?.toLowerCase().includes(label?.toLowerCase())
        })

        if (found && typeof found !== 'string') {
            if (found.currency) return `${found.currency} ${found.value}`
            return found.value
        }

        // Fallback for direct keys or simple lists
        if (doc.metadata[key]) {
            if (Array.isArray(doc.metadata[key])) {
                return doc.metadata[key].map((i: any) => typeof i === 'string' ? i : i.value).join(", ")
            }
            return doc.metadata[key]
        }

        return "-"
    }

    // Define columns based on category
    const getColumns = () => {
        const common = [
            {
                header: "Name", accessor: (doc: Document) => (
                    <Link href={`/documents/${doc.id}`} className="font-medium text-blue-600 hover:underline">
                        {doc.name}
                    </Link>
                )
            },
            { header: "Date", accessor: (doc: Document) => new Date(doc.created_at).toLocaleDateString() },
        ]

        switch (category) {
            case "Invoice":
                return [
                    ...common,
                    { header: "Invoice #", accessor: (doc: Document) => getMetaValue(doc, 'invoice_number', 'Invoice') },
                    { header: "Amount", accessor: (doc: Document) => getMetaValue(doc, 'amounts', 'Total') },
                    { header: "Due Date", accessor: (doc: Document) => getMetaValue(doc, 'dates', 'Due') },
                ]
            case "Receipt":
                return [
                    ...common,
                    { header: "Merchant", accessor: (doc: Document) => getMetaValue(doc, 'entities', 'Merchant') || getMetaValue(doc, 'entities', 'Vendor') },
                    { header: "Total", accessor: (doc: Document) => getMetaValue(doc, 'amounts', 'Total') },
                ]
            case "Contract":
                return [
                    ...common,
                    { header: "Parties", accessor: (doc: Document) => getMetaValue(doc, 'contract_parties', 'Parties') || getMetaValue(doc, 'entities', '') },
                    { header: "Effective Date", accessor: (doc: Document) => getMetaValue(doc, 'dates', 'Effective') },
                    { header: "Expiry Date", accessor: (doc: Document) => getMetaValue(doc, 'dates', 'Expir') },
                ]
            default:
                return [
                    ...common,
                    {
                        header: "Category", accessor: (doc: Document) => (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                                {doc.category}
                            </span>
                        )
                    },
                    { header: "Summary", accessor: (doc: Document) => <span className="line-clamp-1 text-slate-500" title={doc.metadata?.summary}>{doc.metadata?.summary || "-"}</span> },
                ]
        }
    }

    const columns = getColumns()

    const handleExportCSV = () => {
        const headers = columns.map(c => c.header).join(",")
        const rows = documents.map(doc => {
            return columns.map(col => {
                const val = col.accessor(doc)
                // If it's a React element (Link/Span), we need to extract text or just use a fallback
                // This is a bit hacky for the export, ideally we separate data accessor from render
                if (typeof val === 'object' && val !== null) {
                    // Try to get text content if possible, or just use name/date/etc directly
                    if (col.header === "Name") return `"${doc.name}"`
                    if (col.header === "Category") return `"${doc.category}"`
                    if (col.header === "Summary") return `"${doc.metadata?.summary || ""}"`
                    return ""
                }
                return `"${val}"`
            }).join(",")
        }).join("\n")

        const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`
        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", `documents_${category.toLowerCase()}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2">
                    <Download className="h-4 w-4" />
                    Export CSV
                </Button>
            </div>
            <div className="rounded-md border bg-white">
                <div className="w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                {columns.map((col, i) => (
                                    <th key={i} className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">
                                        {col.header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {documents.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length} className="p-4 text-center text-muted-foreground">
                                        No documents found.
                                    </td>
                                </tr>
                            ) : (
                                documents.map((doc) => (
                                    <tr key={doc.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        {columns.map((col, i) => (
                                            <td key={i} className="p-4 align-middle [&:has([role=checkbox])]:pr-0">
                                                {col.accessor(doc)}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
