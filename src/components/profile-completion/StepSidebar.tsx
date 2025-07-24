
import React from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Smartphone, 
  Briefcase, 
  Brain, 
  Share, 
  Star, 
  Check,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: number;
  title: string;
  description: string;
  icon: React.ElementType;
  completed: boolean;
  fieldsComplete: number;
  totalFields: number;
}

interface StepSidebarProps {
  steps: Step[];
  activeStep: number;
  onStepClick: (stepId: number) => void;
}

export const StepSidebar: React.FC<StepSidebarProps> = ({
  steps,
  activeStep,
  onStepClick
}) => {
  const stepIcons = [User, Smartphone, Briefcase, Brain, Share, Star];

  return (
    <div className="w-80 bg-card/80 backdrop-blur-sm border-r border-border/50 p-6 overflow-y-auto">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Profile Sections</h2>
          <p className="text-sm text-muted-foreground">
            Complete all sections to unlock your full Explorer profile
          </p>
        </div>

        <div className="space-y-4">
          {steps.map((step, index) => {
            const Icon = stepIcons[index] || User;
            const isActive = activeStep === step.id;
            const isCompleted = step.completed;
            const isClickable = true; // Allow navigation to any step

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <button
                  onClick={() => onStepClick(step.id)}
                  disabled={!isClickable}
                  className={cn(
                    "w-full flex items-center space-x-4 p-4 rounded-xl transition-all duration-200 group",
                    isActive && "bg-primary/10 border border-primary/20",
                    !isActive && "hover:bg-muted/50",
                    !isClickable && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {/* Step Indicator */}
                  <div className="relative">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold transition-all duration-200",
                      isCompleted && "bg-success text-success-foreground",
                      isActive && !isCompleted && "bg-gradient-to-r from-primary-start to-primary-end text-white",
                      !isActive && !isCompleted && "bg-muted text-muted-foreground"
                    )}>
                      {isCompleted ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          <Check className="w-6 h-6" />
                        </motion.div>
                      ) : (
                        <Icon className="w-6 h-6" />
                      )}
                    </div>
                    
                    {/* Connecting Line */}
                    {index < steps.length - 1 && (
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0.5 h-8 bg-border/50" />
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 text-left">
                    <div className="flex items-center justify-between">
                      <h3 className={cn(
                        "font-medium transition-colors",
                        isActive && "text-primary",
                        !isActive && "text-foreground"
                      )}>
                        {step.title}
                      </h3>
                      <ChevronRight className={cn(
                        "w-4 h-4 transition-transform",
                        isActive && "transform rotate-90",
                        "group-hover:transform group-hover:translate-x-1"
                      )} />
                    </div>
                    
                    <p className="text-sm text-muted-foreground mt-1">
                      {step.description}
                    </p>
                    
                    {/* Progress Indicator */}
                    <div className="mt-3 flex items-center space-x-2">
                      <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                        <motion.div
                          className="h-full bg-primary rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${(step.fieldsComplete / step.totalFields) * 100}%` }}
                          transition={{ duration: 0.5, ease: "easeInOut" }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">
                        {step.fieldsComplete}/{step.totalFields}
                      </span>
                    </div>
                  </div>
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Completion Motivation */}
        <div className="bg-gradient-to-r from-primary-start/10 to-primary-end/10 rounded-xl p-4 border border-primary/20">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
              <Star className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h4 className="font-medium text-foreground">Almost there!</h4>
              <p className="text-sm text-muted-foreground">
                Complete your profile to unlock premium features
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
