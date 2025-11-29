"use client"

import { useState } from "react"
import { AuthGuard } from "@/components/AuthGuard"
import { supabase } from "@/lib/supabase"
import { LogOut, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { DocumentList } from "@/components/DocumentList"
import { UploadZone } from "@/components/UploadZone"
import { DashboardStats } from "@/components/DashboardStats"
import { GlobalChat } from "@/components/GlobalChat"
import { Button } from "@/components/ui/button"
import { DateFilter, DateRange } from "@/components/DateFilter"

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined })
  const router = useRouter()

  const handleUploadComplete = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <AuthGuard>
      <div className="container mx-auto py-10 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-2">
              <h1 className="text-4xl font-extrabold tracking-tight text-[var(--primary)]">
                Document<span className="text-[var(--primary)] opacity-80">Gem</span>
              </h1>
            </div>
            <p className="text-muted-foreground">
              Upload, categorize, and analyze your business documents with AI.
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <DateFilter onFilterChange={setDateRange} />
            <Button onClick={() => setIsChatOpen(true)} className="gap-2 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white shadow-md shadow-blue-900/20">
              <Sparkles className="h-4 w-4" />
              Chat with All Documents
            </Button>
            <Button variant="outline" onClick={handleSignOut} size="icon" title="Sign Out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <DashboardStats refreshTrigger={refreshTrigger} dateRange={dateRange} />

        <div className="grid gap-8 md:grid-cols-[300px_1fr]">
          <div className="space-y-4">
            <UploadZone onUploadComplete={handleUploadComplete} />
          </div>
          <div className="space-y-4">
            <DocumentList refreshTrigger={refreshTrigger} dateRange={dateRange} />
          </div>
        </div>

        <GlobalChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      </div>
    </AuthGuard>
  )
}
