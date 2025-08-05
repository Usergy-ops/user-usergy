
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProfileProvider } from "./contexts/ProfileContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import ProfileCompletion from "./pages/ProfileCompletion";
import ProjectWorkspace from "./pages/ProjectWorkspace";
import Payments from "./pages/Payments";
import { SystemMonitoring } from "./pages/SystemMonitoring";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/ProtectedRoute";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <ProfileProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile-completion"
                  element={
                    <ProtectedRoute>
                      <ProfileCompletion />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/project/:id"
                  element={
                    <ProtectedRoute>
                      <ProjectWorkspace />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/payments"
                  element={
                    <ProtectedRoute>
                      <Payments />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/monitoring"
                  element={
                    <ProtectedRoute>
                      <SystemMonitoring />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </ProfileProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
