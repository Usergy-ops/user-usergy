
import React, { useState, useEffect } from 'react';
import { useProfile } from '@/contexts/ProfileContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Bot, Code, Lightbulb, Loader2 } from 'lucide-react';
import { monitoring, trackUserAction } from '@/utils/monitoring';

interface TechFluencyFormData {
  technical_experience_level: string;
  ai_familiarity_level: string;
  ai_models_used: string[];
  ai_interests: string[];
  coding_experience_years: number | null;
  programming_languages: string[];
}

export const EnhancedTechFluencySection: React.FC = () => {
  const { user } = useAuth();
  const { 
    profileData, 
    techFluencyData, 
    setCurrentStep, 
    currentStep, 
    updateProfileData,
    loading: profileLoading 
  } = useProfile();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [formData, setFormData] = useState<TechFluencyFormData>({
    technical_experience_level: '',
    ai_familiarity_level: '',
    ai_models_used: [],
    ai_interests: [],
    coding_experience_years: null,
    programming_languages: []
  });

  // Initialize form data when profile data is available
  useEffect(() => {
    if (!user?.id || profileLoading) return;
    
    setIsLoadingData(true);
    
    // Load existing data from both profile and tech fluency tables
    const existingData: TechFluencyFormData = {
      technical_experience_level: profileData.technical_experience_level || '',
      ai_familiarity_level: profileData.ai_familiarity_level || '',
      ai_models_used: techFluencyData?.ai_models_used || [],
      ai_interests: techFluencyData?.ai_interests || [],
      coding_experience_years: techFluencyData?.coding_experience_years || null,
      programming_languages: techFluencyData?.programming_languages || []
    };
    
    setFormData(existingData);
    setIsLoadingData(false);
  }, [user?.id, profileLoading, profileData, techFluencyData]);

  const handleSelectChange = (field: keyof TechFluencyFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayChange = (field: 'ai_models_used' | 'ai_interests' | 'programming_languages', value: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked 
        ? [...prev[field], value]
        : prev[field].filter(item => item !== value)
    }));
  };

  const handleCodingExperienceChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      coding_experience_years: value ? parseInt(value) : null
    }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not authenticated. Please try again.",
        variant: "destructive"
      });
      return;
    }

    // Validate required fields
    if (!formData.technical_experience_level || !formData.ai_familiarity_level) {
      toast({
        title: "Required fields missing",
        description: "Please fill in your technical experience and AI familiarity levels.",
        variant: "destructive"
      });
      return;
    }

    if (formData.ai_models_used.length === 0 || formData.ai_interests.length === 0) {
      toast({
        title: "Required selections missing",
        description: "Please select at least one AI model and one area of interest.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      monitoring.startTiming('tech_fluency_save');
      
      // Update profile table fields
      await updateProfileData('profile', {
        technical_experience_level: formData.technical_experience_level,
        ai_familiarity_level: formData.ai_familiarity_level,
        section_4_completed: true
      });

      // Update tech fluency table fields
      await updateProfileData('tech_fluency', {
        ai_models_used: formData.ai_models_used,
        ai_interests: formData.ai_interests,
        coding_experience_years: formData.coding_experience_years,
        programming_languages: formData.programming_languages
      });
      
      monitoring.endTiming('tech_fluency_save');
      
      trackUserAction('tech_fluency_completed', {
        technical_level: formData.technical_experience_level,
        ai_familiarity: formData.ai_familiarity_level,
        models_count: formData.ai_models_used.length,
        interests_count: formData.ai_interests.length,
        section: 'tech_fluency'
      });
      
      toast({
        title: "Tech fluency saved!",
        description: "Your technical experience has been updated successfully.",
      });

      setCurrentStep(currentStep + 1);
    } catch (error) {
      monitoring.logError(error as Error, 'tech_fluency_save_error', {
        section: 'tech_fluency',
        user_id: user.id
      });
      
      toast({
        title: "Error saving tech fluency",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const technicalLevels = [
    { value: 'beginner', label: 'Beginner - Limited technical experience' },
    { value: 'intermediate', label: 'Intermediate - Some technical background' },
    { value: 'advanced', label: 'Advanced - Strong technical expertise' },
    { value: 'expert', label: 'Expert - Deep technical knowledge' }
  ];

  const aiFamiliarityLevels = [
    { value: 'none', label: 'No experience with AI tools' },
    { value: 'basic', label: 'Basic - Tried a few AI tools' },
    { value: 'intermediate', label: 'Intermediate - Regular AI user' },
    { value: 'advanced', label: 'Advanced - Power user of AI tools' }
  ];

  const aiModels = [
    'ChatGPT', 'Claude', 'Gemini', 'GitHub Copilot', 'Midjourney', 
    'DALL-E', 'Stable Diffusion', 'Perplexity', 'Notion AI', 'Jasper',
    'Copy.ai', 'Grammarly', 'Other'
  ];

  const aiInterestAreas = [
    'Content Creation', 'Code Generation', 'Data Analysis', 'Image Generation',
    'Research & Learning', 'Productivity Tools', 'Creative Writing', 
    'Business Automation', 'Marketing', 'Design', 'Education', 'Healthcare'
  ];

  const programmingLanguages = [
    'JavaScript', 'Python', 'Java', 'TypeScript', 'C#', 'PHP', 'C++',
    'Ruby', 'Go', 'Swift', 'Kotlin', 'Rust', 'SQL', 'HTML/CSS'
  ];

  const codingExperienceOptions = [
    { value: '0', label: 'No coding experience' },
    { value: '1', label: 'Less than 1 year' },
    { value: '2', label: '1-2 years' },
    { value: '5', label: '3-5 years' },
    { value: '10', label: '6-10 years' },
    { value: '15', label: '10+ years' }
  ];

  // Show loading if profile context is loading or we're loading data
  if (profileLoading || isLoadingData) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="ml-2">Loading tech fluency data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-foreground mb-2">
          AI & Technical Fluency
        </h3>
        <p className="text-muted-foreground">
          Help us understand your technical background and AI experience
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Technical Experience Level */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Code className="w-5 h-5 text-primary" />
            <label className="text-sm font-medium text-foreground">
              Technical Experience Level *
            </label>
          </div>
          <Select 
            value={formData.technical_experience_level} 
            onValueChange={(value) => handleSelectChange('technical_experience_level', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select your technical experience level" />
            </SelectTrigger>
            <SelectContent>
              {technicalLevels.map((level) => (
                <SelectItem key={level.value} value={level.value}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* AI Familiarity Level */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Bot className="w-5 h-5 text-primary" />
            <label className="text-sm font-medium text-foreground">
              AI Familiarity Level *
            </label>
          </div>
          <Select 
            value={formData.ai_familiarity_level} 
            onValueChange={(value) => handleSelectChange('ai_familiarity_level', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select your AI familiarity level" />
            </SelectTrigger>
            <SelectContent>
              {aiFamiliarityLevels.map((level) => (
                <SelectItem key={level.value} value={level.value}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* AI Models Used */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Bot className="w-5 h-5 text-primary" />
            <label className="text-sm font-medium text-foreground">
              AI Models/Tools You've Used *
            </label>
          </div>
          <p className="text-sm text-muted-foreground">
            Select all AI tools and models you have experience with
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {aiModels.map((model) => (
              <div key={model} className="flex items-center space-x-2">
                <Checkbox
                  id={`model-${model}`}
                  checked={formData.ai_models_used.includes(model)}
                  onCheckedChange={(checked) => handleArrayChange('ai_models_used', model, checked as boolean)}
                />
                <label htmlFor={`model-${model}`} className="text-sm">
                  {model}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* AI Interest Areas */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            <label className="text-sm font-medium text-foreground">
              AI Interest Areas *
            </label>
          </div>
          <p className="text-sm text-muted-foreground">
            Select areas where you're interested in AI applications
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {aiInterestAreas.map((interest) => (
              <div key={interest} className="flex items-center space-x-2">
                <Checkbox
                  id={`interest-${interest}`}
                  checked={formData.ai_interests.includes(interest)}
                  onCheckedChange={(checked) => handleArrayChange('ai_interests', interest, checked as boolean)}
                />
                <label htmlFor={`interest-${interest}`} className="text-sm">
                  {interest}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Coding Experience */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Code className="w-5 h-5 text-primary" />
            <label className="text-sm font-medium text-foreground">
              Coding Experience
            </label>
          </div>
          <Select 
            value={formData.coding_experience_years?.toString() || ''} 
            onValueChange={handleCodingExperienceChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select your coding experience" />
            </SelectTrigger>
            <SelectContent>
              {codingExperienceOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Programming Languages */}
        {formData.coding_experience_years && formData.coding_experience_years > 0 && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Code className="w-5 h-5 text-primary" />
              <label className="text-sm font-medium text-foreground">
                Programming Languages
              </label>
            </div>
            <p className="text-sm text-muted-foreground">
              Select programming languages you have experience with
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {programmingLanguages.map((language) => (
                <div key={language} className="flex items-center space-x-2">
                  <Checkbox
                    id={`lang-${language}`}
                    checked={formData.programming_languages.includes(language)}
                    onCheckedChange={(checked) => handleArrayChange('programming_languages', language, checked as boolean)}
                  />
                  <label htmlFor={`lang-${language}`} className="text-sm">
                    {language}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-medium text-foreground mb-2">Why we ask about your tech fluency:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Match you with projects suited to your skill level</li>
            <li>• Understand how AI tools fit into your workflow</li>
            <li>• Connect you with relevant research opportunities</li>
            <li>• Help researchers design better AI experiences</li>
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
