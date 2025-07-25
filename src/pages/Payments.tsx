
import React, { useState, useEffect } from 'react';
import { Clock, Info, Shield } from 'lucide-react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { BalanceCard } from '@/components/payments/BalanceCard';
import { PayoutConfirmationModal } from '@/components/payments/PayoutConfirmationModal';
import { PaymentHistoryTable } from '@/components/payments/PaymentHistoryTable';
import { SecurityBadge } from '@/components/payments/SecurityBadge';
import { SuccessState } from '@/components/payments/SuccessState';
import { PaymentsSkeleton } from '@/components/payments/PaymentsSkeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/hooks/use-toast';

interface Payment {
  id: string;
  date: Date;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  reference: string;
}

// Mock data for demonstration
const mockPaymentHistory: Payment[] = [
  {
    id: '1',
    date: new Date('2024-01-15'),
    amount: 25,
    status: 'completed',
    reference: 'REF-001'
  },
  {
    id: '2',
    date: new Date('2024-01-10'),
    amount: 15,
    status: 'completed',
    reference: 'REF-002'
  },
  {
    id: '3',
    date: new Date('2024-01-05'),
    amount: 10,
    status: 'pending',
    reference: 'REF-003'
  }
];

const Payments: React.FC = () => {
  const [balance, setBalance] = useState(0);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccessState, setShowSuccessState] = useState(false);

  // Simulate fetching payment data
  useEffect(() => {
    const fetchPaymentData = async () => {
      setIsLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock data - in real app, this would come from API
      setBalance(47.50);
      setPaymentHistory(mockPaymentHistory);
      setIsLoading(false);
    };

    fetchPaymentData();
  }, []);

  const handlePayoutRequest = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Add new pending payment to history
      const newPayment: Payment = {
        id: Date.now().toString(),
        date: new Date(),
        amount: balance,
        status: 'pending',
        reference: `REF-${Date.now().toString().slice(-3)}`
      };
      
      setPaymentHistory(prev => [newPayment, ...prev]);
      setBalance(0); // Reset balance after payout request
      setShowPayoutModal(false);
      setShowSuccessState(true);
      
      toast({
        title: "Payout Requested",
        description: "Your gift card will be sent within 48-72 hours.",
      });
    } catch (error) {
      console.error('Payout request failed:', error);
      toast({
        title: "Error",
        description: "Failed to process payout request. Please try again.",
        variant: "destructive"
      });
    }
  };

  const ProcessingTimeInfo: React.FC = () => (
    <div className="flex items-center space-x-2 text-sm text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
      <Clock className="w-4 h-4" />
      <span>Payouts processed within 48-72 hours</span>
      <Tooltip>
        <TooltipTrigger>
          <Info className="w-3 h-3 cursor-help" />
        </TooltipTrigger>
        <TooltipContent>
          Gift cards are sent to your registered email address
        </TooltipContent>
      </Tooltip>
    </div>
  );

  if (isLoading) {
    return <PaymentsSkeleton />;
  }

  if (showSuccessState) {
    return (
      <SuccessState 
        onContinue={() => setShowSuccessState(false)}
      />
    );
  }

  return (
    <TooltipProvider>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Page header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Payments & Rewards
            </h1>
            <p className="text-muted-foreground">
              Track your earnings and request payouts
            </p>
          </div>
          
          {/* Balance card */}
          <BalanceCard 
            balance={balance} 
            onPayoutClick={() => setShowPayoutModal(true)}
          />
          
          {/* Trust indicators */}
          <div className="flex items-center justify-center space-x-6 flex-wrap gap-4">
            <SecurityBadge />
            <ProcessingTimeInfo />
          </div>
          
          {/* Payment history */}
          <PaymentHistoryTable payments={paymentHistory} />
          
          {/* Payout modal */}
          <PayoutConfirmationModal
            isOpen={showPayoutModal}
            onClose={() => setShowPayoutModal(false)}
            amount={balance}
            onConfirm={handlePayoutRequest}
          />
        </div>
      </DashboardLayout>
    </TooltipProvider>
  );
};

export default Payments;
