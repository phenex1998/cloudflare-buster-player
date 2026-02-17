import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { IptvProvider, useIptv } from "@/contexts/IptvContext";
import LoginPage from "@/pages/LoginPage";
import LiveTvPage from "@/pages/LiveTvPage";
import MoviesPage from "@/pages/MoviesPage";
import SeriesPage from "@/pages/SeriesPage";
import SeriesDetailPage from "@/pages/SeriesDetailPage";
import EpgPage from "@/pages/EpgPage";
import FavoritesPage from "@/pages/FavoritesPage";
import SearchPage from "@/pages/SearchPage";
import PlayerPage from "@/pages/PlayerPage";
import BottomNav from "@/components/BottomNav";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";

const queryClient = new QueryClient();

// Force dark mode
function DarkMode() {
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);
  return null;
}

function AuthenticatedRoutes() {
  const { isAuthenticated, isLoading } = useIptv();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/live" replace />} />
        <Route path="/live" element={<LiveTvPage />} />
        <Route path="/movies" element={<MoviesPage />} />
        <Route path="/series" element={<SeriesPage />} />
        <Route path="/series/:id" element={<SeriesDetailPage />} />
        <Route path="/epg" element={<EpgPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/player" element={<PlayerPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <BottomNav />
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <DarkMode />
      <Toaster />
      <Sonner />
      <IptvProvider>
        <BrowserRouter>
          <AuthenticatedRoutes />
        </BrowserRouter>
      </IptvProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
