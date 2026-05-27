import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider, useAppAuth } from "./contexts/AuthContext";
import Home from "./pages/Home";
import AdminPage from "./pages/AdminPage";
import OrderPage from "./pages/OrderPage";
import SummaryPage from "./pages/SummaryPage";
import EmployeeDetailPage from "./pages/EmployeeDetailPage";
import EmployeeManagePage from "./pages/EmployeeManagePage";
import RestaurantManagePage from "./pages/RestaurantManagePage";
import { HistoryPage } from "./pages/HistoryPage";
import AccountManagePage from "./pages/AccountManagePage";
import AppLayout from "./components/AppLayout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import { Loader2 } from "lucide-react";

// 로그인 필요 라우트 - 비로그인 시 로그인 페이지로 리다이렉트
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAppAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "oklch(0.45 0.18 250)" }} />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/" />;
  }

  return <>{children}</>;
}

// 관리자 전용 라우트 - 일반 회원 접근 시 /order로 리다이렉트
function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isLoading } = useAppAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "oklch(0.45 0.18 250)" }} />
      </div>
    );
  }

  if (!user) return <Redirect to="/" />;
  if (!isAdmin) return <Redirect to="/order" />;

  return <>{children}</>;
}

function Router() {
  const { user, isLoading } = useAppAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "oklch(0.45 0.18 250)" }} />
      </div>
    );
  }

  return (
    <Switch>
      {/* 공개 라우트 - 로그인/회원가입 */}
      <Route path="/">
        {user ? <Redirect to="/order" /> : <LoginPage />}
      </Route>
      <Route path="/register" component={RegisterPage} />

      {/* 로그인 필요 라우트 */}
      <Route path="/home">
        <RequireAuth>
          <AppLayout><Home /></AppLayout>
        </RequireAuth>
      </Route>
      <Route path="/order">
        <RequireAuth>
          <AppLayout><OrderPage /></AppLayout>
        </RequireAuth>
      </Route>
      <Route path="/employee-detail">
        <RequireAuth>
          <AppLayout><EmployeeDetailPage /></AppLayout>
        </RequireAuth>
      </Route>

      {/* 관리자 전용 라우트 */}
      <Route path="/admin">
        <RequireAdmin>
          <AppLayout><AdminPage /></AppLayout>
        </RequireAdmin>
      </Route>
      <Route path="/summary">
        <RequireAdmin>
          <AppLayout><SummaryPage /></AppLayout>
        </RequireAdmin>
      </Route>
      <Route path="/history">
        <RequireAdmin>
          <AppLayout><HistoryPage /></AppLayout>
        </RequireAdmin>
      </Route>
      <Route path="/employee-manage">
        <RequireAdmin>
          <AppLayout><EmployeeManagePage /></AppLayout>
        </RequireAdmin>
      </Route>
      <Route path="/restaurant-manage">
        <RequireAdmin>
          <AppLayout><RestaurantManagePage /></AppLayout>
        </RequireAdmin>
      </Route>
      <Route path="/account-manage">
        <RequireAdmin>
          <AppLayout><AccountManagePage /></AppLayout>
        </RequireAdmin>
      </Route>

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-center" />
          <AuthProvider>
            <Router />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
