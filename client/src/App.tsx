import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import Clients from "@/pages/clients";
import Quotes from "@/pages/quotes";
import ServiceOrders from "@/pages/service-orders";
import Projects from "@/pages/projects";
import Personnel from "@/pages/personnel";
import Reports from "@/pages/reports";
import Subcontractors from "@/pages/subcontractors";
import Calendar from "@/pages/calendar";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/clients" component={Clients} />
      <ProtectedRoute path="/quotes" component={Quotes} />
      <ProtectedRoute path="/service-orders" component={ServiceOrders} />
      <ProtectedRoute path="/projects" component={Projects} />
      <ProtectedRoute path="/calendar" component={Calendar} />
      <ProtectedRoute path="/personnel" component={Personnel} />
      <ProtectedRoute path="/subcontractors" component={Subcontractors} />
      <ProtectedRoute path="/reports" component={Reports} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
