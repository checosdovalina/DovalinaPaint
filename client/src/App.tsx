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
import Invoices from "@/pages/invoices";
import Payments from "@/pages/payments";
import FinancialReports from "@/pages/financial-reports";
import Suppliers from "@/pages/suppliers";
import PurchaseOrders from "@/pages/purchase-orders";
import SimpleQuotes from "@/pages/simple-quotes";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={Dashboard} title="Dashboard" />
      <ProtectedRoute path="/clients" component={Clients} title="Clients & Prospects" />
      <ProtectedRoute path="/quotes" component={Quotes} title="Quotes" />
      <ProtectedRoute path="/simple-quotes" component={SimpleQuotes} title="Simple Quotes" />
      <ProtectedRoute path="/service-orders" component={ServiceOrders} title="Service Orders" />
      <ProtectedRoute path="/projects" component={Projects} title="Project Management" />
      <ProtectedRoute path="/calendar" component={Calendar} title="Calendar" />
      <ProtectedRoute path="/personnel" component={Personnel} title="Staff Management" />
      <ProtectedRoute path="/subcontractors" component={Subcontractors} title="Subcontractors" />
      <ProtectedRoute path="/suppliers" component={Suppliers} title="Suppliers" />
      <ProtectedRoute path="/purchase-orders" component={PurchaseOrders} title="Purchase Orders" />
      <ProtectedRoute path="/invoices" component={Invoices} title="Invoices" />
      <ProtectedRoute path="/payments" component={Payments} title="Payments" />
      <ProtectedRoute path="/financial-reports" component={FinancialReports} title="Financial Reports" />
      <ProtectedRoute path="/reports" component={Reports} title="Reports & Analytics" />
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
