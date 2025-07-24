
import React, { useState } from 'react';
import { useProfileCompletion, ProfileData } from '@/hooks/useProfileCompletion';
import { Star, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileSection6Props {
  data: ProfileData | null;
}

export const ProfileSection6: React.FC<ProfileSection6Props> = ({ data }) => {
  const { updateProfileData, updating } = useProfileCompletion();
  const [formData, setFormData] = useState({
    interests: data?.interests || [],
    bio: data?.bio || ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMultiSelect = (field: 'interests', value: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked 
        ? [...prev[field], value]
        : prev[field].filter(item => item !== value)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfileData(6, formData);
  };

  const interestOptions = [
    'Technology', 'Gaming', 'Music', 'Sports', 'Travel', 'Reading', 
    'Photography', 'Cooking', 'Art', 'Science', 'Movies', 'Fitness'
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Skills & Interests</h2>
        <p className="text-muted-foreground">
          Share your interests and tell us about yourself
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Interests */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground flex items-center space-x-2">
            <Star className="w-4 h-4" />
            <span>Interests</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {interestOptions.map((interest) => (
              <label key={interest} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.interests.includes(interest)}
                  onChange={(e) => handleMultiSelect('interests', interest, e.target.checked)}
                  className="rounded border-border"
                />
                <span className="text-sm">{interest}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Bio</span>
          </label>
          <textarea
            value={formData.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            className="usergy-input w-full h-32 resize-none"
            placeholder="Tell us about yourself, your interests, and what you're passionate about..."
            maxLength={500}
          />
          <div className="text-right text-xs text-muted-foreground">
            {formData.bio.length}/500
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
            {updating ? 'Saving...' : 'Complete Section 6'}
          </button>
        </div>
      </form>
    </div>
  );
};
