import React from 'react';
import { useForm } from 'react-hook-form';
import { useProfile } from '@/contexts/ProfileContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Star, Heart, Globe } from 'lucide-react';

interface SkillsInterestsFormData {
  bio: string;
  interests: string[];
  product_categories: string[];
  languages_spoken: string[];
  timezone: string;
}

export const SkillsInterestsSection: React.FC = () => {
  const { profileData, skillsData, updateProfileData, setCurrentStep, currentStep } = useProfile();
  const { toast } = useToast();

  const { register, handleSubmit, setValue, watch } = useForm<SkillsInterestsFormData>({
    defaultValues: {
      bio: profileData.bio || '',
      interests: skillsData.interests || [],
      product_categories: skillsData.product_categories || [],
      languages_spoken: profileData.languages_spoken || [],
      timezone: profileData.timezone || '',
    }
  });

  const onSubmit = async (data: SkillsInterestsFormData) => {
    try {
      await updateProfileData('profile', {
        bio: data.bio,
        languages_spoken: data.languages_spoken,
        timezone: data.timezone,
        section_6_completed: true
      });

      await updateProfileData('skills', {
        interests: data.interests,
        product_categories: data.product_categories,
      });
      
      toast({
        title: "Profile completed!",
        description: "Your Explorer profile is now complete.",
      });

      // FIXED: Keep current step at 6 instead of setting to 7
      // The celebration screen will be triggered by the completion percentage, not step number
      // This ensures we don't have "Step 7 of 6" bug
    } catch (error) {
      toast({
        title: "Error completing profile",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const interests = [
    'Product Design', 'User Research', 'Data Analysis', 'Marketing', 'AI/ML',
    'Mobile Apps', 'Web Development', 'Gaming', 'Healthcare', 'Finance',
    'Education', 'Sustainability', 'E-commerce', 'Social Media'
  ];

  const languages = ['English', 'Spanish', 'French', 'German', 'Mandarin', 'Japanese', 'Other'];

  const handleArrayChange = (field: keyof SkillsInterestsFormData, value: string, checked: boolean) => {
    const current = (watch(field) as string[]) || [];
    if (checked) {
      setValue(field, [...current, value] as any);
    } else {
      setValue(field, current.filter(item => item !== value) as any);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Your Unique Expertise
        </h3>
        <p className="text-muted-foreground">
          Final touches to complete your Explorer profile
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="bio" className="text-sm font-medium">Short Bio</Label>
          <Textarea
            id="bio"
            {...register('bio')}
            placeholder="Tell us about yourself, your interests, and what makes you unique..."
            className="min-h-[100px]"
          />
        </div>

        <div className="space-y-4">
          <Label className="text-lg font-medium">Interests</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {interests.map((interest) => (
              <div key={interest} className="flex items-center space-x-2 p-2 border rounded">
                <Checkbox
                  id={`interest-${interest}`}
                  checked={watch('interests')?.includes(interest)}
                  onCheckedChange={(checked) => 
                    handleArrayChange('interests', interest, checked as boolean)
                  }
                />
                <Label htmlFor={`interest-${interest}`} className="cursor-pointer text-sm">
                  {interest}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-lg font-medium">Languages Spoken</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {languages.map((language) => (
              <div key={language} className="flex items-center space-x-2 p-2 border rounded">
                <Checkbox
                  id={`lang-${language}`}
                  checked={watch('languages_spoken')?.includes(language)}
                  onCheckedChange={(checked) => 
                    handleArrayChange('languages_spoken', language, checked as boolean)
                  }
                />
                <Label htmlFor={`lang-${language}`} className="cursor-pointer text-sm">
                  {language}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button 
            type="submit" 
            className="bg-gradient-to-r from-primary-start to-primary-end hover:opacity-90"
          >
            Complete Profile
          </Button>
        </div>
      </form>
    </div>
  );
};
