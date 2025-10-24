
"use client";

import { useEffect } from "react";
import * as gtag from "../gtag";

interface QuizProps {
    quizId: string;
    quizName: string;
}

export default function Quiz({ quizId, quizName }: QuizProps) {
    useEffect(() => {
        // Trigger quiz_start when component mounts
        gtag.event({
            action: "quiz_start",
            params: {
                quiz_id: quizId,
                quiz_name: quizName,
            },
        });

        return () => {
            // Track quiz_complete when user leaves component
            gtag.event({
                action: "quiz_complete",
                params: {
                    quiz_id: quizId,
                    quiz_name: quizName,
                },
            });
        };
    }, [quizId, quizName]);

    return (
        <div>
            <h3>{quizName}</h3>
            <p>Questions for {quizName} will appear here...</p>
        </div>
    );
}
