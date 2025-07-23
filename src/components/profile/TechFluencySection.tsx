import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useProfile } from '@/contexts/ProfileContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Brain, Code, Zap } from 'lucide-react';
import { validateRequiredFields } from '@/utils/dataValidation';

interface TechFluencyFormData {
  technical_experience_level: string;
  ai_familiarity_level: string;
  ai_interests: string[];
  ai_models_used: string[];
  programming_languages: string[];
  coding_experience_years: number;
}

export const TechFluencySection: React.FC = () => {
  const { profileData, techFluencyData, updateProfileData, setCurrentStep, currentStep } = useProfile();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, setValue, watch } = useForm<TechFluencyFormData>({
    defaultValues: {
      technical_experience_level: profileData.technical_experience_level || '',
      ai_familiarity_level: profileData.ai_familiarity_level || '',
      ai_interests: techFluencyData.ai_interests || [],
      ai_models_used: techFluencyData.ai_models_used || [],
      programming_languages: techFluencyData.programming_languages || [],
      coding_experience_years: techFluencyData.coding_experience_years || 0,
    }
  });

  const isSectionComplete = () => {
    const formData = watch();
    return !!(
      formData.technical_experience_level &&
      formData.ai_familiarity_level &&
      formData.ai_interests?.length &&
      formData.ai_models_used?.length
    );
  };

  const onSubmit = async (data: TechFluencyFormData) => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      console.log('Submitting tech fluency data:', data);
      
      // Validate required fields
      const missing = validateRequiredFields(data, ['technical_experience_level', 'ai_familiarity_level']);
      if (missing.length > 0) {
        toast({
          title: "Required fields missing",
          description: `Please fill in: ${missing.join(', ')}`,
          variant: "destructive"
        });
        return;
      }
      
      // Check required arrays
      if (!data.ai_interests || data.ai_interests.length === 0) {
        toast({
          title: "Required selection missing",
          description: "Please select at least one AI interest",
          variant: "destructive"
        });
        return;
      }
      
      if (!data.ai_models_used || data.ai_models_used.length === 0) {
        toast({
          title: "Required selection missing",
          description: "Please select at least one AI tool you've used",
          variant: "destructive"
        });
        return;
      }
      
      // Update profile with basic tech levels
      await updateProfileData('profile', {
        technical_experience_level: data.technical_experience_level,
        ai_familiarity_level: data.ai_familiarity_level,
        section_4_completed: true
      });

      // Update tech fluency details
      await updateProfileData('tech_fluency', {
        ai_interests: data.ai_interests,
        ai_models_used: data.ai_models_used,
        programming_languages: data.programming_languages,
        coding_experience_years: data.coding_experience_years,
      });
      
      toast({
        title: "Tech fluency saved!",
        description: "Your technical expertise has been updated successfully.",
      });

      // Move to next step
      setCurrentStep(currentStep + 1);
    } catch (error) {
      console.error('Error saving tech fluency data:', error);
      toast({
        title: "Error saving tech fluency",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const techExperienceLevels = [
    { value: 'beginner', label: 'Beginner - Basic computer skills' },
    { value: 'intermediate', label: 'Intermediate - Comfortable with most software' },
    { value: 'advanced', label: 'Advanced - Power user, some technical skills' },
    { value: 'expert', label: 'Expert - Strong technical background' }
  ];

  const aiFamiliarityLevels = [
    { value: 'none', label: 'No experience with AI tools' },
    { value: 'basic', label: 'Basic - Used ChatGPT or similar occasionally' },
    { value: 'intermediate', label: 'Intermediate - Regular AI tool user' },
    { value: 'advanced', label: 'Advanced - Integrate AI into workflows' },
    { value: 'expert', label: 'Expert - Develop or customize AI solutions' }
  ];

  const aiInterests = [
    'Content Creation', 'Code Generation', 'Data Analysis', 'Design & Art',
    'Research & Writing', 'Automation', 'Customer Service', 'Marketing',
    'Education & Training', 'Healthcare', 'Finance', 'Gaming'
  ];

  const aiModels = [
    'ChatGPT', 'Claude', 'GPT-4', 'Gemini', 'Midjourney', 'DALL-E',
    'Stable Diffusion', 'GitHub Copilot', 'Cursor', 'Perplexity',
    'Notion AI', 'Jasper', 'Copy.ai', 'Other'
  ];

  const programmingLanguages = [
    'JavaScript', 'Python', 'Java', 'TypeScript', 'C#', 'C++',
    'Go', 'Rust', 'PHP', 'Ruby', 'Swift', 'Kotlin', 'SQL', 'HTML/CSS'
  ];

  const handleCheckboxChange = (field: 'ai_interests' | 'ai_models_used' | 'programming_languages', value: string, checked: boolean) => {
    const current = watch(field) || [];
    if (checked) {
      setValue(field, [...current, value]);
    } else {
      setValue(field, current.filter(item => item !== value));
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-foreground mb-2 flex items-center justify-center space-x-2">
          <Brain className="w-6 h-6 text-primary" />
          <span>Your AI & Tech Superpowers</span>
        </h3>
        <p className="text-muted-foreground">
          Share your technical expertise to help us find the perfect projects for you
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        {/* Technical Experience Level */}
        <div className="space-y-4 p-6 border rounded-lg bg-muted/20">
          <h4 className="text-lg font-medium flex items-center space-x-2">
            <Code className="w-5 h-5 text-primary" />
            <span>Technical Experience <span className="text-red-500">*</span></span>
          </h4>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
              <input
                type="radio"
                id="tech-beginner"
                value="beginner"
                {...register('technical_experience_level')}
                className="w-4 h-4 text-primary"
              />
              <Label htmlFor="tech-beginner" className="cursor-pointer">
                Beginner - Basic computer skills
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
              <input
                type="radio"
                id="tech-intermediate"
                value="intermediate"
                {...register('technical_experience_level')}
                className="w-4 h-4 text-primary"
              />
              <Label htmlFor="tech-intermediate" className="cursor-pointer">
                Intermediate - Comfortable with most software
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
              <input
                type="radio"
                id="tech-advanced"
                value="advanced"
                {...register('technical_experience_level')}
                className="w-4 h-4 text-primary"
              />
              <Label htmlFor="tech-advanced" className="cursor-pointer">
                Advanced - Power user, some technical skills
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
              <input
                type="radio"
                id="tech-expert"
                value="expert"
                {...register('technical_experience_level')}
                className="w-4 h-4 text-primary"
              />
              <Label htmlFor="tech-expert" className="cursor-pointer">
                Expert - Strong technical background
              </Label>
            </div>
          </div>
        </div>

        {/* AI Familiarity */}
        <div className="space-y-4 p-6 border rounded-lg bg-muted/20">
          <h4 className="text-lg font-medium flex items-center space-x-2">
            <Zap className="w-5 h-5 text-primary" />
            <span>AI Familiarity <span className="text-red-500">*</span></span>
          </h4>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
              <input
                type="radio"
                id="ai-none"
                value="none"
                {...register('ai_familiarity_level')}
                className="w-4 h-4 text-primary"
              />
              <Label htmlFor="ai-none" className="cursor-pointer">
                No experience with AI tools
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
              <input
                type="radio"
                id="ai-basic"
                value="basic"
                {...register('ai_familiarity_level')}
                className="w-4 h-4 text-primary"
              />
              <Label htmlFor="ai-basic" className="cursor-pointer">
                Basic - Used ChatGPT or similar occasionally
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
              <input
                type="radio"
                id="ai-intermediate"
                value="intermediate"
                {...register('ai_familiarity_level')}
                className="w-4 h-4 text-primary"
              />
              <Label htmlFor="ai-intermediate" className="cursor-pointer">
                Intermediate - Regular AI tool user
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
              <input
                type="radio"
                id="ai-advanced"
                value="advanced"
                {...register('ai_familiarity_level')}
                className="w-4 h-4 text-primary"
              />
              <Label htmlFor="ai-advanced" className="cursor-pointer">
                Advanced - Integrate AI into workflows
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
              <input
                type="radio"
                id="ai-expert"
                value="expert"
                {...register('ai_familiarity_level')}
                className="w-4 h-4 text-primary"
              />
              <Label htmlFor="ai-expert" className="cursor-pointer">
                Expert - Develop or customize AI solutions
              </Label>
            </div>
          </div>
        </div>

        {/* AI Interests */}
        <div className="space-y-4">
          <Label className="text-lg font-medium">
            AI Use Cases You're Interested In <span className="text-red-500">*</span>
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              'Content Creation', 'Code Generation', 'Data Analysis', 'Design & Art',
              'Research & Writing', 'Automation', 'Customer Service', 'Marketing',
              'Education & Training', 'Healthcare', 'Finance', 'Gaming'
            ].map((interest) => (
              <div key={interest} className="flex items-center space-x-2 p-2 border rounded hover:bg-muted/50 transition-colors">
                <Checkbox
                  id={`interest-${interest}`}
                  checked={watch('ai_interests')?.includes(interest)}
                  onCheckedChange={(checked) => 
                    handleCheckboxChange('ai_interests', interest, checked as boolean)
                  }
                />
                <Label htmlFor={`interest-${interest}`} className="cursor-pointer text-sm">
                  {interest}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* AI Models Used */}
        <div className="space-y-4">
          <Label className="text-lg font-medium">
            AI Tools You've Used <span className="text-red-500">*</span>
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              'ChatGPT', 'Claude', 'GPT-4', 'Gemini', 'Midjourney', 'DALL-E',
              'Stable Diffusion', 'GitHub Copilot', 'Cursor', 'Perplexity',
              'Notion AI', 'Jasper', 'Copy.ai', 'Other'
            ].map((model) => (
              <div key={model} className="flex items-center space-x-2 p-2 border rounded hover:bg-muted/50 transition-colors">
                <Checkbox
                  id={`model-${model}`}
                  checked={watch('ai_models_used')?.includes(model)}
                  onCheckedChange={(checked) => 
                    handleCheckboxChange('ai_models_used', model, checked as boolean)
                  }
                />
                <Label htmlFor={`model-${model}`} className="cursor-pointer text-sm">
                  {model}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Programming Languages */}
        <div className="space-y-4">
          <Label className="text-lg font-medium">Programming Languages (Optional)</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              'JavaScript', 'Python', 'Java', 'TypeScript', 'C#', 'C++',
              'Go', 'Rust', 'PHP', 'Ruby', 'Swift', 'Kotlin', 'SQL', 'HTML/CSS'
            ].map((language) => (
              <div key={language} className="flex items-center space-x-2 p-2 border rounded hover:bg-muted/50 transition-colors">
                <Checkbox
                  id={`lang-${language}`}
                  checked={watch('programming_languages')?.includes(language)}
                  onCheckedChange={(checked) => 
                    handleCheckboxChange('programming_languages', language, checked as boolean)
                  }
                />
                <Label htmlFor={`lang-${language}`} className="cursor-pointer text-sm">
                  {language}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Coding Experience Years */}
        <div className="space-y-4">
          <Label className="text-lg font-medium">
            Years of Coding Experience: {watch('coding_experience_years') || 0}
          </Label>
          <Slider
            value={[watch('coding_experience_years') || 0]}
            onValueChange={(value) => setValue('coding_experience_years', value[0])}
            max={20}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>0 years</span>
            <span>20+ years</span>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button 
            type="submit" 
            disabled={!isSectionComplete() || isSubmitting}
            className="bg-gradient-to-r from-primary-start to-primary-end hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : 'Save & Continue'}
          </Button>
        </div>
      </form>
    </div>
  );
};
