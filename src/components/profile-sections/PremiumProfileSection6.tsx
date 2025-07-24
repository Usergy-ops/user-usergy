
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useProfileCompletion, ProfileData } from '@/hooks/useProfileCompletion';
import { Star, FileText, Heart, Sparkles, Tag, User, Trophy, CheckCircle } from 'lucide-react';
import { PremiumFormField } from '../profile-completion/PremiumFormField';
import { MultiSelectField } from '../profile-completion/MultiSelectField';
import { cn } from '@/lib/utils';

interface PremiumProfileSection6Props {
  data: ProfileData | null;
}

export const PremiumProfileSection6: React.FC<PremiumProfileSection6Props> = ({ data }) => {
  const { updateProfileData, updating } = useProfileCompletion();
  const [formData, setFormData] = useState({
    interests: data?.interests || [],
    bio: data?.bio || ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMultiSelectChange = (field: string, values: string[]) => {
    setFormData(prev => ({ ...prev, [field]: values }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfileData(6, formData);
  };

  const interestOptions = [
    { value: 'technology', label: 'Technology', description: 'Latest tech trends and innovations', icon: Sparkles },
    { value: 'artificial-intelligence', label: 'Artificial Intelligence', description: 'AI developments and applications', icon: Star },
    { value: 'gaming', label: 'Gaming', description: 'Video games and gaming culture', icon: Trophy },
    { value: 'music', label: 'Music', description: 'All genres and music production', icon: Heart },
    { value: 'sports', label: 'Sports', description: 'Athletic activities and competitions', icon: Trophy },
    { value: 'travel', label: 'Travel', description: 'Exploring new places and cultures', icon: Star },
    { value: 'reading', label: 'Reading', description: 'Books, articles, and literature', icon: FileText },
    { value: 'photography', label: 'Photography', description: 'Capturing moments and visual arts', icon: Sparkles },
    { value: 'cooking', label: 'Cooking', description: 'Culinary arts and food exploration', icon: Heart },
    { value: 'art', label: 'Art', description: 'Visual arts and creative expression', icon: Star },
    { value: 'science', label: 'Science', description: 'Scientific discoveries and research', icon: Sparkles },
    { value: 'movies', label: 'Movies & TV', description: 'Cinema and television entertainment', icon: Trophy },
    { value: 'fitness', label: 'Fitness', description: 'Health, wellness, and exercise', icon: Heart },
    { value: 'entrepreneurship', label: 'Entrepreneurship', description: 'Business building and innovation', icon: Star },
    { value: 'design', label: 'Design', description: 'UI/UX and creative design', icon: Sparkles },
    { value: 'writing', label: 'Writing', description: 'Creative and technical writing', icon: FileText },
    { value: 'podcasts', label: 'Podcasts', description: 'Audio content and storytelling', icon: Heart },
    { value: 'cryptocurrency', label: 'Cryptocurrency', description: 'Digital assets and blockchain', icon: Trophy },
    { value: 'philosophy', label: 'Philosophy', description: 'Deep thinking and existential questions', icon: Star },
    { value: 'education', label: 'Education', description: 'Learning and knowledge sharing', icon: FileText }
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
            <Star className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary-start to-primary-end bg-clip-text text-transparent mb-3">
          Skills & Interests
        </h2>
        <p className="text-lg text-muted-foreground">
          Share your interests and tell us about yourself to complete your Explorer profile
        </p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Interests Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Tag className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Your Interests</h3>
          </div>

          <MultiSelectField
            label="Select Your Interests"
            options={interestOptions}
            selected={formData.interests}
            onChange={(values) => handleMultiSelectChange('interests', values)}
            searchable
            maxColumns={3}
          />

          {formData.interests.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/10"
            >
              <div className="flex items-center space-x-2 text-sm text-primary">
                <CheckCircle className="w-4 h-4" />
                <span>Great! You've selected {formData.interests.length} interests</span>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Bio Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="space-y-4"
        >
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">About You</h3>
          </div>

          <PremiumFormField
            label="Personal Bio"
            type="textarea"
            value={formData.bio}
            onChange={(value) => handleInputChange('bio', value)}
            placeholder="Tell us about yourself, your interests, career goals, and what makes you unique. This helps us understand who you are beyond your professional background..."
            icon={FileText}
            rows={6}
          />

          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>Share what makes you unique and what you're passionate about</span>
            <span>{formData.bio.length}/1000</span>
          </div>
        </motion.div>

        {/* Completion Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-gradient-to-r from-primary-start/10 to-primary-end/10 rounded-xl p-6 border border-primary/20"
        >
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-start to-primary-end rounded-xl flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">You're Almost Done!</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Complete this final section to unlock your full Explorer profile and gain access to premium features.
              </p>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>Personalized recommendations</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>Priority access to features</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>Enhanced profile visibility</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>Exclusive community access</span>
                </div>
              </div>
            </div>
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
                <span>Completing Profile...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5" />
                <span>Complete Profile</span>
              </div>
            )}
          </motion.button>
        </motion.div>
      </form>
    </div>
  );
};
