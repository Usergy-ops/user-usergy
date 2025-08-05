
import React from 'react';
import { UnifiedLayout } from '@/layouts/UnifiedLayout';

interface DashboardLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  sidebarContent?: React.ReactNode;
}

/**
 * @deprecated Use UnifiedLayout directly instead
 * This component is kept for backward compatibility
 */
const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children, 
  showSidebar = false, 
  sidebarContent 
}) => {
  return (
    <UnifiedLayout showSidebar={showSidebar} sidebarContent={sidebarContent}>
      {children}
    </UnifiedLayout>
  );
};

export default DashboardLayout;
