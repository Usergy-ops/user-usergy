
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useProfileCompletion, ProfileData } from '@/hooks/useProfileCompletion';
import { Linkedin, Twitter, Github, Link, Share2, Globe, ExternalLink } from 'lucide-react';
import { PremiumFormField } from '../profile-completion/PremiumFormField';
import { cn } from '@/lib/utils';

interface PremiumProfileSection5Props {
  data: ProfileData | null;
}

export const PremiumProfileSection5: React.FC<PremiumProfileSection5Props> = ({ data }) => {
  const { updateProfileData, updating } = useProfileCompletion();
  const [formData, setFormData] = useState({
    linkedin_url: data?.linkedin_url || '',
    twitter_url: data?.twitter_url || '',
    github_url: data?.github_url || '',
    portfolio_url: data?.portfolio_url || ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfileData(5, formData);
  };

  const socialPlatforms = [
    {
      key: 'linkedin_url',
      label: 'LinkedIn Profile',
      icon: Linkedin,
      placeholder: 'https://linkedin.com/in/yourprofile',
      color: 'from-blue-600 to-blue-700',
      description: 'Professional networking platform'
    },
    {
      key: 'twitter_url',
      label: 'Twitter / X Profile',
      icon: Twitter,
      placeholder: 'https://twitter.com/yourhandle',
      color: 'from-sky-500 to-sky-600',
      description: 'Social media and updates'
    },
    {
      key: 'github_url',
      label: 'GitHub Profile',
      icon: Github,
      placeholder: 'https://github.com/yourusername',
      color: 'from-gray-800 to-gray-900',
      description: 'Code repositories and projects'
    },
    {
      key: 'portfolio_url',
      label: 'Portfolio Website',
      icon: Globe,
      placeholder: 'https://yourportfolio.com',
      color: 'from-purple-600 to-purple-700',
      description: 'Personal website or portfolio'
    }
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
            <Share2 className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary-start to-primary-end bg-clip-text text-transparent mb-3">
          Social Presence
        </h2>
        <p className="text-lg text-muted-foreground">
          Connect your professional and social profiles to showcase your online presence
        </p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Social Platforms Grid */}
        <div className="grid gap-6">
          {socialPlatforms.map((platform, index) => (
            <motion.div
              key={platform.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              className="group"
            >
              <div className="relative">
                {/* Platform Header */}
                <div className="flex items-center space-x-3 mb-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-r",
                    platform.color
                  )}>
                    <platform.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{platform.label}</h3>
                    <p className="text-sm text-muted-foreground">{platform.description}</p>
                  </div>
                </div>

                {/* URL Input */}
                <PremiumFormField
                  label={platform.label}
                  type="url"
                  value={formData[platform.key as keyof typeof formData]}
                  onChange={(value) => handleInputChange(platform.key, value)}
                  placeholder={platform.placeholder}
                  icon={platform.icon}
                />

                {/* Preview Link */}
                {formData[platform.key as keyof typeof formData] && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-3 flex items-center space-x-2 text-sm text-muted-foreground"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <a
                      href={formData[platform.key as keyof typeof formData]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary transition-colors truncate"
                    >
                      {formData[platform.key as keyof typeof formData]}
                    </a>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Privacy Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="bg-muted/50 rounded-xl p-6 border border-border/50"
        >
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mt-1">
              <Link className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">Privacy & Verification</h4>
              <p className="text-sm text-muted-foreground">
                Your social profiles help us verify your identity and understand your professional background. 
                This information is used to personalize your experience and is kept secure according to our privacy policy.
              </p>
            </div>
          </div>
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
