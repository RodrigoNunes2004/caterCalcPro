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
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
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
import NotFound from "./pages/NotFound";
import "./index.css";

const queryClient = new QueryClient();

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
                  path="/"
                  element={
                    <ProtectedRoute>
                      <HomePage />
                    </ProtectedRoute>
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
