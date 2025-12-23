"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Bot, Loader2, Sparkles, Mic, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import api from "@/lib/api"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Message {
    id?: string
    role: "user" | "assistant"
    content: string
    created_at?: string
}

interface ChatInterfaceProps {
    sessionId: string
}

export function ChatInterface({ sessionId }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const [fetchingHistory, setFetchingHistory] = useState(true)
    const [isListening, setIsListening] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    // Fetch history when sessionId changes
    useEffect(() => {
        const fetchHistory = async () => {
            setFetchingHistory(true)
            try {
                const response = await api.get(`/api/chat/sessions/${sessionId}/messages`)
                setMessages(response.data)
            } catch (error) {
                console.error("Failed to fetch messages:", error)
            } finally {
                setFetchingHistory(false)
            }
        }

        if (sessionId) {
            fetchHistory()
        } else {
            setMessages([])
            setFetchingHistory(false)
        }
    }, [sessionId])

    // Scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages, fetchingHistory])

    const startListening = () => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            // @ts-ignore
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
            const recognition = new SpeechRecognition()

            recognition.onstart = () => setIsListening(true)
            recognition.onend = () => setIsListening(false)
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

        // Optimistic UI update
        const tempId = Date.now().toString()
        setMessages((prev) => [...prev, { id: tempId, role: "user", content: userMessage }])
        setLoading(true)

        try {
            const response = await api.post(`/api/chat/sessions/${sessionId}/messages`, {
                content: userMessage
            })

            // Add Assistant Response
            setMessages((prev) => [...prev, response.data])
        } catch (error) {
            console.error("Chat error:", error)
            // Remove user message if failed (or show error state)
            setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, failed to send message." }])
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

    if (fetchingHistory) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
            </div>
        )
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-white relative">
            {/* Header/Banner could go here */}

            <div className="flex-1 overflow-y-auto p-6 scroll-smooth" ref={scrollRef}>
                <div className="max-w-3xl mx-auto space-y-6 pb-4">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
                            <div className="h-16 w-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                                <Sparkles className="h-8 w-8 text-blue-500" />
                            </div>
                            <h3 className="text-xl font-semibold text-slate-700 mb-2">Capabilities</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg w-full mt-4">
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm">
                                    "Summarize my recent invoices"
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm">
                                    "When does the Tech Corp contract expire?"
                                </div>
                            </div>
                        </div>
                    )}

                    {messages.map((msg, i) => (
                        <div
                            key={i}
                            className={cn(
                                "flex w-full gap-4",
                                msg.role === "user" ? "justify-end" : "justify-start"
                            )}
                        >
                            {msg.role === "assistant" && (
                                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-1">
                                    <Bot className="h-4 w-4 text-indigo-600" />
                                </div>
                            )}

                            <div
                                className={cn(
                                    "rounded-2xl px-5 py-3 text-sm max-w-[85%] shadow-sm",
                                    msg.role === "user"
                                        ? "bg-blue-600 text-white rounded-br-none"
                                        : "bg-slate-50 border border-slate-100 text-slate-700 rounded-bl-none"
                                )}
                            >
                                <div className="markdown prose prose-sm max-w-none dark:prose-invert">
                                    {/* Ideally render markdown here. For now plain text. */}
                                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                </div>
                            </div>

                            {msg.role === "user" && (
                                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mt-1">
                                    <div className="text-xs font-bold text-white">ME</div>
                                </div>
                            )}
                        </div>
                    ))}

                    {loading && (
                        <div className="flex w-full gap-4 justify-start">
                            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                                <Loader2 className="h-4 w-4 text-indigo-600 animate-spin" />
                            </div>
                            <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-bl-none px-5 py-3 flex items-center gap-2">
                                <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce delay-0"></span>
                                <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                                <span className="h-2 w-2 bg-slate-400 rounded-full animate-bounce delay-300"></span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-white/80 backdrop-blur-sm sticky bottom-0 z-10">
                <div className="max-w-3xl mx-auto relative flex gap-2 items-end">
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={startListening}
                        className={cn("mb-1 rounded-full", isListening && "text-red-500 bg-red-50 animate-pulse")}
                        title="Voice Search"
                    >
                        <Mic className="h-5 w-5" />
                    </Button>
                    <div className="flex-1 bg-slate-100 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-blue-100 transition-all flex items-end p-2 px-4 shadow-inner">
                        <textarea
                            className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400 resize-none max-h-32 py-2"
                            placeholder={isListening ? "Listening..." : "Ask anything about your documents..."}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={loading}
                            rows={1}
                            style={{ minHeight: "24px" }}
                            onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = 'auto';
                                target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
                            }}
                        />
                    </div>
                    <Button
                        size="icon"
                        onClick={handleSend}
                        disabled={loading || !input.trim()}
                        className={cn(
                            "mb-1 rounded-full transition-all",
                            input.trim() ? "bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/30" : "bg-slate-200 text-slate-400"
                        )}
                    >
                        <Send className="h-5 w-5" />
                    </Button>
                </div>
                <div className="max-w-3xl mx-auto text-center mt-2">
                    <p className="text-[10px] text-slate-400">AI can make mistakes. Check important info.</p>
                </div>
            </div>
        </div>
    )
}
