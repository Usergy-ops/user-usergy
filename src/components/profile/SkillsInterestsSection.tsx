import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useProfile } from '@/contexts/ProfileContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

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
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, setValue, watch } = useForm<SkillsInterestsFormData>({
    defaultValues: {
      bio: profileData.bio || '',
      interests: skillsData.interests || [],
      product_categories: skillsData.product_categories || [],
      languages_spoken: profileData.languages_spoken || [],
      timezone: profileData.timezone || '',
    }
  });

  // Debounced auto-save without strict validation
  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      if (type === 'change' && !isSaving) {
        const timeoutId = setTimeout(async () => {
          try {
            setIsSaving(true);
            
            // Save profile data - only non-empty values
            const profileDataToSave: any = {};
            if (value.bio && value.bio.trim() !== '') {
              profileDataToSave.bio = value.bio.trim();
            }
            if (value.languages_spoken && value.languages_spoken.length > 0) {
              profileDataToSave.languages_spoken = value.languages_spoken;
            }
            if (value.timezone && value.timezone !== '') {
              profileDataToSave.timezone = value.timezone;
            }
            
            if (Object.keys(profileDataToSave).length > 0) {
              console.log('Auto-saving profile data:', profileDataToSave);
              await updateProfileData('profile', profileDataToSave);
            }

            // Save skills data - allow empty arrays during auto-save
            const skillsDataToSave: any = {};
            if (value.interests !== undefined) {
              skillsDataToSave.interests = value.interests || [];
            }
            if (value.product_categories !== undefined) {
              skillsDataToSave.product_categories = value.product_categories || [];
            }
            
            if (Object.keys(skillsDataToSave).length > 0) {
              console.log('Auto-saving skills data:', skillsDataToSave);
              await updateProfileData('skills', skillsDataToSave);
            }
          } catch (error) {
            console.error('Auto-save failed:', error);
            // Don't show error toast for auto-save failures to prevent spam
          } finally {
            setIsSaving(false);
          }
        }, 1500);

        return () => clearTimeout(timeoutId);
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, updateProfileData, isSaving]);

  const onSubmit = async (data: SkillsInterestsFormData) => {
    if (isSaving) return; // Prevent duplicate submissions
    
    try {
      setIsSaving(true);
      
      // Validate required fields only during final submission
      if (!data.interests || data.interests.length === 0) {
        toast({
          title: "Validation Error",
          description: "Please select at least one interest.",
          variant: "destructive"
        });
        return;
      }

      if (!data.languages_spoken || data.languages_spoken.length === 0) {
        toast({
          title: "Validation Error",
          description: "Please select at least one language.",
          variant: "destructive"
        });
        return;
      }

      // Clean and prepare data for submission
      const profileDataToSave: any = {
        languages_spoken: data.languages_spoken,
        section_6_completed: true
      };

      // Only include optional fields if they have valid values
      if (data.bio && data.bio.trim() !== '') {
        profileDataToSave.bio = data.bio.trim();
      }
      if (data.timezone && data.timezone !== '') {
        profileDataToSave.timezone = data.timezone;
      }

      const skillsDataToSave: any = {
        interests: data.interests,
      };

      if (data.product_categories && data.product_categories.length > 0) {
        skillsDataToSave.product_categories = data.product_categories;
      }

      console.log('Submitting profile data:', profileDataToSave);
      console.log('Submitting skills data:', skillsDataToSave);

      await updateProfileData('profile', profileDataToSave);
      await updateProfileData('skills', skillsDataToSave);
      
      toast({
        title: "Profile completed!",
        description: "Your Explorer profile is now complete.",
      });

      setCurrentStep(currentStep + 1);
    } catch (error) {
      console.error('Error completing profile:', error);
      toast({
        title: "Error completing profile",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
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

  const isFormValid = () => {
    const formData = watch();
    return !!(
      formData.interests && formData.interests.length > 0 &&
      formData.languages_spoken && formData.languages_spoken.length > 0
    );
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
          <Label className="text-lg font-medium">
            Interests <span className="text-red-500">*</span>
          </Label>
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
          <Label className="text-lg font-medium">
            Languages Spoken <span className="text-red-500">*</span>
          </Label>
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
            disabled={!isFormValid() || isSaving}
            className="bg-gradient-to-r from-primary-start to-primary-end hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Complete Profile'}
          </Button>
        </div>
      </form>
    </div>
  );
};
