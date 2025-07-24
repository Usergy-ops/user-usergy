
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useProfileCompletion, ProfileData } from '@/hooks/useProfileCompletion';
import { Upload, User, MapPin, Phone, Calendar, Users, Clock, Camera } from 'lucide-react';
import { PremiumFormField } from '../profile-completion/PremiumFormField';
import { cn } from '@/lib/utils';

interface PremiumProfileSection1Props {
  data: ProfileData | null;
}

export const PremiumProfileSection1: React.FC<PremiumProfileSection1Props> = ({ data }) => {
  const { updateProfileData, uploadProfilePicture, updating } = useProfileCompletion();
  const [formData, setFormData] = useState({
    full_name: data?.full_name || '',
    country: data?.country || '',
    city: data?.city || '',
    phone_number: data?.phone_number || '',
    date_of_birth: data?.date_of_birth || '',
    gender: data?.gender || '',
    timezone: data?.timezone || '',
    avatar_url: data?.avatar_url || ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await uploadProfilePicture(file);
      setFormData(prev => ({ ...prev, avatar_url: url }));
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfileData(1, formData);
  };

  const timezoneOptions = [
    { value: 'UTC-8', label: 'Pacific Time (UTC-8)' },
    { value: 'UTC-7', label: 'Mountain Time (UTC-7)' },
    { value: 'UTC-6', label: 'Central Time (UTC-6)' },
    { value: 'UTC-5', label: 'Eastern Time (UTC-5)' },
    { value: 'UTC+0', label: 'UTC' },
    { value: 'UTC+1', label: 'Central European Time (UTC+1)' },
    { value: 'UTC+8', label: 'China Time (UTC+8)' },
    { value: 'UTC+9', label: 'Japan Time (UTC+9)' }
  ];

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'non-binary', label: 'Non-binary' },
    { value: 'prefer-not-to-say', label: 'Prefer not to say' }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary-start to-primary-end bg-clip-text text-transparent mb-3">
          Let's get to know you
        </h2>
        <p className="text-lg text-muted-foreground">
          Share your basic information to personalize your Explorer experience
        </p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Profile Picture Section */}
        <motion.div
          className="flex justify-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="relative group">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary-start to-primary-end p-1 shadow-lg">
              <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                {formData.avatar_url ? (
                  <img 
                    src={formData.avatar_url} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-muted-foreground" />
                )}
              </div>
            </div>
            
            {/* Upload Button */}
            <label className="absolute bottom-0 right-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/80 transition-colors shadow-lg group-hover:scale-110 transition-transform">
              <Camera className="w-5 h-5 text-primary-foreground" />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>
        </motion.div>

        {/* Form Fields */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Row 1 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <PremiumFormField
              label="Full Name"
              value={formData.full_name}
              onChange={(value) => handleInputChange('full_name', value)}
              placeholder="Enter your full name"
              icon={User}
              required
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <PremiumFormField
              label="Phone Number"
              type="tel"
              value={formData.phone_number}
              onChange={(value) => handleInputChange('phone_number', value)}
              placeholder="+1 (555) 123-4567"
              icon={Phone}
            />
          </motion.div>

          {/* Row 2 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <PremiumFormField
              label="Country"
              value={formData.country}
              onChange={(value) => handleInputChange('country', value)}
              placeholder="United States"
              icon={MapPin}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <PremiumFormField
              label="City"
              value={formData.city}
              onChange={(value) => handleInputChange('city', value)}
              placeholder="San Francisco"
              icon={MapPin}
            />
          </motion.div>

          {/* Row 3 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <PremiumFormField
              label="Date of Birth"
              type="date"
              value={formData.date_of_birth}
              onChange={(value) => handleInputChange('date_of_birth', value)}
              icon={Calendar}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <PremiumFormField
              label="Gender"
              type="select"
              value={formData.gender}
              onChange={(value) => handleInputChange('gender', value)}
              options={genderOptions}
              placeholder="Select gender"
              icon={Users}
            />
          </motion.div>
        </div>

        {/* Timezone - Full Width */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
        >
          <PremiumFormField
            label="Timezone"
            type="select"
            value={formData.timezone}
            onChange={(value) => handleInputChange('timezone', value)}
            options={timezoneOptions}
            placeholder="Select your timezone"
            icon={Clock}
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
