import React, { useState } from 'react';
import { format } from 'date-fns';
import { StatusBadge } from './StatusBadge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface Payment {
  id: string;
  date: Date;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  reference: string;
}

interface PaymentHistoryTableProps {
  payments: Payment[];
}

const ITEMS_PER_PAGE = 10;

const EmptyPaymentHistory: React.FC = () => (
  <div className="py-16 text-center">
    <div className="mb-6">
      <svg className="w-32 h-32 mx-auto" viewBox="0 0 200 200">
        <g className="animate-bounce" style={{ animationDuration: '3s' }}>
          <rect x="60" y="80" width="80" height="60" rx="8" 
                fill="hsl(var(--muted))" stroke="hsl(var(--muted-foreground))" strokeWidth="2" />
          <path d="M60 100 L140 100" stroke="hsl(var(--muted-foreground))" strokeWidth="2" />
          
          {/* Floating coins */}
          <g className="animate-pulse">
            <circle cx="100" cy="50" r="10" fill="hsl(var(--primary))" opacity="0.6" />
            <circle cx="130" cy="60" r="8" fill="hsl(var(--primary))" opacity="0.4" />
            <circle cx="70" cy="60" r="8" fill="hsl(var(--primary))" opacity="0.4" />
          </g>
        </g>
      </svg>
    </div>
    <h3 className="text-lg font-semibold text-foreground mb-2">
      No payments yet
    </h3>
    <p className="text-muted-foreground">
      Complete projects to earn rewards and request payouts
    </p>
  </div>
);

export const PaymentHistoryTable: React.FC<PaymentHistoryTableProps> = ({ payments }) => {
  const [currentPage, setCurrentPage] = useState(1);
  
  const totalPages = Math.ceil(payments.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentPayments = payments.slice(startIndex, endIndex);

  const formatDate = (date: Date) => {
    return format(date, 'MMM dd, yyyy');
  };

  if (payments.length === 0) {
    return (
      <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 overflow-hidden">
        <div className="p-6 border-b border-border/50">
          <h2 className="text-xl font-semibold text-foreground">
            Payment History
          </h2>
        </div>
        <EmptyPaymentHistory />
      </div>
    );
  }

  return (
    <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 overflow-hidden">
      <div className="p-6 border-b border-border/50">
        <h2 className="text-xl font-semibold text-foreground">
          Payment History
        </h2>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/50 bg-muted/30 hover:bg-muted/30">
              <TableHead className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                Date
              </TableHead>
              <TableHead className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                Amount
              </TableHead>
              <TableHead className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                Reference
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentPayments.map((payment, index) => (
              <TableRow 
                key={payment.id}
                className={`border-b border-border/30 transition-all duration-300 hover:bg-muted/20 hover:scale-[1.01] ${
                  index % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                }`}
              >
                <TableCell className="px-6 py-4 text-sm text-foreground">
                  {formatDate(payment.date)}
                </TableCell>
                <TableCell className="px-6 py-4">
                  <span className="text-sm font-medium bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                    ${payment.amount}
                  </span>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <StatusBadge status={payment.status} />
                </TableCell>
                <TableCell className="px-6 py-4 text-sm text-muted-foreground">
                  {payment.reference}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Custom pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-border/50">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {[...Array(totalPages)].map((_, i) => (
                <PaginationItem key={i + 1}>
                  <PaginationLink
                    onClick={() => setCurrentPage(i + 1)}
                    isActive={currentPage === i + 1}
                    className="cursor-pointer"
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};