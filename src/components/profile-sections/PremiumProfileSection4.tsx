
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useProfileCompletion, ProfileData } from '@/hooks/useProfileCompletion';
import { Brain, Code, Zap, Bot, Cpu, Terminal, Sparkles, Award } from 'lucide-react';
import { PremiumFormField } from '../profile-completion/PremiumFormField';
import { MultiSelectField } from '../profile-completion/MultiSelectField';
import { cn } from '@/lib/utils';

interface PremiumProfileSection4Props {
  data: ProfileData | null;
}

export const PremiumProfileSection4: React.FC<PremiumProfileSection4Props> = ({ data }) => {
  const { updateProfileData, updating } = useProfileCompletion();
  const [formData, setFormData] = useState({
    technical_experience_level: data?.technical_experience_level || '',
    ai_familiarity_level: data?.ai_familiarity_level || '',
    ai_interests: data?.ai_interests || [],
    ai_models_used: data?.ai_models_used || [],
    coding_experience_years: data?.coding_experience_years || 0
  });

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMultiSelectChange = (field: string, values: string[]) => {
    setFormData(prev => ({ ...prev, [field]: values }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfileData(4, formData);
  };

  const techLevelOptions = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'expert', label: 'Expert' }
  ];

  const aiLevelOptions = [
    { value: 'curious', label: 'Curious Beginner' },
    { value: 'user', label: 'Regular User' },
    { value: 'experienced', label: 'Experienced User' },
    { value: 'professional', label: 'AI Professional' }
  ];

  const aiInterestOptions = [
    { value: 'machine-learning', label: 'Machine Learning', description: 'Algorithms and model training', icon: Brain },
    { value: 'natural-language', label: 'Natural Language Processing', description: 'Text analysis and generation', icon: Bot },
    { value: 'computer-vision', label: 'Computer Vision', description: 'Image and video analysis', icon: Cpu },
    { value: 'robotics', label: 'Robotics', description: 'Autonomous systems and control', icon: Terminal },
    { value: 'ai-ethics', label: 'AI Ethics', description: 'Responsible AI development', icon: Award },
    { value: 'generative-ai', label: 'Generative AI', description: 'Content creation and synthesis', icon: Sparkles },
    { value: 'automation', label: 'Automation', description: 'Process optimization and efficiency', icon: Zap },
    { value: 'data-science', label: 'Data Science', description: 'Analytics and insights', icon: Code }
  ];

  const aiModelOptions = [
    { value: 'chatgpt', label: 'ChatGPT', description: 'OpenAI conversational AI', icon: Bot },
    { value: 'claude', label: 'Claude', description: 'Anthropic AI assistant', icon: Brain },
    { value: 'gemini', label: 'Gemini', description: 'Google multimodal AI', icon: Sparkles },
    { value: 'copilot', label: 'GitHub Copilot', description: 'AI coding assistant', icon: Code },
    { value: 'midjourney', label: 'Midjourney', description: 'AI image generation', icon: Cpu },
    { value: 'stable-diffusion', label: 'Stable Diffusion', description: 'Open-source image AI', icon: Zap },
    { value: 'dall-e', label: 'DALL-E', description: 'OpenAI image generator', icon: Sparkles },
    { value: 'hugging-face', label: 'Hugging Face', description: 'ML model platform', icon: Terminal }
  ];

  const codingYearsOptions = [
    { value: '0', label: 'No coding experience' },
    { value: '1', label: 'Less than 1 year' },
    { value: '2', label: '1-2 years' },
    { value: '5', label: '3-5 years' },
    { value: '10', label: '6-10 years' },
    { value: '15', label: '11-15 years' },
    { value: '20', label: '16+ years' }
  ];

  return (
    <div className="space-y-8">
      {/* Premium Header */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-start to-primary-end rounded-2xl flex items-center justify-center">
            <Brain className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary-start to-primary-end bg-clip-text text-transparent mb-3">
          AI & Tech Fluency
        </h2>
        <p className="text-lg text-muted-foreground">
          Help us understand your technical background and AI experience to personalize your journey
        </p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Technical Experience */}
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Code className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Technical Experience</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <PremiumFormField
              label="Technical Experience Level"
              type="select"
              value={formData.technical_experience_level}
              onChange={(value) => handleInputChange('technical_experience_level', value)}
              options={techLevelOptions}
              placeholder="Select your technical level"
              icon={Code}
              required
            />

            <PremiumFormField
              label="Coding Experience"
              type="select"
              value={formData.coding_experience_years?.toString() || ''}
              onChange={(value) => handleInputChange('coding_experience_years', parseInt(value) || 0)}
              options={codingYearsOptions}
              placeholder="Years of coding experience"
              icon={Terminal}
            />
          </div>
        </motion.div>

        {/* AI Experience */}
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">AI Experience</h3>
          </div>

          <PremiumFormField
            label="AI Familiarity Level"
            type="select"
            value={formData.ai_familiarity_level}
            onChange={(value) => handleInputChange('ai_familiarity_level', value)}
            options={aiLevelOptions}
            placeholder="Select your AI familiarity level"
            icon={Brain}
            required
          />
        </motion.div>

        {/* AI Interests */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <MultiSelectField
            label="AI Interests"
            options={aiInterestOptions}
            selected={formData.ai_interests}
            onChange={(values) => handleMultiSelectChange('ai_interests', values)}
            searchable
            maxColumns={2}
          />
        </motion.div>

        {/* AI Models Used */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <MultiSelectField
            label="AI Models & Tools You've Used"
            options={aiModelOptions}
            selected={formData.ai_models_used}
            onChange={(values) => handleMultiSelectChange('ai_models_used', values)}
            searchable
            maxColumns={2}
          />
        </motion.div>

        {/* Submit Button */}
        <motion.div
          className="flex justify-end pt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.0 }}
        >
          <motion.button
            type="submit"
            disabled={updating}
            className={cn(
              "px-8 py-4 rounded-xl font-semibold text-lg shadow-lg transition-all duration-300",
              "bg-gradient-to-r from-primary-start to-primary-end text-white",
              "hover:shadow-xl hover:scale-105",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            )}
            whileHover={{ scale: updating ? 1 : 1.05 }}
            whileTap={{ scale: updating ? 1 : 0.95 }}
          >
            {updating ? (
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving...</span>
              </div>
            ) : (
              'Continue to Next Section'
            )}
          </motion.button>
        </motion.div>
      </form>
    </div>
  );
};
