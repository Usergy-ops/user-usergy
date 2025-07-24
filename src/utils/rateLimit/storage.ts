
import { supabase } from '@/integrations/supabase/client';
import { RateLimitRecord } from './types';

// Fixed storage implementation that uses correct table names
export class RateLimitStorage {
  async getRecord(identifier: string, action: string, tableName: 'rate_limits' | 'enhanced_rate_limits' = 'rate_limits'): Promise<RateLimitRecord | null> {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('identifier', identifier)
        .eq('action', action)
        .maybeSingle();

      if (error) {
        console.error('Error getting rate limit record:', error);
        return null;
      }

      if (!data) return null;

      return {
        id: data.id,
        identifier: data.identifier,
        action: data.action,
        attempts: data.attempts,
        windowStart: new Date(data.window_start),
        windowEnd: data.window_end ? new Date(data.window_end) : null,
        blockedUntil: data.blocked_until ? new Date(data.blocked_until) : null,
        metadata: data.metadata || {},
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('Error in getRecord:', error);
      return null;
    }
  }

  async saveRecord(record: Omit<RateLimitRecord, 'id' | 'createdAt' | 'updatedAt'>, tableName: 'rate_limits' | 'enhanced_rate_limits' = 'rate_limits'): Promise<RateLimitRecord | null> {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .upsert({
          identifier: record.identifier,
          action: record.action,
          attempts: record.attempts,
          window_start: record.windowStart.toISOString(),
          window_end: record.windowEnd?.toISOString() || null,
          blocked_until: record.blockedUntil?.toISOString() || null,
          metadata: record.metadata || {}
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving rate limit record:', error);
        return null;
      }

      return {
        id: data.id,
        identifier: data.identifier,
        action: data.action,
        attempts: data.attempts,
        windowStart: new Date(data.window_start),
        windowEnd: data.window_end ? new Date(data.window_end) : null,
        blockedUntil: data.blocked_until ? new Date(data.blocked_until) : null,
        metadata: data.metadata || {},
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('Error in saveRecord:', error);
      return null;
    }
  }

  async cleanup(maxAge: number = 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const cutoff = new Date(Date.now() - maxAge);
      
      // Clean up both tables
      await Promise.all([
        supabase
          .from('rate_limits')
          .delete()
          .lt('created_at', cutoff.toISOString()),
        supabase
          .from('enhanced_rate_limits')
          .delete()
          .lt('created_at', cutoff.toISOString())
      ]);
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

export const rateLimitStorage = new RateLimitStorage();
