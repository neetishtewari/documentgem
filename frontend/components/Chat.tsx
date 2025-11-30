"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import api from "@/lib/api"

interface ChatProps {
    documentId: string
}

interface Message {
    role: "user" | "assistant"
    content: string
}

export function Chat({ documentId }: ChatProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const handleSend = async () => {
        if (!input.trim() || loading) return

        const userMessage = input.trim()
        setInput("")
        setMessages((prev) => [...prev, { role: "user", content: userMessage }])
        setLoading(true)

        try {
            const response = await api.post(`/api/chat/${documentId}`, {
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
        <Card className="flex h-[400px] flex-col">
            <CardHeader className="border-b px-4 py-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Bot className="h-4 w-4 text-primary" />
                    Chat with Document
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                {messages.length === 0 && (
                    <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground opacity-50">
                        <Bot className="h-8 w-8 mb-2" />
                        <p className="text-sm">Ask any question about this document.</p>
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
                    <input
                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                        placeholder="Type your question..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={loading}
                    />
                    <Button size="icon" variant="ghost" onClick={handleSend} disabled={loading || !input.trim()}>
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </Card>
    )
}
