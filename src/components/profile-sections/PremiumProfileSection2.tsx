
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useProfileCompletion, ProfileData } from '@/hooks/useProfileCompletion';
import { Smartphone, Monitor, Mail, Play, Apple, Chrome } from 'lucide-react';
import { MultiSelectField } from '../profile-completion/MultiSelectField';
import { cn } from '@/lib/utils';

interface PremiumProfileSection2Props {
  data: ProfileData | null;
}

export const PremiumProfileSection2: React.FC<PremiumProfileSection2Props> = ({ data }) => {
  const { updateProfileData, updating } = useProfileCompletion();
  const [formData, setFormData] = useState({
    operating_systems: data?.operating_systems || [],
    devices_owned: data?.devices_owned || [],
    mobile_manufacturers: data?.mobile_manufacturers || [],
    email_clients: data?.email_clients || [],
    streaming_subscriptions: data?.streaming_subscriptions || []
  });

  const handleMultiSelectChange = (field: string, values: string[]) => {
    setFormData(prev => ({ ...prev, [field]: values }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfileData(2, formData);
  };

  const osOptions = [
    { value: 'Windows', label: 'Windows', description: 'Microsoft Windows OS' },
    { value: 'macOS', label: 'macOS', description: 'Apple macOS' },
    { value: 'Linux', label: 'Linux', description: 'Linux distributions' },
    { value: 'iOS', label: 'iOS', description: 'Apple iOS' },
    { value: 'Android', label: 'Android', description: 'Google Android' }
  ];

  const deviceOptions = [
    { value: 'Smartphone', label: 'Smartphone', description: 'Mobile phone', icon: Smartphone },
    { value: 'Tablet', label: 'Tablet', description: 'Tablet device' },
    { value: 'Laptop', label: 'Laptop', description: 'Portable computer' },
    { value: 'Desktop', label: 'Desktop', description: 'Desktop computer', icon: Monitor },
    { value: 'Smart TV', label: 'Smart TV', description: 'Internet-connected TV' },
    { value: 'Gaming Console', label: 'Gaming Console', description: 'Game console' }
  ];

  const mobileOptions = [
    { value: 'Apple', label: 'Apple', description: 'iPhone devices', icon: Apple },
    { value: 'Samsung', label: 'Samsung', description: 'Samsung Galaxy series' },
    { value: 'Google', label: 'Google', description: 'Google Pixel devices' },
    { value: 'OnePlus', label: 'OnePlus', description: 'OnePlus devices' },
    { value: 'Xiaomi', label: 'Xiaomi', description: 'Xiaomi devices' },
    { value: 'Huawei', label: 'Huawei', description: 'Huawei devices' }
  ];

  const emailOptions = [
    { value: 'Gmail', label: 'Gmail', description: 'Google Mail' },
    { value: 'Outlook', label: 'Outlook', description: 'Microsoft Outlook' },
    { value: 'Apple Mail', label: 'Apple Mail', description: 'Apple Mail app' },
    { value: 'Yahoo', label: 'Yahoo', description: 'Yahoo Mail' },
    { value: 'Thunderbird', label: 'Thunderbird', description: 'Mozilla Thunderbird' }
  ];

  const streamingOptions = [
    { value: 'Netflix', label: 'Netflix', description: 'Video streaming service' },
    { value: 'Amazon Prime', label: 'Amazon Prime', description: 'Prime Video' },
    { value: 'Disney+', label: 'Disney+', description: 'Disney streaming' },
    { value: 'HBO Max', label: 'HBO Max', description: 'HBO streaming' },
    { value: 'Spotify', label: 'Spotify', description: 'Music streaming' },
    { value: 'Apple Music', label: 'Apple Music', description: 'Apple music service' }
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
          Your Digital Ecosystem
        </h2>
        <p className="text-lg text-muted-foreground">
          Help us understand your technology preferences and usage patterns
        </p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-10">
        {/* Operating Systems */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <MultiSelectField
            label="Operating Systems"
            options={osOptions}
            selected={formData.operating_systems}
            onChange={(values) => handleMultiSelectChange('operating_systems', values)}
            searchable
            maxColumns={3}
          />
        </motion.div>

        {/* Devices Owned */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <MultiSelectField
            label="Devices You Own"
            options={deviceOptions}
            selected={formData.devices_owned}
            onChange={(values) => handleMultiSelectChange('devices_owned', values)}
            maxColumns={3}
          />
        </motion.div>

        {/* Mobile Manufacturers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <MultiSelectField
            label="Mobile Device Manufacturers"
            options={mobileOptions}
            selected={formData.mobile_manufacturers}
            onChange={(values) => handleMultiSelectChange('mobile_manufacturers', values)}
            maxColumns={3}
          />
        </motion.div>

        {/* Email Clients */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <MultiSelectField
            label="Email Clients"
            options={emailOptions}
            selected={formData.email_clients}
            onChange={(values) => handleMultiSelectChange('email_clients', values)}
            maxColumns={3}
          />
        </motion.div>

        {/* Streaming Services */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <MultiSelectField
            label="Streaming Subscriptions"
            options={streamingOptions}
            selected={formData.streaming_subscriptions}
            onChange={(values) => handleMultiSelectChange('streaming_subscriptions', values)}
            maxColumns={3}
          />
        </motion.div>

        {/* Submit Button */}
        <motion.div
          className="flex justify-end pt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
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
