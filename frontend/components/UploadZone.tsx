"use client"

import { useState, useRef } from "react"
import { Upload, File, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import api from "@/lib/api"

interface UploadZoneProps {
    onUploadComplete: () => void
}

export function UploadZone({ onUploadComplete }: UploadZoneProps) {
    const [isDragging, setIsDragging] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0])
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
        }
    }

    const handleUpload = async () => {
        if (!file) return

        setUploading(true)
        const formData = new FormData()
        formData.append("file", file)

        try {
            await api.post("/api/documents/upload", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            })
            setFile(null)
            onUploadComplete()
        } catch (error) {
            console.error("Upload failed:", error)
            alert("Upload failed. Please try again.")
        } finally {
            setUploading(false)
        }
    }

    return (
        <Card
            className={cn(
                "relative flex flex-col items-center justify-center border-2 border-dashed p-12 transition-all duration-200 cursor-pointer group",
                isDragging
                    ? "border-primary bg-primary/5 scale-[1.01]"
                    : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/50",
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
        >
            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept=".pdf,.jpg,.jpeg,.png,.docx"
            />

            {!file ? (
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className={cn(
                        "rounded-full bg-muted p-4 transition-colors group-hover:bg-primary/10",
                        isDragging && "bg-primary/10"
                    )}>
                        <Upload className={cn(
                            "h-8 w-8 text-muted-foreground transition-colors group-hover:text-primary",
                            isDragging && "text-primary"
                        )} />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold tracking-tight">Upload Documents</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Drag & drop or click to browse
                        </p>
                    </div>
                    <Button variant="secondary" className="mt-2 pointer-events-none">
                        Select File
                    </Button>
                    <p className="text-xs text-muted-foreground/60">
                        Supports PDF, JPG, PNG, DOCX
                    </p>
                </div>
            ) : (
                <div className="flex w-full max-w-md flex-col gap-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-4 rounded-xl border bg-background/50 backdrop-blur-sm p-4 shadow-sm">
                        <div className="rounded-lg bg-primary/10 p-3">
                            <File className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 truncate">
                            <p className="truncate font-medium">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setFile(null)}
                            disabled={uploading}
                            className="text-muted-foreground hover:text-destructive"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setFile(null)}
                            disabled={uploading}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleUpload} disabled={uploading}>
                            {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {uploading ? "Uploading..." : "Upload Document"}
                        </Button>
                    </div>
                </div>
            )}
        </Card>
    )
}
