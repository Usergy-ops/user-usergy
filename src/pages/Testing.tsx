
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
              Comprehensive testing tools for account type detection and authentication systems
            </p>
          </div>
        </div>

        <Alert className="mb-6">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Domain-Based Account Type Assignment:</strong> This system automatically detects and assigns 
            account types based on signup domains (user.usergy.ai → "user", client.usergy.ai → "client"). 
            All external emails default to "client" accounts.
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
                      <Badge variant="outline">user.usergy.ai</Badge>
                      <span>→ "user" account</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">client.usergy.ai</Badge>
                      <span>→ "client" account</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">External emails</Badge>
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
                  <h4 className="font-semibold">Trigger Configuration</h4>
                  <div className="space-y-1 text-sm">
                    <div><strong>Trigger:</strong> handle_account_type_assignment_trigger</div>
                    <div><strong>Events:</strong> INSERT OR UPDATE on auth.users</div>
                    <div><strong>Condition:</strong> Email confirmed or OAuth signup</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Frontend Components</h4>
                  <div className="space-y-1 text-sm">
                    <div>• Enhanced OTP Verification with domain detection</div>
                    <div>• Real-time account type monitoring</div>
                    <div>• Comprehensive testing interface</div>
                    <div>• System health diagnostics</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Testing Instructions</CardTitle>
              <CardDescription>Step-by-step guide for testing account type detection</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">1. URL-Based Testing</h4>
                  <p className="text-sm text-muted-foreground">
                    Visit user.usergy.ai or client.usergy.ai and sign up with OTP verification. 
                    The system should automatically detect and assign the correct account type.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">2. Domain Detection</h4>
                  <p className="text-sm text-muted-foreground">
                    Check the "Detection Test" tab above to see real-time domain detection results 
                    and system health metrics.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">3. Manual Function Testing</h4>
                  <p className="text-sm text-muted-foreground">
                    Use the "Test Helper" tab to manually invoke the account type assignment function 
                    with custom email and user ID combinations.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">4. System Health Monitoring</h4>
                  <p className="text-sm text-muted-foreground">
                    Monitor overall system health and coverage percentage. Fix any users missing 
                    account type assignments using the provided tools.
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
