
import React from 'react';
import { AccountTypeDetectionTest } from '@/components/auth/AccountTypeDetectionTest';

const Testing: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Account Type Detection Testing</h1>
          <p className="text-muted-foreground">
            Test suite for validating account type detection logic across different URL patterns and contexts.
          </p>
        </div>
        
        <AccountTypeDetectionTest />
      </div>
    </div>
  );
};

export default Testing;
