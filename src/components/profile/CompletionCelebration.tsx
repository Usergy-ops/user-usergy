import React from 'react';
import { useProfile } from '@/contexts/ProfileContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Sparkles, Users, Zap } from 'lucide-react';

export const CompletionCelebration: React.FC = () => {
  const { profileData } = useProfile();
  const navigate = useNavigate();

  const handleContinue = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center animate-fade-in">
        
        {/* Success Animation */}
        <div className="mb-8 relative">
          <div className="w-24 h-24 mx-auto mb-6 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-start to-primary-end rounded-full animate-pulse"></div>
            <div className="absolute inset-2 bg-background rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-success animate-scale-in" />
            </div>
          </div>
          
          {/* Floating particles */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4">
            <Sparkles className="w-6 h-6 text-primary-start animate-bounce" />
          </div>
          <div className="absolute top-8 right-1/4 transform translate-x-4">
            <Sparkles className="w-4 h-4 text-primary-end animate-bounce" style={{ animationDelay: '0.5s' }} />
          </div>
          <div className="absolute top-8 left-1/4 transform -translate-x-4">
            <Sparkles className="w-5 h-5 text-success animate-bounce" style={{ animationDelay: '1s' }} />
          </div>
        </div>

        {/* Celebration Header */}
        <div className="mb-8">
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Welcome to the{' '}
            <span className="bg-gradient-to-r from-primary-start to-primary-end bg-clip-text text-transparent">
              Explorer Community!
            </span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            🎉 Congratulations! Your profile is now <strong>100% complete</strong> and ready for project matching.
          </p>
        </div>

        {/* Achievement Stats */}
        <div className="bg-card/80 backdrop-blur-sm usergy-shadow-strong rounded-3xl p-8 mb-8 border border-border/50">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Your Explorer Profile</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gradient-to-br from-primary-start/10 to-primary-end/10 rounded-xl">
              <Users className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">Explorer</div>
              <div className="text-sm text-muted-foreground">Status Achieved</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-success/10 to-success/20 rounded-xl">
              <CheckCircle className="w-8 h-8 text-success mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">100%</div>
              <div className="text-sm text-muted-foreground">Profile Complete</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-primary-end/10 to-primary-start/10 rounded-xl">
              <Zap className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">Ready</div>
              <div className="text-sm text-muted-foreground">For Matching</div>
            </div>
          </div>
        </div>

        {/* What's Next */}
        <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-6 mb-8">
          <h3 className="text-xl font-semibold text-foreground mb-4">What's Next?</h3>
          <div className="text-left space-y-3 text-muted-foreground">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
              <span>Access your personalized Explorer dashboard</span>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
              <span>Browse and apply to exclusive projects</span>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
              <span>Get matched with projects that fit your expertise</span>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
              <span>Connect with innovative companies and startups</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="space-y-4">
          <Button 
            onClick={handleContinue}
            size="lg"
            className="bg-gradient-to-r from-primary-start to-primary-end hover:opacity-90 text-lg px-8 py-4"
          >
            Enter the Explorer Dashboard 🚀
          </Button>
          
          <p className="text-sm text-muted-foreground">
            Welcome to where innovation meets insight, {profileData.full_name}!
          </p>
        </div>
      </div>
    </div>
  );
};