"use client"

import { Plus, MessageSquare, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import api from "@/lib/api"
import { useRouter } from "next/navigation"

interface ChatSession {
    id: string
    title: string
    updated_at: string
}

interface ChatSidebarProps {
    currentSessionId: string | null
    onSelectSession: (id: string) => void
    onNewChat: () => void
}

export function ChatSidebar({ currentSessionId, onSelectSession, onNewChat }: ChatSidebarProps) {
    const [sessions, setSessions] = useState<ChatSession[]>([])
    const [loading, setLoading] = useState(true)

    const fetchSessions = async () => {
        try {
            const response = await api.get("/api/chat/sessions")
            setSessions(response.data)
        } catch (error) {
            console.error("Failed to fetch sessions:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSessions()
    }, [currentSessionId]) // Refresh list when session updates/creates

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        if (!confirm("Delete this conversation?")) return

        try {
            await api.delete(`/api/chat/sessions/${id}`)
            setSessions(prev => prev.filter(s => s.id !== id))
            if (currentSessionId === id) {
                onNewChat()
            }
        } catch (error) {
            console.error("Failed to delete session:", error)
        }
    }

    return (
        <div className="flex bg-slate-50 border-r border-slate-200 h-full flex-col w-64 shrink-0 transition-all duration-300">
            <div className="p-4 border-b border-slate-200">
                <Button onClick={onNewChat} className="w-full justify-start gap-2 bg-brand-navy text-white hover:bg-brand-navy/90">
                    <Plus className="h-4 w-4" /> New Chat
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {loading ? (
                    <div className="flex justify-center p-4">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="text-center p-4 text-xs text-muted-foreground">
                        No history yet. Start a new chat!
                    </div>
                ) : (
                    sessions.map(session => (
                        <div
                            key={session.id}
                            onClick={() => onSelectSession(session.id)}
                            className={cn(
                                "group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer",
                                currentSessionId === session.id
                                    ? "bg-white shadow-sm ring-1 ring-slate-200 text-brand-navy"
                                    : "text-slate-600 hover:bg-slate-100"
                            )}
                        >
                            <div className="flex items-center gap-2 overflow-hidden">
                                <MessageSquare className="h-4 w-4 shrink-0 opacity-50" />
                                <span className="truncate">{session.title}</span>
                            </div>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => handleDelete(e, session.id)}
                            >
                                <Trash2 className="h-3 w-3 text-red-400 hover:text-red-500" />
                            </Button>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
