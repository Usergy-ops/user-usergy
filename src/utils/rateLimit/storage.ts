
/**
 * Rate limiting storage interface - works with both database tables
 */

import { supabase } from '@/integrations/supabase/client';
import { RateLimitEntry } from './types';

export class RateLimitStorage {
  private useEnhancedTable: boolean;

  constructor(useEnhancedTable: boolean = true) {
    this.useEnhancedTable = useEnhancedTable;
  }

  private getTableName(): string {
    return this.useEnhancedTable ? 'enhanced_rate_limits' : 'rate_limits';
  }

  async findRecord(identifier: string, action: string, windowStart: Date): Promise<RateLimitEntry | null> {
    const tableName = this.getTableName();
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('identifier', identifier)
      .eq('action', action)
      .gte('window_start', windowStart.toISOString())
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data) return null;

    return {
      id: data.id,
      identifier: data.identifier,
      action: data.action,
      attempts: data.attempts,
      windowStart: new Date(data.window_start),
      windowEnd: data.window_end ? new Date(data.window_end) : undefined,
      blockedUntil: data.blocked_until ? new Date(data.blocked_until) : undefined,
      metadata: data.metadata || {},
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  async createRecord(entry: Omit<RateLimitEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    const tableName = this.getTableName();
    
    const insertData = {
      identifier: entry.identifier,
      action: entry.action,
      attempts: entry.attempts,
      window_start: entry.windowStart.toISOString(),
      window_end: entry.windowEnd?.toISOString(),
      blocked_until: entry.blockedUntil?.toISOString(),
      metadata: entry.metadata || {}
    };

    const { error } = await supabase
      .from(tableName)
      .insert(insertData);

    if (error) throw error;
  }

  async updateRecord(id: string, updates: Partial<RateLimitEntry>): Promise<void> {
    const tableName = this.getTableName();
    
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (updates.attempts !== undefined) updateData.attempts = updates.attempts;
    if (updates.blockedUntil !== undefined) {
      updateData.blocked_until = updates.blockedUntil?.toISOString() || null;
    }
    if (updates.windowEnd !== undefined) {
      updateData.window_end = updates.windowEnd?.toISOString() || null;
    }
    if (updates.metadata !== undefined) updateData.metadata = updates.metadata;

    const { error } = await supabase
      .from(tableName)
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
  }

  async deleteRecord(identifier: string, action: string): Promise<void> {
    const tableName = this.getTableName();
    
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('identifier', identifier)
      .eq('action', action);

    if (error) throw error;
  }

  async cleanup(maxAge: number = 24 * 60 * 60 * 1000): Promise<void> {
    const tableName = this.getTableName();
    const cutoff = new Date(Date.now() - maxAge);
    
    const { error } = await supabase
      .from(tableName)
      .delete()
      .lt('window_start', cutoff.toISOString())
      .or(`blocked_until.is.null,blocked_until.lt.${new Date().toISOString()}`);

    if (error) throw error;
  }
}
