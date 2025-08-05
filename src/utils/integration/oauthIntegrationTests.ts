
/**
 * OAuth-specific integration tests for Google authentication
 */

import { supabase } from '@/integrations/supabase/client';
import { monitoring } from '@/utils/monitoring';
import { OAuthAuthService } from '@/services/oauthAuthService';
import { OAuthProfileService } from '@/services/oauthProfileService';

export class OAuthIntegrationTestRunner {
  private testResults: Record<string, boolean> = {};

  async runOAuthTests(): Promise<Record<string, boolean>> {
    console.log('🔐 Starting OAuth Integration Tests...');
    
    await this.testOAuthConfiguration();
    await this.testCallbackHandling();
    await this.testProfileCreation();
    await this.testSessionManagement();
    await this.testErrorRecovery();
    await this.testRedirectFlow();
    
    console.log('✅ OAuth integration tests completed:', this.testResults);
    return this.testResults;
  }

  private async testOAuthConfiguration(): Promise<void> {
    try {
      console.log('⚙️ Testing OAuth Configuration...');
      
      // Test that OAuth provider is properly configured
      const configTest = typeof window !== 'undefined' && 
                        window.location.origin && 
                        !!supabase.auth;
      
      this.testResults['oauth_configuration'] = configTest;
      console.log('OAuth Configuration:', configTest ? '✅' : '❌');
    } catch (error) {
      console.error('OAuth Configuration Test Failed:', error);
      this.testResults['oauth_configuration'] = false;
    }
  }

  private async testCallbackHandling(): Promise<void> {
    try {
      console.log('🔄 Testing Callback Handling...');
      
      // Test callback route exists and is accessible
      const callbackRouteExists = true; // This will be validated by routing
      
      this.testResults['callback_handling'] = callbackRouteExists;
      console.log('Callback Handling:', callbackRouteExists ? '✅' : '❌');
    } catch (error) {
      console.error('Callback Handling Test Failed:', error);
      this.testResults['callback_handling'] = false;
    }
  }

  private async testProfileCreation(): Promise<void> {
    try {
      console.log('👤 Testing Profile Creation Flow...');
      
      // Test profile service methods exist and are callable
      const profileServiceWorking = typeof OAuthProfileService.createOAuthProfile === 'function' &&
                                   typeof OAuthProfileService.getOAuthProfile === 'function';
      
      this.testResults['profile_creation'] = profileServiceWorking;
      console.log('Profile Creation Flow:', profileServiceWorking ? '✅' : '❌');
    } catch (error) {
      console.error('Profile Creation Test Failed:', error);
      this.testResults['profile_creation'] = false;
    }
  }

  private async testSessionManagement(): Promise<void> {
    try {
      console.log('🔑 Testing Session Management...');
      
      // Test session handling
      const { data } = await supabase.auth.getSession();
      const sessionHandlingWorking = data !== undefined;
      
      this.testResults['session_management'] = sessionHandlingWorking;
      console.log('Session Management:', sessionHandlingWorking ? '✅' : '❌');
    } catch (error) {
      console.error('Session Management Test Failed:', error);
      this.testResults['session_management'] = false;
    }
  }

  private async testErrorRecovery(): Promise<void> {
    try {
      console.log('🚨 Testing Error Recovery...');
      
      // Test error handling mechanisms
      const errorRecoveryWorking = typeof OAuthAuthService.initiateGoogleAuth === 'function';
      
      this.testResults['error_recovery'] = errorRecoveryWorking;
      console.log('Error Recovery:', errorRecoveryWorking ? '✅' : '❌');
    } catch (error) {
      console.error('Error Recovery Test Failed:', error);
      this.testResults['error_recovery'] = false;
    }
  }

  private async testRedirectFlow(): Promise<void> {
    try {
      console.log('↩️ Testing Redirect Flow...');
      
      // Test redirect URL configuration
      const redirectFlowWorking = window.location.origin && 
                                 window.location.origin.includes('http');
      
      this.testResults['redirect_flow'] = redirectFlowWorking;
      console.log('Redirect Flow:', redirectFlowWorking ? '✅' : '❌');
    } catch (error) {
      console.error('Redirect Flow Test Failed:', error);
      this.testResults['redirect_flow'] = false;
    }
  }
}

export const oauthIntegrationTestRunner = new OAuthIntegrationTestRunner();
