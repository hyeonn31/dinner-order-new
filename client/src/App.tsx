import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AppLayout from "./components/AppLayout";
import Home from "./pages/Home";
import OrderPage from "./pages/OrderPage";
import SummaryPage from "./pages/SummaryPage";
import AdminPage from "./pages/AdminPage";
import EmployeeManagePage from "./pages/EmployeeManagePage";
import RestaurantManagePage from "./pages/RestaurantManagePage";

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/order" component={OrderPage} />
        <Route path="/summary" component={SummaryPage} />
        <Route path="/admin" component={AdminPage} />
        <Route path="/admin/employees" component={EmployeeManagePage} />
        <Route path="/admin/restaurants" component={RestaurantManagePage} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
