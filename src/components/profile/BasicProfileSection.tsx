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
  gender: string;
  country: string;
  city: string;
}

export const BasicProfileSection: React.FC = () => {
  const { profileData, updateProfileData, uploadProfilePicture } = useProfile();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<BasicProfileFormData>({
    defaultValues: {
      full_name: profileData.full_name || '',
      phone_number: profileData.phone_number || '',
      date_of_birth: profileData.date_of_birth || '',
      gender: profileData.gender || '',
      country: profileData.country || '',
      city: profileData.city || '',
    }
  });

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

  const countries = [
    "United States", "Canada", "United Kingdom", "Germany", "France", "Australia", 
    "Japan", "Singapore", "Netherlands", "Sweden", "Other"
  ];

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
          Click to upload your profile picture<br />
          <span className="text-xs">JPG, PNG up to 5MB</span>
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="full_name" className="text-sm font-medium">
              Full Name *
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
              Phone Number
            </Label>
            <Input
              id="phone_number"
              {...register('phone_number')}
              className="bg-background"
              placeholder="+1 (555) 123-4567"
              type="tel"
            />
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

          {/* Gender */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Gender</Label>
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
            <Label className="text-sm font-medium">Country *</Label>
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
              City
            </Label>
            <Input
              id="city"
              {...register('city')}
              className="bg-background"
              placeholder="Your city"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button 
            type="submit" 
            className="bg-gradient-to-r from-primary-start to-primary-end hover:opacity-90"
          >
            Save & Continue
          </Button>
        </div>
      </form>
    </div>
  );
};