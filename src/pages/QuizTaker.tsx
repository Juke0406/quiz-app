import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useQuizStore, type Question } from "@/store/useQuizStore";
import { ArrowLeft, Check, Code, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserAnswer {
  questionId: string;
  selectedOptionIds: string[];
}

export function QuizTaker() {
  const { id } = useParams();
  const navigate = useNavigate();
  const quiz = useQuizStore((state) => state.getQuiz(id!));
  const [isPasswordVerified, setIsPasswordVerified] = useState(!quiz?.password);
  const [password, setPassword] = useState("");
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [showResults, setShowResults] = useState(false);

  if (!quiz) {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold mb-4">Quiz not found</h1>
        <Button onClick={() => navigate("/")}>Back to Quiz List</Button>
      </div>
    );
  }

  const handlePasswordSubmit = () => {
    if (password === quiz.password) {
      setIsPasswordVerified(true);
    }
  };

  const handleOptionSelect = (questionId: string, optionId: string) => {
    setUserAnswers((prev) => {
      const existingAnswer = prev.find((a) => a.questionId === questionId);
      const question = quiz.questions.find((q) => q.id === questionId);

      if (!question) return prev;

      if (existingAnswer) {
        if (question.isMultipleAnswer) {
          const updatedOptionIds = existingAnswer.selectedOptionIds.includes(
            optionId
          )
            ? existingAnswer.selectedOptionIds.filter((id) => id !== optionId)
            : [...existingAnswer.selectedOptionIds, optionId];

          return prev.map((a) =>
            a.questionId === questionId
              ? { ...a, selectedOptionIds: updatedOptionIds }
              : a
          );
        } else {
          return prev.map((a) =>
            a.questionId === questionId
              ? { ...a, selectedOptionIds: [optionId] }
              : a
          );
        }
      }

      return [
        ...prev,
        {
          questionId,
          selectedOptionIds: [optionId],
        },
      ];
    });
  };

  const isOptionSelected = (questionId: string, optionId: string) => {
    const answer = userAnswers.find((a) => a.questionId === questionId);
    return answer?.selectedOptionIds.includes(optionId) || false;
  };

  const isAnswerCorrect = (question: Question) => {
    const answer = userAnswers.find((a) => a.questionId === question.id);
    if (!answer) return false;

    const correctOptionIds = question.options
      .filter((o) => o.isCorrect)
      .map((o) => o.id);

    return (
      answer.selectedOptionIds.length === correctOptionIds.length &&
      answer.selectedOptionIds.every((id) => correctOptionIds.includes(id))
    );
  };

  if (!isPasswordVerified) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Password Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter quiz password"
            />
            <Button onClick={handlePasswordSubmit} className="w-full">
              Start Quiz
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">{quiz.title}</h1>
        </div>
      </div>

      <div className="space-y-6">
        {quiz.questions.map((question, index) => (
          <Card key={question.id}>
            <CardHeader>
              <CardTitle>
                <div className="flex items-center gap-2">
                  {isAnswerCorrect(question) && showResults ? (
                    <Check className="text-green-500" />
                  ) : showResults ? (
                    <X className="text-red-500" />
                  ) : null}
                  Question {index + 1}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-lg">{question.text}</p>

              {question.codeSnippet && (
                <div className="space-y-2 border rounded-lg overflow-hidden">
                  <div className="bg-gray-100 px-3 py-1 border-b flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    <span>Code Snippet</span>
                  </div>
                  <pre className="p-3 overflow-x-auto font-mono text-sm">
                    <code>{question.codeSnippet}</code>
                  </pre>
                </div>
              )}

              {question.image && (
                <img
                  src={question.image.data}
                  alt={question.image.name}
                  className="max-w-full h-auto rounded-lg"
                />
              )}

              <div className="space-y-2">
                {question.options.map((option) => {
                  const isSelected = isOptionSelected(question.id, option.id);
                  const hasIncorrectSelection =
                    showResults &&
                    !isAnswerCorrect(question) &&
                    userAnswers
                      .find((a) => a.questionId === question.id)
                      ?.selectedOptionIds.some((id) =>
                        question.options.find(
                          (o) => o.id === id && !o.isCorrect
                        )
                      );

                  return (
                    <label
                      key={option.id}
                      className={cn("block relative cursor-pointer", {
                        "opacity-80": showResults,
                      })}
                    >
                      <div
                        className={cn(
                          "flex items-center p-3 rounded-md border transition-colors",
                          {
                            // Default state
                            "border-gray-200 hover:border-gray-300":
                              !showResults && !isSelected,

                            // Selected but not submitted
                            "border-blue-300 bg-blue-50":
                              isSelected && !showResults,

                            // Selected and correct
                            "bg-green-100 border-green-500":
                              showResults && isSelected && option.isCorrect,

                            // Selected and incorrect
                            "bg-red-100 border-red-500":
                              showResults && isSelected && !option.isCorrect,

                            // Not selected but correct (only show when there's an incorrect selection)
                            "bg-green-50 border-green-300":
                              showResults &&
                              !isSelected &&
                              option.isCorrect &&
                              hasIncorrectSelection,
                          }
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-6 h-6">
                            <input
                              type={
                                question.isMultipleAnswer ? "checkbox" : "radio"
                              }
                              checked={isSelected}
                              onChange={() =>
                                handleOptionSelect(question.id, option.id)
                              }
                              disabled={showResults}
                              className="h-6 w-6 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                            />
                          </div>
                          <span className="flex-1">{option.text}</span>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        {!showResults && (
          <Button onClick={() => setShowResults(true)}>Submit Quiz</Button>
        )}
      </div>

      {showResults && (
        <div className="text-center">
          <Button onClick={() => navigate("/")}>Back to Quiz List</Button>
        </div>
      )}
    </div>
  );
}
