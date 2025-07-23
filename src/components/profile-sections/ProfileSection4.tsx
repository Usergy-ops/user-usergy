
import React, { useState } from 'react';
import { useProfileCompletion, ProfileData } from '@/hooks/useProfileCompletion';
import { Brain, Code, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileSection4Props {
  data: ProfileData | null;
}

export const ProfileSection4: React.FC<ProfileSection4Props> = ({ data }) => {
  const { updateProfileData, updating } = useProfileCompletion();
  const [formData, setFormData] = useState({
    technical_experience_level: data?.technical_experience_level || '',
    ai_familiarity_level: data?.ai_familiarity_level || '',
    ai_interests: data?.ai_interests || [],
    ai_models_used: data?.ai_models_used || [],
    programming_languages: data?.programming_languages || {}
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMultiSelect = (field: string, value: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked 
        ? [...(prev[field as keyof typeof prev] || []), value]
        : (prev[field as keyof typeof prev] || []).filter(item => item !== value)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfileData(4, formData);
  };

  const aiInterests = ['Machine Learning', 'Natural Language Processing', 'Computer Vision', 'Robotics', 'AI Ethics'];
  const aiModels = ['ChatGPT', 'Claude', 'Gemini', 'Copilot', 'Midjourney', 'Stable Diffusion'];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">AI & Tech Fluency</h2>
        <p className="text-muted-foreground">
          Tell us about your experience with AI and technology
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Technical Experience Level */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center space-x-2">
              <Code className="w-4 h-4" />
              <span>Technical Experience Level</span>
            </label>
            <select
              value={formData.technical_experience_level}
              onChange={(e) => handleInputChange('technical_experience_level', e.target.value)}
              className="usergy-input w-full"
            >
              <option value="">Select level</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
          </div>

          {/* AI Familiarity Level */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center space-x-2">
              <Brain className="w-4 h-4" />
              <span>AI Familiarity Level</span>
            </label>
            <select
              value={formData.ai_familiarity_level}
              onChange={(e) => handleInputChange('ai_familiarity_level', e.target.value)}
              className="usergy-input w-full"
            >
              <option value="">Select level</option>
              <option value="curious">Curious Beginner</option>
              <option value="user">Regular User</option>
              <option value="experienced">Experienced User</option>
              <option value="professional">AI Professional</option>
            </select>
          </div>
        </div>

        {/* AI Interests */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground flex items-center space-x-2">
            <Zap className="w-4 h-4" />
            <span>AI Interests</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {aiInterests.map((interest) => (
              <label key={interest} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.ai_interests.includes(interest)}
                  onChange={(e) => handleMultiSelect('ai_interests', interest, e.target.checked)}
                  className="rounded border-border"
                />
                <span className="text-sm">{interest}</span>
              </label>
            ))}
          </div>
        </div>

        {/* AI Models Used */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">AI Models You've Used</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {aiModels.map((model) => (
              <label key={model} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.ai_models_used.includes(model)}
                  onChange={(e) => handleMultiSelect('ai_models_used', model, e.target.checked)}
                  className="rounded border-border"
                />
                <span className="text-sm">{model}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-6">
          <button
            type="submit"
            disabled={updating}
            className={cn(
              "usergy-btn-primary px-8 py-3",
              updating && "opacity-50 cursor-not-allowed"
            )}
          >
            {updating ? 'Saving...' : 'Complete Section 4'}
          </button>
        </div>
      </form>
    </div>
  );
};
