
/**
 * Refactored profile data updater with proper separation of concerns
 */

import { checkRateLimit } from '@/utils/rateLimit';
import { monitoring, trackUserAction } from '@/utils/monitoring';
import { profileSectionUpdater } from './profileSectionUpdater';
import { techFluencyUpdater } from './techFluencyUpdater';
import { skillsUpdater } from './skillsUpdater';
import { profileDataValidator } from './dataValidator';
import type { SectionUpdateData } from './types';

export class ProfileDataUpdater {
  async updateSection(section: string, data: any, userId: string): Promise<void> {
    console.log(`Updating ${section} with data:`, data);
    monitoring.startTiming(`profile_update_${section}`);

    // Check rate limiting
    const rateLimitResult = await checkRateLimit(userId, 'profile_update');
    if (!rateLimitResult.allowed) {
      throw new Error('Too many profile update requests. Please try again later.');
    }

    try {
      // Validate data before updating
      const validationResult = profileDataValidator.validateSectionData(section, data);
      console.log(`Validation result for ${section}:`, validationResult);

      if (!validationResult.isValid) {
        const errorMessage = profileDataValidator.formatErrorMessage(validationResult);
        throw new Error(errorMessage);
      }

      await this.updateSectionInDatabase(section, data, userId);

      monitoring.endTiming(`profile_update_${section}`);
      
      trackUserAction('profile_updated', {
        section,
        data_keys: Object.keys(data).join(','), // Convert array to string
        user_id: userId
      });

    } catch (error) {
      monitoring.endTiming(`profile_update_${section}`);
      throw error;
    }
  }

  private async updateSectionInDatabase(section: string, data: any, userId: string): Promise<void> {
    switch (section) {
      case 'profile':
        await profileSectionUpdater.updateProfile(data, userId);
        break;

      case 'devices':
        await profileSectionUpdater.updateDevices(data, userId);
        break;

      case 'tech_fluency':
        await techFluencyUpdater.updateTechFluency(userId, data);
        break;

      case 'skills':
        await skillsUpdater.updateSkills(userId, data);
        break;

      case 'social_presence':
        await profileSectionUpdater.updateSocialPresence(data, userId);
        break;

      default:
        throw new Error(`Unknown section: ${section}`);
    }
  }
}

export const profileDataUpdater = new ProfileDataUpdater();

// Export individual updaters for direct use if needed
export { profileSectionUpdater } from './profileSectionUpdater';
export { techFluencyUpdater } from './techFluencyUpdater';
export { skillsUpdater } from './skillsUpdater';
export { profileDataValidator } from './dataValidator';
export type { SectionUpdateData, ValidationResult } from './types';
