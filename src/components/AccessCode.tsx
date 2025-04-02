import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Lock } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

// AccessCode wrapper component that acts as a gateway to protected routes
interface AccessCodeProps {
  children: React.ReactNode;
}

export function AccessCode({ children }: AccessCodeProps) {
  const [code, setCode] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Load authorization state from localStorage on component mount
  useEffect(() => {
    const checkAuth = () => {
      const storedCode = localStorage.getItem("quiz_access_code");
      const storedExpiry = localStorage.getItem("quiz_access_expiry");

      if (storedCode && storedExpiry) {
        // Check if access hasn't expired
        if (Date.now() < parseInt(storedExpiry)) {
          setIsAuthorized(true);
        } else {
          // Clean up expired tokens
          localStorage.removeItem("quiz_access_code");
          localStorage.removeItem("quiz_access_expiry");
        }
      }

      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Function to verify the access code
  const verifyCode = () => {
    // Get the admin code from localStorage or use a default code if not set
    const adminCode = import.meta.env.VITE_ADMIN_CODE;

    if (code === adminCode) {
      // Set authorized state and store in localStorage with 24-hour expiry
      setIsAuthorized(true);

      // 24 hours in milliseconds
      const expiryTime = Date.now() + 24 * 60 * 60 * 1000;
      localStorage.setItem("quiz_access_code", "authorized");
      localStorage.setItem("quiz_access_expiry", expiryTime.toString());

      toast({
        title: "Access granted",
        description:
          "You now have access to create and edit quizzes for 24 hours.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Access denied",
        description: "The access code you entered is incorrect.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading...</p>
      </div>
    );
  }

  // If authorized, render the children components
  if (isAuthorized) {
    return <>{children}</>;
  }

  // Otherwise, show the access code entry form
  return (
    <div
      className={`flex flex-col items-center justify-center ${
        isMobile ? "max-w-full px-4" : "max-w-md"
      } mx-auto mt-16`}
    >
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className={`${isMobile ? "text-2xl" : "text-xl"}`}>
            Restricted Access
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-center text-muted-foreground">
            You need an access code to create or edit quizzes.
          </p>

          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Enter access code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  verifyCode();
                }
              }}
            />
          </div>

          <div className="flex flex-col space-y-2">
            <Button
              onClick={verifyCode}
              className={`w-full ${isMobile ? "py-6 text-lg" : ""}`}
            >
              Verify Code
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className={`w-full ${isMobile ? "py-6 text-lg" : ""}`}
            >
              Back to Quizzes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
