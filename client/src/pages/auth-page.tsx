import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { useEffect } from "react";
import logoImg from "@assets/78c08020-ed9d-43be-8936-ddbc8089b6c3.jpeg";

const loginSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
  password: z.string().min(1, { message: "Password is required" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const { user, loginMutation } = useAuth();
  const [, setLocation] = useLocation();
  
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);
  
  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate({
      username: data.username,
      password: data.password,
    });
  };
  
  return (
    <div className="min-h-screen flex bg-gray-50 safe-area-inset">
      {/* Left side - Company info and features */}
      <div className="hidden lg:flex lg:flex-1 flex-col justify-center px-8 py-12">
        <div className="max-w-md mx-auto">
          <div className="mb-6">
            <img src={logoImg} alt="Dovalina Painting LLC" className="h-32 mb-4" />
            <h1 className="text-3xl font-bold text-blue-700 mb-2">Dovalina Painting LLC</h1>
            <p className="text-gray-600">Management system for efficient handling of clients, projects, personnel, and quotes.</p>
          </div>
          
          <div className="bg-blue-50 p-6 rounded-lg">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Key features:</h2>
            <ul className="space-y-2">
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Client and prospect management</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Kanban-style project tracking</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Quote generation and tracking</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Personnel and assignment management</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md w-full">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <img src={logoImg} alt="Dovalina Painting LLC" className="h-20 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-blue-700">Dovalina Painting LLC</h1>
          </div>
          
          <Card className="shadow-lg border-0">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 mb-4">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-semibold mb-1">Login</h2>
                <p className="text-sm text-gray-500 mb-6">Enter your credentials to access the system</p>
              </div>
              
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input 
                    id="username" 
                    placeholder="username"
                    {...loginForm.register("username")}
                  />
                  {loginForm.formState.errors.username && (
                    <p className="text-sm text-red-500">{loginForm.formState.errors.username.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password"
                    placeholder="********"
                    {...loginForm.register("password")}
                  />
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-red-500">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Logging in..." : "Login"}
                </Button>
              </form>
              
              <p className="mt-6 text-center text-sm text-gray-500">
                If you don't have an account, please contact an administrator to provide you with access to the system.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
