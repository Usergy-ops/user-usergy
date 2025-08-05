
import React from 'react';
import { UnifiedLayout } from '@/layouts/UnifiedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle } from 'lucide-react';

const ProfileSetup: React.FC = () => {
  const setupSteps = [
    { title: 'Basic Information', completed: true, description: 'Name, email, and contact details' },
    { title: 'Skills & Expertise', completed: true, description: 'Your professional skills and experience' },
    { title: 'Work Preferences', completed: false, description: 'Availability and project preferences' },
    { title: 'Portfolio', completed: false, description: 'Showcase your previous work' },
    { title: 'Verification', completed: false, description: 'Verify your identity and credentials' },
  ];

  const completedSteps = setupSteps.filter(step => step.completed).length;
  const progressPercentage = (completedSteps / setupSteps.length) * 100;

  return (
    <UnifiedLayout>
      <div className="max-w-4xl mx-auto space-y-8 p-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Complete Your Profile</h1>
          <p className="text-muted-foreground">
            Help us match you with the perfect projects by completing your profile
          </p>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-[#00C6FB] to-[#005BEA] h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {completedSteps} of {setupSteps.length} steps completed
          </p>
        </div>

        <div className="grid gap-6">
          {setupSteps.map((step, index) => (
            <Card key={index} className={step.completed ? 'border-green-200 bg-green-50/30' : ''}>
              <CardHeader className="flex flex-row items-center space-y-0 pb-3">
                <div className="flex items-center space-x-4 flex-1">
                  {step.completed ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : (
                    <Circle className="h-6 w-6 text-muted-foreground" />
                  )}
                  <div>
                    <CardTitle className="text-lg">{step.title}</CardTitle>
                    <CardDescription>{step.description}</CardDescription>
                  </div>
                </div>
                <Button
                  variant={step.completed ? "outline" : "default"}
                  className={step.completed ? '' : 'bg-gradient-to-r from-[#00C6FB] to-[#005BEA]'}
                >
                  {step.completed ? 'Edit' : 'Complete'}
                </Button>
              </CardHeader>
            </Card>
          ))}
        </div>

        <div className="text-center pt-8">
          <Button
            size="lg"
            className="bg-gradient-to-r from-[#00C6FB] to-[#005BEA] hover:opacity-90 px-8"
            disabled={completedSteps < setupSteps.length}
          >
            Complete Setup
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            Complete all steps to unlock full platform features
          </p>
        </div>
      </div>
    </UnifiedLayout>
  );
};

export default ProfileSetup;
