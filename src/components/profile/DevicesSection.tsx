
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useProfile } from '@/contexts/ProfileContext';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Smartphone, Laptop, Monitor, Mail, Music, Video, Watch, Tablet, Tv, Apple, Command, Computer } from 'lucide-react';

interface DevicesFormData {
  operating_systems: string[];
  devices_owned: string[];
  mobile_manufacturers: string[];
  desktop_manufacturers: string[];
  email_clients: string[];
  streaming_subscriptions: string[];
  music_subscriptions: string[];
}

export const DevicesSection: React.FC = () => {
  const { deviceData, updateProfileData, setCurrentStep, currentStep } = useProfile();
  const { toast } = useToast();

  const { handleSubmit, setValue, watch } = useForm<DevicesFormData>({
    defaultValues: {
      operating_systems: deviceData.operating_systems || [],
      devices_owned: deviceData.devices_owned || [],
      mobile_manufacturers: deviceData.mobile_manufacturers || [],
      desktop_manufacturers: deviceData.desktop_manufacturers || [],
      email_clients: deviceData.email_clients || [],
      streaming_subscriptions: deviceData.streaming_subscriptions || [],
      music_subscriptions: deviceData.music_subscriptions || [],
    }
  });

  // Auto-save with debounce
  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      if (type === 'change') {
        const timeoutId = setTimeout(async () => {
          try {
            const dataToSave: any = {};
            Object.entries(value).forEach(([key, val]) => {
              if (Array.isArray(val) && val.length > 0) {
                dataToSave[key] = val;
              }
            });
            
            if (Object.keys(dataToSave).length > 0) {
              await updateProfileData('devices', dataToSave);
            }
          } catch (error) {
            console.error('Auto-save failed:', error);
          }
        }, 1000);

        return () => clearTimeout(timeoutId);
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, updateProfileData]);

  const isSectionComplete = () => {
    const formData = watch();
    return !!(
      formData.operating_systems?.length &&
      formData.devices_owned?.length &&
      formData.mobile_manufacturers?.length &&
      formData.email_clients?.length
    );
  };

  const onSubmit = async (data: DevicesFormData) => {
    try {
      await updateProfileData('devices', data);
      await updateProfileData('profile', { section_2_completed: true });
      
      toast({
        title: "Device preferences saved!",
        description: "Your tech ecosystem has been updated successfully.",
      });

      setCurrentStep(currentStep + 1);
    } catch (error) {
      toast({
        title: "Error saving preferences",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCheckboxChange = (field: keyof DevicesFormData, value: string, checked: boolean) => {
    const current = watch(field) || [];
    if (checked) {
      setValue(field, [...current, value] as any);
    } else {
      setValue(field, current.filter(item => item !== value) as any);
    }
  };

  // Operating systems with icons
  const operatingSystems = [
    { value: 'windows', label: 'Windows', icon: Computer },
    { value: 'macos', label: 'macOS', icon: Apple },
    { value: 'linux', label: 'Linux', icon: Command },
    { value: 'android', label: 'Android', icon: Smartphone },
    { value: 'ios', label: 'iOS', icon: Apple }
  ];

  // Devices with icons
  const devices = [
    { value: 'smartphone', label: 'Smartphone', icon: Smartphone },
    { value: 'laptop', label: 'Laptop', icon: Laptop },
    { value: 'desktop', label: 'Desktop', icon: Monitor },
    { value: 'tablet', label: 'Tablet', icon: Tablet },
    { value: 'smartwatch', label: 'Smartwatch', icon: Watch },
    { value: 'smart-tv', label: 'Smart TV', icon: Tv }
  ];

  const mobileManufacturers = [
    'Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi', 'Huawei', 'Sony', 'Other'
  ];

  const desktopManufacturers = [
    'Apple', 'Dell', 'HP', 'Lenovo', 'ASUS', 'Microsoft', 'Custom Built', 'Other'
  ];

  const emailClients = [
    'Gmail', 'Outlook', 'Apple Mail', 'Thunderbird', 'Yahoo Mail', 'Other'
  ];

  const streamingServices = [
    'Netflix', 'Disney+', 'Amazon Prime', 'Hulu', 'HBO Max', 'YouTube Premium', 'Apple TV+', 'Other'
  ];

  const musicServices = [
    'Spotify', 'Apple Music', 'YouTube Music', 'Amazon Music', 'Pandora', 'Tidal', 'Other'
  ];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Your Digital World
        </h3>
        <p className="text-muted-foreground">
          Help us understand your tech ecosystem for better product matching
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        {/* Operating Systems */}
        <div className="space-y-4">
          <Label className="text-lg font-medium">
            Operating Systems <span className="text-red-500">*</span>
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {operatingSystems.map((os) => {
              const IconComponent = os.icon;
              return (
                <div key={os.value} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <Checkbox
                    id={`os-${os.value}`}
                    checked={watch('operating_systems')?.includes(os.value)}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange('operating_systems', os.value, checked as boolean)
                    }
                  />
                  <Label htmlFor={`os-${os.value}`} className="flex items-center space-x-2 cursor-pointer">
                    <IconComponent className="w-5 h-5 text-primary" />
                    <span>{os.label}</span>
                  </Label>
                </div>
              );
            })}
          </div>
        </div>

        {/* Devices Owned */}
        <div className="space-y-4">
          <Label className="text-lg font-medium">
            Devices You Own <span className="text-red-500">*</span>
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {devices.map((device) => {
              const IconComponent = device.icon;
              return (
                <div key={device.value} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <Checkbox
                    id={`device-${device.value}`}
                    checked={watch('devices_owned')?.includes(device.value)}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange('devices_owned', device.value, checked as boolean)
                    }
                  />
                  <Label htmlFor={`device-${device.value}`} className="flex items-center space-x-2 cursor-pointer">
                    <IconComponent className="w-5 h-5 text-primary" />
                    <span>{device.label}</span>
                  </Label>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile Manufacturers */}
        <div className="space-y-4">
          <Label className="text-lg font-medium">
            Mobile Device Brands <span className="text-red-500">*</span>
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {mobileManufacturers.map((brand) => (
              <div key={brand} className="flex items-center space-x-2 p-2 border rounded hover:bg-muted/50 transition-colors">
                <Checkbox
                  id={`mobile-${brand}`}
                  checked={watch('mobile_manufacturers')?.includes(brand)}
                  onCheckedChange={(checked) => 
                    handleCheckboxChange('mobile_manufacturers', brand, checked as boolean)
                  }
                />
                <Label htmlFor={`mobile-${brand}`} className="cursor-pointer text-sm">
                  {brand}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop Manufacturers */}
        <div className="space-y-4">
          <Label className="text-lg font-medium flex items-center space-x-2">
            <Monitor className="w-5 h-5 text-primary" />
            <span>Desktop/Laptop Brands</span>
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {desktopManufacturers.map((brand) => (
              <div key={brand} className="flex items-center space-x-2 p-2 border rounded hover:bg-muted/50 transition-colors">
                <Checkbox
                  id={`desktop-${brand}`}
                  checked={watch('desktop_manufacturers')?.includes(brand)}
                  onCheckedChange={(checked) => 
                    handleCheckboxChange('desktop_manufacturers', brand, checked as boolean)
                  }
                />
                <Label htmlFor={`desktop-${brand}`} className="cursor-pointer text-sm">
                  {brand}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Email Clients */}
        <div className="space-y-4">
          <Label className="text-lg font-medium flex items-center space-x-2">
            <Mail className="w-5 h-5 text-primary" />
            <span>Email Clients <span className="text-red-500">*</span></span>
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {emailClients.map((client) => (
              <div key={client} className="flex items-center space-x-2 p-2 border rounded hover:bg-muted/50 transition-colors">
                <Checkbox
                  id={`email-${client}`}
                  checked={watch('email_clients')?.includes(client)}
                  onCheckedChange={(checked) => 
                    handleCheckboxChange('email_clients', client, checked as boolean)
                  }
                />
                <Label htmlFor={`email-${client}`} className="cursor-pointer text-sm">
                  {client}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Streaming & Music Services */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Streaming Services */}
          <div className="space-y-4">
            <Label className="text-lg font-medium flex items-center space-x-2">
              <Video className="w-5 h-5 text-primary" />
              <span>Streaming Services</span>
            </Label>
            <div className="space-y-2">
              {streamingServices.map((service) => (
                <div key={service} className="flex items-center space-x-2">
                  <Checkbox
                    id={`streaming-${service}`}
                    checked={watch('streaming_subscriptions')?.includes(service)}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange('streaming_subscriptions', service, checked as boolean)
                    }
                  />
                  <Label htmlFor={`streaming-${service}`} className="cursor-pointer">
                    {service}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Music Services */}
          <div className="space-y-4">
            <Label className="text-lg font-medium flex items-center space-x-2">
              <Music className="w-5 h-5 text-primary" />
              <span>Music Services</span>
            </Label>
            <div className="space-y-2">
              {musicServices.map((service) => (
                <div key={service} className="flex items-center space-x-2">
                  <Checkbox
                    id={`music-${service}`}
                    checked={watch('music_subscriptions')?.includes(service)}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange('music_subscriptions', service, checked as boolean)
                    }
                  />
                  <Label htmlFor={`music-${service}`} className="cursor-pointer">
                    {service}
                  </Label>
                </div>
              ))}
            </div>
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
