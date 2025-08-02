
import React from 'react';
import { Header } from '@/components/Header';
import { NetworkNodes } from '@/components/NetworkNodes';
import { useStandardLayout } from '@/hooks/useStandardLayout';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { getLayoutClasses, getContentMinHeight } = useStandardLayout();

  return (
    <div className={`${getContentMinHeight()} bg-gradient-to-br from-background via-background/95 to-primary/5 relative overflow-hidden`}>
      {/* Animated Network Background */}
      <div className="fixed inset-0 z-0">
        <NetworkNodes />
      </div>

      {/* Use the shared Header component */}
      <Header />

      {/* Main Content - Using standardized layout system */}
      <main className={`relative z-10 ${getLayoutClasses('pb-8')}`}>
        <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
