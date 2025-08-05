
import { lazy } from 'react';
import { withPerformanceMonitoring } from '@/utils/performance';

/**
 * Lazy-loaded profile components for better initial page load performance
 */

export const LazyBasicProfileSection = lazy(() => 
  withPerformanceMonitoring(
    () => import('@/components/profile/BasicProfileSection').then(module => ({ 
      default: module.BasicProfileSection
    })),
    'lazy_load_basic_profile'
  )()
);

export const LazyDevicesSection = lazy(() =>
  withPerformanceMonitoring(
    () => import('@/components/profile/DevicesSection').then(module => ({ 
      default: module.DevicesSection
    })),
    'lazy_load_devices_section'
  )()
);

export const LazyTechFluencySection = lazy(() =>
  withPerformanceMonitoring(
    () => import('@/components/profile/EnhancedTechFluencySection').then(module => ({ 
      default: module.EnhancedTechFluencySection
    })),
    'lazy_load_tech_fluency'
  )()
);

export const LazySkillsSection = lazy(() =>
  withPerformanceMonitoring(
    () => import('@/components/profile/SkillsInterestsSection').then(module => ({ 
      default: module.SkillsInterestsSection
    })),
    'lazy_load_skills_section'
  )()
);

export const LazySocialPresenceSection = lazy(() =>
  withPerformanceMonitoring(
    () => import('@/components/profile/EnhancedSocialPresenceSection').then(module => ({ 
      default: module.EnhancedSocialPresenceSection
    })),
    'lazy_load_social_presence'
  )()
);

export const LazyEducationWorkSection = lazy(() =>
  withPerformanceMonitoring(
    () => import('@/components/profile/EducationWorkSection').then(module => ({ 
      default: module.EducationWorkSection
    })),
    'lazy_load_education_work'
  )()
);

// Preload components based on current step
export const preloadNextComponent = (currentStep: number) => {
  const componentMap: Record<number, () => Promise<any>> = {
    1: () => import('@/components/profile/DevicesSection'),
    2: () => import('@/components/profile/EnhancedTechFluencySection'),
    3: () => import('@/components/profile/SkillsInterestsSection'),
    4: () => import('@/components/profile/EnhancedSocialPresenceSection'),
    5: () => import('@/components/profile/EducationWorkSection')
  };

  const nextComponent = componentMap[currentStep + 1];
  if (nextComponent) {
    // Preload next component in background
    setTimeout(() => {
      nextComponent().catch(console.warn);
    }, 1000);
  }
};
