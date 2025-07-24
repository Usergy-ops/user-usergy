
import { supabase } from '@/integrations/supabase/client';
import { RateLimitRecord } from './types';

export class RateLimitStorage {
  private tableName: 'rate_limits' | 'enhanced_rate_limits';

  constructor(useEnhancedTable: boolean = false) {
    this.tableName = useEnhancedTable ? 'enhanced_rate_limits' : 'rate_limits';
  }

  async getRecord(identifier: string, action: string): Promise<RateLimitRecord | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
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
        metadata: (data as any).metadata || {},
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('Error in getRecord:', error);
      return null;
    }
  }

  async findRecord(identifier: string, action: string, windowStart: Date): Promise<RateLimitRecord | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('identifier', identifier)
        .eq('action', action)
        .gte('window_start', windowStart.toISOString())
        .maybeSingle();

      if (error) {
        console.error('Error finding rate limit record:', error);
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
        metadata: (data as any).metadata || {},
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('Error in findRecord:', error);
      return null;
    }
  }

  async createRecord(record: Omit<RateLimitRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<RateLimitRecord | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .insert({
          identifier: record.identifier,
          action: record.action,
          attempts: record.attempts,
          window_start: record.windowStart.toISOString(),
          window_end: record.windowEnd?.toISOString() || null,
          blocked_until: record.blockedUntil?.toISOString() || null,
          ...(this.tableName === 'enhanced_rate_limits' && { metadata: record.metadata || {} })
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating rate limit record:', error);
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
        metadata: (data as any).metadata || {},
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('Error in createRecord:', error);
      return null;
    }
  }

  async updateRecord(id: string, updates: Partial<Pick<RateLimitRecord, 'attempts' | 'blockedUntil' | 'metadata'>>): Promise<RateLimitRecord | null> {
    try {
      const updateData: any = {};
      
      if (updates.attempts !== undefined) updateData.attempts = updates.attempts;
      if (updates.blockedUntil !== undefined) updateData.blocked_until = updates.blockedUntil?.toISOString() || null;
      if (updates.metadata !== undefined && this.tableName === 'enhanced_rate_limits') {
        updateData.metadata = updates.metadata;
      }

      const { data, error } = await supabase
        .from(this.tableName)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating rate limit record:', error);
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
        metadata: (data as any).metadata || {},
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('Error in updateRecord:', error);
      return null;
    }
  }

  async deleteRecord(identifier: string, action: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('identifier', identifier)
        .eq('action', action);

      if (error) {
        console.error('Error deleting rate limit record:', error);
      }
    } catch (error) {
      console.error('Error in deleteRecord:', error);
    }
  }

  async saveRecord(record: Omit<RateLimitRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<RateLimitRecord | null> {
    return this.createRecord(record);
  }

  async cleanup(maxAge: number = 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const cutoff = new Date(Date.now() - maxAge);
      
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .lt('created_at', cutoff.toISOString());

      if (error) {
        console.error('Error during cleanup:', error);
      }
    } catch (error) {
      console.error('Error in cleanup:', error);
    }
  }
}

export const rateLimitStorage = new RateLimitStorage();
