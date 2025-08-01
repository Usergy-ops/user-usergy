
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, ExternalLink, Globe, UserCheck, Building2 } from 'lucide-react';
import { assignAccountTypeByDomain } from '@/utils/accountTypeUtils';

export const AuthTestHelper: React.FC = () => {
  const [testEmail, setTestEmail] = useState('');
  const [testUserId, setTestUserId] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [isTestingAssignment, setIsTestingAssignment] = useState(false);

  const testDomainAssignment = async () => {
    if (!testEmail || !testUserId) {
      alert('Please provide both email and user ID for testing');
      return;
    }

    setIsTestingAssignment(true);
    setTestResult(null);

    try {
      const result = await assignAccountTypeByDomain(testUserId, testEmail);
      setTestResult(result);
    } catch (error) {
      console.error('Error testing assignment:', error);
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsTestingAssignment(false);
    }
  };

  const testScenarios = [
    {
      id: 'user-domain',
      email: 'test@user.usergy.ai',
      expected: 'user',
      description: 'User domain signup',
      icon: <UserCheck className="h-4 w-4" />
    },
    {
      id: 'client-domain',
      email: 'test@client.usergy.ai', 
      expected: 'client',
      description: 'Client domain signup',
      icon: <Building2 className="h-4 w-4" />
    },
    {
      id: 'external-email',
      email: 'user@gmail.com',
      expected: 'client',
      description: 'External email (defaults to client)',
      icon: <Globe className="h-4 w-4" />
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Authentication Test Helper</h2>
        <p className="text-muted-foreground">
          Tools for testing and debugging account type assignment
        </p>
      </div>

      <Tabs defaultValue="manual-test" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual-test">Manual Testing</TabsTrigger>
          <TabsTrigger value="test-scenarios">Test Scenarios</TabsTrigger>
        </TabsList>

        <TabsContent value="manual-test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manual Account Type Assignment Test</CardTitle>
              <CardDescription>
                Test the assign_account_type_by_domain function with custom parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="test-email">Test Email</Label>
                  <Input
                    id="test-email"
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="user@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="test-user-id">Test User ID</Label>
                  <Input
                    id="test-user-id"
                    value={testUserId}
                    onChange={(e) => setTestUserId(e.target.value)}
                    placeholder="uuid-format-user-id"
                  />
                </div>
              </div>

              <Button
                onClick={testDomainAssignment}
                disabled={isTestingAssignment || !testEmail || !testUserId}
                className="w-full"
              >
                {isTestingAssignment ? 'Testing Assignment...' : 'Test Domain Assignment'}
              </Button>

              {testResult && (
                <Alert variant={testResult.success ? 'default' : 'destructive'}>
                  <div className="flex items-center gap-2">
                    {testResult.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <AlertDescription>
                      {testResult.success ? (
                        <>
                          <strong>Success!</strong> Account type "{testResult.account_type}" assigned.
                          {testResult.message && <span> {testResult.message}</span>}
                        </>
                      ) : (
                        <>
                          <strong>Failed:</strong> {testResult.error}
                        </>
                      )}
                    </AlertDescription>
                  </div>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test-scenarios" className="space-y-4">
          <div className="grid gap-4">
            {testScenarios.map((scenario) => (
              <Card key={scenario.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {scenario.icon}
                    {scenario.description}
                  </CardTitle>
                  <CardDescription>
                    Test with: <code className="bg-muted px-2 py-1 rounded">{scenario.email}</code>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Expected Account Type:</p>
                      <Badge variant="outline">{scenario.expected}</Badge>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setTestEmail(scenario.email);
                        // For demo, generate a mock UUID
                        setTestUserId('00000000-0000-0000-0000-000000000000');
                      }}
                    >
                      Load Scenario
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Alert>
            <ExternalLink className="h-4 w-4" />
            <AlertDescription>
              <strong>Testing Tip:</strong> Load a scenario above, then switch to the "Manual Testing" tab 
              and replace the user ID with a real UUID from your database to test the assignment function.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
};
