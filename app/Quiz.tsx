
import * as gtag from "./gtag";

interface QuizProps {
  quizId: string;
  moduleId: string;
}

export default function Quiz({ quizId, moduleId }: QuizProps) {

  const startQuiz = () => {
    gtag.event("quiz_start", { quiz_name: quizId, module_name: moduleId });
  };

  const completeQuiz = (score: number) => {
    gtag.event("quiz_complete", {
      quiz_name: quizId,
      module_name: moduleId,
      score
    });
  };

  return (
    <div>
      <h2>Quiz: {quizId}</h2>
      <button onClick={startQuiz}>Start Quiz</button>
      <button onClick={() => completeQuiz(95)}>Complete Quiz (example score)</button>
    </div>
  );
}
