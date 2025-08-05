
import { supabase } from '@/integrations/supabase/client';
import { checkRateLimit } from '@/utils/rateLimit';
import { handleError } from '@/utils/unifiedErrorHandling';
import { monitoring, trackUserAction } from '@/utils/monitoring';

class ProfilePictureUploader {
  async upload(file: File, userId: string): Promise<string> {
    monitoring.startTiming('profile_picture_upload');

    // Check rate limiting
    const rateLimitResult = await checkRateLimit(userId, 'file_upload');
    if (!rateLimitResult.allowed) {
      throw new Error('Too many file upload requests. Please try again later.');
    }

    try {
      // Validate file
      this.validateFile(file);

      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName);

      monitoring.endTiming('profile_picture_upload');
      
      trackUserAction('profile_picture_uploaded', {
        file_size: file.size,
        file_type: file.type,
        user_id: userId
      });

      return data.publicUrl;
    } catch (error) {
      monitoring.endTiming('profile_picture_upload');
      throw error;
    }
  }

  private validateFile(file: File): void {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    
    if (file.size > maxSize) {
      throw new Error('File size must be less than 5MB');
    }
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('File must be a JPEG, PNG, or WebP image');
    }
  }
}

export const profilePictureUploader = new ProfilePictureUploader();
