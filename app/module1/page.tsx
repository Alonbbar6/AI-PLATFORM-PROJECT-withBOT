"use client";

import NavBar from "../components/NavBar";
import { useState } from "react";
import { useEffect } from "react";
import { Play } from "lucide-react";
import * as gtag from "../gtag";

export default function Module1() {

    useEffect(() => {
        window.gtag?.("event", "module_start", {
            module_name: "Module 1 - Introduction to AI",
        });
    }, []);

    const [started, setStarted] = useState(false);
    const [completed, setCompleted] = useState(false);


    const handleModuleComplete = () => {
        window.gtag?.("event", "module_complete", {
            module_name: "Module 1 - Introduction to AI",
        });
        alert("Module complete tracked!");
    };


    return (
        <main className="min-h-screen bg-white text-gray-800">
            <NavBar />
            <section className="p-8 max-w-3xl mx-auto">
                <h1 className="text-3xl font-semibold mb-4">Module 1: The AI Landscape: History,
                    Types, and Definitions</h1>
                <p className="mb-6 text-gray-500">
                    In this module, you’ll be exploring the foundations and evolution of artificial intelligence.
                </p>



                {/* Module Content */}


                <h2 className="text-2xl font-extrabold">Module Content</h2>
                <div className="grid grid-col-1 rounded-xl gap-2 p-2">

                    <div className="flex font-semibold bg-gray-100">
                        <Play className="m-4"></Play>
                        <div>
                            <h3 className="pt-2">Intro to Artificial Intelligence </h3>
                            <p className="text-sm text-gray-500">1.1 What is Artificial Intelligence?</p>
                        </div>
                    </div>

                    <div className="flex font-semibold bg-gray-100">
                        <Play className="m-4"></Play>
                        <div>
                            <h3 className="pt-2"> Defining the Three Pillars </h3>
                            <p className="text-sm text-gray-500">1.2 Explore machine learning, deep learning, and neural networks.</p>
                        </div>
                    </div>

                    <div className="flex font-semibold bg-gray-100">
                        <Play className="m-4"></Play>
                        <div>
                            <h3 className="pt-2">The Historical Journey of AI </h3>
                            <p className="text-sm text-gray-500">1.3 Discover the key milestones and breakthroughs that shaped AI.
                            </p>
                        </div>
                    </div>
                </div>




                {/* Learning Objectives */}
                <section className="bg-white p-6 rounded-xl shadow-md mt-8">
                    <h2 className="text-2xl font-bold mb-4">Learning Objectives</h2>
                    <div className="space-y-3">
                        {[
                            "Understand what Artificial Intelligence is and its practical applications.",
                            "Differentiate between AI, Machine Learning, and Deep Learning.",
                            "Identify how AI impacts modern businesses and daily life.",
                            "Recognize the historical milestones that shaped AI development.",
                            "Gain insight into ethical considerations surrounding AI use."
                        ].map((objective, i) => (
                            <label key={i} className="flex items-center gap-3 text-gray-700">
                                <input
                                    type="checkbox"
                                    className="w-5 h-5 accent-blue-600 rounded-md cursor-pointer"
                                />
                                <span>{objective}</span>
                            </label>
                        ))}
                    </div>

                </section>

                <section className="bg-white p-6 rounded-xl shadow-md mt-8">
                    <h2 className="text-2xl font-bold mb-4">Module Preview</h2>
                    <div className="relative aspect-video rounded-lg overflow-hidden shadow-sm">
                        <video
                            className="w-full h-full object-cover"
                            controls
                            poster="/video-thumbnail.jpg"
                        >
                            <source src="/lesson-preview.mp4" type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>
                    </div>
                    <p className="mt-3 text-gray-700 text-sm">
                        Watch this short introduction to get an overview of what you’ll learn in this module.
                    </p>
                </section>


                <button
                    onClick={handleModuleComplete}
                    className="bg-blue-600 text-white px-6 py-3 m-6 rounded-md hover:bg-blue-700"
                >
                    Mark Module as Complete
                </button>


            </section>
        </main>
    );
}
