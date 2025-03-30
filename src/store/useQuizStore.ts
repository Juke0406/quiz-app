import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/lib/supabase";

export interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface BlankItem {
  id: string;
  answer: string; // Correct answer
  userAnswer?: string; // User's input answer
}

export interface SequenceItem {
  id: string;
  text: string;
  correctPosition: number;
}

export type QuestionType = 'multiple-choice' | 'fill-in-blanks' | 'sequence-arrangement';

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options: Option[];
  blanks?: BlankItem[];
  sequenceItems?: SequenceItem[];
  codeSnippet?: string;
  image?: {
    data: string; // base64 string
    name: string;
    path?: string;
  };
  isMultipleAnswer: boolean;
  // For sequence questions, this can track pre-filled positions
  preFilledPositions?: number[];
}

export interface Quiz {
  id: string;
  title: string;
  password?: string;
  questions: Question[];
}

interface QuizStore {
    quizzes: Quiz[];
    addQuiz: (quiz: Quiz) => Promise<void>;
    updateQuiz: (id: string, updatedQuiz: Quiz) => Promise<void>;
    fetchQuizzes: () => Promise<void>;
    getQuiz: (id: string) => Quiz | undefined;
}

export const useQuizStore = create<QuizStore>()(
    persist(
        (set, get) => ({
            quizzes: [],

            addQuiz: async (quiz) => {
                // Shuffle questions and options before saving
                const shuffledQuiz = {
                    ...quiz,
                    questions: quiz.questions.map((q) => ({
                        ...q,
                        options: [...q.options].sort(() => Math.random() - 0.5),
                    })).sort(() => Math.random() - 0.5),
                };

                try {
                    // Save to Supabase
                    const { data, error } = await supabase
                        .from('quizzes')
                        .insert([shuffledQuiz])
                        .select();

                    if (error) throw error;

                    // Update local state
                    set((state) => ({
                        quizzes: [...state.quizzes, data[0]],
                    }));
                } catch (error) {
                    console.error("Error saving quiz:", error);
                    // Fallback to local storage only
                    set((state) => ({
                        quizzes: [...state.quizzes, shuffledQuiz],
                    }));
                }
            },

            fetchQuizzes: async () => {
                try {
                    const { data, error } = await supabase
                        .from('quizzes')
                        .select('*');

                    if (error) throw error;

                    set({ quizzes: data });
                } catch (error) {
                    console.error("Error fetching quizzes:", error);
                }
            },

            updateQuiz: async (id, updatedQuiz) => {
                try {
                    // Update in Supabase
                    const { error } = await supabase
                        .from('quizzes')
                        .update(updatedQuiz)
                        .eq('id', id);

                    if (error) throw error;

                    // Update local state
                    set((state) => ({
                        quizzes: state.quizzes.map((quiz) =>
                            quiz.id === id ? updatedQuiz : quiz
                        ),
                    }));
                } catch (error) {
                    console.error("Error updating quiz:", error);
                    // Fallback to local update only
                    set((state) => ({
                        quizzes: state.quizzes.map((quiz) =>
                            quiz.id === id ? updatedQuiz : quiz
                        ),
                    }));
                }
            },

            getQuiz: (id) => {
                return get().quizzes.find((quiz) => quiz.id === id);
            },
        }),
        {
            name: "quiz-storage",
        }
    )
);
