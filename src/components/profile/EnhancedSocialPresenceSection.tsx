
import React, { useState } from 'react';
import { useProfile } from '@/contexts/ProfileContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Link, Github, Linkedin, Twitter, AlertCircle, CheckCircle } from 'lucide-react';
import { 
  useProfileFormValidation, 
  socialPresenceSchema, 
  ValidatedField 
} from './ProfileFormValidation';
import { monitoring, trackUserAction } from '@/utils/monitoring';

export const EnhancedSocialPresenceSection: React.FC = () => {
  const { profileData, updateProfileData, setCurrentStep, currentStep } = useProfile();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue
  } = useProfileFormValidation(socialPresenceSchema);

  // Watch all fields for real-time validation
  const watchedFields = watch();

  const validateURL = (url: string) => {
    if (!url) return true;
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  };

  const normalizeURL = (url: string) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `https://${url}`;
  };

  const handleURLChange = (field: string, value: string) => {
    const normalizedValue = normalizeURL(value);
    setValue(field as any, normalizedValue);
    
    // Track URL validation
    trackUserAction('social_url_validation', {
      field,
      is_valid: validateURL(normalizedValue),
      section: 'social_presence'
    });
  };

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    
    try {
      monitoring.startTiming('social_presence_save');
      
      // Normalize all URLs
      const normalizedData = Object.entries(data).reduce((acc, [key, value]) => {
        acc[key] = value ? normalizeURL(value as string) : '';
        return acc;
      }, {} as any);

      // Store social presence data in both profile and user_social_presence tables
      // This maintains backward compatibility while using the new consolidated approach
      await updateProfileData('profile', {
        linkedin_url: normalizedData.linkedin_url,
        github_url: normalizedData.github_url,
        twitter_url: normalizedData.twitter_url,
        portfolio_url: normalizedData.portfolio_url,
        section_5_completed: true
      });

      // Also update the dedicated social presence table
      await updateProfileData('social_presence', {
        additional_links: Object.values(normalizedData).filter(Boolean) as string[],
        other_social_networks: normalizedData
      });
      
      monitoring.endTiming('social_presence_save');
      
      trackUserAction('social_presence_completed', {
        filled_profiles: Object.values(normalizedData).filter(Boolean).length,
        section: 'social_presence'
      });
      
      toast({
        title: "Social presence saved!",
        description: "Your social profiles have been updated successfully.",
      });

      setCurrentStep(currentStep + 1);
    } catch (error) {
      monitoring.logError(error as Error, 'social_presence_save_error', {
        section: 'social_presence',
        user_id: profileData.user_id
      });
      
      toast({
        title: "Error saving profiles",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const socialPlatforms = [
    {
      name: 'linkedin_url',
      label: 'LinkedIn Profile',
      icon: Linkedin,
      iconColor: 'text-blue-600',
      placeholder: 'https://linkedin.com/in/your-profile',
      description: 'Your professional LinkedIn profile'
    },
    {
      name: 'github_url',
      label: 'GitHub Profile',
      icon: Github,
      iconColor: 'text-gray-800',
      placeholder: 'https://github.com/your-username',
      description: 'Your GitHub developer profile'
    },
    {
      name: 'twitter_url',
      label: 'Twitter/X Profile',
      icon: Twitter,
      iconColor: 'text-blue-400',
      placeholder: 'https://twitter.com/your-username',
      description: 'Your Twitter/X social profile'
    },
    {
      name: 'portfolio_url',
      label: 'Portfolio/Website',
      icon: Link,
      iconColor: 'text-primary',
      placeholder: 'https://your-website.com',
      description: 'Your personal website or portfolio'
    }
  ];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Connect Your Digital Presence
        </h3>
        <p className="text-muted-foreground">
          Share your professional profiles to enhance your Explorer credibility
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          {socialPlatforms.map((platform) => {
            const currentValue = watchedFields[platform.name as keyof typeof watchedFields] || '';
            const hasError = errors[platform.name as keyof typeof errors];
            const isValidURL = !currentValue || validateURL(currentValue);
            
            return (
              <ValidatedField
                key={platform.name}
                label={platform.label}
                error={hasError?.message}
                required={false}
              >
                <div className="flex items-center space-x-3 p-4 border rounded-lg transition-colors duration-200 hover:bg-muted/50">
                  <platform.icon className={`w-6 h-6 ${platform.iconColor}`} />
                  <div className="flex-1">
                    <div className="relative">
                      <Input
                        {...register(platform.name as any)}
                        placeholder={platform.placeholder}
                        className={`pr-10 ${hasError ? 'border-destructive' : isValidURL && currentValue ? 'border-success' : ''}`}
                        onChange={(e) => handleURLChange(platform.name, e.target.value)}
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        {currentValue && (
                          isValidURL ? (
                            <CheckCircle className="w-5 h-5 text-success" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-destructive" />
                          )
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {platform.description}
                    </p>
                  </div>
                </div>
              </ValidatedField>
            );
          })}
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-medium text-foreground mb-2">Why connect your profiles?</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Enhance your credibility as an Explorer</li>
            <li>• Help researchers understand your background</li>
            <li>• Connect with other community members</li>
            <li>• Optional - only share what you're comfortable with</li>
          </ul>
        </div>

        <div className="flex justify-between items-center pt-4">
          <Button 
            type="button" 
            variant="outline"
            onClick={() => setCurrentStep(currentStep - 1)}
          >
            Previous
          </Button>
          
          <Button 
            type="submit" 
            disabled={isSubmitting || !isValid}
            className="bg-gradient-to-r from-primary-start to-primary-end hover:opacity-90"
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </div>
            ) : (
              'Save & Continue'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
