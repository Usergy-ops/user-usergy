
import { useCallback } from 'react';

export interface StandardLayoutConfig {
  headerHeight: string;
  contentPadding: string;
  maxWidth: string;
  spacing: string;
}

export const useStandardLayout = () => {
  const config: StandardLayoutConfig = {
    headerHeight: 'h-16', // 64px consistent header height
    contentPadding: 'pt-16', // 64px top padding to match header
    maxWidth: 'max-w-7xl',
    spacing: 'px-4 md:px-8'
  };

  const getLayoutClasses = useCallback((customClasses?: string) => {
    const baseClasses = `${config.contentPadding} ${config.maxWidth} mx-auto ${config.spacing}`;
    return customClasses ? `${baseClasses} ${customClasses}` : baseClasses;
  }, [config]);

  const getHeaderClasses = useCallback((customClasses?: string) => {
    const baseClasses = config.headerHeight;
    return customClasses ? `${baseClasses} ${customClasses}` : baseClasses;
  }, [config]);

  const getContentMinHeight = useCallback(() => {
    return 'min-h-[calc(100vh-4rem)]'; // Full height minus header
  }, []);

  return {
    config,
    getLayoutClasses,
    getHeaderClasses,
    getContentMinHeight
  };
};
