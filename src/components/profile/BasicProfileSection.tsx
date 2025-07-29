
import React, { useState, useEffect } from 'react';
import { useProfile } from '@/contexts/ProfileContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ChevronRight, Upload, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { validateUnified, isReadyForSubmission } from '@/utils/validation/unifiedValidation';

const BasicProfileSection = () => {
  const { profileData, updateProfileData, setCurrentStep, uploadProfilePicture } = useProfile();
  const { toast } = useToast();

  // Form state - initialize with existing data, ensuring age is a string for input handling
  const [formData, setFormData] = useState({
    full_name: profileData?.full_name || '',
    email: profileData?.email || '',
    age: profileData?.age ? profileData.age.toString() : '',
    gender: profileData?.gender || '',
    country: profileData?.country || '',
    city: profileData?.city || '',
    timezone: profileData?.timezone || '',
    bio: profileData?.bio || '',
    avatar_url: profileData?.avatar_url || ''
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  console.log('BasicProfileSection rendered with:', {
    profileData,
    formData,
    errors
  });

  // Auto-save functionality with unified validation
  useEffect(() => {
    const autoSave = async () => {
      // Only auto-save if user has started entering data
      const hasData = Object.values(formData).some(value => 
        value !== null && value !== undefined && value !== ''
      );

      if (!hasData) return;

      try {
        // Use unified validation for auto-save
        const validationResult = validateUnified(formData, {
          isAutoSave: true,
          isSubmission: false,
          isRealTime: false,
          section: 'profile'
        });

        console.log('Auto-save validation result:', validationResult);

        // For auto-save, we save the sanitized data even with validation errors (partial data is OK)
        // Only save the fields that have values
        const dataToSave: any = {};
        Object.entries(validationResult.sanitizedData).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            dataToSave[key] = value;
          }
        });

        if (Object.keys(dataToSave).length > 0) {
          console.log('Auto-saving profile data:', dataToSave);
          await updateProfileData('profile', dataToSave);
        }

        // Clear errors for auto-save (we don't want to show validation errors during typing)
        setErrors([]);

      } catch (error) {
        console.error('Auto-save error:', error);
        // Don't show toast for auto-save errors to avoid annoying users
      }
    };

    const timer = setTimeout(autoSave, 1500);
    return () => clearTimeout(timer);
  }, [formData, updateProfileData]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const avatarUrl = await uploadProfilePicture(file);
      
      const updatedData = { ...formData, avatar_url: avatarUrl };
      setFormData(updatedData);
      
      await updateProfileData('profile', { avatar_url: avatarUrl });
      
      toast({
        title: "Success!",
        description: "Profile picture uploaded successfully.",
      });
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast({
        title: "Error",
        description: "Failed to upload profile picture. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleNext = async () => {
    try {
      setIsSubmitting(true);
      
      // Use unified validation for submission
      const validationResult = validateUnified(formData, {
        isAutoSave: false,
        isSubmission: true,
        isRealTime: false,
        section: 'profile'
      });

      console.log('Submission validation result:', validationResult);

      if (!validationResult.isValid) {
        setErrors(validationResult.errors);
        toast({
          title: "Validation Error",
          description: "Please fix the errors below to continue.",
          variant: "destructive",
        });
        return;
      }

      // Prepare data for submission using sanitized data from validation
      const submissionData: any = {
        ...validationResult.sanitizedData,
        section_1_completed: true
      };

      console.log('Submitting profile data:', submissionData);

      await updateProfileData('profile', submissionData);
      
      toast({
        title: "Success!",
        description: "Basic profile completed successfully.",
      });

      setCurrentStep(2);
      
    } catch (error) {
      console.error('Profile submission error:', error);
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check form validity using the validation function with current form data
  const isFormValid = isReadyForSubmission(formData, 'profile');

  return (
    <div className="space-y-6">
      {/* Profile Picture Upload */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              {formData.avatar_url ? (
                <img
                  src={formData.avatar_url}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border-4 border-primary/20"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center border-4 border-primary/20">
                  <User className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">Profile Picture</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Upload a profile picture to personalize your account.
              </p>
              <label htmlFor="avatar-upload">
                <Button variant="outline" size="sm" disabled={uploading} asChild>
                  <span className="cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading ? 'Uploading...' : 'Upload Photo'}
                  </span>
                </Button>
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                placeholder="Enter your full name"
                className={errors.some(e => e.includes('Full name')) ? 'border-destructive' : ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="your.email@example.com"
                className={errors.some(e => e.includes('email')) ? 'border-destructive' : ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="age">Age *</Label>
              <Input
                id="age"
                type="number"
                value={formData.age}
                onChange={(e) => handleInputChange('age', e.target.value)}
                placeholder="25"
                min="13"
                max="120"
                className={errors.some(e => e.includes('Age')) ? 'border-destructive' : ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender *</Label>
              <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                <SelectTrigger className={errors.some(e => e.includes('Gender')) ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="non-binary">Non-binary</SelectItem>
                  <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                placeholder="United States"
                className={errors.some(e => e.includes('Country')) ? 'border-destructive' : ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="New York"
                className={errors.some(e => e.includes('City')) ? 'border-destructive' : ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone *</Label>
              <Select value={formData.timezone} onValueChange={(value) => handleInputChange('timezone', value)}>
                <SelectTrigger className={errors.some(e => e.includes('Timezone')) ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC-12:00">UTC-12:00 (Baker Island)</SelectItem>
                  <SelectItem value="UTC-11:00">UTC-11:00 (Hawaii)</SelectItem>
                  <SelectItem value="UTC-10:00">UTC-10:00 (Alaska)</SelectItem>
                  <SelectItem value="UTC-09:00">UTC-09:00 (Pacific)</SelectItem>
                  <SelectItem value="UTC-08:00">UTC-08:00 (Mountain)</SelectItem>
                  <SelectItem value="UTC-07:00">UTC-07:00 (Central)</SelectItem>
                  <SelectItem value="UTC-06:00">UTC-06:00 (Eastern)</SelectItem>
                  <SelectItem value="UTC-05:00">UTC-05:00 (Colombia)</SelectItem>
                  <SelectItem value="UTC-04:00">UTC-04:00 (Atlantic)</SelectItem>
                  <SelectItem value="UTC-03:00">UTC-03:00 (Brazil)</SelectItem>
                  <SelectItem value="UTC-02:00">UTC-02:00 (Mid-Atlantic)</SelectItem>
                  <SelectItem value="UTC-01:00">UTC-01:00 (Azores)</SelectItem>
                  <SelectItem value="UTC+00:00">UTC+00:00 (London, Dublin)</SelectItem>
                  <SelectItem value="UTC+01:00">UTC+01:00 (Paris, Berlin)</SelectItem>
                  <SelectItem value="UTC+02:00">UTC+02:00 (Cairo, Helsinki)</SelectItem>
                  <SelectItem value="UTC+03:00">UTC+03:00 (Moscow, Nairobi)</SelectItem>
                  <SelectItem value="UTC+04:00">UTC+04:00 (Dubai, Baku)</SelectItem>
                  <SelectItem value="UTC+05:00">UTC+05:00 (Karachi, Tashkent)</SelectItem>
                  <SelectItem value="UTC+06:00">UTC+06:00 (Dhaka, Almaty)</SelectItem>
                  <SelectItem value="UTC+07:00">UTC+07:00 (Bangkok, Jakarta)</SelectItem>
                  <SelectItem value="UTC+08:00">UTC+08:00 (Beijing, Singapore)</SelectItem>
                  <SelectItem value="UTC+09:00">UTC+09:00 (Tokyo, Seoul)</SelectItem>
                  <SelectItem value="UTC+10:00">UTC+10:00 (Sydney, Melbourne)</SelectItem>
                  <SelectItem value="UTC+11:00">UTC+11:00 (Solomon Islands)</SelectItem>
                  <SelectItem value="UTC+12:00">UTC+12:00 (Auckland, Fiji)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio (Optional)</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="Tell us a bit about yourself..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Error Messages */}
      {errors.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <h4 className="text-sm font-medium text-destructive mb-2">Please fix the following errors:</h4>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index} className="text-sm text-destructive">{error}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Continue Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleNext} 
          disabled={isSubmitting}
          className="min-w-[120px]"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
              Saving...
            </>
          ) : (
            <>
              Continue
              <ChevronRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>

      {/* Progress Indicator */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {isFormValid ? (
            <span className="text-green-600 font-medium">✓ All required fields completed</span>
          ) : (
            <span>Complete all required fields to continue</span>
          )}
        </p>
      </div>
    </div>
  );
};

export default BasicProfileSection;
