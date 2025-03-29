import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuizStore } from "@/store/useQuizStore";
import { Plus, Lock, Unlock, Edit } from "lucide-react";

export function QuizList() {
  const navigate = useNavigate();
  const quizzes = useQuizStore((state) => state.quizzes);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Available Quizzes</h1>
        <Button onClick={() => navigate("/create")}>
          <Plus className="h-4 w-4 mr-2" />
          Create Quiz
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {quizzes.map((quiz) => (
          <Card
            key={quiz.id}
            className="hover:shadow-lg transition-shadow"
            onClick={() => navigate(`/quiz/${quiz.id}`)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl cursor-pointer">
                  {quiz.title}
                </CardTitle>
                {quiz.password ? (
                  <Lock className="h-4 w-4 text-yellow-500" />
                ) : (
                  <Unlock className="h-4 w-4 text-green-500" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  {quiz.questions.length} Questions
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/edit/${quiz.id}`);
                  }}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {quizzes.length === 0 && (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            No quizzes available. Create one to get started!
          </div>
        )}
      </div>
    </div>
  );
}
