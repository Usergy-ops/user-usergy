
import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { NetworkNodes } from '@/components/NetworkNodes';
import { useStandardLayout } from '@/hooks/useStandardLayout';
import {
  Sidebar,
  SidebarContent,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { UnifiedSidebar } from '@/components/layout/UnifiedSidebar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

interface UnifiedLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  sidebarContent?: React.ReactNode;
}

export const UnifiedLayout: React.FC<UnifiedLayoutProps> = ({ 
  children, 
  showSidebar = false,
  sidebarContent 
}) => {
  const { getContentMinHeight } = useStandardLayout();

  if (!showSidebar) {
    // Simple layout without sidebar
    return (
      <div className={`${getContentMinHeight()} bg-gradient-to-br from-background via-background/95 to-primary/5 relative overflow-hidden`}>
        {/* Animated Network Background */}
        <div className="fixed inset-0 z-0">
          <NetworkNodes />
        </div>

        {/* Header */}
        <Header />

        {/* Main Content */}
        <main className="relative z-10 pt-16 max-w-7xl mx-auto px-4 md:px-8">
          <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
            {children}
          </div>
        </main>
      </div>
    );
  }

  // Layout with sidebar
  return (
    <SidebarProvider>
      <div className={`${getContentMinHeight()} bg-gradient-to-br from-background via-background/95 to-primary/5 relative overflow-hidden w-full flex`}>
        {/* Animated Network Background */}
        <div className="fixed inset-0 z-0">
          <NetworkNodes />
        </div>

        {/* Sidebar */}
        <UnifiedSidebar>
          {sidebarContent}
        </UnifiedSidebar>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Header with sidebar trigger */}
          <header className="fixed top-0 right-0 left-0 z-50 md:left-auto border-b bg-background/80 backdrop-blur-lg">
            <div className="flex items-center justify-between h-16 px-4">
              <div className="flex items-center space-x-4">
                <SidebarTrigger className="md:hidden" />
              </div>
              <Header />
            </div>
          </header>

          {/* Main Content */}
          <main className="relative z-10 flex-1 pt-16">
            <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
              {children}
            </div>
          </main>
        </div>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />
      </div>
    </SidebarProvider>
  );
};
