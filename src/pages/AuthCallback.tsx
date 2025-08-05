
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UnifiedLayout } from '@/layouts/UnifiedLayout';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      console.error('Auth callback error:', error, errorDescription);
      navigate('/?error=' + encodeURIComponent(errorDescription || error));
      return;
    }

    if (user) {
      // Successfully authenticated, redirect to dashboard
      navigate('/dashboard');
    } else {
      // No user found, redirect to login
      navigate('/');
    }
  }, [user, loading, navigate, searchParams]);

  if (loading) {
    return (
      <UnifiedLayout>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <h2 className="text-xl font-semibold">Processing authentication...</h2>
            <p className="text-muted-foreground">Please wait while we complete your sign in.</p>
          </div>
        </div>
      </UnifiedLayout>
    );
  }

  return (
    <UnifiedLayout>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold">Authentication Complete</h2>
          <p className="text-muted-foreground">Redirecting you now...</p>
        </div>
      </div>
    </UnifiedLayout>
  );
};

export default AuthCallback;
