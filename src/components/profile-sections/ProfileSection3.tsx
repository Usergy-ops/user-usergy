
import React, { useState } from 'react';
import { useProfileCompletion, ProfileData } from '@/hooks/useProfileCompletion';
import { GraduationCap, Briefcase, Building } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileSection3Props {
  data: ProfileData | null;
}

export const ProfileSection3: React.FC<ProfileSection3Props> = ({ data }) => {
  const { updateProfileData, updating } = useProfileCompletion();
  const [formData, setFormData] = useState({
    education_level: data?.education_level || '',
    field_of_study: data?.field_of_study || '',
    current_job_title: data?.current_job_title || '',
    current_employer: data?.current_employer || '',
    industry: data?.industry || '',
    work_role: data?.work_role || '',
    company_size: data?.company_size || '',
    household_income_range: data?.household_income_range || ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfileData(3, formData);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Education & Work</h2>
        <p className="text-muted-foreground">
          Share your professional background and expertise
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Education Level */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center space-x-2">
              <GraduationCap className="w-4 h-4" />
              <span>Education Level</span>
            </label>
            <select
              value={formData.education_level}
              onChange={(e) => handleInputChange('education_level', e.target.value)}
              className="usergy-input w-full"
            >
              <option value="">Select education level</option>
              <option value="high-school">High School</option>
              <option value="bachelor">Bachelor's Degree</option>
              <option value="master">Master's Degree</option>
              <option value="phd">PhD</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Field of Study */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Field of Study</label>
            <input
              type="text"
              value={formData.field_of_study}
              onChange={(e) => handleInputChange('field_of_study', e.target.value)}
              className="usergy-input w-full"
              placeholder="Computer Science, Marketing, etc."
            />
          </div>

          {/* Current Job Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center space-x-2">
              <Briefcase className="w-4 h-4" />
              <span>Current Job Title</span>
            </label>
            <input
              type="text"
              value={formData.current_job_title}
              onChange={(e) => handleInputChange('current_job_title', e.target.value)}
              className="usergy-input w-full"
              placeholder="Software Engineer, Product Manager, etc."
            />
          </div>

          {/* Current Employer */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center space-x-2">
              <Building className="w-4 h-4" />
              <span>Current Employer</span>
            </label>
            <input
              type="text"
              value={formData.current_employer}
              onChange={(e) => handleInputChange('current_employer', e.target.value)}
              className="usergy-input w-full"
              placeholder="Company name"
            />
          </div>

          {/* Industry */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Industry</label>
            <select
              value={formData.industry}
              onChange={(e) => handleInputChange('industry', e.target.value)}
              className="usergy-input w-full"
            >
              <option value="">Select industry</option>
              <option value="technology">Technology</option>
              <option value="healthcare">Healthcare</option>
              <option value="finance">Finance</option>
              <option value="education">Education</option>
              <option value="retail">Retail</option>
              <option value="manufacturing">Manufacturing</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Company Size */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Company Size</label>
            <select
              value={formData.company_size}
              onChange={(e) => handleInputChange('company_size', e.target.value)}
              className="usergy-input w-full"
            >
              <option value="">Select company size</option>
              <option value="startup">Startup (1-50)</option>
              <option value="small">Small (51-200)</option>
              <option value="medium">Medium (201-1000)</option>
              <option value="large">Large (1000+)</option>
            </select>
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
            {updating ? 'Saving...' : 'Complete Section 3'}
          </button>
        </div>
      </form>
    </div>
  );
};
