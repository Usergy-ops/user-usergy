import React from 'react';
import { Shield } from 'lucide-react';

export const SecurityBadge: React.FC = () => (
  <div className="flex items-center space-x-2 text-sm text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
    <div className="relative">
      <Shield className="w-4 h-4" />
      <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 opacity-50 blur-sm" />
    </div>
    <span>Secure payment processing</span>
  </div>
);