
import React, { useState } from 'react';
import { useProfileCompletion, ProfileData } from '@/hooks/useProfileCompletion';
import { Star, Globe, Clock, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileSection6Props {
  data: ProfileData | null;
}

export const ProfileSection6: React.FC<ProfileSection6Props> = ({ data }) => {
  const { updateProfileData, updating } = useProfileCompletion();
  const [formData, setFormData] = useState({
    product_categories: data?.product_categories || [],
    time_zone: data?.time_zone || '',
    short_bio: data?.short_bio || ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMultiSelect = (field: 'product_categories', value: string, checked: boolean) => {
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

  const productCategories = [
    'Mobile Apps', 'Web Apps', 'SaaS Tools', 'E-commerce', 'Gaming', 
    'Productivity', 'Social Media', 'AI Tools', 'Developer Tools', 'Design Tools'
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Skills & Interests</h2>
        <p className="text-muted-foreground">
          Share your expertise and interests to help us match you with relevant opportunities
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Categories */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground flex items-center space-x-2">
            <Star className="w-4 h-4" />
            <span>Product Categories of Interest</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {productCategories.map((category) => (
              <label key={category} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.product_categories.includes(category)}
                  onChange={(e) => handleMultiSelect('product_categories', category, e.target.checked)}
                  className="rounded border-border"
                />
                <span className="text-sm">{category}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Time Zone */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>Time Zone</span>
          </label>
          <select
            value={formData.time_zone}
            onChange={(e) => handleInputChange('time_zone', e.target.value)}
            className="usergy-input w-full"
          >
            <option value="">Select time zone</option>
            <option value="UTC-8">Pacific Time (UTC-8)</option>
            <option value="UTC-7">Mountain Time (UTC-7)</option>
            <option value="UTC-6">Central Time (UTC-6)</option>
            <option value="UTC-5">Eastern Time (UTC-5)</option>
            <option value="UTC+0">UTC</option>
            <option value="UTC+1">Central European Time (UTC+1)</option>
            <option value="UTC+8">China Time (UTC+8)</option>
            <option value="UTC+9">Japan Time (UTC+9)</option>
          </select>
        </div>

        {/* Short Bio */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Short Bio</span>
          </label>
          <textarea
            value={formData.short_bio}
            onChange={(e) => handleInputChange('short_bio', e.target.value)}
            className="usergy-input w-full h-32 resize-none"
            placeholder="Tell us about yourself, your interests, and what you're passionate about..."
            maxLength={500}
          />
          <div className="text-right text-xs text-muted-foreground">
            {formData.short_bio.length}/500
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
