import React, { useEffect, useState } from 'react';
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
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, setValue, watch } = useForm<TechFluencyFormData>({
    defaultValues: {
      technical_experience_level: techFluencyData.technical_experience_level || '',
      ai_familiarity_level: techFluencyData.ai_familiarity_level || '',
      ai_interests: techFluencyData.ai_interests || [],
      ai_models_used: techFluencyData.ai_models_used || [],
      programming_languages: techFluencyData.programming_languages || [],
      coding_experience_years: techFluencyData.coding_experience_years || 0,
    }
  });

  // Auto-save with proper validation handling
  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      if (type === 'change' && !isSaving) {
        const timeoutId = setTimeout(async () => {
          try {
            setIsSaving(true);
            
            // Save all tech fluency data including experience levels
            const techFluencyDataToSave: any = {};
            if (value.technical_experience_level && value.technical_experience_level !== '') {
              techFluencyDataToSave.technical_experience_level = value.technical_experience_level;
            }
            if (value.ai_familiarity_level && value.ai_familiarity_level !== '') {
              techFluencyDataToSave.ai_familiarity_level = value.ai_familiarity_level;
            }
            if (value.ai_interests !== undefined) {
              techFluencyDataToSave.ai_interests = value.ai_interests || [];
            }
            if (value.ai_models_used !== undefined) {
              techFluencyDataToSave.ai_models_used = value.ai_models_used || [];
            }
            if (value.programming_languages !== undefined) {
              techFluencyDataToSave.programming_languages = value.programming_languages || [];
            }
            if (value.coding_experience_years !== undefined) {
              techFluencyDataToSave.coding_experience_years = value.coding_experience_years || 0;
            }
            
            if (Object.keys(techFluencyDataToSave).length > 0) {
              console.log('Auto-saving tech fluency data:', techFluencyDataToSave);
              await updateProfileData('tech_fluency', techFluencyDataToSave);
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
    if (isSaving) return; // Prevent duplicate submissions
    
    try {
      setIsSaving(true);
      
      // Validate required fields only during final submission
      if (!data.technical_experience_level || !data.ai_familiarity_level) {
        toast({
          title: "Missing required fields",
          description: "Please fill in all required fields.",
          variant: "destructive"
        });
        return;
      }

      if (!data.ai_interests || data.ai_interests.length === 0) {
        toast({
          title: "Missing AI interests",
          description: "Please select at least one AI interest.",
          variant: "destructive"
        });
        return;
      }

      if (!data.ai_models_used || data.ai_models_used.length === 0) {
        toast({
          title: "Missing AI models",
          description: "Please select at least one AI model you've used.",
          variant: "destructive"
        });
        return;
      }

      // Update tech fluency data with all fields including experience levels
      await updateProfileData('tech_fluency', {
        technical_experience_level: data.technical_experience_level,
        ai_familiarity_level: data.ai_familiarity_level,
        ai_interests: data.ai_interests || [],
        ai_models_used: data.ai_models_used || [],
        programming_languages: data.programming_languages || [],
        coding_experience_years: data.coding_experience_years || 0,
        _isSubmission: true
      });

      // Update section completion separately
      await updateProfileData('profile', {
        section_4_completed: true
      });
      
      toast({
        title: "Tech fluency saved!",
        description: "Your technical expertise has been updated successfully.",
      });

      // Move to next step
      setCurrentStep(currentStep + 1);
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: "Error saving tech fluency",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
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
            {techExperienceLevels.map((level) => (
              <div key={level.value} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <input
                  type="radio"
                  id={`tech-${level.value}`}
                  value={level.value}
                  {...register('technical_experience_level')}
                  className="w-4 h-4 text-primary"
                />
                <Label htmlFor={`tech-${level.value}`} className="cursor-pointer">
                  {level.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* AI Familiarity */}
        <div className="space-y-4 p-6 border rounded-lg bg-muted/20">
          <h4 className="text-lg font-medium flex items-center space-x-2">
            <Zap className="w-5 h-5 text-primary" />
            <span>AI Familiarity <span className="text-red-500">*</span></span>
          </h4>
          
          <div className="space-y-3">
            {aiFamiliarityLevels.map((level) => (
              <div key={level.value} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <input
                  type="radio"
                  id={`ai-${level.value}`}
                  value={level.value}
                  {...register('ai_familiarity_level')}
                  className="w-4 h-4 text-primary"
                />
                <Label htmlFor={`ai-${level.value}`} className="cursor-pointer">
                  {level.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* AI Interests */}
        <div className="space-y-4">
          <Label className="text-lg font-medium">
            AI Use Cases You're Interested In <span className="text-red-500">*</span>
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {aiInterests.map((interest) => (
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
            {aiModels.map((model) => (
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
            {programmingLanguages.map((language) => (
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
            disabled={!isSectionComplete() || isSaving}
            className="bg-gradient-to-r from-primary-start to-primary-end hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save & Continue'}
          </Button>
        </div>
      </form>
    </div>
  );
};
