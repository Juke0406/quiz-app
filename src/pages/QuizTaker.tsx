import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useQuizStore, type Question, type Quiz } from "@/store/useQuizStore";
import { ArrowLeft, Check, ChevronDown, Code, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Extended question type to include the source quiz title
interface ExtendedQuestion extends Question {
  quizTitle?: string;
}

// Extended quiz type with the extended questions
interface ExtendedQuiz extends Omit<Quiz, 'questions'> {
  questions: ExtendedQuestion[];
}

interface UserAnswer {
  questionId: string;
  selectedOptionIds: string[];
  blankAnswers?: Record<string, string>; // blankId -> answer
  sequencePositions?: Record<string, number>; // itemId -> position
}

export function QuizTaker() {
  const { id } = useParams();
  const navigate = useNavigate();
  const quizzes = useQuizStore((state) => state.quizzes);
  const getQuiz = useQuizStore((state) => state.getQuiz);
  
  // Handle special cases
  const isAllQuizzes = id === "all";
  const isAllAnswers = id === "all-answers";
  
  // For special modes, combine all quizzes
  const quiz = useMemo(() => {
    if (isAllQuizzes || isAllAnswers) {
      if (quizzes.length === 0) {
        return null;
      }
      
      // Get the password from the first quiz that has one (all passwords are the same)
      const commonPassword = quizzes.find(q => q.password)?.password || "";
      
      // Flatten all questions from all quizzes and add source quiz title
      const allQuestions = quizzes.flatMap(q => 
        q.questions.map(question => ({
          ...question,
          quizTitle: q.title // Add the source quiz title to each question
        }))
      );
      
      // All-answers mode - no randomization of questions
      const finalQuestions = isAllAnswers 
        ? allQuestions 
        : [...allQuestions].sort(() => Math.random() - 0.5); // Randomly shuffle for quiz mode
      
      // Create the combined quiz
      return {
        id: isAllAnswers ? "all-answers" : "all",
        title: isAllAnswers ? "All Quizzes Answers" : "All Quizzes",
        password: isAllAnswers ? "" : commonPassword, // No password needed for answers view
        questions: finalQuestions
      } as ExtendedQuiz;
    } else {
      // Normal single quiz
      return getQuiz(id!) as Quiz;
    }
  }, [id, quizzes, getQuiz, isAllQuizzes, isAllAnswers]);

  const [isPasswordVerified, setIsPasswordVerified] = useState(!quiz?.password || isAllQuizzes || isAllAnswers);
  const [password, setPassword] = useState("");
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [showResults, setShowResults] = useState(isAllAnswers); // Auto-show results in answers mode
  const [shuffledQuiz, setShuffledQuiz] = useState<Quiz | null>(null);
  
  // Function to shuffle an array (Fisher-Yates algorithm)
  const shuffleArray = <T,>(array: T[]): T[] => {
    const arrayCopy = [...array];
    for (let i = arrayCopy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arrayCopy[i], arrayCopy[j]] = [arrayCopy[j], arrayCopy[i]];
    }
    return arrayCopy;
  };

  // Shuffle options and sequence items when quiz is loaded and verified
  useEffect(() => {
    if (quiz && isPasswordVerified) {
      // For normal quizzes, we also shuffle the questions
      // For "all quizzes" mode, the questions are already shuffled in the useMemo above
      const shuffledQuestions = isAllQuizzes 
        ? [...quiz.questions] 
        : shuffleArray([...quiz.questions]);
      
      // Now shuffle options and sequence items for all questions
      const shuffled = {
        ...quiz,
        questions: shuffledQuestions.map(q => {
          if (q.type === 'multiple-choice') {
            // Shuffle options for multiple choice questions
            return {
              ...q,
              options: shuffleArray([...q.options])
            };
          } else if (q.type === 'sequence-arrangement' && q.sequenceItems) {
            // Shuffle sequence items but maintain their correct positions
            return {
              ...q,
              sequenceItems: shuffleArray([...q.sequenceItems])
            };
          }
          return { ...q };
        })
      };
      
      setShuffledQuiz(shuffled);
    }
  }, [quiz, isPasswordVerified, isAllQuizzes]);

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
    if (shuffledQuiz && !userAnswers.length) {
      // Pre-initialize empty answers for the questions
      const initialAnswers = shuffledQuiz.questions.map(question => {
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
  }, [shuffledQuiz]);

  const handleOptionSelect = (questionId: string, optionId: string) => {
    setUserAnswers((prev) => {
      const existingAnswer = prev.find((a) => a.questionId === questionId);
      const question = (shuffledQuiz || quiz).questions.find((q) => q.id === questionId);

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
  
  // Calculate the total score (number of correct answers)
  const calculateScore = () => {
    if (!showResults || !(shuffledQuiz || quiz)) return { correct: 0, total: 0 };
    
    const questions = (shuffledQuiz || quiz).questions;
    let correctCount = 0;
    
    questions.forEach(question => {
      if (isAnswerCorrect(question)) {
        correctCount++;
      }
    });
    
    return {
      correct: correctCount,
      total: questions.length
    };
  };
  
  const score = calculateScore();

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

  // Special case: All-Answers mode (just show the answers without quiz-taking UI)
  if (isAllAnswers) {
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
        
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700 font-medium">
            Viewing all quiz answers in their original order, without randomization.
          </p>
        </div>

        {/* Answer Card - Shows all answers in sequential order */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-left space-y-6">
              {/* Display questions from all quizzes sorted by quiz title */}
              {[...quizzes]
                // Sort quizzes by title (numerical order: 1, 2, 3... 10, 11...)
                .sort((a, b) => {
                  // Check if titles start with numbers (e.g., "1. ", "10. ")
                  const numPrefixRegex = /^(\d+)\.\s+/;
                  const matchA = a.title.match(numPrefixRegex);
                  const matchB = b.title.match(numPrefixRegex);

                  // If both have numerical prefixes, sort numerically
                  if (matchA && matchB) {
                    const numA = parseInt(matchA[1], 10);
                    const numB = parseInt(matchB[1], 10);
                    return numA - numB;
                  } 
                  // If only one has a numerical prefix, prioritize it
                  else if (matchA) {
                    return -1; // A comes first
                  } 
                  else if (matchB) {
                    return 1;  // B comes first
                  }
                  // Otherwise, use standard alphabetical sorting
                  return a.title.localeCompare(b.title);
                })
                .flatMap(q => 
                  // Map each quiz to its questions with index
                  q.questions.map((question, qIndex) => (
                  <div key={question.id} className="border-b pb-4 last:border-0">
                    <div className="flex items-start gap-2">
                      <span className="bg-primary text-white px-2 py-1 rounded-md text-sm">Q{qIndex + 1}</span>
                      <div className="space-y-2 flex-1">
                        {/* Show source quiz title for each question */}
                        <div className="text-sm text-gray-500 mb-1">
                          From: {q.title}
                        </div>
                        <p className="font-medium whitespace-pre-wrap">{question.text}</p>
                        
                        {question.codeSnippet && (
                          <div className="border rounded-md overflow-hidden">
                            <div className="bg-gray-100 px-3 py-1 border-b flex items-center gap-2">
                              <Code className="h-4 w-4" />
                              <span>Code Snippet</span>
                            </div>
                            <pre className="p-3 overflow-x-auto text-sm">
                              <code>{question.codeSnippet}</code>
                            </pre>
                          </div>
                        )}

                        {/* Display answers based on question type */}
                        {question.type === 'multiple-choice' && (
                          <div className="space-y-1 mt-2">
                            <p className="text-sm font-medium text-gray-500">Options:</p>
                            <div className="space-y-2">
                              {question.options.map(option => (
                                <div 
                                  key={option.id} 
                                  className={cn(
                                    "p-2 border rounded-md flex items-center gap-2",
                                    option.isCorrect ? "border-green-300 bg-green-50" : "border-gray-200"
                                  )}
                                >
                                  {option.isCorrect ? (
                                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                                  ) : (
                                    <div className="w-4 h-4 flex-shrink-0" />
                                  )}
                                  <span className={cn(
                                    "whitespace-pre-wrap",
                                    option.isCorrect ? "text-green-700 font-medium" : "text-gray-700"
                                  )}>
                                    {option.text}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {question.type === 'fill-in-blanks' && question.blanks && (
                          <div className="space-y-1 mt-2">
                            <p className="text-sm font-medium text-gray-500">Correct Answer(s):</p>
                            <ul className="list-disc list-inside space-y-1">
                              {question.blanks.map((blank, blankIndex) => (
                                <li key={blank.id} className="text-green-600">
                                  Blank {blankIndex + 1}: {blank.answer}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {question.type === 'sequence-arrangement' && question.sequenceItems && (
                          <div className="space-y-1 mt-2">
                            <p className="text-sm font-medium text-gray-500">Correct Sequence:</p>
                            <ol className="list-decimal list-inside">
                              {/* Sort items by correctPosition to show the correct sequence */}
                              {[...question.sequenceItems]
                                .sort((a, b) => a.correctPosition - b.correctPosition)
                                .map(item => (
                                  <li key={item.id} className="text-green-600 whitespace-pre-wrap">
                                    {item.text}
                                  </li>
                                ))
                              }
                            </ol>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-center">
          <Button onClick={() => navigate("/")}>Back to Quiz List</Button>
        </div>
      </div>
    );
  }

  // Normal quiz-taking mode
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
      
      {isAllQuizzes && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-700 font-medium">
            You are taking all available quizzes in one session. Good luck!
          </p>
        </div>
      )}

      <div className="space-y-6">
        {(shuffledQuiz || quiz).questions.map((question, index) => (
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
              <p className="text-lg whitespace-pre-wrap">{question.text}</p>

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
                            <span className="flex-1 whitespace-pre-wrap">{option.text}</span>
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
                            <div className="text-sm flex-1 whitespace-pre-wrap">{item.text}</div>
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
    <div className="text-center space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Quiz Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-5xl font-bold">
              <span className="text-primary">{score.correct}</span>
              <span className="text-gray-400">/{score.total}</span>
            </div>
            <p className="mt-4 text-lg">
              {score.correct === score.total
                ? "Perfect score! Excellent job!"
                : score.correct >= score.total * 0.8
                ? "Great job! Nearly perfect!"
                : score.correct >= score.total * 0.6
                ? "Good effort! Keep practicing!"
                : "You need more practice!"}
            </p>
            <div className="mt-6 flex gap-4 justify-center">
              <Button onClick={() => navigate("/")}>Back to Quiz List</Button>
              <Button 
                onClick={() => {
                  // Reset user answers
                  setUserAnswers([]);
                  // Reshuffle quiz questions and options
                  if (quiz) {
                    // For normal quizzes, we shuffle the questions
                    // For "all quizzes" mode, the questions are already shuffled in the useMemo
                    const shuffledQuestions = isAllQuizzes 
                      ? [...quiz.questions] 
                      : shuffleArray([...quiz.questions]);
                    
                    // Now shuffle options and sequence items for all questions
                    const newShuffledQuiz = {
                      ...quiz,
                      questions: shuffledQuestions.map(q => {
                        if (q.type === 'multiple-choice') {
                          // Shuffle options for multiple choice questions
                          return {
                            ...q,
                            options: shuffleArray([...q.options])
                          };
                        } else if (q.type === 'sequence-arrangement' && q.sequenceItems) {
                          // Shuffle sequence items but maintain their correct positions
                          return {
                            ...q,
                            sequenceItems: shuffleArray([...q.sequenceItems])
                          };
                        }
                        return { ...q };
                      })
                    };
                    
                    setShuffledQuiz(newShuffledQuiz);
                  }
                  // Hide results
                  setShowResults(false);
                  
                  // Scroll to the top of the page
                  window.scrollTo(0, 0);
                }}
                variant="outline"
              >
                Redo Quiz
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )}
    </div>
  );
}
