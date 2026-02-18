import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { App as CapApp } from '@capacitor/app';
import { IptvProvider, useIptv } from "@/contexts/IptvContext";
import LoginPage from "@/pages/LoginPage";
import HomePage from "@/pages/HomePage";
import LiveTvSplitPage from "@/pages/LiveTvSplitPage";
import MoviesSplitPage from "@/pages/MoviesSplitPage";
import MovieDetailsPage from "@/pages/MovieDetailsPage";
import SeriesSplitPage from "@/pages/SeriesSplitPage";
import FavoritesPage from "@/pages/FavoritesPage";
import SearchPage from "@/pages/SearchPage";
import PlayerPage from "@/pages/PlayerPage";
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
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const listener = CapApp.addListener('backButton', () => {
      if (location.pathname === '/') {
        CapApp.exitApp();
      } else {
        navigate(-1);
      }
    });
    return () => { listener.then(h => h.remove()); };
  }, [location.pathname, navigate]);

  if (isLoading) {
    return (
      <div className="w-full h-full bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/live" element={<LiveTvSplitPage />} />
      <Route path="/movies" element={<MoviesSplitPage />} />
      <Route path="/movie/:id" element={<MovieDetailsPage />} />
      <Route path="/series" element={<SeriesSplitPage />} />
      <Route path="/favorites" element={<FavoritesPage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/player" element={<PlayerPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
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
