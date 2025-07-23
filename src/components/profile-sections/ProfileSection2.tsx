
import React, { useState } from 'react';
import { useProfileCompletion, ProfileData } from '@/hooks/useProfileCompletion';
import { Smartphone, Monitor, Mail, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileSection2Props {
  data: ProfileData | null;
}

export const ProfileSection2: React.FC<ProfileSection2Props> = ({ data }) => {
  const { updateProfileData, updating } = useProfileCompletion();
  const [formData, setFormData] = useState({
    operating_systems: data?.operating_systems || [],
    devices_owned: data?.devices_owned || [],
    mobile_manufacturers: data?.mobile_manufacturers || [],
    email_clients: data?.email_clients || [],
    streaming_subscriptions: data?.streaming_subscriptions || []
  });

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
    await updateProfileData(2, formData);
  };

  const osOptions = ['Windows', 'macOS', 'Linux', 'iOS', 'Android'];
  const deviceOptions = ['Smartphone', 'Tablet', 'Laptop', 'Desktop', 'Smart TV', 'Gaming Console'];
  const mobileOptions = ['Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi', 'Huawei'];
  const emailOptions = ['Gmail', 'Outlook', 'Apple Mail', 'Yahoo', 'Thunderbird'];
  const streamingOptions = ['Netflix', 'Amazon Prime', 'Disney+', 'HBO Max', 'Spotify', 'Apple Music'];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Devices & Product Usage</h2>
        <p className="text-muted-foreground">
          Help us understand your technology ecosystem
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Operating Systems */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground flex items-center space-x-2">
            <Monitor className="w-4 h-4" />
            <span>Operating Systems</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {osOptions.map((os) => (
              <label key={os} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.operating_systems.includes(os)}
                  onChange={(e) => handleMultiSelect('operating_systems', os, e.target.checked)}
                  className="rounded border-border"
                />
                <span className="text-sm">{os}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Devices Owned */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground flex items-center space-x-2">
            <Smartphone className="w-4 h-4" />
            <span>Devices You Own</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {deviceOptions.map((device) => (
              <label key={device} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.devices_owned.includes(device)}
                  onChange={(e) => handleMultiSelect('devices_owned', device, e.target.checked)}
                  className="rounded border-border"
                />
                <span className="text-sm">{device}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Mobile Manufacturers */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">
            Mobile Device Manufacturers
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {mobileOptions.map((brand) => (
              <label key={brand} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.mobile_manufacturers.includes(brand)}
                  onChange={(e) => handleMultiSelect('mobile_manufacturers', brand, e.target.checked)}
                  className="rounded border-border"
                />
                <span className="text-sm">{brand}</span>
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
            {updating ? 'Saving...' : 'Complete Section 2'}
          </button>
        </div>
      </form>
    </div>
  );
};
