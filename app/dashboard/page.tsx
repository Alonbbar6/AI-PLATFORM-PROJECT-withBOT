"use client";
import { useState } from "react";

export default function DashboardPage() {
    const [progress, setProgress] = useState(65);

    return (
        <main className="min-h-screen bg-gray-100 text-gray-900">
            <section className="p-8 max-w-4xl mx-auto space-y-8">



                {/* Header */}
                <h1 className="text-3xl font-bold">Dashboard</h1>




                {/* Stats grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow">
                        <h2 className="text-xl font-semibold mb-2">Modules Completed</h2>
                        <p className="text-3xl font-bold text-blue-600">1</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow">
                        <h2 className="text-xl font-semibold mb-2">Quizzes Completed</h2>
                        <p className="text-3xl font-bold text-green-600">0</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow">
                        <h2 className="text-xl font-semibold mb-2">Total Study Time</h2>
                        <p className="text-3xl font-bold text-purple-600">2h 15m</p>
                    </div>
                </div>


                {/* Progress section */}
                <div className="space-y-3">
                    <h2 className="text-2xl font-bold">Overall Progress</h2>
                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                        <div
                            className="bg-blue-600 h-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-gray-700 font-medium">{progress}% complete</p>
                </div>

                {/* Achievements */}
                <div className="">
                    <h2 className="text-2xl font-bold">Achievements</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

                        <div className="bg-white p-4 rounded-xl" >

                            <img
                                className=""
                                src="/placeholder.png"
                                alt="Hero Image"
                            />

                            <h2>
                                Completed Module 1
                            </h2>
                            <p className="text-xs text-gray-500">
                                Awarded for completing the AI Landscape module.
                            </p>

                        </div>

                        <div className="bg-white p-4 rounded-xl p" >
                            <img
                                className=""
                                src="/placeholder.png"
                                alt="Hero Image"
                            />
                            <h2>
                                Completed Module 2
                            </h2>
                            <p className="text-xs text-gray-500">
                                Awarded for completing the AI Tools module.
                            </p>
                        </div>

                        <div className="bg-white p-4 rounded-xl">

                            <img
                                className=""
                                src="/placeholder.png"
                                alt="Hero Image"
                            />
                            <h2>
                                Completed Module 3
                            </h2>
                            <p className="text-xs text-gray-500">
                                Certificate of attendance for the Workshop.
                            </p>
                        </div>

                    </div>
                </div>
            </section>
        </main >
    );
}
