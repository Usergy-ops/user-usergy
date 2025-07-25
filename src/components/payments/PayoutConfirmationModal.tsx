import React, { useState } from 'react';
import { CheckCircle, Clock, Info } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PayoutConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  onConfirm: () => Promise<void>;
}

export const PayoutConfirmationModal: React.FC<PayoutConfirmationModalProps> = ({
  isOpen,
  onClose,
  amount,
  onConfirm
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error('Payout confirmation failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <TooltipProvider>
      <AlertDialog open={isOpen} onOpenChange={onClose}>
        <AlertDialogContent className="max-w-md">
          {/* Animated icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-primary animate-pulse" />
              </div>
              {/* Pulse ring */}
              <div className="absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-30" />
            </div>
          </div>
          
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-xl">
              Confirm Payout Request
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-base leading-relaxed">
              You are about to request a payout of{' '}
              <span className="font-semibold text-foreground">${amount}</span>.
              Your Tremendous Gift card will be processed within{' '}
              <span className="font-semibold text-foreground">48-72 hours</span>{' '}
              and sent to your registered email.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Processing time indicator */}
          <div className="flex items-center justify-center space-x-2 text-sm bg-muted/30 rounded-lg p-3 mb-4">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              Payouts processed within 48-72 hours
            </span>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-3 h-3 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                Gift cards are sent to your registered email address
              </TooltipContent>
            </Tooltip>
          </div>
          
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel 
              onClick={onClose}
              className="px-4 py-2"
              disabled={isProcessing}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={isProcessing}
              className="px-4 py-2 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:shadow-lg transition-all duration-300"
            >
              {isProcessing ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                'Confirm Payout'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
};