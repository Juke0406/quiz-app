import { useEffect } from "react";
import { useQuizStore } from "./store/useQuizStore";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QuizMaker } from "./pages/QuizMaker";
import { QuizList } from "./pages/QuizList";
import { QuizTaker } from "./pages/QuizTaker";
import { Toaster } from "@/components/ui/toaster";

function App() {
  const fetchQuizzes = useQuizStore((state) => state.fetchQuizzes);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <main className="container mx-auto py-8">
          <Routes>
            <Route path="/" element={<QuizList />} />
            <Route path="/create" element={<QuizMaker />} />
            <Route path="/edit/:id" element={<QuizMaker />} />
            <Route path="/quiz/:id" element={<QuizTaker />} />
          </Routes>
        </main>
        <Toaster />
      </div>
    </Router>
  );
}

export default App;
