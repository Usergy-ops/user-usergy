
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useAccountType } from '@/hooks/useAccountType';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User, Building, TestTube, Database, Trash2, CheckCircle } from 'lucide-react';

export const AuthTestHelper: React.FC = () => {
  const [testEmail, setTestEmail] = useState('');
  const [testPassword, setTestPassword] = useState('test123456');
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  
  const { user, signUp, signIn, signOut } = useAuth();
  const { accountType, isUser, isClient } = useAccountType();
  const { toast } = useToast();

  const runSignupTest = async (emailPrefix: string, expectedType: 'user' | 'client') => {
    const testEmail = `${emailPrefix}+${Date.now()}@test.com`;
    setIsLoading(true);
    
    try {
      // Simulate different contexts by manipulating the URL
      const originalUrl = window.location.href;
      const originalSearch = window.location.search;
      
      // Test URL parameter approach
      const testUrl = expectedType === 'user' ? 
        `${window.location.origin}/?type=user` : 
        `${window.location.origin}/?type=client`;
      
      // Update URL for test
      window.history.replaceState({}, '', testUrl);
      
      const result = await signUp(testEmail, testPassword, {
        signup_source: expectedType === 'user' ? 'enhanced_user_signup' : 'enhanced_client_signup',
        account_type: expectedType
      });
      
      // Restore original URL
      window.history.replaceState({}, '', originalUrl + originalSearch);
      
      const testResult = {
        timestamp: new Date().toISOString(),
        email: testEmail,
        expectedType,
        result: result.error ? 'Error' : 'OTP Sent',
        error: result.error,
        passed: !result.error
      };
      
      setTestResults(prev => [testResult, ...prev]);
      
      if (result.error) {
        toast({
          title: "Test Failed",
          description: result.error,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Test Passed",
          description: `OTP sent for ${expectedType} account creation`,
        });
      }
      
    } catch (error) {
      const testResult = {
        timestamp: new Date().toISOString(),
        email: testEmail,
        expectedType,
        result: 'Exception',
        error: error.message,
        passed: false
      };
      
      setTestResults(prev => [testResult, ...prev]);
      
      toast({
        title: "Test Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkAccountType = async () => {
    if (!user) {
      toast({
        title: "No User",
        description: "Please sign in to check account type",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase.rpc('get_user_account_type', {
        user_id_param: user.id
      });

      if (error) {
        toast({
          title: "Database Error",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Account Type Check",
        description: `Database says: ${data || 'null'}, Context says: ${accountType}`,
      });

    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  const testCurrentContext = () => {
    const currentUrl = window.location.href;
    const currentHost = window.location.host;
    const referrerUrl = document.referrer || currentUrl;
    const urlParams = new URLSearchParams(window.location.search);
    
    // Determine account type and signup source
    let accountType = 'client';
    let signupSource = 'enhanced_auth_form';
    
    if (urlParams.get('type') === 'user' || urlParams.get('accountType') === 'user') {
      accountType = 'user';
      signupSource = 'enhanced_user_signup';
    } else if (urlParams.get('type') === 'client' || urlParams.get('accountType') === 'client') {
      accountType = 'client';
      signupSource = 'enhanced_client_signup';
    } else if (currentHost.includes('user.usergy.ai')) {
      accountType = 'user';
      signupSource = 'enhanced_user_signup';
    } else if (currentHost.includes('client.usergy.ai')) {
      accountType = 'client';
      signupSource = 'enhanced_client_signup';
    } else if (currentUrl.includes('/user') || referrerUrl.includes('user.usergy.ai')) {
      accountType = 'user';
      signupSource = 'enhanced_user_signup';
    } else if (currentUrl.includes('/client') || referrerUrl.includes('client.usergy.ai')) {
      accountType = 'client';
      signupSource = 'enhanced_client_signup';
    }
    
    const contextResult = {
      timestamp: new Date().toISOString(),
      email: 'context-test',
      expectedType: accountType as 'user' | 'client',
      result: 'Context Detection',
      error: null,
      passed: true,
      context: {
        currentUrl,
        currentHost,
        referrerUrl,
        urlParams: Object.fromEntries(urlParams),
        detectedAccountType: accountType,
        signupSource
      }
    };
    
    setTestResults(prev => [contextResult, ...prev]);
    
    toast({
      title: "Context Detected",
      description: `Current context would create: ${accountType}`,
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="w-5 h-5" />
          Authentication Testing Helper
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Current User Status */}
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Current User Status</h3>
          {user ? (
            <div className="space-y-2">
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>User ID:</strong> {user.id}</p>
              <div className="flex items-center gap-2">
                <strong>Account Type:</strong>
                {accountType ? (
                  <Badge variant={isUser ? "default" : "secondary"}>
                    {isUser ? (
                      <>
                        <User className="w-3 h-3 mr-1" />
                        User
                      </>
                    ) : (
                      <>
                        <Building className="w-3 h-3 mr-1" />
                        Client
                      </>
                    )}
                  </Badge>
                ) : (
                  <Badge variant="outline">Unknown</Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button onClick={checkAccountType} size="sm" variant="outline">
                  <Database className="w-4 h-4 mr-1" />
                  Check DB
                </Button>
                <Button onClick={signOut} size="sm" variant="destructive">
                  Sign Out
                </Button>
              </div>
            </div>
          ) : (
            <p>Not signed in</p>
          )}
        </div>

        <Separator />

        {/* Context Testing */}
        <div className="space-y-4">
          <h3 className="font-semibold">Context Detection</h3>
          <div className="flex gap-2">
            <Button onClick={testCurrentContext} variant="outline">
              Test Current Context
            </Button>
          </div>
          <Alert>
            <AlertDescription>
              <div className="text-sm">
                <p><strong>Current URL:</strong> {window.location.href}</p>
                <p><strong>Host:</strong> {window.location.host}</p>
                <p><strong>Search:</strong> {window.location.search || 'none'}</p>
                <p><strong>Referrer:</strong> {document.referrer || 'none'}</p>
              </div>
            </AlertDescription>
          </Alert>
        </div>

        <Separator />

        {/* Signup Testing */}
        <div className="space-y-4">
          <h3 className="font-semibold">Signup Testing</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={() => runSignupTest('user-test', 'user')}
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              Test User Signup
            </Button>
            <Button 
              onClick={() => runSignupTest('client-test', 'client')}
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Building className="w-4 h-4" />
              Test Client Signup
            </Button>
          </div>
        </div>

        <Separator />

        {/* Custom Testing */}
        <div className="space-y-4">
          <h3 className="font-semibold">Custom Test</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="testEmail">Test Email</Label>
              <Input
                id="testEmail"
                placeholder="test@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="testPassword">Test Password</Label>
              <Input
                id="testPassword"
                type="password"
                value={testPassword}
                onChange={(e) => setTestPassword(e.target.value)}
              />
            </div>
          </div>
          <Button 
            onClick={() => runSignupTest(testEmail.split('@')[0] || 'custom', 'client')}
            disabled={isLoading || !testEmail}
          >
            Test Custom Signup
          </Button>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Test Results</h3>
                <Button onClick={clearTestResults} size="sm" variant="outline">
                  <Trash2 className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {testResults.map((result, index) => (
                  <div key={index} className="border rounded p-3 text-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {result.passed ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="font-medium">{result.email}</span>
                      </div>
                      <Badge variant={result.passed ? "default" : "destructive"}>
                        {result.expectedType}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                      <div>
                        <strong>Result:</strong> {result.result}
                      </div>
                      <div>
                        <strong>Time:</strong> {new Date(result.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    
                    {result.error && (
                      <div className="mt-2 text-xs text-red-500">
                        <strong>Error:</strong> {result.error}
                      </div>
                    )}
                    
                    {result.context && (
                      <details className="mt-2">
                        <summary className="text-xs cursor-pointer">Context</summary>
                        <pre className="text-xs mt-1 bg-muted p-2 rounded overflow-x-auto">
                          {JSON.stringify(result.context, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
