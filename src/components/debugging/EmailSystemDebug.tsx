import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Mail, User, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UserDebugInfo, AccountTypeAssignmentResponse, EmailConfigTestResponse } from '@/types/debug';

export const EmailSystemDebug: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [debugInfo, setDebugInfo] = useState<UserDebugInfo | null>(null);
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const getUserDebugInfo = async () => {
    if (!userId) {
      toast({
        title: "Error",
        description: "Please enter a user ID",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('get_user_debug_info', {
        user_id_param: userId
      });

      if (error) {
        console.error('Error fetching debug info:', error);
        toast({
          title: "Error",
          description: "Failed to fetch user debug information",
          variant: "destructive"
        });
        return;
      }

      // Type assertion since we know the structure from our RPC function
      const typedData = data as unknown as UserDebugInfo;
      setDebugInfo(typedData);

      // Also fetch email logs for this user
      if (typedData?.auth_info?.email) {
        const { data: logs, error: logsError } = await supabase
          .from('email_send_logs')
          .select('*')
          .eq('email', typedData.auth_info.email)
          .order('created_at', { ascending: false })
          .limit(10);

        if (!logsError) {
          setEmailLogs(logs || []);
        }
      }

    } catch (error) {
      console.error('Error in getUserDebugInfo:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const manuallyAssignAccountType = async (accountType: 'user' | 'client') => {
    if (!userId) {
      toast({
        title: "Error",
        description: "Please enter a user ID",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase.rpc('manually_assign_account_type', {
        user_id_param: userId,
        account_type_param: accountType
      });

      if (error) {
        console.error('Error assigning account type:', error);
        toast({
          title: "Error",
          description: "Failed to assign account type",
          variant: "destructive"
        });
        return;
      }

      // Type assertion for the response - first cast to unknown, then to our type
      const typedResponse = data as unknown as AccountTypeAssignmentResponse;
      
      if (typedResponse.success) {
        toast({
          title: "Success",
          description: `Account type set to ${accountType}`,
        });
        
        // Refresh debug info
        getUserDebugInfo();
      } else {
        toast({
          title: "Error",
          description: typedResponse.error || "Failed to assign account type",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Error in manuallyAssignAccountType:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  const testEmailConfiguration = async () => {
    try {
      const { data, error } = await supabase.rpc('test_email_configuration');

      if (error) {
        toast({
          title: "Error",
          description: "Email configuration test failed",
          variant: "destructive"
        });
        return;
      }

      // Type assertion for the response - first cast to unknown, then to our type
      const typedResponse = data as unknown as EmailConfigTestResponse;
      
      toast({
        title: "Email Configuration",
        description: typedResponse.message || "Email system is ready for testing",
      });

    } catch (error) {
      console.error('Error testing email configuration:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred during email test",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Email System Debugging
          </CardTitle>
          <CardDescription>
            Debug email delivery and account type assignment issues
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter User ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="flex-1"
            />
            <Button onClick={getUserDebugInfo} disabled={loading}>
              Get Debug Info
            </Button>
            <Button onClick={testEmailConfiguration} variant="outline">
              Test Email Config
            </Button>
          </div>

          {debugInfo && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Auth Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Auth Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div><strong>Email:</strong> {debugInfo.auth_info?.email}</div>
                  <div><strong>Confirmed:</strong> {
                    debugInfo.auth_info?.email_confirmed_at ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Yes
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-700">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        No
                      </Badge>
                    )
                  }</div>
                  <div><strong>Created:</strong> {debugInfo.auth_info?.created_at && new Date(debugInfo.auth_info.created_at).toLocaleString()}</div>
                  <div><strong>Last Sign In:</strong> {debugInfo.auth_info?.last_sign_in_at && new Date(debugInfo.auth_info.last_sign_in_at).toLocaleString()}</div>
                </CardContent>
              </Card>

              {/* Account Type Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Account Type</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div><strong>Type:</strong> {
                    debugInfo.account_type_info?.account_type ? (
                      <Badge variant="outline">
                        {debugInfo.account_type_info.account_type}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-700">
                        Not Assigned
                      </Badge>
                    )
                  }</div>
                  <div><strong>Assigned:</strong> {debugInfo.account_type_info?.created_at && new Date(debugInfo.account_type_info.created_at).toLocaleString()}</div>
                  
                  <div className="flex gap-2 mt-3">
                    <Button 
                      size="sm" 
                      onClick={() => manuallyAssignAccountType('user')}
                      variant="outline"
                    >
                      Set as User
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => manuallyAssignAccountType('client')}
                      variant="outline"
                    >
                      Set as Client
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* OTP Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Latest OTP
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {debugInfo.otp_info?.email ? (
                    <>
                      <div><strong>Created:</strong> {new Date(debugInfo.otp_info.created_at).toLocaleString()}</div>
                      <div><strong>Expires:</strong> {new Date(debugInfo.otp_info.expires_at).toLocaleString()}</div>
                      <div><strong>Verified:</strong> {debugInfo.otp_info.verified_at ? 'Yes' : 'No'}</div>
                      <div><strong>Attempts:</strong> {debugInfo.otp_info.attempts}</div>
                      <div><strong>Email Sent:</strong> {
                        debugInfo.otp_info.email_sent ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Yes
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 text-red-700">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            No
                          </Badge>
                        )
                      }</div>
                      {debugInfo.otp_info.email_error && (
                        <div><strong>Email Error:</strong> <span className="text-red-600">{debugInfo.otp_info.email_error}</span></div>
                      )}
                    </>
                  ) : (
                    <div>No OTP records found</div>
                  )}
                </CardContent>
              </Card>

              {/* Profile Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {debugInfo.profile_info?.completion_percentage !== undefined ? (
                    <>
                      <div><strong>Completed:</strong> {debugInfo.profile_info.profile_completed ? 'Yes' : 'No'}</div>
                      <div><strong>Completion:</strong> {debugInfo.profile_info.completion_percentage}%</div>
                      <div><strong>Created:</strong> {new Date(debugInfo.profile_info.created_at).toLocaleString()}</div>
                    </>
                  ) : (
                    <div>No profile found</div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Email Logs */}
          {emailLogs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Recent Email Attempts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {emailLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-2 border rounded text-sm">
                      <div>
                        <span className="font-medium">{log.email_type}</span>
                        <span className="text-muted-foreground ml-2">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                      <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                        {log.status}
                      </Badge>
                      {log.error_message && (
                        <div className="text-red-600 text-xs mt-1">{log.error_message}</div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
