
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UnifiedLayout } from '@/layouts/UnifiedLayout';

const Welcome: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/dashboard');
  };

  return (
    <UnifiedLayout>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-[#00C6FB] to-[#005BEA] bg-clip-text text-transparent">
              Welcome to Usergy
            </h1>
            <p className="text-xl text-muted-foreground max-w-lg mx-auto">
              Connect with meaningful projects and collaborate with talented individuals in the Usergy ecosystem.
            </p>
          </div>

          {user && (
            <div className="space-y-4">
              <p className="text-lg">
                Hello, <span className="font-semibold">{user.email}</span>!
              </p>
              <Button
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-[#00C6FB] to-[#005BEA] hover:opacity-90 transition-opacity text-white px-8 py-3 text-lg"
              >
                Get Started
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
            <div className="space-y-3">
              <div className="w-12 h-12 bg-gradient-to-r from-[#00C6FB] to-[#005BEA] rounded-lg flex items-center justify-center mx-auto">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <h3 className="font-semibold text-lg">Quality Projects</h3>
              <p className="text-muted-foreground">
                Access carefully curated projects that match your skills and interests.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-12 h-12 bg-gradient-to-r from-[#00C6FB] to-[#005BEA] rounded-lg flex items-center justify-center mx-auto">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="m22 21-3-3m0 0a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z"/>
                </svg>
              </div>
              <h3 className="font-semibold text-lg">Smart Matching</h3>
              <p className="text-muted-foreground">
                Our AI-powered system connects you with the perfect collaborators.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-12 h-12 bg-gradient-to-r from-[#00C6FB] to-[#005BEA] rounded-lg flex items-center justify-center mx-auto">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <h3 className="font-semibold text-lg">Secure Rewards</h3>
              <p className="text-muted-foreground">
                Get paid fairly and securely for your contributions and expertise.
              </p>
            </div>
          </div>
        </div>
      </div>
    </UnifiedLayout>
  );
};

export default Welcome;
