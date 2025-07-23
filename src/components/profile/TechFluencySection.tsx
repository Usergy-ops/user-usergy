import React from 'react';
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
  programming_languages: Record<string, string>;
  coding_experience_years: number;
}

export const TechFluencySection: React.FC = () => {
  const { profileData, techFluencyData, updateProfileData } = useProfile();
  const { toast } = useToast();

  const { register, handleSubmit, setValue, watch } = useForm<TechFluencyFormData>({
    defaultValues: {
      technical_experience_level: profileData.technical_experience_level || '',
      ai_familiarity_level: profileData.ai_familiarity_level || '',
      ai_interests: techFluencyData.ai_interests || [],
      ai_models_used: techFluencyData.ai_models_used || [],
      programming_languages: techFluencyData.programming_languages || {},
      coding_experience_years: techFluencyData.coding_experience_years || 0,
    }
  });

  const onSubmit = async (data: TechFluencyFormData) => {
    try {
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
    } catch (error) {
      toast({
        title: "Error saving tech fluency",
        description: "Please try again.",
        variant: "destructive"
      });
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

  const handleCheckboxChange = (field: 'ai_interests' | 'ai_models_used', value: string, checked: boolean) => {
    const current = watch(field) || [];
    if (checked) {
      setValue(field, [...current, value]);
    } else {
      setValue(field, current.filter(item => item !== value));
    }
  };

  const handleLanguageProficiency = (language: string, proficiency: string) => {
    const current = watch('programming_languages') || {};
    setValue('programming_languages', { ...current, [language]: proficiency });
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
            <span>Technical Experience</span>
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
            <span>AI Familiarity</span>
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
          <Label className="text-lg font-medium">AI Use Cases You're Interested In</Label>
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
          <Label className="text-lg font-medium">AI Tools You've Used</Label>
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
          <div className="space-y-4">
            {programmingLanguages.map((language) => (
              <div key={language} className="flex items-center justify-between p-3 border rounded-lg">
                <span className="font-medium">{language}</span>
                <Select
                  value={watch('programming_languages')?.[language] || ''}
                  onValueChange={(value) => handleLanguageProficiency(language, value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                    <SelectItem value="expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
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
            className="bg-gradient-to-r from-primary-start to-primary-end hover:opacity-90"
          >
            Save & Continue
          </Button>
        </div>
      </form>
    </div>
  );
};