"use client";

import NavBar from "../components/NavBar";
import { useState } from "react";
import "./globals.css";
import * as gtag from "../gtag";

export default function Module1() {
    const [started, setStarted] = useState(false);
    const [completed, setCompleted] = useState(false);

    const handleStart = () => {
        gtag.event("module_start", { label: "Module_1" });
        setStarted(true);
    };

    const handleComplete = () => {
        gtag.event("module_complete", { label: "Module_1" });
        setCompleted(true);
    };

    return (
        <main className="min-h-screen bg-white text-gray-800">
            <NavBar />
            <section className="p-8 max-w-3xl mx-auto">
                <h1 className="text-3xl font-semibold mb-4">Module 1: The AI Landscape: History,
                    Types, and Definitions</h1>
                <p className="mb-6">
                    In this module, you’ll be exploring the foundations and evolution of artificial intelligence.
                </p>
                {!started && (
                    <button
                        onClick={handleStart}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Start Module
                    </button>
                )}
                {started && !completed && (
                    <button
                        onClick={handleComplete}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                    >
                        Complete Module
                    </button>
                )}
                {completed && (
                    <p className="mt-4 text-green-700 font-semibold">Module completed ✅</p>
                )}
            </section>
        </main>
    );
}
