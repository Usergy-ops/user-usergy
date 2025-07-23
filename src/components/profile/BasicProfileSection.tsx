
import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useProfile } from '@/contexts/ProfileContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Upload, User } from 'lucide-react';

interface BasicProfileFormData {
  full_name: string;
  phone_number: string;
  date_of_birth: string;
  age: number;
  gender: string;
  country: string;
  city: string;
  timezone: string;
}

export const BasicProfileSection: React.FC = () => {
  const { profileData, updateProfileData, uploadProfilePicture, setCurrentStep, currentStep } = useProfile();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<BasicProfileFormData>({
    defaultValues: {
      full_name: profileData.full_name || '',
      phone_number: profileData.phone_number || '',
      date_of_birth: profileData.date_of_birth || '',
      age: profileData.age || 0,
      gender: profileData.gender || '',
      country: profileData.country || '',
      city: profileData.city || '',
      timezone: profileData.timezone || '',
    }
  });

  const countries = [
    "Afghanistan", "Albania", "Algeria", "Argentina", "Armenia", "Australia",
    "Austria", "Azerbaijan", "Bahrain", "Bangladesh", "Belarus", "Belgium",
    "Bolivia", "Brazil", "Bulgaria", "Cambodia", "Canada", "Chile", "China",
    "Colombia", "Croatia", "Czech Republic", "Denmark", "Ecuador", "Egypt",
    "Estonia", "Ethiopia", "Finland", "France", "Georgia", "Germany", "Ghana",
    "Greece", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq",
    "Ireland", "Israel", "Italy", "Japan", "Jordan", "Kazakhstan", "Kenya",
    "Kuwait", "Latvia", "Lebanon", "Lithuania", "Malaysia", "Mexico",
    "Morocco", "Netherlands", "New Zealand", "Nigeria", "Norway", "Pakistan",
    "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia",
    "Saudi Arabia", "Singapore", "South Africa", "South Korea", "Spain",
    "Sri Lanka", "Sweden", "Switzerland", "Thailand", "Turkey", "Ukraine",
    "United Arab Emirates", "United Kingdom", "United States", "Uruguay",
    "Venezuela", "Vietnam"
  ];

  const timezones = [
    { value: "GMT-12:00", label: "(GMT-12:00) International Date Line West" },
    { value: "GMT-11:00", label: "(GMT-11:00) Midway Island, Samoa" },
    { value: "GMT-10:00", label: "(GMT-10:00) Hawaii" },
    { value: "GMT-09:00", label: "(GMT-09:00) Alaska" },
    { value: "GMT-08:00", label: "(GMT-08:00) Pacific Time (US & Canada)" },
    { value: "GMT-07:00", label: "(GMT-07:00) Mountain Time (US & Canada)" },
    { value: "GMT-06:00", label: "(GMT-06:00) Central Time (US & Canada)" },
    { value: "GMT-05:00", label: "(GMT-05:00) Eastern Time (US & Canada)" },
    { value: "GMT-04:00", label: "(GMT-04:00) Atlantic Time (Canada)" },
    { value: "GMT-03:30", label: "(GMT-03:30) Newfoundland" },
    { value: "GMT-03:00", label: "(GMT-03:00) Brazil, Buenos Aires" },
    { value: "GMT-02:00", label: "(GMT-02:00) Mid-Atlantic" },
    { value: "GMT-01:00", label: "(GMT-01:00) Azores, Cape Verde Islands" },
    { value: "GMT+00:00", label: "(GMT+00:00) Western Europe Time, London" },
    { value: "GMT+01:00", label: "(GMT+01:00) Central Europe Time, Paris" },
    { value: "GMT+02:00", label: "(GMT+02:00) Eastern Europe Time, Cairo" },
    { value: "GMT+03:00", label: "(GMT+03:00) Baghdad, Riyadh, Moscow" },
    { value: "GMT+03:30", label: "(GMT+03:30) Tehran" },
    { value: "GMT+04:00", label: "(GMT+04:00) Abu Dhabi, Muscat, Baku" },
    { value: "GMT+04:30", label: "(GMT+04:30) Kabul" },
    { value: "GMT+05:00", label: "(GMT+05:00) Ekaterinburg, Islamabad" },
    { value: "GMT+05:30", label: "(GMT+05:30) Bombay, Calcutta, Madras, New Delhi" },
    { value: "GMT+05:45", label: "(GMT+05:45) Kathmandu" },
    { value: "GMT+06:00", label: "(GMT+06:00) Almaty, Dhaka, Colombo" },
    { value: "GMT+07:00", label: "(GMT+07:00) Bangkok, Hanoi, Jakarta" },
    { value: "GMT+08:00", label: "(GMT+08:00) Beijing, Perth, Singapore" },
    { value: "GMT+09:00", label: "(GMT+09:00) Tokyo, Seoul, Osaka" },
    { value: "GMT+09:30", label: "(GMT+09:30) Adelaide, Darwin" },
    { value: "GMT+10:00", label: "(GMT+10:00) Eastern Australia, Guam" },
    { value: "GMT+11:00", label: "(GMT+11:00) Magadan, Solomon Islands" },
    { value: "GMT+12:00", label: "(GMT+12:00) Auckland, Wellington, Fiji" }
  ];

  const isSectionComplete = () => {
    const formData = watch();
    return !!(
      formData.full_name?.trim() &&
      formData.phone_number?.trim() &&
      formData.age &&
      formData.gender &&
      formData.country &&
      formData.city?.trim() &&
      formData.timezone &&
      profileData.avatar_url
    );
  };

  const onSubmit = async (data: BasicProfileFormData) => {
    try {
      await updateProfileData('profile', {
        ...data,
        section_1_completed: true
      });
      
      toast({
        title: "Basic profile saved!",
        description: "Your basic information has been updated successfully.",
      });

      // Move to next step
      setCurrentStep(currentStep + 1);
    } catch (error) {
      toast({
        title: "Error saving profile",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please choose an image smaller than 5MB.",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploading(true);
      const avatarUrl = await uploadProfilePicture(file);
      
      await updateProfileData('profile', {
        avatar_url: avatarUrl
      });

      toast({
        title: "Profile picture updated!",
        description: "Your new profile picture has been saved.",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Let's get to know you
        </h3>
        <p className="text-muted-foreground">
          Tell us about yourself so we can create your perfect Explorer profile
        </p>
      </div>

      {/* Profile Picture Upload */}
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <Avatar className="w-24 h-24 border-4 border-primary/20">
            <AvatarImage src={profileData.avatar_url} />
            <AvatarFallback className="bg-gradient-to-br from-primary-start to-primary-end text-white text-2xl">
              <User className="w-8 h-8" />
            </AvatarFallback>
          </Avatar>
          
          <Button
            type="button"
            size="sm"
            className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="w-4 h-4" />
          </Button>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/jpg"
          onChange={handleFileUpload}
          className="hidden"
        />
        
        <p className="text-sm text-muted-foreground text-center">
          Click to upload your profile picture <span className="text-red-500">*</span><br />
          <span className="text-xs">JPG, PNG up to 5MB</span>
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="full_name" className="text-sm font-medium">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="full_name"
              {...register('full_name', { required: 'Full name is required' })}
              className="bg-background"
              placeholder="Your full name"
            />
            {errors.full_name && (
              <p className="text-sm text-destructive">{errors.full_name.message}</p>
            )}
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phone_number" className="text-sm font-medium">
              Phone Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="phone_number"
              {...register('phone_number', { required: 'Phone number is required' })}
              className="bg-background"
              placeholder="+1 (555) 123-4567"
              type="tel"
            />
            {errors.phone_number && (
              <p className="text-sm text-destructive">{errors.phone_number.message}</p>
            )}
          </div>

          {/* Date of Birth */}
          <div className="space-y-2">
            <Label htmlFor="date_of_birth" className="text-sm font-medium">
              Date of Birth
            </Label>
            <Input
              id="date_of_birth"
              {...register('date_of_birth')}
              className="bg-background"
              type="date"
            />
          </div>

          {/* Age */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Age <span className="text-red-500">*</span>
            </Label>
            <Select 
              value={watch('age')?.toString() || ''} 
              onValueChange={(value) => setValue('age', parseInt(value))}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select your age" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 83 }, (_, i) => i + 18).map(age => (
                  <SelectItem key={age} value={age.toString()}>{age}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Gender <span className="text-red-500">*</span>
            </Label>
            <Select 
              value={watch('gender')} 
              onValueChange={(value) => setValue('gender', value)}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="non-binary">Non-binary</SelectItem>
                <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Country */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Country <span className="text-red-500">*</span>
            </Label>
            <Select 
              value={watch('country')} 
              onValueChange={(value) => setValue('country', value)}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* City */}
          <div className="space-y-2">
            <Label htmlFor="city" className="text-sm font-medium">
              City <span className="text-red-500">*</span>
            </Label>
            <Input
              id="city"
              {...register('city', { required: 'City is required' })}
              className="bg-background"
              placeholder="Your city"
            />
            {errors.city && (
              <p className="text-sm text-destructive">{errors.city.message}</p>
            )}
          </div>

          {/* Timezone */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Timezone <span className="text-red-500">*</span>
            </Label>
            <Select 
              value={watch('timezone')} 
              onValueChange={(value) => setValue('timezone', value)}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select your timezone" />
              </SelectTrigger>
              <SelectContent>
                {timezones.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button 
            type="submit" 
            disabled={!isSectionComplete()}
            className="bg-gradient-to-r from-primary-start to-primary-end hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save & Continue
          </Button>
        </div>
      </form>
    </div>
  );
};
