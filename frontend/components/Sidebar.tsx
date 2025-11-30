"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    FileText,
    BarChart3,
    Settings,
    Trash2,
    Plug,
    Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const menuItems = [
    {
        title: "Main",
        items: [
            { name: "Dashboard", href: "/", icon: LayoutDashboard },
            { name: "Insights", href: "/insights", icon: BarChart3 },
        ],
    },
    {
        title: "Connections",
        items: [
            { name: "Integrations", href: "/integrations", icon: Plug },
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

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.email) {
                setUserEmail(user.email);
            }
        };
        getUser();
    }, []);

    return (
        <div className="flex h-screen w-64 flex-col bg-brand-navy text-[var(--sidebar-foreground)] border-r border-gray-800">
            <div className="flex h-16 items-center px-6 border-b border-gray-800">
                <span className="text-xl font-bold tracking-tight text-white">Document<span className="text-blue-400">Gem</span></span>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
                <nav className="space-y-6 px-4">
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
                                                "flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors",
                                                isActive
                                                    ? "bg-[var(--primary)] text-white"
                                                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                                            )}
                                        >
                                            <item.icon className="h-4 w-4" />
                                            {item.name}
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
                        {userEmail[0].toUpperCase()}
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
