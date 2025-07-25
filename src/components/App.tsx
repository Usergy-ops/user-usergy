
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from './ErrorBoundary';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProfileProvider } from '@/contexts/ProfileContext';
import { Toaster } from '@/components/ui/toaster';
import { setupGlobalErrorHandler } from '@/utils/errorHandling';
import { monitoring } from '@/utils/monitoring';
import { errorCleanupService } from '@/utils/errorCleanup';
import { ProtectedRoute } from './ProtectedRoute';
import Index from '@/pages/Index';
import ProfileCompletion from '@/pages/ProfileCompletion';
import Dashboard from '@/pages/Dashboard';
import ProjectWorkspace from '@/pages/ProjectWorkspace';
import { SystemMonitoring } from '@/pages/SystemMonitoring';
import NotFound from '@/pages/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        monitoring.recordMetric('query_retry', 1, {
          failure_count: failureCount.toString(),
          error_type: error.constructor.name
        });
        return failureCount < 3;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

// Setup global error handling
setupGlobalErrorHandler();

// Initialize error cleanup service
errorCleanupService.startAutoCleanup();

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ProfileProvider>
            <Router>
              <div className="min-h-screen bg-background">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/profile-completion" element={
                    <ProtectedRoute>
                      <ProfileCompletion />
                    </ProtectedRoute>
                  } />
                  <Route path="/dashboard" element={
                    <ProtectedRoute requireCompleteProfile>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/project/:id" element={
                    <ProtectedRoute requireCompleteProfile>
                      <ProjectWorkspace />
                    </ProtectedRoute>
                  } />
                  <Route path="/monitoring" element={
                    <ProtectedRoute requireCompleteProfile>
                      <SystemMonitoring />
                    </ProtectedRoute>
                  } />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
            </Router>
            <Toaster />
          </ProfileProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
