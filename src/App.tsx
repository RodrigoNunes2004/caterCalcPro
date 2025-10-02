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
import HomePage from "./pages/HomePage";
import RecipesPage from "./pages/RecipesPage";
import MenuPage from "./pages/MenuPage";
import EventsPage from "./pages/EventsPage";
import InventoryPage from "./pages/InventoryPage";
import PrepListPage from "./pages/PrepListPage";
import UnitConverterPage from "./pages/UnitConverterPage";
import LandingPage from "./pages/LandingPage";
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
        onStorageChange={(theme) => {
          console.log("Theme storage changed:", theme);
        }}
      >
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <div className="min-h-screen bg-background" suppressHydrationWarning>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/recipes" element={<RecipesPage />} />
              <Route path="/menus" element={<MenuPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/prep-list" element={<PrepListPage />} />
              <Route path="/unit-converter" element={<UnitConverterPage />} />
              <Route path="/landing" element={<LandingPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
          <ReactQueryDevtools initialIsOpen={false} />
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
