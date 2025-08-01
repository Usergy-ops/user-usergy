
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AccountTypeDetectionTest } from '@/components/auth/AccountTypeDetectionTest';
import { AuthTestHelper } from '@/components/auth/AuthTestHelper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TestTube, Shield, Users, Settings } from 'lucide-react';

const Testing: React.FC = () => {
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <TestTube className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Testing & Debugging Center</h1>
            <p className="text-lg text-muted-foreground">
              Comprehensive testing tools for URL-based account type detection and authentication systems
            </p>
          </div>
        </div>

        <Alert className="mb-6">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>URL-Based Account Type Assignment:</strong> This system automatically detects and assigns 
            account types based on the signup URL (user.usergy.ai → "user", client.usergy.ai → "client"). 
            The referrer URL is captured during signup and used to determine the correct account type.
          </AlertDescription>
        </Alert>
      </div>

      <Tabs defaultValue="detection-test" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="detection-test" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Detection Test
          </TabsTrigger>
          <TabsTrigger value="auth-helper" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Test Helper
          </TabsTrigger>
          <TabsTrigger value="system-info" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            System Info
          </TabsTrigger>
        </TabsList>

        <TabsContent value="detection-test">
          <AccountTypeDetectionTest />
        </TabsContent>

        <TabsContent value="auth-helper">
          <AuthTestHelper />
        </TabsContent>

        <TabsContent value="system-info" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>Current implementation details and configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold">Account Type Assignment Logic</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">https://user.usergy.ai/</Badge>
                      <span>→ "user" account</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">https://client.usergy.ai/</Badge>
                      <span>→ "client" account</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Other URLs</Badge>
                      <span>→ "client" account (default)</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Database Functions</h4>
                  <div className="space-y-1 text-sm font-mono">
                    <div>• assign_account_type_by_domain()</div>
                    <div>• monitor_account_type_coverage()</div>
                    <div>• fix_existing_users_without_account_types()</div>
                    <div>• handle_unified_signup_with_source()</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">URL Detection Priority</h4>
                  <div className="space-y-1 text-sm">
                    <div><strong>1.</strong> Explicit metadata (account_type, signup_source)</div>
                    <div><strong>2.</strong> Referrer URL analysis (user.usergy.ai vs client.usergy.ai)</div>
                    <div><strong>3.</strong> OAuth context preservation</div>
                    <div><strong>4.</strong> Default fallback to "client"</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Frontend Components</h4>
                  <div className="space-y-1 text-sm">
                    <div>• Enhanced OTP Verification with URL detection</div>
                    <div>• Real-time account type monitoring</div>
                    <div>• Comprehensive testing interface</div>
                    <div>• OAuth URL context preservation</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Testing Instructions</CardTitle>
              <CardDescription>Step-by-step guide for testing URL-based account type detection</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">1. URL-Based Testing</h4>
                  <p className="text-sm text-muted-foreground">
                    Visit https://user.usergy.ai/ or https://client.usergy.ai/ and sign up with OTP verification 
                    or Google OAuth. The system should automatically detect and assign the correct account type 
                    based on the originating URL.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">2. URL Detection Verification</h4>
                  <p className="text-sm text-muted-foreground">
                    Check the "Detection Test" tab above to see real-time URL detection results 
                    and system health metrics. The system analyzes the current URL to determine expected account type.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">3. Manual Function Testing</h4>
                  <p className="text-sm text-muted-foreground">
                    Use the "Test Helper" tab to manually invoke the account type assignment function 
                    with custom email and user ID combinations to verify the database logic.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">4. OAuth URL Preservation</h4>
                  <p className="text-sm text-muted-foreground">
                    Test Google OAuth from both user.usergy.ai and client.usergy.ai to ensure 
                    the referrer URL is properly captured and passed through the OAuth state parameter.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Testing;
