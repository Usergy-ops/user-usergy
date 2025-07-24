
import React, { useState, useEffect } from 'react';
import { useProfile } from '@/contexts/ProfileContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Link, Github, Linkedin, Twitter, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { 
  validateSocialUrls, 
  normalizeSocialUrls, 
  saveSocialPresence, 
  loadSocialPresence,
  type SocialPresenceData
} from '@/utils/socialPresenceUtils';
import { monitoring, trackUserAction } from '@/utils/monitoring';

// Define a more specific type for the form data to avoid the type error
interface SocialFormData {
  linkedin_url: string;
  github_url: string;
  twitter_url: string;
  portfolio_url: string;
}

export const EnhancedSocialPresenceSection: React.FC = () => {
  const { profileData, setCurrentStep, currentStep } = useProfile();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<SocialFormData>({
    linkedin_url: '',
    github_url: '',
    twitter_url: '',
    portfolio_url: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load existing social presence data
  useEffect(() => {
    const loadExistingData = async () => {
      if (!profileData.user_id) return;
      
      try {
        const { data, error } = await loadSocialPresence(profileData.user_id);
        
        if (error) {
          console.error('Error loading social presence:', error);
          return;
        }
        
        if (data) {
          setFormData({
            linkedin_url: data.primary_profiles.linkedin || '',
            github_url: data.primary_profiles.github || '',
            twitter_url: data.primary_profiles.twitter || '',
            portfolio_url: data.primary_profiles.portfolio || ''
          });
        }
      } catch (error) {
        console.error('Error loading social presence:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadExistingData();
  }, [profileData.user_id]);

  const handleInputChange = (field: keyof SocialFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleInputBlur = (field: keyof SocialFormData, value: string) => {
    if (value) {
      const validation = validateSocialUrls({ [field]: value });
      if (!validation.isValid && validation.errors[field]) {
        setErrors(prev => ({
          ...prev,
          [field]: validation.errors[field]
        }));
      }
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profileData.user_id) {
      toast({
        title: "Error",
        description: "User not found. Please try again.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      monitoring.startTiming('social_presence_save');
      
      // Convert form data to SocialPresenceData format
      const socialPresenceData: SocialPresenceData = {
        linkedin_url: formData.linkedin_url,
        github_url: formData.github_url,
        twitter_url: formData.twitter_url,
        portfolio_url: formData.portfolio_url
      };
      
      // Validate all URLs
      const validation = validateSocialUrls(socialPresenceData);
      if (!validation.isValid) {
        setErrors(validation.errors);
        setIsSubmitting(false);
        return;
      }
      
      // Save social presence data
      const result = await saveSocialPresence(profileData.user_id, socialPresenceData);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save social presence');
      }
      
      monitoring.endTiming('social_presence_save');
      
      trackUserAction('social_presence_completed', {
        filled_profiles: Object.values(formData).filter(Boolean).length,
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
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const socialPlatforms = [
    {
      name: 'linkedin_url' as keyof SocialFormData,
      label: 'LinkedIn Profile',
      icon: Linkedin,
      iconColor: 'text-blue-600',
      placeholder: 'https://linkedin.com/in/your-profile',
      description: 'Your professional LinkedIn profile'
    },
    {
      name: 'github_url' as keyof SocialFormData,
      label: 'GitHub Profile',
      icon: Github,
      iconColor: 'text-gray-800',
      placeholder: 'https://github.com/your-username',
      description: 'Your GitHub developer profile'
    },
    {
      name: 'twitter_url' as keyof SocialFormData,
      label: 'Twitter/X Profile',
      icon: Twitter,
      iconColor: 'text-blue-400',
      placeholder: 'https://twitter.com/your-username',
      description: 'Your Twitter/X social profile'
    },
    {
      name: 'portfolio_url' as keyof SocialFormData,
      label: 'Portfolio/Website',
      icon: Link,
      iconColor: 'text-primary',
      placeholder: 'https://your-website.com',
      description: 'Your personal website or portfolio'
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="ml-2">Loading social presence data...</span>
      </div>
    );
  }

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

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-4">
          {socialPlatforms.map((platform) => {
            const currentValue = formData[platform.name] || '';
            const hasError = errors[platform.name];
            const isValidURL = !currentValue || !hasError;
            
            return (
              <div key={platform.name} className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {platform.label}
                </label>
                <div className="flex items-center space-x-3 p-4 border rounded-lg transition-colors duration-200 hover:bg-muted/50">
                  <platform.icon className={`w-6 h-6 ${platform.iconColor}`} />
                  <div className="flex-1">
                    <div className="relative">
                      <Input
                        value={currentValue}
                        onChange={(e) => handleInputChange(platform.name, e.target.value)}
                        onBlur={(e) => handleInputBlur(platform.name, e.target.value)}
                        placeholder={platform.placeholder}
                        className={`pr-10 ${hasError ? 'border-destructive' : isValidURL && currentValue ? 'border-green-500' : ''}`}
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        {currentValue && (
                          isValidURL ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-destructive" />
                          )
                        )}
                      </div>
                    </div>
                    {hasError && (
                      <p className="text-sm text-destructive mt-1">{hasError}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {platform.description}
                    </p>
                  </div>
                </div>
              </div>
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
            disabled={isSubmitting}
          >
            Previous
          </Button>
          
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-gradient-to-r from-primary-start to-primary-end hover:opacity-90"
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
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
