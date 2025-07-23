
import React, { useState } from 'react';
import { useProfileCompletion, ProfileData } from '@/hooks/useProfileCompletion';
import { Upload, User, MapPin, Phone, Calendar, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileSection1Props {
  data: ProfileData | null;
}

export const ProfileSection1: React.FC<ProfileSection1Props> = ({ data }) => {
  const { updateProfileData, uploadProfilePicture, updating } = useProfileCompletion();
  const [formData, setFormData] = useState({
    full_name: data?.full_name || '',
    location_country: data?.location_country || '',
    location_city: data?.location_city || '',
    contact_number: data?.contact_number || '',
    date_of_birth: data?.date_of_birth || '',
    gender: data?.gender || '',
    profile_picture_url: data?.profile_picture_url || ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await uploadProfilePicture(file);
      setFormData(prev => ({ ...prev, profile_picture_url: url }));
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfileData(1, formData);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Basic Information</h2>
        <p className="text-muted-foreground">
          Tell us about yourself so we can personalize your experience
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Picture */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-start to-primary-end flex items-center justify-center overflow-hidden">
              {formData.profile_picture_url ? (
                <img 
                  src={formData.profile_picture_url} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-12 h-12 text-white" />
              )}
            </div>
            <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/80 transition-colors">
              <Upload className="w-4 h-4 text-primary-foreground" />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Full Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>Full Name</span>
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => handleInputChange('full_name', e.target.value)}
              className="usergy-input w-full"
              placeholder="Enter your full name"
              required
            />
          </div>

          {/* Contact Number */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center space-x-2">
              <Phone className="w-4 h-4" />
              <span>Contact Number</span>
            </label>
            <input
              type="tel"
              value={formData.contact_number}
              onChange={(e) => handleInputChange('contact_number', e.target.value)}
              className="usergy-input w-full"
              placeholder="+1 (555) 123-4567"
            />
          </div>

          {/* Country */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span>Country</span>
            </label>
            <input
              type="text"
              value={formData.location_country}
              onChange={(e) => handleInputChange('location_country', e.target.value)}
              className="usergy-input w-full"
              placeholder="United States"
            />
          </div>

          {/* City */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span>City</span>
            </label>
            <input
              type="text"
              value={formData.location_city}
              onChange={(e) => handleInputChange('location_city', e.target.value)}
              className="usergy-input w-full"
              placeholder="San Francisco"
            />
          </div>

          {/* Date of Birth */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Date of Birth</span>
            </label>
            <input
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
              className="usergy-input w-full"
            />
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Gender</span>
            </label>
            <select
              value={formData.gender}
              onChange={(e) => handleInputChange('gender', e.target.value)}
              className="usergy-input w-full"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="non-binary">Non-binary</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
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
            {updating ? 'Saving...' : 'Complete Section 1'}
          </button>
        </div>
      </form>
    </div>
  );
};
