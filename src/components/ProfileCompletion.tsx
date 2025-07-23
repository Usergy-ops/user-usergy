
import React, { useState } from 'react';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { ProfileSection1 } from './profile-sections/ProfileSection1';
import { ProfileSection2 } from './profile-sections/ProfileSection2';
import { ProfileSection3 } from './profile-sections/ProfileSection3';
import { ProfileSection4 } from './profile-sections/ProfileSection4';
import { ProfileSection5 } from './profile-sections/ProfileSection5';
import { ProfileSection6 } from './profile-sections/ProfileSection6';
import { Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const ProfileCompletion = () => {
  const { profileCompletion, profileData, loading, updating } = useProfileCompletion();
  const [activeSection, setActiveSection] = useState(1);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const sections = [
    { id: 1, title: 'Basic Information', completed: profileCompletion?.section_1_completed || false },
    { id: 2, title: 'Devices & Products', completed: profileCompletion?.section_2_completed || false },
    { id: 3, title: 'Education & Work', completed: profileCompletion?.section_3_completed || false },
    { id: 4, title: 'AI & Tech Fluency', completed: profileCompletion?.section_4_completed || false },
    { id: 5, title: 'Social Presence', completed: profileCompletion?.section_5_completed || false },
    { id: 6, title: 'Skills & Interests', completed: profileCompletion?.section_6_completed || false }
  ];

  const renderSection = () => {
    switch (activeSection) {
      case 1:
        return <ProfileSection1 data={profileData} />;
      case 2:
        return <ProfileSection2 data={profileData} />;
      case 3:
        return <ProfileSection3 data={profileData} />;
      case 4:
        return <ProfileSection4 data={profileData} />;
      case 5:
        return <ProfileSection5 data={profileData} />;
      case 6:
        return <ProfileSection6 data={profileData} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-start to-primary-end bg-clip-text text-transparent">
            Complete Your Explorer Profile
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Help us understand your expertise and interests to connect you with the right opportunities
          </p>
          <div className="mt-4">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary-start to-primary-end transition-all duration-300"
                  style={{ width: `${profileCompletion?.overall_completion_percentage || 0}%` }}
                />
              </div>
              <span className="text-sm font-medium">
                {profileCompletion?.overall_completion_percentage || 0}%
              </span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-card/80 backdrop-blur-sm rounded-3xl p-6 border border-border/50">
              <h2 className="text-xl font-semibold mb-4">Profile Sections</h2>
              <div className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200",
                      activeSection === section.id
                        ? "bg-primary/10 border border-primary/20 text-primary"
                        : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                        section.completed
                          ? "bg-success text-success-foreground"
                          : activeSection === section.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}>
                        {section.completed ? <Check className="w-4 h-4" /> : section.id}
                      </div>
                      <span className="text-sm font-medium">{section.title}</span>
                    </div>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-card/80 backdrop-blur-sm rounded-3xl p-8 border border-border/50">
              {updating && (
                <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50 rounded-3xl">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span>Updating profile...</span>
                  </div>
                </div>
              )}
              
              {renderSection()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletion;
