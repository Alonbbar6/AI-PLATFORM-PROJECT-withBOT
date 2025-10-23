"use client";

import Link from "next/link";

export default function NavBar() {
    return (
        <nav className="flex items-center justify-between px-6 py-4 bg-gray-900 text-white">
            <h1 className="text-xl font-semibold">AI Platform</h1>
            <ul className="flex space-x-6">
                <li><Link href="/">Home</Link></li>
                <li><Link href="/module1">Modules</Link></li>
                <li><Link href="/dashboard">Dashboard</Link></li>
            </ul>
        </nav>
    );
}
