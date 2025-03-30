import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useQuizStore, type Question } from "@/store/useQuizStore";
import { ArrowLeft, Check, ChevronDown, Code, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserAnswer {
  questionId: string;
  selectedOptionIds: string[];
  blankAnswers?: Record<string, string>; // blankId -> answer
  sequencePositions?: Record<string, number>; // itemId -> position
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

  // Initialize answers for fill-in-blanks and sequence questions
  useEffect(() => {
    if (quiz && !userAnswers.length) {
      // Pre-initialize empty answers for the questions
      const initialAnswers = quiz.questions.map(question => {
        const baseAnswer: UserAnswer = {
          questionId: question.id,
          selectedOptionIds: []
        };
        
        // Add empty answers for fill-in-blanks
        if (question.type === 'fill-in-blanks' && question.blanks) {
          baseAnswer.blankAnswers = {};
          question.blanks.forEach(blank => {
            baseAnswer.blankAnswers![blank.id] = '';
          });
        }
        
        // Add empty sequence positions
        if (question.type === 'sequence-arrangement' && question.sequenceItems) {
          baseAnswer.sequencePositions = {};
          question.sequenceItems.forEach(item => {
            // Pre-fill positions that are marked as prefilled
            if (question.preFilledPositions?.includes(item.correctPosition)) {
              baseAnswer.sequencePositions![item.id] = item.correctPosition;
            } else {
              baseAnswer.sequencePositions![item.id] = 0; // 0 represents no selection
            }
          });
        }
        
        return baseAnswer;
      });
      
      setUserAnswers(initialAnswers);
    }
  }, [quiz]);

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
  
  const handleBlankAnswerChange = (questionId: string, blankId: string, value: string) => {
    setUserAnswers(prev => 
      prev.map(answer => 
        answer.questionId === questionId
          ? {
              ...answer,
              blankAnswers: {
                ...(answer.blankAnswers || {}),
                [blankId]: value
              }
            }
          : answer
      )
    );
  };
  
  const handleSequencePositionChange = (questionId: string, itemId: string, position: number) => {
    setUserAnswers(prev => 
      prev.map(answer => 
        answer.questionId === questionId
          ? {
              ...answer,
              sequencePositions: {
                ...(answer.sequencePositions || {}),
                [itemId]: position
              }
            }
          : answer
      )
    );
  };

  const isOptionSelected = (questionId: string, optionId: string) => {
    const answer = userAnswers.find((a) => a.questionId === questionId);
    return answer?.selectedOptionIds.includes(optionId) || false;
  };

  const isAnswerCorrect = (question: Question) => {
    const answer = userAnswers.find((a) => a.questionId === question.id);
    if (!answer) return false;
    
    // For multiple choice questions
    if (question.type === 'multiple-choice') {
      const correctOptionIds = question.options
        .filter((o) => o.isCorrect)
        .map((o) => o.id);
  
      return (
        answer.selectedOptionIds.length === correctOptionIds.length &&
        answer.selectedOptionIds.every((id) => correctOptionIds.includes(id))
      );
    }
    
    // For fill in the blanks questions
    else if (question.type === 'fill-in-blanks' && question.blanks && answer.blankAnswers) {
      return question.blanks.every(blank => {
        const userAnswer = answer.blankAnswers?.[blank.id] || '';
        // Case insensitive comparison and trimming whitespace
        return userAnswer.trim().toLowerCase() === blank.answer.trim().toLowerCase();
      });
    }
    
    // For sequence arrangement questions
    else if (question.type === 'sequence-arrangement' && question.sequenceItems && answer.sequencePositions) {
      // Every item needs to be in its correct position
      return question.sequenceItems.every(item => {
        const userPosition = answer.sequencePositions?.[item.id];
        // If position is prefilled, it's already correct
        if (question.preFilledPositions?.includes(item.correctPosition)) {
          return true;
        }
        return userPosition === item.correctPosition;
      });
    }
    
    return false;
  };
  
  // Check if any sequence item is already assigned the given position
  // This is used to prevent duplicate position selections
  const isPositionAssigned = (questionId: string, position: number, excludeItemId?: string) => {
    const answer = userAnswers.find(a => a.questionId === questionId);
    if (!answer?.sequencePositions) return false;
    
    return Object.entries(answer.sequencePositions).some(
      ([itemId, pos]) => pos === position && itemId !== excludeItemId
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

              {/* Multiple Choice Questions */}
              {question.type === 'multiple-choice' && (
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
              )}
              
              {/* Fill in the Blanks Questions */}
              {question.type === 'fill-in-blanks' && question.blanks && (
                <div className="space-y-4">
                  {question.blanks.map((blank, index) => {
                    const answer = userAnswers.find(a => a.questionId === question.id);
                    const userAnswer = answer?.blankAnswers?.[blank.id] || '';
                    const isCorrect = userAnswer.trim().toLowerCase() === blank.answer.trim().toLowerCase();
                    
                    return (
                      <div key={blank.id} className="space-y-1">
                        <label className="text-sm font-medium">Blank {index + 1}</label>
                        <div className="relative">
                          <Input
                            value={userAnswer}
                            onChange={(e) => handleBlankAnswerChange(question.id, blank.id, e.target.value)}
                            placeholder="Your answer"
                            disabled={showResults}
                            className={cn({
                              "border-green-500 bg-green-50": showResults && isCorrect,
                              "border-red-500 bg-red-50": showResults && !isCorrect && userAnswer.trim() !== '',
                            })}
                          />
                          {showResults && (
                            <div className="mt-1">
                              {isCorrect ? (
                                <div className="text-green-600 text-sm flex items-center">
                                  <Check className="h-4 w-4 mr-1" /> 
                                  Correct
                                </div>
                              ) : (
                                <div className="text-red-600 text-sm">
                                  <span className="flex items-center mb-1">
                                    <X className="h-4 w-4 mr-1" />
                                    Incorrect
                                  </span>
                                  <span className="text-xs">
                                    Correct answer: {blank.answer}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* Sequence Arrangement Questions */}
              {question.type === 'sequence-arrangement' && question.sequenceItems && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    {/* Items with their dropdown menus */}
                    {question.sequenceItems.map((item) => {
                      const answer = userAnswers.find(a => a.questionId === question.id);
                      const selectedPosition = answer?.sequencePositions?.[item.id] || 0;
                      const isPrefilled = question.preFilledPositions?.includes(item.correctPosition);
                      const isCorrect = selectedPosition === item.correctPosition;
                      
                      return (
                        <div 
                          key={item.id} 
                          className={cn("p-3 border rounded-md", {
                            "bg-gray-100 border-gray-300": isPrefilled,
                            "bg-green-50 border-green-500": showResults && isCorrect && !isPrefilled,
                            "bg-red-50 border-red-500": showResults && !isCorrect && selectedPosition > 0 && !isPrefilled,
                          })}
                        >
                          <div className="flex items-center gap-3">
                            {/* Dropdown first (on the left) */}
                            <div className="w-28">
                              {isPrefilled ? (
                                <div className="px-3 py-2 bg-blue-100 text-blue-800 rounded-md text-center">
                                  Position {item.correctPosition}
                                </div>
                              ) : (
                                <DropdownMenu>
                                  <DropdownMenuTrigger
                                    disabled={showResults}
                                    className={cn(
                                      "w-full flex items-center justify-between px-3 py-2 border rounded-md text-left",
                                      {
                                        "border-red-300 bg-red-50": showResults && !isCorrect && selectedPosition > 0,
                                        "border-green-500 bg-green-50": showResults && isCorrect,
                                        "border-blue-300 bg-blue-50": selectedPosition > 0 && !showResults,
                                        "border-gray-300": selectedPosition === 0 && !showResults,
                                      }
                                    )}
                                  >
                                    <span>
                                      {selectedPosition > 0
                                        ? `${selectedPosition}${
                                            isPositionAssigned(question.id, selectedPosition, selectedPosition === selectedPosition ? item.id : undefined)
                                              ? " (used)"
                                              : ""
                                          }`
                                        : ""}
                                    </span>
                                    <ChevronDown className="h-4 w-4 opacity-50" />
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="start" className="w-56">
                                    {Array.from(
                                      { length: question.sequenceItems?.length || 0 },
                                      (_, i) => i + 1
                                    )
                                      .filter(
                                        pos =>
                                          !question.preFilledPositions?.includes(pos) || pos === selectedPosition
                                      )
                                      .map((pos) => (
                                        <DropdownMenuItem
                                          key={pos}
                                          onSelect={() => handleSequencePositionChange(
                                            question.id,
                                            item.id,
                                            pos
                                          )}
                                          className={cn({
                                            "bg-blue-100": selectedPosition === pos,
                                          })}
                                        >
                                          {pos}
                                          {isPositionAssigned(question.id, pos, selectedPosition === pos ? item.id : undefined)
                                            ? " (used)"
                                            : ""}
                                        </DropdownMenuItem>
                                      ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                            
                            {/* Item text (on the right) */}
                            <div className="text-sm flex-1">{item.text}</div>
                          </div>
                          
                          {showResults && !isCorrect && !isPrefilled && (
                            <div className="mt-2 ml-28 text-xs text-red-600">
                              Correct position: {item.correctPosition}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
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
