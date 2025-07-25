
import React from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { CreditCard, DollarSign, Calendar, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Payments: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="max-w-6xl mx-auto p-4 md:p-8">
          
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Payments & Billing
            </h1>
            <p className="text-lg text-muted-foreground">
              Manage your payment methods, view transaction history, and download invoices.
            </p>
          </div>

          {/* Payment Methods */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="bg-card/80 backdrop-blur-sm border border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5" />
                  <span>Payment Methods</span>
                </CardTitle>
                <CardDescription>
                  Add and manage your payment methods
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg bg-muted/20">
                    <div className="flex items-center space-x-3">
                      <CreditCard className="w-6 h-6 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">No payment methods</p>
                        <p className="text-xs text-muted-foreground">Add a payment method to get started</p>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full" variant="outline">
                    Add Payment Method
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/80 backdrop-blur-sm border border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5" />
                  <span>Billing Summary</span>
                </CardTitle>
                <CardDescription>
                  Your current billing status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Current Balance</span>
                    <span className="text-2xl font-bold text-foreground">$0.00</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Next Payment</span>
                    <span className="text-sm text-foreground">No upcoming payments</span>
                  </div>
                  <Button className="w-full" variant="outline">
                    View Billing Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transaction History */}
          <Card className="bg-card/80 backdrop-blur-sm border border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Transaction History</span>
              </CardTitle>
              <CardDescription>
                View your payment and earning history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No transactions yet</h3>
                <p className="text-muted-foreground mb-4">
                  Your payment history will appear here once you start participating in projects.
                </p>
                <Button variant="outline" className="flex items-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span>Download Statement</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Payments;
