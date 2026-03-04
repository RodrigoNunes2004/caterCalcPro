import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RequirePlan } from "./components/RequirePlan";
import HomePage from "./pages/HomePage";
import RecipesPage from "./pages/RecipesPage";
import MenuPage from "./pages/MenuPage";
import EventsPage from "./pages/EventsPage";
import InventoryPage from "./pages/InventoryPage";
import PrepListPage from "./pages/PrepListPage";
import UnitConverterPage from "./pages/UnitConverterPage";
import GuestScalerPage from "./pages/GuestScalerPage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import BillingPage from "./pages/BillingPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import AIStudioPage from "./pages/AIStudioPage";
import NotFound from "./pages/NotFound";
import "./index.css";

const queryClient = new QueryClient();

function LandingOrHome({
  landing,
  home,
}: {
  landing: React.ReactNode;
  home: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600" />
      </div>
    );
  }
  return <>{user ? home : landing}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange={false}
        storageKey="catercalc-theme"
      >
        <AuthProvider>
          <Router
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <div className="min-h-screen bg-background" suppressHydrationWarning>
              <Routes>
                <Route path="/landing" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route
                  path="/analytics"
                  element={
                    <ProtectedRoute>
                      <RequirePlan requiredPlan="pro">
                        <AnalyticsPage />
                      </RequirePlan>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ai-studio"
                  element={
                    <ProtectedRoute>
                      <RequirePlan requiredPlan="ai">
                        <AIStudioPage />
                      </RequirePlan>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/billing"
                  element={
                    <ProtectedRoute>
                      <BillingPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/"
                  element={
                    <LandingOrHome
                      landing={<LandingPage />}
                      home={<HomePage />}
                    />
                  }
                />
                <Route
                  path="/recipes"
                  element={
                    <ProtectedRoute>
                      <RecipesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/menus"
                  element={
                    <ProtectedRoute>
                      <MenuPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/events"
                  element={
                    <ProtectedRoute>
                      <EventsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/inventory"
                  element={
                    <ProtectedRoute>
                      <InventoryPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/prep-list"
                  element={
                    <ProtectedRoute>
                      <PrepListPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/unit-converter"
                  element={
                    <ProtectedRoute>
                      <UnitConverterPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/guest-scaler"
                  element={
                    <ProtectedRoute>
                      <GuestScalerPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            <ReactQueryDevtools initialIsOpen={false} />
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
