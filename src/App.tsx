
import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProfileProvider } from '@/contexts/ProfileContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Toaster } from '@/components/ui/toaster';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/ProtectedRoute';

// Page imports
import Index from '@/pages/Index';
import Welcome from '@/pages/Welcome';
import Dashboard from '@/pages/Dashboard';
import ClientDashboard from '@/pages/ClientDashboard';
import ProfileCompletion from '@/pages/ProfileCompletion';
import ProfileSetup from '@/pages/ProfileSetup';
import Payments from '@/pages/Payments';
import ProjectWorkspace from '@/pages/ProjectWorkspace';
import SystemMonitoring from '@/pages/SystemMonitoring';
import Testing from '@/pages/Testing';
import Diagnostics from '@/pages/Diagnostics';
import AuthCallback from '@/pages/AuthCallback';
import NotFound from '@/pages/NotFound';

// Account type routing helper
import { useAccountType } from '@/hooks/useAccountType';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

// Account-aware dashboard router
const DashboardRouter: React.FC = () => {
  const { accountType, isUser, isClient, loading } = useAccountType();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Route to appropriate dashboard based on account type
  if (isClient) {
    return <ClientDashboard />;
  } else if (isUser) {
    return <Dashboard />;
  } else {
    // Fallback for unknown account types - redirect to profile setup
    return <ProfileSetup />;
  }
};

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ProfileProvider>
            <Router>
              <div className="min-h-screen bg-background font-sans antialiased">
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  
                  {/* Protected routes */}
                  <Route path="/welcome" element={
                    <ProtectedRoute>
                      <Welcome />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <DashboardRouter />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/profile-completion" element={
                    <ProtectedRoute>
                      <ProfileCompletion />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/profile-setup" element={
                    <ProtectedRoute>
                      <ProfileSetup />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/payments" element={
                    <ProtectedRoute requireCompleteProfile>
                      <Payments />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/project/:projectId" element={
                    <ProtectedRoute requireCompleteProfile>
                      <ProjectWorkspace />
                    </ProtectedRoute>
                  } />
                  
                  {/* System routes */}
                  <Route path="/system-monitoring" element={
                    <ProtectedRoute>
                      <SystemMonitoring />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/diagnostics" element={
                    <ProtectedRoute>
                      <Diagnostics />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/testing" element={
                    <ProtectedRoute>
                      <Testing />
                    </ProtectedRoute>
                  } />
                  
                  {/* Catch-all route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <Toaster />
              </div>
            </Router>
          </ProfileProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
