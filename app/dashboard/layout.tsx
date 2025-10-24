
"use client";

import Sidebar from "../components/Sidebar";
import React from "react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-64 p-8 bg-gray-100">{children}</main>
        </div>
    );
}

