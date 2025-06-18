import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Route, useLocation } from "wouter";
import { useEffect } from "react";
import { Layout } from "@/components/layout";

export function ProtectedRoute({
  path,
  component: Component,
  title,
}: {
  path: string;
  component: () => React.JSX.Element;
  title?: string;
}) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  // Usar useEffect para redirigir después del renderizado
  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/auth");
    }
  }, [user, isLoading, setLocation]);

  return (
    <Route path={path}>
      {() => {
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }

        if (!user) {
          // No renderizamos nada mientras se ejecuta la redirección
          return null;
        }

        return (
          <Layout title={title || ""}>
            <Component />
          </Layout>
        );
      }}
    </Route>
  );
}
