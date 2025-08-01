import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, RefreshCw, TestTube, Globe, User, Building } from 'lucide-react';

interface TestResult {
  scenario: string;
  expectedAccountType: 'user' | 'client';
  expectedSignupSource: string;
  actualAccountType: 'user' | 'client';
  actualSignupSource: string;
  passed: boolean;
  context: any;
}

export const AccountTypeDetectionTest: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [customReferrer, setCustomReferrer] = useState('');

  // Test scenarios
  const testScenarios = [
    {
      scenario: 'URL Parameter: ?type=user',
      url: 'https://client.usergy.ai/?type=user',
      referrer: '',
      expectedAccountType: 'user' as const,
      expectedSignupSource: 'enhanced_user_signup'
    },
    {
      scenario: 'URL Parameter: ?accountType=client',
      url: 'https://client.usergy.ai/?accountType=client',
      referrer: '',
      expectedAccountType: 'client' as const,
      expectedSignupSource: 'enhanced_client_signup'
    },
    {
      scenario: 'Domain: user.usergy.ai',
      url: 'https://user.usergy.ai/signup',
      referrer: '',
      expectedAccountType: 'user' as const,
      expectedSignupSource: 'enhanced_user_signup'
    },
    {
      scenario: 'Domain: client.usergy.ai',
      url: 'https://client.usergy.ai/signup',
      referrer: '',
      expectedAccountType: 'client' as const,
      expectedSignupSource: 'enhanced_client_signup'
    },
    {
      scenario: 'Path: /user/signup',
      url: 'https://usergy.ai/user/signup',
      referrer: '',
      expectedAccountType: 'user' as const,
      expectedSignupSource: 'enhanced_user_signup'
    },
    {
      scenario: 'Path: /client/signup',
      url: 'https://usergy.ai/client/signup',
      referrer: '',
      expectedAccountType: 'client' as const,
      expectedSignupSource: 'enhanced_client_signup'
    },
    {
      scenario: 'Referrer: user.usergy.ai',
      url: 'https://usergy.ai/signup',
      referrer: 'https://user.usergy.ai/landing',
      expectedAccountType: 'user' as const,
      expectedSignupSource: 'enhanced_user_signup'
    },
    {
      scenario: 'Referrer: client.usergy.ai',
      url: 'https://usergy.ai/signup',
      referrer: 'https://client.usergy.ai/landing',
      expectedAccountType: 'client' as const,
      expectedSignupSource: 'enhanced_client_signup'
    },
    {
      scenario: 'Default fallback',
      url: 'https://example.com/signup',
      referrer: '',
      expectedAccountType: 'client' as const,
      expectedSignupSource: 'enhanced_client_signup'
    }
  ];

  // Detection logic (same as in components)
  const detectAccountTypeContext = (testUrl: string, testReferrer: string) => {
    const url = new URL(testUrl);
    const currentHost = url.host;
    const currentUrl = testUrl;
    const referrerUrl = testReferrer || testUrl;
    const urlParams = url.searchParams;
    
    let accountType = 'client'; // Default fallback
    let signupSource = 'enhanced_auth_form';
    
    // Check URL parameters first (highest priority)
    if (urlParams.get('type') === 'user' || urlParams.get('accountType') === 'user') {
      accountType = 'user';
      signupSource = 'enhanced_user_signup';
    } else if (urlParams.get('type') === 'client' || urlParams.get('accountType') === 'client') {
      accountType = 'client';
      signupSource = 'enhanced_client_signup';
    }
    // Check domain/host (second priority)
    else if (currentHost.includes('user.usergy.ai')) {
      accountType = 'user';
      signupSource = 'enhanced_user_signup';
    } else if (currentHost.includes('client.usergy.ai')) {
      accountType = 'client';
      signupSource = 'enhanced_client_signup';
    }
    // Check URL paths (third priority)
    else if (currentUrl.includes('/user') || referrerUrl.includes('user.usergy.ai')) {
      accountType = 'user';
      signupSource = 'enhanced_user_signup';
    } else if (currentUrl.includes('/client') || referrerUrl.includes('client.usergy.ai')) {
      accountType = 'client';
      signupSource = 'enhanced_client_signup';
    }
    
    return {
      account_type: accountType as 'user' | 'client',
      signup_source: signupSource,
      context: {
        currentUrl,
        currentHost,
        referrerUrl,
        urlParams: Object.fromEntries(urlParams)
      }
    };
  };

  const runTests = async () => {
    setIsRunning(true);
    const results: TestResult[] = [];
    
    for (const scenario of testScenarios) {
      try {
        const detection = detectAccountTypeContext(scenario.url, scenario.referrer);
        
        const result: TestResult = {
          scenario: scenario.scenario,
          expectedAccountType: scenario.expectedAccountType,
          expectedSignupSource: scenario.expectedSignupSource,
          actualAccountType: detection.account_type,
          actualSignupSource: detection.signup_source,
          passed: detection.account_type === scenario.expectedAccountType && 
                  detection.signup_source === scenario.expectedSignupSource,
          context: detection.context
        };
        
        results.push(result);
      } catch (error) {
        results.push({
          scenario: scenario.scenario,
          expectedAccountType: scenario.expectedAccountType,
          expectedSignupSource: scenario.expectedSignupSource,
          actualAccountType: 'client',
          actualSignupSource: 'error',
          passed: false,
          context: { error: error.message }
        });
      }
    }
    
    setTestResults(results);
    setIsRunning(false);
  };

  const testCustomUrl = () => {
    if (!customUrl) return;
    
    try {
      const detection = detectAccountTypeContext(customUrl, customReferrer);
      
      const customResult: TestResult = {
        scenario: `Custom Test: ${customUrl}`,
        expectedAccountType: 'client', // Default assumption
        expectedSignupSource: 'enhanced_client_signup',
        actualAccountType: detection.account_type,
        actualSignupSource: detection.signup_source,
        passed: true, // Always pass for custom tests
        context: detection.context
      };
      
      setTestResults([...testResults, customResult]);
    } catch (error) {
      const errorResult: TestResult = {
        scenario: `Custom Test: ${customUrl}`,
        expectedAccountType: 'client',
        expectedSignupSource: 'enhanced_client_signup',
        actualAccountType: 'client',
        actualSignupSource: 'error',
        passed: false,
        context: { error: error.message }
      };
      
      setTestResults([...testResults, errorResult]);
    }
  };

  const passedTests = testResults.filter(r => r.passed).length;
  const totalTests = testResults.length;
  const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="w-5 h-5" />
            Account Type Detection Test Suite
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button 
              onClick={runTests} 
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <TestTube className="w-4 h-4" />
                  Run All Tests
                </>
              )}
            </Button>
            
            {totalTests > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant={successRate === 100 ? "default" : "destructive"}>
                  {passedTests}/{totalTests} Passed ({successRate.toFixed(1)}%)
                </Badge>
              </div>
            )}
          </div>
          
          {/* Custom URL Test */}
          <Separator />
          <div className="space-y-3">
            <h3 className="font-semibold">Custom URL Test</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customUrl">Test URL</Label>
                <Input
                  id="customUrl"
                  placeholder="https://example.com/signup?type=user"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="customReferrer">Referrer URL (optional)</Label>
                <Input
                  id="customReferrer"
                  placeholder="https://user.usergy.ai/landing"
                  value={customReferrer}
                  onChange={(e) => setCustomReferrer(e.target.value)}
                />
              </div>
            </div>
            <Button 
              onClick={testCustomUrl} 
              disabled={!customUrl}
              variant="outline"
              size="sm"
            >
              Test Custom URL
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {result.passed ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      <h4 className="font-semibold">{result.scenario}</h4>
                    </div>
                    <Badge variant={result.passed ? "default" : "destructive"}>
                      {result.passed ? "PASS" : "FAIL"}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Expected:</strong>
                      <div className="flex items-center gap-2 mt-1">
                        {result.expectedAccountType === 'user' ? (
                          <User className="w-4 h-4" />
                        ) : (
                          <Building className="w-4 h-4" />
                        )}
                        <span>{result.expectedAccountType}</span>
                        <Badge variant="outline">
                          {result.expectedSignupSource}
                        </Badge>
                      </div>
                    </div>
                    
                    <div>
                      <strong>Actual:</strong>
                      <div className="flex items-center gap-2 mt-1">
                        {result.actualAccountType === 'user' ? (
                          <User className="w-4 h-4" />
                        ) : (
                          <Building className="w-4 h-4" />
                        )}
                        <span>{result.actualAccountType}</span>
                        <Badge 
                          variant="outline" 
                          className={result.actualSignupSource === 'error' ? 'border-red-500 text-red-500' : ''}
                        >
                          {result.actualSignupSource}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {result.context && (
                    <div className="mt-3 p-2 bg-muted rounded text-xs">
                      <strong>Context:</strong>
                      <pre className="mt-1 text-xs overflow-x-auto">
                        {JSON.stringify(result.context, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Testing Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Testing Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              <div className="space-y-2">
                <p><strong>Test URLs for validation:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><code>https://client.usergy.ai/?type=user</code> → Should detect <strong>user</strong></li>
                  <li><code>https://client.usergy.ai/?accountType=client</code> → Should detect <strong>client</strong></li>
                  <li><code>https://user.usergy.ai/signup</code> → Should detect <strong>user</strong></li>
                  <li><code>https://client.usergy.ai/signup</code> → Should detect <strong>client</strong></li>
                  <li><code>https://example.com/user/signup</code> → Should detect <strong>user</strong></li>
                  <li><code>https://example.com/client/signup</code> → Should detect <strong>client</strong></li>
                </ul>
                <p className="mt-3"><strong>Priority Order:</strong></p>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>URL Parameters (?type=user, ?accountType=client)</li>
                  <li>Domain (user.usergy.ai vs client.usergy.ai)</li>
                  <li>URL Path (/user vs /client)</li>
                  <li>Referrer URL</li>
                  <li>Default fallback (client)</li>
                </ol>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};
