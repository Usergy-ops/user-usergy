
import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Index from '@/pages/Index';
import Dashboard from '@/pages/Dashboard';
import ProfileCompletion from '@/pages/ProfileCompletion';
import Profile from '@/pages/Profile';
import Payments from '@/pages/Payments';
import ProjectWorkspace from '@/pages/ProjectWorkspace';
import NotFound from '@/pages/NotFound';
import SystemMonitoring from '@/pages/SystemMonitoring';
import Testing from '@/pages/Testing';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProfileProvider } from '@/contexts/ProfileContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Toaster } from '@/components/ui/toaster';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ProfileProvider>
            <Router>
              <div className="min-h-screen bg-background font-sans antialiased">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/profile-completion" element={<ProfileCompletion />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/payments" element={<Payments />} />
                  <Route path="/project/:projectId" element={<ProjectWorkspace />} />
                  <Route path="/system-monitoring" element={<SystemMonitoring />} />
                  <Route path="/testing" element={<Testing />} />
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
