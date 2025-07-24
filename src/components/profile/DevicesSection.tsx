
import React, { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useProfile } from '@/contexts/ProfileContext';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Smartphone, Laptop, Monitor, Mail, Music, Video, Watch, Tablet, Tv, Apple, Zap, Command, Computer } from 'lucide-react';

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
  
  // Use refs for persistent state across tab switches
  const initialLoadComplete = useRef(false);
  const hasFormData = useRef(false);
  
  // Add component-level data persistence
  const [componentMounted, setComponentMounted] = useState(false);

  const { handleSubmit, setValue, watch, reset } = useForm<DevicesFormData>({
    mode: 'onChange',
    shouldFocusError: false
  });

  useEffect(() => {
    setComponentMounted(true);
    return () => setComponentMounted(false);
  }, []);

  // Single, comprehensive useEffect for data loading
  useEffect(() => {
    let isMounted = true;
    
    const loadFormData = async () => {
      if (initialLoadComplete.current) return;
      
      try {
        // Step 1: Check sessionStorage first
        const componentName = 'devices';
        const backupData = sessionStorage.getItem(`usergy_${componentName}_backup`);
        
        if (backupData) {
          try {
            const parsedBackup = JSON.parse(backupData);
            const hasBackupData = Object.values(parsedBackup).some(value => {
              if (Array.isArray(value)) return value.length > 0;
              return false;
            });
            
            if (hasBackupData && isMounted) {
              console.log('Loading devices from sessionStorage backup');
              Object.keys(parsedBackup).forEach(key => {
                setValue(key as keyof DevicesFormData, parsedBackup[key] || [], { shouldDirty: false, shouldTouch: false });
              });
              hasFormData.current = true;
              initialLoadComplete.current = true;
              return;
            }
          } catch (error) {
            console.error('Error parsing devices backup data:', error);
          }
        }
        
        // Step 2: Load from database if no backup
        if (deviceData && Object.keys(deviceData).length > 0 && isMounted) {
          console.log('Loading devices from database');
          setValue('operating_systems', deviceData.operating_systems || [], { shouldDirty: false, shouldTouch: false });
          setValue('devices_owned', deviceData.devices_owned || [], { shouldDirty: false, shouldTouch: false });
          setValue('mobile_manufacturers', deviceData.mobile_manufacturers || [], { shouldDirty: false, shouldTouch: false });
          setValue('desktop_manufacturers', deviceData.desktop_manufacturers || [], { shouldDirty: false, shouldTouch: false });
          setValue('email_clients', deviceData.email_clients || [], { shouldDirty: false, shouldTouch: false });
          setValue('streaming_subscriptions', deviceData.streaming_subscriptions || [], { shouldDirty: false, shouldTouch: false });
          setValue('music_subscriptions', deviceData.music_subscriptions || [], { shouldDirty: false, shouldTouch: false });
          
          hasFormData.current = true;
        }
        
        initialLoadComplete.current = true;
        
      } catch (error) {
        console.error('Error loading devices form data:', error);
      }
    };
    
    loadFormData();
    
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array

  // Auto-save for devices
  useEffect(() => {
    if (!initialLoadComplete.current) return;
    
    let saveTimeout: NodeJS.Timeout;
    
    const subscription = watch((formData) => {
      const hasData = Object.values(formData).some(value => {
        if (Array.isArray(value)) return value.length > 0;
        return false;
      });
      
      if (hasData) {
        hasFormData.current = true;
        
        // Save to sessionStorage immediately
        const componentName = 'devices';
        sessionStorage.setItem(`usergy_${componentName}_backup`, JSON.stringify(formData));
        
        // Debounced database save
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(async () => {
          try {
            const dataToSave: any = {};
            Object.entries(formData).forEach(([key, value]) => {
              if (Array.isArray(value) && value.length > 0) {
                dataToSave[key] = value;
              }
            });
            
            if (Object.keys(dataToSave).length > 0) {
              await updateProfileData('devices', dataToSave);
            }
          } catch (error) {
            console.error('Devices auto-save failed:', error);
          }
        }, 2000);
      }
    });
    
    return () => {
      clearTimeout(saveTimeout);
      subscription.unsubscribe();
    };
  }, [watch, updateProfileData]);

  // Add emergency recovery on focus
  useEffect(() => {
    const handleWindowFocus = () => {
      if (hasFormData.current) {
        // Force re-validate form state
        const componentName = 'devices';
        const backupData = sessionStorage.getItem(`usergy_${componentName}_backup`);
        
        if (backupData) {
          try {
            const parsedBackup = JSON.parse(backupData);
            Object.keys(parsedBackup).forEach(key => {
              const currentValue = watch(key as keyof DevicesFormData);
              if (!currentValue || (Array.isArray(currentValue) && currentValue.length === 0)) {
                setValue(key as keyof DevicesFormData, parsedBackup[key] || [], { shouldDirty: false });
              }
            });
          } catch (error) {
            console.error('Error recovering devices data on focus:', error);
          }
        }
      }
    };
    
    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, [watch, setValue]);

  // Only render form after component is properly mounted
  if (!componentMounted) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading...</p>
        </div>
      </div>
    );
  }

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

  // Updated operating systems with Lucide icons
  const operatingSystems = [
    { value: 'windows', label: 'Windows', icon: Computer },
    { value: 'macos', label: 'macOS', icon: Apple },
    { value: 'linux', label: 'Linux', icon: Command },
    { value: 'android', label: 'Android', icon: Smartphone },
    { value: 'ios', label: 'iOS', icon: Apple }
  ];

  // Updated devices with Watch icon for smartwatch
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
