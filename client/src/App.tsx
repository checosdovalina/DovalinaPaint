import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import LandingPage from "@/pages/landing-page";
import Dashboard from "@/pages/dashboard";
import Clients from "@/pages/clients";
import Quotes from "@/pages/quotes";
import ServiceOrders from "@/pages/service-orders";
import Projects from "@/pages/projects";
import Personnel from "@/pages/personnel";
import Reports from "@/pages/reports";
import Subcontractors from "@/pages/subcontractors";
import Calendar from "@/pages/calendar";
import Invoices from "@/pages/invoices";
import Payments from "@/pages/payments";
import FinancialReports from "@/pages/financial-reports";
import Suppliers from "@/pages/suppliers";
import PurchaseOrders from "@/pages/purchase-orders";
import SimpleQuotes from "@/pages/simple-quotes";
import Settings from "@/pages/settings";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/dashboard/clients" component={Clients} />
      <ProtectedRoute path="/dashboard/quotes" component={Quotes} />
      <ProtectedRoute path="/dashboard/simple-quotes" component={SimpleQuotes} />
      <ProtectedRoute path="/dashboard/service-orders" component={ServiceOrders} />
      <ProtectedRoute path="/dashboard/projects/:id" component={Projects} />
      <ProtectedRoute path="/dashboard/projects" component={Projects} />
      <ProtectedRoute path="/dashboard/calendar" component={Calendar} />
      <ProtectedRoute path="/dashboard/personnel" component={Personnel} />
      <ProtectedRoute path="/dashboard/subcontractors" component={Subcontractors} />
      <ProtectedRoute path="/dashboard/suppliers" component={Suppliers} />
      <ProtectedRoute path="/dashboard/purchase-orders" component={PurchaseOrders} />
      <ProtectedRoute path="/dashboard/invoices" component={Invoices} />
      <ProtectedRoute path="/dashboard/payments" component={Payments} />
      <ProtectedRoute path="/dashboard/financial-reports" component={FinancialReports} />
      <ProtectedRoute path="/dashboard/reports" component={Reports} />
      <ProtectedRoute path="/dashboard/settings" component={Settings} />
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
