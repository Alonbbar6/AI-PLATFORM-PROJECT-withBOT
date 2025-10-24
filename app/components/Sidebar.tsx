"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BarChart3, User, BookOpen } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavLink {
    name: string;
    href: string;
    icon: LucideIcon;
}

const links: NavLink[] = [
    { name: "Home", href: "/dashboard", icon: Home },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    { name: "Modules", href: "/dashboard/modules", icon: BookOpen },
    { name: "Profile", href: "/dashboard/settings", icon: User },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 h-screen text-black flex flex-col p-4 fixed">
            <h1 className="text-2xl font-bold mb-8">AI Platform</h1>
            <nav className="space-y-2">
                {links.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={`flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 ${pathname === link.href ? "bg-white" : ""
                            }`}
                    >
                        <link.icon className="w-5 h-5" />
                        <span>{link.name}</span>
                    </Link>
                ))}
            </nav>
        </aside>
    );
}
