
import React from 'react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { AccountTypeGuard } from '@/components/auth/AccountTypeGuard';
import { MonitoringDashboard } from '@/components/monitoring/MonitoringDashboard';
import { AccountTypeMonitoring } from '@/components/monitoring/AccountTypeMonitoring';
import { EmailSystemDebug } from '@/components/debugging/EmailSystemDebug';
import { AlertsPanel } from '@/components/monitoring/AlertsPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const SystemMonitoring = () => {
  return (
    <DashboardLayout>
      <AccountTypeGuard allowedTypes={['user']}>
        <div className="container mx-auto py-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              System Monitoring
            </h1>
            <p className="text-lg text-muted-foreground">
              Monitor system health, account types, and debug issues
            </p>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="account-types">Account Types</TabsTrigger>
              <TabsTrigger value="email-debug">Email Debug</TabsTrigger>
              <TabsTrigger value="alerts">Alerts</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <MonitoringDashboard />
            </TabsContent>

            <TabsContent value="account-types">
              <AccountTypeMonitoring />
            </TabsContent>

            <TabsContent value="email-debug">
              <EmailSystemDebug />
            </TabsContent>

            <TabsContent value="alerts">
              <AlertsPanel />
            </TabsContent>
          </Tabs>
        </div>
      </AccountTypeGuard>
    </DashboardLayout>
  );
};

export default SystemMonitoring;
