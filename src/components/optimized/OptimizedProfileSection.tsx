
import React, { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface OptimizedProfileSectionProps {
  title: string;
  children: React.ReactNode;
  completed?: boolean;
  required?: boolean;
  className?: string;
}

/**
 * Performance-optimized profile section component with React.memo
 */
export const OptimizedProfileSection = memo<OptimizedProfileSectionProps>(({ 
  title, 
  children, 
  completed = false, 
  required = false,
  className = "" 
}) => {
  // Memoize computed styles to prevent recalculation
  const sectionStyles = useMemo(() => ({
    card: `transition-all duration-200 ${completed ? 'border-green-500' : ''} ${className}`,
    header: `flex items-center justify-between ${completed ? 'text-green-700' : ''}`,
    indicator: completed ? 'text-green-500' : required ? 'text-red-500' : 'text-gray-400'
  }), [completed, required, className]);

  // Memoize header content
  const headerContent = useMemo(() => (
    <div className={sectionStyles.header}>
      <CardTitle className="text-lg font-medium">{title}</CardTitle>
      <div className="flex items-center space-x-2">
        {required && !completed && (
          <span className="text-sm text-red-500">Required</span>
        )}
        <div className={`w-3 h-3 rounded-full ${sectionStyles.indicator}`}>
          {completed && (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      </div>
    </div>
  ), [title, required, completed, sectionStyles]);

  return (
    <Card className={sectionStyles.card}>
      <CardHeader className="pb-4">
        {headerContent}
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
});

OptimizedProfileSection.displayName = 'OptimizedProfileSection';
