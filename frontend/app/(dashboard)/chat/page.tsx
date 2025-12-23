"use client"

import { useState } from "react"
import { ChatSidebar } from "@/components/chat/ChatSidebar"
import { ChatInterface } from "@/components/chat/ChatInterface"
import api from "@/lib/api"
import { useRouter } from "next/navigation"

export default function ChatPage() {
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
    const router = useRouter()

    const handleNewChat = async () => {
        try {
            const response = await api.post("/api/chat/sessions", { title: "New Chat" })
            setCurrentSessionId(response.data.id)
        } catch (error) {
            console.error("Failed to create new chat:", error)
        }
    }

    return (
        <div className="flex h-[calc(100vh-4rem)] bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <ChatSidebar
                currentSessionId={currentSessionId}
                onSelectSession={setCurrentSessionId}
                onNewChat={handleNewChat}
            />
            {currentSessionId ? (
                <ChatInterface sessionId={currentSessionId} />
            ) : (
                <div className="flex-1 flex items-center justify-center bg-slate-50 text-slate-400">
                    <div className="text-center">
                        <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                        <p className="text-sm">Or start a new chat to begin.</p>
                    </div>
                </div>
            )}
        </div>
    )
}
