
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User, LogOut, Edit2, Save, X } from 'lucide-react';

interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  profile_completed: boolean;
  created_at: string;
  updated_at: string;
}

export const UserProfile: React.FC = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: ''
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: "Error",
          description: "Failed to load profile information",
          variant: "destructive"
        });
      } else {
        setProfile(data);
        setEditForm({
          first_name: data.first_name || '',
          last_name: data.last_name || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: editForm.first_name,
          last_name: editForm.last_name,
          profile_completed: true
        })
        .eq('id', profile.id);

      if (error) {
        console.error('Error updating profile:', error);
        toast({
          title: "Error",
          description: "Failed to update profile",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully"
        });
        setIsEditing(false);
        fetchProfile();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || ''
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-card usergy-shadow-soft rounded-2xl p-6 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">Profile</h2>
        <button
          onClick={signOut}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Avatar */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="w-10 h-10 text-primary" />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Email</label>
          <div className="p-3 bg-muted rounded-lg text-foreground">
            {profile?.email}
          </div>
        </div>

        {/* First Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">First Name</label>
          {isEditing ? (
            <input
              type="text"
              value={editForm.first_name}
              onChange={(e) => setEditForm(prev => ({ ...prev, first_name: e.target.value }))}
              className="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Enter your first name"
            />
          ) : (
            <div className="p-3 bg-muted rounded-lg text-foreground">
              {profile?.first_name || 'Not set'}
            </div>
          )}
        </div>

        {/* Last Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Last Name</label>
          {isEditing ? (
            <input
              type="text"
              value={editForm.last_name}
              onChange={(e) => setEditForm(prev => ({ ...prev, last_name: e.target.value }))}
              className="w-full p-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Enter your last name"
            />
          ) : (
            <div className="p-3 bg-muted rounded-lg text-foreground">
              {profile?.last_name || 'Not set'}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          {isEditing ? (
            <>
              <button
                onClick={handleSaveProfile}
                className="flex-1 usergy-btn-primary flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={handleCancelEdit}
                className="flex-1 usergy-btn-secondary flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="w-full usergy-btn-secondary flex items-center justify-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
