"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function NavBar() {
    const [language, setLanguage] = useState("en");

    useEffect(() => {
        const savedLang = localStorage.getItem("language") || "en";
        setLanguage(savedLang);
    }, []);

    const toggleLanguage = () => {
        const newLang = language === "en" ? "es" : "en";
        setLanguage(newLang);
        localStorage.setItem("language", newLang);
    };

    return (
        <nav className="flex items-center justify-between px-6 py-4 bg-gray-900 text-white">
            <h1 className="text-xl font-semibold">AI Platform</h1>
            <ul className="flex space-x-6">
                <li><Link href="/">Home</Link></li>
                <li><Link href="/module1">Modules</Link></li>
                <li><Link href="/dashboard">Dashboard</Link></li>



                {/* Language Toggle */}
                <button
                    onClick={toggleLanguage}
                    className="px-3 py-1 text-sm font-semibold border border-gray-300 rounded-full hover:bg-gray-300 transition"
                >
                    {language === "en" ? "ES" : "EN"}
                </button>
            </ul>
        </nav>
    );
}
