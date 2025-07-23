
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useProfile } from '@/contexts/ProfileContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Link, Github, Linkedin, Twitter } from 'lucide-react';

interface SocialPresenceFormData {
  linkedin_url: string;
  twitter_url: string;
  github_url: string;
  portfolio_url: string;
}

export const SocialPresenceSection: React.FC = () => {
  const { profileData, updateProfileData, setCurrentStep, currentStep } = useProfile();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, watch } = useForm<SocialPresenceFormData>({
    defaultValues: {
      linkedin_url: profileData.linkedin_url || '',
      twitter_url: profileData.twitter_url || '',
      github_url: profileData.github_url || '',
      portfolio_url: profileData.portfolio_url || '',
    }
  });

  const onSubmit = async (data: SocialPresenceFormData) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      console.log('Submitting social presence data:', data);
      
      await updateProfileData('profile', {
        ...data,
        section_5_completed: true
      });
      
      toast({
        title: "Social presence saved!",
        description: "Your social profiles have been updated successfully.",
      });

      // Move to next step
      setCurrentStep(currentStep + 1);
    } catch (error) {
      console.error('Error saving social presence data:', error);
      toast({
        title: "Error saving profiles",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <div className="flex items-center space-x-3 p-4 border rounded-lg">
            <Linkedin className="w-6 h-6 text-blue-600" />
            <div className="flex-1">
              <Label htmlFor="linkedin_url" className="text-sm font-medium">LinkedIn Profile</Label>
              <Input
                id="linkedin_url"
                {...register('linkedin_url')}
                placeholder="https://linkedin.com/in/your-profile"
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 border rounded-lg">
            <Github className="w-6 h-6" />
            <div className="flex-1">
              <Label htmlFor="github_url" className="text-sm font-medium">GitHub Profile</Label>
              <Input
                id="github_url"
                {...register('github_url')}
                placeholder="https://github.com/your-username"
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 border rounded-lg">
            <Twitter className="w-6 h-6 text-blue-400" />
            <div className="flex-1">
              <Label htmlFor="twitter_url" className="text-sm font-medium">Twitter/X Profile</Label>
              <Input
                id="twitter_url"
                {...register('twitter_url')}
                placeholder="https://twitter.com/your-username"
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 border rounded-lg">
            <Link className="w-6 h-6 text-primary" />
            <div className="flex-1">
              <Label htmlFor="portfolio_url" className="text-sm font-medium">Portfolio/Website</Label>
              <Input
                id="portfolio_url"
                {...register('portfolio_url')}
                placeholder="https://your-website.com"
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-gradient-to-r from-primary-start to-primary-end hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : 'Save & Continue'}
          </Button>
        </div>
      </form>
    </div>
  );
};
