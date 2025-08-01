
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAccountType } from '@/hooks/useAccountType';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Building2, Mail, Calendar } from 'lucide-react';

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const { accountType, isClient, loading: accountTypeLoading } = useAccountType();
  const navigate = useNavigate();

  // Redirect logic for authenticated users
  useEffect(() => {
    if (!authLoading && !accountTypeLoading) {
      if (!user) {
        // Not authenticated, redirect to home
        navigate('/');
        return;
      }
      
      if (!isClient) {
        // Not a client account, redirect to appropriate location
        if (accountType === 'user') {
          // User accounts should go to user.usergy.ai
          window.location.href = 'https://user.usergy.ai/profile-completion';
        } else {
          // Unknown account type, redirect to profile completion for detection
          navigate('/profile-completion');
        }
      }
    }
  }, [user, accountType, isClient, authLoading, accountTypeLoading, navigate]);

  if (authLoading || accountTypeLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !isClient) {
    return null; // Will be redirected by useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-start to-primary-end rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-start to-primary-end bg-clip-text text-transparent">
                Client Profile
              </h1>
              <p className="text-muted-foreground">Manage your client account settings</p>
            </div>
          </div>
        </div>

        {/* Profile Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Account Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Account Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Account Type</p>
                  <p className="text-sm text-muted-foreground capitalize">{accountType}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Member Since</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/dashboard')}
              >
                View Dashboard
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/profile-completion')}
              >
                Complete Profile
              </Button>
            </CardContent>
          </Card>

          {/* Profile Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Profile Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Profile Setup</span>
                  <span className="text-sm text-primary">In Progress</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-gradient-to-r from-primary-start to-primary-end h-2 rounded-full w-1/3"></div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Complete your profile to unlock all features
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Welcome Message for Client Accounts */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-semibold">Welcome to Usergy Client Portal</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                As a client account, you have access to powerful tools for gathering user insights 
                and feedback. Get started by completing your profile and exploring our platform.
              </p>
              <div className="flex justify-center space-x-4 pt-4">
                <Button onClick={() => navigate('/profile-completion')}>
                  Complete Profile
                </Button>
                <Button variant="outline" onClick={() => navigate('/dashboard')}>
                  Explore Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
