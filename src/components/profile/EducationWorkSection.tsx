
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useProfile } from '@/contexts/ProfileContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { GraduationCap, Briefcase, Building } from 'lucide-react';

interface EducationWorkFormData {
  education_level: string;
  field_of_study: string;
  job_title: string;
  employer: string;
  industry: string;
  work_role: string;
  company_size: string;
  household_income_range: string;
}

export const EducationWorkSection: React.FC = () => {
  const { profileData, updateProfileData, setCurrentStep, currentStep } = useProfile();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, setValue, watch } = useForm<EducationWorkFormData>({
    defaultValues: {
      education_level: profileData.education_level || '',
      field_of_study: profileData.field_of_study || '',
      job_title: profileData.job_title || '',
      employer: profileData.employer || '',
      industry: profileData.industry || '',
      work_role: profileData.work_role || '',
      company_size: profileData.company_size || '',
      household_income_range: profileData.household_income_range || '',
    }
  });

  const onSubmit = async (data: EducationWorkFormData) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      console.log('Submitting education & work data:', data);
      
      // Simple validation - only require education level
      if (!data.education_level) {
        toast({
          title: "Required field missing",
          description: "Please select your education level",
          variant: "destructive"
        });
        return;
      }
      
      await updateProfileData('profile', {
        ...data,
        section_3_completed: true
      });
      
      toast({
        title: "Education & work info saved!",
        description: "Your professional information has been updated successfully.",
      });

      // Move to next step
      setCurrentStep(currentStep + 1);
    } catch (error) {
      console.error('Error saving education & work data:', error);
      toast({
        title: "Error saving information",
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
        <h3 className="text-xl font-semibold text-foreground mb-2 flex items-center justify-center space-x-2">
          <Briefcase className="w-6 h-6 text-primary" />
          <span>Your Professional Journey</span>
        </h3>
        <p className="text-muted-foreground">
          Help us understand your background for better project matching
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Education Section */}
        <div className="space-y-4 p-6 border rounded-lg bg-muted/20">
          <h4 className="text-lg font-medium flex items-center space-x-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            <span>Education</span>
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Highest Level of Education <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={watch('education_level')} 
                onValueChange={(value) => setValue('education_level', value)}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select education level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High School">High School</SelectItem>
                  <SelectItem value="Some College">Some College</SelectItem>
                  <SelectItem value="Associate Degree">Associate Degree</SelectItem>
                  <SelectItem value="Bachelor's Degree">Bachelor's Degree</SelectItem>
                  <SelectItem value="Master's Degree">Master's Degree</SelectItem>
                  <SelectItem value="Doctoral Degree">Doctoral Degree</SelectItem>
                  <SelectItem value="Professional Degree">Professional Degree</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="field_of_study" className="text-sm font-medium">
                Field of Study
              </Label>
              <Input
                id="field_of_study"
                {...register('field_of_study')}
                className="bg-background"
                placeholder="e.g., Computer Science, Business"
              />
            </div>
          </div>
        </div>

        {/* Work Section */}
        <div className="space-y-4 p-6 border rounded-lg bg-muted/20">
          <h4 className="text-lg font-medium flex items-center space-x-2">
            <Building className="w-5 h-5 text-primary" />
            <span>Current Work</span>
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="job_title" className="text-sm font-medium">
                Job Title
              </Label>
              <Input
                id="job_title"
                {...register('job_title')}
                className="bg-background"
                placeholder="e.g., Product Manager"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employer" className="text-sm font-medium">
                Current Employer
              </Label>
              <Input
                id="employer"
                {...register('employer')}
                className="bg-background"
                placeholder="Company name"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Industry</Label>
              <Select 
                value={watch('industry')} 
                onValueChange={(value) => setValue('industry', value)}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="Education">Education</SelectItem>
                  <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="Retail">Retail</SelectItem>
                  <SelectItem value="Construction">Construction</SelectItem>
                  <SelectItem value="Transportation">Transportation</SelectItem>
                  <SelectItem value="Entertainment">Entertainment</SelectItem>
                  <SelectItem value="Government">Government</SelectItem>
                  <SelectItem value="Non-profit">Non-profit</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Work Role</Label>
              <Select 
                value={watch('work_role')} 
                onValueChange={(value) => setValue('work_role', value)}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select work role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Individual Contributor">Individual Contributor</SelectItem>
                  <SelectItem value="Team Lead">Team Lead</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Senior Manager">Senior Manager</SelectItem>
                  <SelectItem value="Director">Director</SelectItem>
                  <SelectItem value="VP/Executive">VP/Executive</SelectItem>
                  <SelectItem value="Founder/CEO">Founder/CEO</SelectItem>
                  <SelectItem value="Consultant">Consultant</SelectItem>
                  <SelectItem value="Freelancer">Freelancer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Company Size</Label>
              <Select 
                value={watch('company_size')} 
                onValueChange={(value) => setValue('company_size', value)}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select company size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-10 employees">1-10 employees</SelectItem>
                  <SelectItem value="11-50 employees">11-50 employees</SelectItem>
                  <SelectItem value="51-200 employees">51-200 employees</SelectItem>
                  <SelectItem value="201-1000 employees">201-1000 employees</SelectItem>
                  <SelectItem value="1000+ employees">1000+ employees</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Household Income Range</Label>
              <Select 
                value={watch('household_income_range')} 
                onValueChange={(value) => setValue('household_income_range', value)}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select income range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Under $25,000">Under $25,000</SelectItem>
                  <SelectItem value="$25,000 - $50,000">$25,000 - $50,000</SelectItem>
                  <SelectItem value="$50,000 - $75,000">$50,000 - $75,000</SelectItem>
                  <SelectItem value="$75,000 - $100,000">$75,000 - $100,000</SelectItem>
                  <SelectItem value="$100,000 - $150,000">$100,000 - $150,000</SelectItem>
                  <SelectItem value="$150,000 - $200,000">$150,000 - $200,000</SelectItem>
                  <SelectItem value="$200,000+">$200,000+</SelectItem>
                  <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button 
            type="submit" 
            disabled={!watch('education_level') || isSubmitting}
            className="bg-gradient-to-r from-primary-start to-primary-end hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : 'Save & Continue'}
          </Button>
        </div>
      </form>
    </div>
  );
};
