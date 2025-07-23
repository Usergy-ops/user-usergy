
import React, { useState } from 'react';
import { useProfileCompletion, ProfileData } from '@/hooks/useProfileCompletion';
import { Linkedin, Twitter, Github, Link } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileSection5Props {
  data: ProfileData | null;
}

export const ProfileSection5: React.FC<ProfileSection5Props> = ({ data }) => {
  const { updateProfileData, updating } = useProfileCompletion();
  const [formData, setFormData] = useState({
    linkedin_profile: data?.linkedin_profile || '',
    twitter_profile: data?.twitter_profile || '',
    github_profile: data?.github_profile || ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfileData(5, formData);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Social Presence</h2>
        <p className="text-muted-foreground">
          Connect your professional and social profiles
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-6">
          {/* LinkedIn Profile */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center space-x-2">
              <Linkedin className="w-4 h-4" />
              <span>LinkedIn Profile</span>
            </label>
            <input
              type="url"
              value={formData.linkedin_profile}
              onChange={(e) => handleInputChange('linkedin_profile', e.target.value)}
              className="usergy-input w-full"
              placeholder="https://linkedin.com/in/yourprofile"
            />
          </div>

          {/* Twitter Profile */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center space-x-2">
              <Twitter className="w-4 h-4" />
              <span>Twitter Profile</span>
            </label>
            <input
              type="url"
              value={formData.twitter_profile}
              onChange={(e) => handleInputChange('twitter_profile', e.target.value)}
              className="usergy-input w-full"
              placeholder="https://twitter.com/yourhandle"
            />
          </div>

          {/* GitHub Profile */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center space-x-2">
              <Github className="w-4 h-4" />
              <span>GitHub Profile</span>
            </label>
            <input
              type="url"
              value={formData.github_profile}
              onChange={(e) => handleInputChange('github_profile', e.target.value)}
              className="usergy-input w-full"
              placeholder="https://github.com/yourusername"
            />
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
            {updating ? 'Saving...' : 'Complete Section 5'}
          </button>
        </div>
      </form>
    </div>
  );
};
