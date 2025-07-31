
import React, { useState } from 'react';
import { useProfile } from '@/contexts/ProfileContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Link, Github, Linkedin, Twitter, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

// Define form data type
interface SocialFormData {
  linkedin_url: string;
  github_url: string;
  twitter_url: string;
  portfolio_url: string;
}

// Simple URL validation
const isValidUrl = (url: string): boolean => {
  if (!url) return true; // Empty is valid
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const EnhancedSocialPresenceSection: React.FC = () => {
  const { profileData, setCurrentStep, currentStep, updateProfileData } = useProfile();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize form data directly from profile context (like the original component)
  const [formData, setFormData] = useState<SocialFormData>({
    linkedin_url: profileData.linkedin_url || '',
    github_url: profileData.github_url || '',
    twitter_url: profileData.twitter_url || '',
    portfolio_url: profileData.portfolio_url || ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    if (value && !isValidUrl(value)) {
      setErrors(prev => ({
        ...prev,
        [field]: 'Please enter a valid URL'
      }));
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    
    try {
      // Validate all URLs
      const validationErrors: Record<string, string> = {};
      Object.entries(formData).forEach(([key, value]) => {
        if (value && !isValidUrl(value)) {
          validationErrors[key] = 'Please enter a valid URL';
        }
      });
      
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        setIsSubmitting(false);
        return;
      }
      
      // Update profile data with social links and mark section as completed
      await updateProfileData('profile', {
        linkedin_url: formData.linkedin_url || null,
        github_url: formData.github_url || null,
        twitter_url: formData.twitter_url || null,
        portfolio_url: formData.portfolio_url || null,
        section_5_completed: true
      });
      
      toast({
        title: "Social presence saved!",
        description: "Your social profiles have been updated successfully.",
      });

      setCurrentStep(currentStep + 1);
    } catch (error) {
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

        <div className="flex justify-end pt-4">
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
