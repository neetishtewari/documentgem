"use client"

import * as React from "react"
import {
    Calculator,
    Calendar,
    CreditCard,
    Settings,
    Smile,
    User,
    Search,
    FileText,
    File,
    Loader2
} from "lucide-react"

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "@/components/ui/command"
import { useRouter } from "next/navigation"
import api from "@/lib/api"

export function CommandPalette() {
    const [open, setOpen] = React.useState(false)
    const [query, setQuery] = React.useState("")
    const [results, setResults] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(false)
    const router = useRouter()

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }

        const openPalette = () => setOpen(true)

        document.addEventListener("keydown", down)
        document.addEventListener("open-command-palette", openPalette)
        return () => {
            document.removeEventListener("keydown", down)
            document.removeEventListener("open-command-palette", openPalette)
        }
    }, [])

    // Debounce search
    React.useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.length > 0) {
                setLoading(true)
                try {
                    const response = await api.get(`/api/search?q=${encodeURIComponent(query)}`)
                    setResults(response.data)
                } catch (error) {
                    console.error("Search failed", error)
                    setResults([])
                } finally {
                    setLoading(false)
                }
            } else {
                setResults([])
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [query])

    const runCommand = React.useCallback((command: () => unknown) => {
        setOpen(false)
        command()
    }, [])

    return (
        <>
            <CommandDialog open={open} onOpenChange={setOpen} shouldFilter={false}>
                <CommandInput placeholder="Type a command or search..." value={query} onValueChange={setQuery} />
                <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>

                    {loading && <div className="p-4 text-center text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin inline mr-2" />Searching...</div>}

                    {!query && (
                        <CommandGroup heading="Suggestions">
                            <CommandItem onSelect={() => runCommand(() => router.push('/dashboard'))}>
                                <Calendar className="mr-2 h-4 w-4" />
                                <span>Dashboard</span>
                            </CommandItem>
                            <CommandItem onSelect={() => runCommand(() => router.push('/insights'))}>
                                <Calculator className="mr-2 h-4 w-4" />
                                <span>Insights</span>
                            </CommandItem>
                            <CommandItem onSelect={() => runCommand(() => router.push('/integrations'))}>
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Integrations</span>
                            </CommandItem>
                        </CommandGroup>
                    )}

                    {results.length > 0 && (
                        <CommandGroup heading="Documents">
                            {results.map((result) => (
                                <CommandItem
                                    key={result.id}
                                    onSelect={() => runCommand(() => router.push(`/documents/${result.id}`))}
                                    className="flex flex-col items-start gap-1 py-3"
                                >
                                    <div className="flex items-center w-full">
                                        <FileText className="mr-2 h-4 w-4 text-blue-500 shrink-0" />
                                        <span className="font-medium">{result.title}</span>
                                        {result.score > 0.8 && <span className="ml-auto text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full">Top Match</span>}
                                    </div>
                                    {result.preview && (
                                        <p className="text-xs text-muted-foreground line-clamp-2 ml-6">
                                            {result.preview}
                                        </p>
                                    )}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}
                </CommandList>
            </CommandDialog>
        </>
    )
}
