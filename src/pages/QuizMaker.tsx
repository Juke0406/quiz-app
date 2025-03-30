import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useQuizStore, type Question, type Option, type QuestionType, type BlankItem, type SequenceItem } from "@/store/useQuizStore";
import { Plus, Trash2, Save, FileImage, Code, ChevronDown } from "lucide-react";
import { uploadImage, deleteImage, verifyImage } from "@/lib/imageUpload";
import imageCompression from "browser-image-compression";
import { useToast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function QuizMaker() {
  const navigate = useNavigate();
  const { id } = useParams(); // Get the quiz ID from URL params
  const addQuiz = useQuizStore((state) => state.addQuiz);
  const updateQuiz = useQuizStore((state) => state.updateQuiz);
  const getQuiz = useQuizStore((state) => state.getQuiz);
  const [title, setTitle] = useState("");
  const [password, setPassword] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  // Load quiz data if in edit mode
  useEffect(() => {
    if (id) {
      const existingQuiz = getQuiz(id);
      if (existingQuiz) {
        setIsEditing(true);
        setTitle(existingQuiz.title);
        setPassword(existingQuiz.password || "");
        setQuestions(existingQuiz.questions);
      } else {
        navigate("/");
      }
    }
  }, [id, getQuiz, navigate]);

  const addQuestion = (type: QuestionType = 'multiple-choice') => {
    const newQuestion: Question = {
      id: crypto.randomUUID(),
      text: "",
      type,
      options: [],
      isMultipleAnswer: false,
    };
    
    // Initialize appropriate fields based on question type
    if (type === 'fill-in-blanks') {
      newQuestion.blanks = [];
    } else if (type === 'sequence-arrangement') {
      newQuestion.sequenceItems = [];
      newQuestion.preFilledPositions = [];
    }
    
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, ...updates } : q))
    );
  };

  const addOption = (questionId: string) => {
    const newOption: Option = {
      id: crypto.randomUUID(),
      text: "",
      isCorrect: false,
    };
    setQuestions(
      questions.map((q) =>
        q.id === questionId ? { ...q, options: [...q.options, newOption] } : q
      )
    );
  };

  const updateOption = (
    questionId: string,
    optionId: string,
    updates: Partial<Option>
  ) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId) {
          // If we're setting an option as correct and it's not multiple answer mode
          if (updates.isCorrect === true && !q.isMultipleAnswer) {
            // Update all options, setting only the current one as correct
            return {
              ...q,
              options: q.options.map((o) => ({
                ...o,
                isCorrect: o.id === optionId, // Only this option should be correct
              })),
            };
          } else {
            // For multiple answer mode or other updates, just update the specific option
            return {
              ...q,
              options: q.options.map((o) =>
                o.id === optionId ? { ...o, ...updates } : o
              ),
            };
          }
        }
        return q;
      })
    );
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const removeOption = (questionId: string, optionId: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? { ...q, options: q.options.filter((o) => o.id !== optionId) }
          : q
      )
    );
  };
  
  // Fill in the blanks question functions
  const addBlank = (questionId: string) => {
    const newBlank: BlankItem = {
      id: crypto.randomUUID(),
      answer: ""
    };
    
    setQuestions(
      questions.map((q) =>
        q.id === questionId && q.blanks 
          ? { ...q, blanks: [...q.blanks, newBlank] }
          : q
      )
    );
  };
  
  const updateBlank = (
    questionId: string,
    blankId: string,
    answer: string
  ) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId && q.blanks) {
          return {
            ...q,
            blanks: q.blanks.map((b) =>
              b.id === blankId ? { ...b, answer } : b
            )
          };
        }
        return q;
      })
    );
  };
  
  const removeBlank = (questionId: string, blankId: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId && q.blanks
          ? { ...q, blanks: q.blanks.filter((b) => b.id !== blankId) }
          : q
      )
    );
  };
  
  // Sequence arrangement question functions
  const addSequenceItem = (questionId: string) => {
    const question = questions.find(q => q.id === questionId);
    const nextPosition = question?.sequenceItems?.length ? question.sequenceItems.length + 1 : 1;
    
    const newItem: SequenceItem = {
      id: crypto.randomUUID(),
      text: "",
      correctPosition: nextPosition
    };
    
    setQuestions(
      questions.map((q) =>
        q.id === questionId && q.sequenceItems 
          ? { ...q, sequenceItems: [...q.sequenceItems, newItem] }
          : q
      )
    );
  };
  
  const updateSequenceItem = (
    questionId: string,
    itemId: string,
    updates: Partial<SequenceItem>
  ) => {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId && q.sequenceItems) {
          return {
            ...q,
            sequenceItems: q.sequenceItems.map((item) =>
              item.id === itemId ? { ...item, ...updates } : item
            )
          };
        }
        return q;
      })
    );
  };
  
  const removeSequenceItem = (questionId: string, itemId: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId && q.sequenceItems
          ? { ...q, sequenceItems: q.sequenceItems.filter((item) => item.id !== itemId) }
          : q
      )
    );
  };
  
  const updatePreFilledPositions = (questionId: string, positions: number[]) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? { ...q, preFilledPositions: positions }
          : q
      )
    );
  };

  const handleImageUpload = async (questionId: string, file: File) => {
      toast({
        title: "Processing image...",
        description: "Please wait while your image is being processed.",
        duration: 3000,
      });

    // Verify the image is valid
    const isValid = await verifyImage(file);
    if (!isValid) {
      toast({
        variant: "destructive",
        title: "Invalid image",
        description:
          "The selected file is not a valid image. Please try another file.",
        duration: 5000,
      });
      return;
    }

    try {
      let fileToUpload = file;

      try {
        // Safer compression options
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1024,
          useWebWorker: true,
          fileType: "image/jpeg", // Convert to JPEG for better compatibility
          initialQuality: 0.8, // Lower quality for better compression
        };

        fileToUpload = await imageCompression(file, options);
        console.log("Compression successful", fileToUpload);
      } catch (compressionError) {
        console.warn(
          "Image compression failed, using original file:",
          compressionError
        );
        // Continue with the original file if compression fails
      }

      // Step 2: Upload to Supabase
    toast({
      title: "Uploading image...",
      description: "Please wait while your image is being uploaded.",
      duration: 3000,
    });

      const { publicUrl, filePath } = await uploadImage(fileToUpload);

      // Step 3: Update the question with the image URL
      updateQuestion(questionId, {
        image: {
          data: publicUrl,
          name: file.name,
          path: filePath,
        },
      });

      toast({
        variant: "success",
        title: "Image uploaded",
        description: "Your image has been successfully uploaded.",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error handling image:", error);

      // Fallback to local base64 storage if Supabase upload fails
      toast({
        variant: "warning",
        title: "Using local storage",
        description:
          "We couldn't upload to the cloud, storing image locally instead.",
        duration: 5000,
      });

      try {
        // Convert to base64 as fallback
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            updateQuestion(questionId, {
              image: {
                data: e.target.result as string,
                name: file.name,
              },
            });
          }
        };
        reader.onerror = () => {
          toast({
            variant: "destructive",
            title: "Image processing failed",
            description:
              "Could not process the image. Please try a different image.",
            duration: 5000,
          });
        };
        reader.readAsDataURL(file);
      } catch (fallbackError) {
        toast({
          variant: "destructive",
          title: "Image processing failed",
          description:
            "Could not process the image. Please try a different image.",
          duration: 5000,
        });
      }
    }
  };

  const removeQuestionImage = async (
    questionId: string,
    imagePath?: string
  ) => {
    if (imagePath) {
      try {
        await deleteImage(imagePath);
        updateQuestion(questionId, { image: undefined });

        toast({
          variant: "success",
          title: "Image removed",
          description: "The image has been successfully removed.",
          duration: 3000,
        });
      } catch (error) {
        console.error("Error deleting image:", error);
        toast({
          variant: "destructive",
          title: "Error removing image",
          description:
            "There was a problem removing the image. Please try again.",
          duration: 5000,
        });
      }
    } else {
      updateQuestion(questionId, { image: undefined });
    }
  };

  const validateQuiz = (): string[] => {
    const errors: string[] = [];

    if (!title) {
      errors.push("Quiz title is required");
    }

    if (questions.length === 0) {
      errors.push("At least one question is required");
    }

    questions.forEach((question, index) => {
      const questionNum = index + 1;
      
      if (!question.text) {
        errors.push(`Question ${questionNum} text is required`);
      }
      
      if (question.type === 'multiple-choice') {
        // Multiple choice validation
        if (question.options.length < 2) {
          errors.push(`Question ${questionNum} must have at least 2 options`);
        }

        // Check if question has at least 1 correct answer
        const hasCorrectOption = question.options.some(option => option.isCorrect);
        if (!hasCorrectOption) {
          errors.push(`Question ${questionNum} must have at least one correct answer`);
        }
      } 
      else if (question.type === 'fill-in-blanks') {
        // Fill in the blanks validation
        if (!question.blanks || question.blanks.length === 0) {
          errors.push(`Question ${questionNum} must have at least one blank to fill`);
        } else {
          const emptyBlanks = question.blanks.some(blank => !blank.answer.trim());
          if (emptyBlanks) {
            errors.push(`Question ${questionNum} has empty answers for blanks`);
          }
        }
      } 
      else if (question.type === 'sequence-arrangement') {
        // Sequence arrangement validation
        if (!question.sequenceItems || question.sequenceItems.length < 2) {
          errors.push(`Question ${questionNum} must have at least 2 sequence items`);
        } else {
          const emptyItems = question.sequenceItems.some(item => !item.text.trim());
          if (emptyItems) {
            errors.push(`Question ${questionNum} has empty sequence items`);
          }
          
          // Check if there are duplicate positions
          const positions = question.sequenceItems.map(item => item.correctPosition);
          const uniquePositions = new Set(positions);
          if (uniquePositions.size !== positions.length) {
            errors.push(`Question ${questionNum} has duplicate positions in the sequence`);
          }
        }
      }
    });

    return errors;
  };

  const handleSave = () => {
    const errors = validateQuiz();
    if (errors.length > 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: (
          <ul className="list-disc pl-5">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        ),
        duration: 8000, // Longer duration for validation errors to give time to read
      });
      return;
    }

    if (isEditing && id) {
      const updatedQuiz = {
        id,
        title,
        password: password || undefined,
        questions,
      };

      updateQuiz(id, updatedQuiz);
      toast({
        variant: "success",
        title: "Quiz Updated",
        description: "Your quiz has been successfully updated!",
        duration: 3000,
      });
    } else {
      const newQuiz = {
        id: crypto.randomUUID(),
        title,
        password: password || undefined,
        questions,
      };

      addQuiz(newQuiz);
      toast({
        variant: "success",
        title: "Quiz Created",
        description: "Your quiz has been successfully created!",
        duration: 3000,
      });
    }

    navigate("/");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-700">
          {isEditing ? "Edit Quiz" : "Create Quiz"}
        </h1>
        <Button onClick={() => navigate("/")}>Back to List</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quiz Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Quiz Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter quiz title"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Password (Optional)</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password to protect quiz"
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {questions.map((question, index) => (
          <Card key={question.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Question {index + 1}</CardTitle>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => removeQuestion(question.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Question Text</label>
                <Input
                  value={question.text}
                  onChange={(e) =>
                    updateQuestion(question.id, { text: e.target.value })
                  }
                  placeholder="Enter question text"
                />
              </div>

              {/* Show multiple answer option only for multiple-choice questions */}
              {question.type === 'multiple-choice' && (
                <div>
                  <label className="inline-flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={question.isMultipleAnswer}
                      onChange={(e) =>
                        updateQuestion(question.id, {
                          isMultipleAnswer: e.target.checked,
                        })
                      }
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Allow multiple answers</span>
                  </label>
                </div>
              )}

              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Code Snippet (Optional)
                  </span>
                </label>
                <Textarea
                  value={question.codeSnippet || ""}
                  onChange={(e) =>
                    updateQuestion(question.id, { codeSnippet: e.target.value })
                  }
                  placeholder="Enter code snippet"
                  className="font-mono"
                />
                {question.codeSnippet && (
                  <div className="mt-2 border rounded-lg overflow-hidden">
                    <div className="bg-gray-100 px-3 py-1 border-b flex items-center gap-2">
                      <Code className="h-4 w-4 text-gray-500" />
                      <span className="text-xs font-medium text-gray-500">
                        Preview
                      </span>
                    </div>
                    <pre className="p-3 overflow-x-auto font-mono text-sm">
                      <code>{question.codeSnippet}</code>
                    </pre>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <FileImage className="h-4 w-4" />
                  <span className="text-sm font-medium">Image (Optional)</span>
                </label>
                <div className="space-y-2">
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleImageUpload(question.id, file);
                      }
                    }}
                  />
                  <p className="text-xs text-gray-500">
                    Supported formats: JPEG, PNG, GIF, WebP. Max size: 5MB
                  </p>
                  {question.image && (
                    <div className="relative group">
                      <img
                        src={question.image.data}
                        alt={question.image.name}
                        className="max-w-full h-auto rounded-lg"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() =>
                          removeQuestionImage(question.id, question.image?.path)
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Question Type</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      {question.type === 'multiple-choice' ? 'Multiple Choice' : 
                       question.type === 'fill-in-blanks' ? 'Fill in the Blanks' : 
                       'Sequence Arrangement'}
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <DropdownMenuItem 
                      onClick={() => updateQuestion(question.id, { 
                        type: 'multiple-choice',
                        blanks: undefined,
                        sequenceItems: undefined,
                        preFilledPositions: undefined,
                      })}
                      className={question.type === 'multiple-choice' ? "bg-blue-50" : ""}
                    >
                      Multiple Choice
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => updateQuestion(question.id, { 
                        type: 'fill-in-blanks',
                        blanks: [],
                        sequenceItems: undefined,
                        preFilledPositions: undefined,
                      })}
                      className={question.type === 'fill-in-blanks' ? "bg-blue-50" : ""}
                    >
                      Fill in the Blanks
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => updateQuestion(question.id, { 
                        type: 'sequence-arrangement',
                        blanks: undefined,
                        sequenceItems: [],
                        preFilledPositions: [],
                      })}
                      className={question.type === 'sequence-arrangement' ? "bg-blue-50" : ""}
                    >
                      Sequence Arrangement
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              {/* Multiple Choice Question Editor */}
              {question.type === 'multiple-choice' && (
                <div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium">Options</label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addOption(question.id)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Option
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => (
                        <div key={option.id} className="relative">
                          <div
                            className={`
                            border rounded-md p-2 pr-10
                            ${
                              option.isCorrect
                                ? "border-green-500"
                                : "border-gray-200"
                            }
                            hover:border-gray-300 transition-colors
                          `}
                          >
                            <div className="flex items-center gap-2">
                              <div className="flex items-center justify-center w-6 h-6">
                                <input
                                  type={
                                    question.isMultipleAnswer ? "checkbox" : "radio"
                                  }
                                  name={`correct-${question.id}`}
                                  checked={option.isCorrect}
                                  onChange={(e) =>
                                    updateOption(question.id, option.id, {
                                      isCorrect: e.target.checked,
                                    })
                                  }
                                  className="h-6 w-6 rounded border-gray-300 text-green-600 focus:ring-green-600"
                                  aria-label="Mark as correct answer"
                                  title="Mark as correct answer"
                                />
                              </div>
                              <Input
                                value={option.text}
                                onChange={(e) =>
                                  updateOption(question.id, option.id, {
                                    text: e.target.value,
                                  })
                                }
                                placeholder={`Option ${optionIndex + 1}`}
                                className="flex-1 border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                              />
                            </div>
                          </div>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2"
                            onClick={() => removeOption(question.id, option.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Fill in the Blanks Question Editor */}
              {question.type === 'fill-in-blanks' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium">Blank Fields</label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addBlank(question.id)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Blank
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {question.blanks?.map((blank, index) => (
                      <div key={blank.id} className="flex items-center gap-2">
                        <div className="flex-1">
                          <label className="block text-sm font-medium mb-1">
                            Blank {index + 1} Answer
                          </label>
                          <Input
                            value={blank.answer}
                            onChange={(e) => updateBlank(question.id, blank.id, e.target.value)}
                            placeholder={`Answer for blank ${index + 1}`}
                          />
                        </div>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="mt-6"
                          onClick={() => removeBlank(question.id, blank.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800 mt-2">
                    <p className="font-semibold mb-1">Instructions:</p>
                    <p>
                      Include underscores (_____) in your question text to indicate where blanks should appear. 
                      For example: "The capital of France is _____."
                    </p>
                    <p className="mt-2">
                      The blanks you add below will be matched with the underscores in order.
                    </p>
                  </div>
                </div>
              )}
              
              {/* Sequence Arrangement Question Editor */}
              {question.type === 'sequence-arrangement' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium">Sequence Items</label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addSequenceItem(question.id)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {question.sequenceItems?.map((item, index) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <div className="w-28 flex-shrink-0">
                          <label className="block text-xs font-medium mb-1">Position</label>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" className="w-full justify-between">
                                {item.correctPosition}
                                <ChevronDown className="h-4 w-4 opacity-50" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              {Array.from(
                                { length: question.sequenceItems?.length || 0 },
                                (_, i) => i + 1
                              ).map((pos) => (
                                <DropdownMenuItem
                                  key={pos}
                                  className={pos === item.correctPosition ? "bg-blue-50" : ""}
                                  onClick={() => updateSequenceItem(
                                    question.id,
                                    item.id,
                                    { correctPosition: pos }
                                  )}
                                >
                                  {pos}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-medium mb-1">Item Text</label>
                          <Input
                            value={item.text}
                            onChange={(e) => updateSequenceItem(
                              question.id, 
                              item.id, 
                              { text: e.target.value }
                            )}
                            placeholder={`Sequence item ${index + 1}`}
                          />
                        </div>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="mt-6"
                          onClick={() => removeSequenceItem(question.id, item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  {/* Pre-filled positions section */}
                  {question.sequenceItems && question.sequenceItems.length > 0 && (
                    <div className="pt-4 border-t">
                      <label className="block text-sm font-medium mb-2">
                        Pre-filled Positions (Optional)
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {question.sequenceItems.map((item) => {
                          const position = item.correctPosition;
                          const isPreFilled = question.preFilledPositions?.includes(position);
                          
                          return (
                            <button
                              key={item.id}
                              className={`px-3 py-1 rounded-md text-sm ${
                                isPreFilled 
                                  ? "bg-blue-100 text-blue-800 border border-blue-300" 
                                  : "bg-gray-100 text-gray-700 border border-gray-200"
                              }`}
                              onClick={() => {
                                const currentPositions = question.preFilledPositions || [];
                                const newPositions = isPreFilled
                                  ? currentPositions.filter(p => p !== position)
                                  : [...currentPositions, position];
                                
                                updatePreFilledPositions(question.id, newPositions);
                              }}
                            >
                              Position {position}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Click on positions that should be pre-filled (revealed) to the student
                      </p>
                    </div>
                  )}
                  
                  {(!question.sequenceItems || question.sequenceItems.length === 0) && (
                    <p className="text-sm text-gray-500 italic">
                      Add sequence items in their correct order. Students will arrange these items using dropdown menus.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-between">
        <div className="flex gap-2">
          <Button onClick={() => addQuestion('multiple-choice')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Multiple Choice
          </Button>
          <Button onClick={() => addQuestion('fill-in-blanks')} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Fill-in-Blanks
          </Button>
          <Button onClick={() => addQuestion('sequence-arrangement')} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Sequence Question
          </Button>
        </div>
        <Button
          onClick={handleSave}
          disabled={!title || questions.length === 0}
        >
          <Save className="h-4 w-4 mr-2" />
          {isEditing ? "Update Quiz" : "Save Quiz"}
        </Button>
      </div>
    </div>
  );
}
