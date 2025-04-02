import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
      <h1 className="text-9xl font-bold text-gray-900">404</h1>
      <h2 className="mt-4 text-3xl font-semibold text-gray-700">Page Not Found</h2>
      <p className="mt-2 text-xl text-gray-600">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Button 
        onClick={() => navigate("/")}
        className="mt-8 px-6"
        size="lg"
      >
        Go Back Home
      </Button>
    </div>
  );
}
