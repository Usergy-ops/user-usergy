
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useProfileCompletion, ProfileData } from '@/hooks/useProfileCompletion';
import { GraduationCap, Briefcase, Building, TrendingUp, Users, DollarSign, Award } from 'lucide-react';
import { PremiumFormField } from '../profile-completion/PremiumFormField';
import { cn } from '@/lib/utils';

interface PremiumProfileSection3Props {
  data: ProfileData | null;
}

export const PremiumProfileSection3: React.FC<PremiumProfileSection3Props> = ({ data }) => {
  const { updateProfileData, updating } = useProfileCompletion();
  const [formData, setFormData] = useState({
    education_level: data?.education_level || '',
    field_of_study: data?.field_of_study || '',
    job_title: data?.job_title || '',
    employer: data?.employer || '',
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

  const educationOptions = [
    { value: 'high-school', label: 'High School Diploma' },
    { value: 'associate', label: 'Associate Degree' },
    { value: 'bachelor', label: 'Bachelor\'s Degree' },
    { value: 'master', label: 'Master\'s Degree' },
    { value: 'phd', label: 'PhD / Doctorate' },
    { value: 'bootcamp', label: 'Coding Bootcamp' },
    { value: 'self-taught', label: 'Self-Taught' },
    { value: 'other', label: 'Other' }
  ];

  const industryOptions = [
    { value: 'technology', label: 'Technology & Software' },
    { value: 'healthcare', label: 'Healthcare & Medical' },
    { value: 'finance', label: 'Finance & Banking' },
    { value: 'education', label: 'Education & Training' },
    { value: 'retail', label: 'Retail & E-commerce' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'consulting', label: 'Consulting' },
    { value: 'marketing', label: 'Marketing & Advertising' },
    { value: 'media', label: 'Media & Entertainment' },
    { value: 'nonprofit', label: 'Non-Profit' },
    { value: 'government', label: 'Government' },
    { value: 'other', label: 'Other' }
  ];

  const companySizeOptions = [
    { value: 'solo', label: 'Solo / Freelancer' },
    { value: 'startup', label: 'Startup (1-10 employees)' },
    { value: 'small', label: 'Small Business (11-50)' },
    { value: 'medium', label: 'Medium Company (51-200)' },
    { value: 'large', label: 'Large Company (201-1000)' },
    { value: 'enterprise', label: 'Enterprise (1000+ employees)' }
  ];

  const incomeRangeOptions = [
    { value: 'under-25k', label: 'Under $25,000' },
    { value: '25k-50k', label: '$25,000 - $50,000' },
    { value: '50k-75k', label: '$50,000 - $75,000' },
    { value: '75k-100k', label: '$75,000 - $100,000' },
    { value: '100k-150k', label: '$100,000 - $150,000' },
    { value: '150k-200k', label: '$150,000 - $200,000' },
    { value: '200k-300k', label: '$200,000 - $300,000' },
    { value: 'over-300k', label: 'Over $300,000' },
    { value: 'prefer-not-to-say', label: 'Prefer not to say' }
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
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary-start to-primary-end bg-clip-text text-transparent mb-3">
          Professional Background
        </h2>
        <p className="text-lg text-muted-foreground">
          Share your educational journey and professional expertise to help us understand your background
        </p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Education Section */}
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Education</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <PremiumFormField
              label="Education Level"
              type="select"
              value={formData.education_level}
              onChange={(value) => handleInputChange('education_level', value)}
              options={educationOptions}
              placeholder="Select your highest education level"
              icon={GraduationCap}
              required
            />

            <PremiumFormField
              label="Field of Study"
              value={formData.field_of_study}
              onChange={(value) => handleInputChange('field_of_study', value)}
              placeholder="Computer Science, Marketing, etc."
              icon={Award}
            />
          </div>
        </motion.div>

        {/* Work Experience Section */}
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Work Experience</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <PremiumFormField
              label="Job Title"
              value={formData.job_title}
              onChange={(value) => handleInputChange('job_title', value)}
              placeholder="Software Engineer, Product Manager, etc."
              icon={Briefcase}
              required
            />

            <PremiumFormField
              label="Current Employer"
              value={formData.employer}
              onChange={(value) => handleInputChange('employer', value)}
              placeholder="Company name"
              icon={Building}
            />

            <PremiumFormField
              label="Industry"
              type="select"
              value={formData.industry}
              onChange={(value) => handleInputChange('industry', value)}
              options={industryOptions}
              placeholder="Select your industry"
              icon={TrendingUp}
              required
            />

            <PremiumFormField
              label="Company Size"
              type="select"
              value={formData.company_size}
              onChange={(value) => handleInputChange('company_size', value)}
              options={companySizeOptions}
              placeholder="Select company size"
              icon={Users}
            />
          </div>
        </motion.div>

        {/* Additional Information */}
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Additional Information</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <PremiumFormField
              label="Household Income Range"
              type="select"
              value={formData.household_income_range}
              onChange={(value) => handleInputChange('household_income_range', value)}
              options={incomeRangeOptions}
              placeholder="Select income range"
              icon={DollarSign}
            />

            <PremiumFormField
              label="Work Role"
              value={formData.work_role}
              onChange={(value) => handleInputChange('work_role', value)}
              placeholder="Individual Contributor, Manager, etc."
              icon={Users}
            />
          </div>
        </motion.div>

        {/* Submit Button */}
        <motion.div
          className="flex justify-end pt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
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
