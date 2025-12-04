"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Settings, LogOut, Search, BarChart3, Activity, Plug, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const menuItems = [
    {
        title: "Main",
        items: [
            { name: "Documents", href: "/dashboard", icon: FileText },
            { name: "Analytics", href: "/analytics", icon: BarChart3 },
            { name: "Integrations", href: "/integrations", icon: Settings },
        ],
    },
    {
        title: "Connections",
        items: [
            { name: "Activity Log", href: "/activity", icon: Activity },
        ],
    },
    {
        title: "System",
        items: [
            { name: "Settings", href: "/settings", icon: Settings },
            { name: "Trash", href: "/trash", icon: Trash2 },
        ],
    },
];

export function Sidebar() {
    const pathname = usePathname();
    const [userEmail, setUserEmail] = useState<string>("user@example.com");
    const [hasDisconnectedIntegrations, setHasDisconnectedIntegrations] = useState(false);

    useEffect(() => {
        const checkIntegrations = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    setUserEmail(user.email || "");

                    // Check for disconnected integrations
                    const { data } = await supabase
                        .from("user_integrations")
                        .select("sync_status")
                        .eq("user_id", user.id)
                        .eq("sync_status", "disconnected");

                    if (data && data.length > 0) {
                        setHasDisconnectedIntegrations(true);
                    }
                }
            } catch (error) {
                console.error("Failed to check integrations:", error);
            }
        };
        checkIntegrations();

        // Listen for custom event to update status (optional, if we want real-time update from other components)
        const handleUpdate = () => checkIntegrations();
        window.addEventListener("integration-status-update", handleUpdate);
        return () => window.removeEventListener("integration-status-update", handleUpdate);
    }, []);

    return (
        <div className="flex h-screen w-64 flex-col bg-brand-navy text-[var(--sidebar-foreground)] border-r border-gray-800">
            <div className="flex h-16 items-center px-6 border-b border-gray-800">
                <span className="text-xl font-bold tracking-tight text-white">Document<span className="text-blue-400">Gem</span></span>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
                <nav className="space-y-6 px-4">
                    {/* Search Trigger */}
                    <div>
                        <button
                            onClick={() => document.dispatchEvent(new CustomEvent("open-command-palette"))}
                            className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white group"
                        >
                            <div className="flex items-center gap-3 flex-1">
                                <Search className="h-4 w-4" />
                                <span>Search</span>
                            </div>
                            <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border border-gray-700 bg-gray-800 px-1.5 font-mono text-[10px] font-medium text-gray-400 opacity-100 group-hover:text-gray-300 sm:flex">
                                <span className="text-xs">⌘</span>K
                            </kbd>
                        </button>
                    </div>

                    {menuItems.map((section) => (
                        <div key={section.title}>
                            <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                                {section.title}
                            </h3>
                            <div className="space-y-1">
                                {section.items.map((item) => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={cn(
                                                "flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors relative",
                                                isActive
                                                    ? "bg-[var(--primary)] text-white"
                                                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                                            )}
                                        >
                                            <item.icon className="h-4 w-4" />
                                            {item.name}
                                            {item.name === "Integrations" && hasDisconnectedIntegrations && (
                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>
            </div>

            <div className="border-t border-gray-800 p-4">
                <div className="flex items-center gap-3 rounded-md bg-gray-900/50 p-3">
                    <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-medium text-white">
                        {userEmail[0]?.toUpperCase()}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-medium text-white truncate">User</span>
                        <span className="text-xs text-gray-400 truncate" title={userEmail}>{userEmail}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

