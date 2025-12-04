"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Bot, X, Loader2, Sparkles, Mic } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import api from "@/lib/api"

interface Message {
    role: "user" | "assistant"
    content: string
}

interface GlobalChatProps {
    isOpen: boolean
    onClose: () => void
}

export function GlobalChat({ isOpen, onClose }: GlobalChatProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const [isListening, setIsListening] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    if (!isOpen) return null

    const startListening = () => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            // @ts-ignore
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
            const recognition = new SpeechRecognition()

            recognition.onstart = () => {
                setIsListening(true)
            }

            recognition.onend = () => {
                setIsListening(false)
            }

            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript
                setInput(transcript)
            }

            recognition.start()
        } else {
            alert("Speech recognition is not supported in this browser.")
        }
    }

    const handleSend = async () => {
        if (!input.trim() || loading) return

        const userMessage = input.trim()
        setInput("")
        setMessages((prev) => [...prev, { role: "user", content: userMessage }])
        setLoading(true)

        try {
            // Use "all" as documentId for global search
            const response = await api.post("/api/chat/all", {
                query: userMessage
            })

            setMessages((prev) => [...prev, { role: "assistant", content: response.data.answer }])
        } catch (error) {
            console.error("Chat error:", error)
            setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I encountered an error processing your request." }])
        } finally {
            setLoading(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 transition-all duration-300">
            <Card className="w-full max-w-2xl h-[600px] flex flex-col shadow-2xl bg-background/80 backdrop-blur-xl border-white/20 animate-in fade-in zoom-in duration-200">
                <CardHeader className="border-b px-4 py-3 flex flex-row items-center justify-between">
                    <CardTitle className="text-lg font-medium flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Chat with All Documents
                    </CardTitle>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                    {messages.length === 0 && (
                        <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground opacity-50">
                            <Sparkles className="h-12 w-12 mb-4 text-primary/50" />
                            <h3 className="text-lg font-semibold">Global Knowledge Base</h3>
                            <p className="text-sm max-w-xs">
                                Ask questions across all your uploaded documents.
                                Try "What is the total of all invoices?"
                            </p>
                        </div>
                    )}
                    {messages.map((msg, i) => (
                        <div
                            key={i}
                            className={cn(
                                "flex w-full gap-2",
                                msg.role === "user" ? "justify-end" : "justify-start"
                            )}
                        >
                            <div
                                className={cn(
                                    "rounded-lg px-3 py-2 text-sm max-w-[80%]",
                                    msg.role === "user"
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted"
                                )}
                            >
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-muted rounded-lg px-3 py-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                        </div>
                    )}
                </CardContent>
                <div className="border-t p-3">
                    <div className="flex gap-2">
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={startListening}
                            className={cn(isListening && "text-red-500 animate-pulse bg-red-50")}
                            title="Voice Search"
                        >
                            <Mic className="h-4 w-4" />
                        </Button>
                        <input
                            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                            placeholder={isListening ? "Listening..." : "Ask a question across all documents..."}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={loading}
                            autoFocus
                        />
                        <Button size="icon" variant="ghost" onClick={handleSend} disabled={loading || !input.trim()}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    )
}
