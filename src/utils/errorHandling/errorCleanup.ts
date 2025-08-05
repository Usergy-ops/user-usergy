
/**
 * Cleanup utilities for error handling system
 */

import { supabase } from '@/integrations/supabase/client';
import { monitoring } from '@/utils/monitoring';

export interface CleanupOptions {
  daysToKeep?: number;
  maxErrors?: number;
  cleanupValidationErrors?: boolean;
  cleanupLowSeverityErrors?: boolean;
}

export class ErrorCleanupManager {
  private static instance: ErrorCleanupManager;

  public static getInstance(): ErrorCleanupManager {
    if (!ErrorCleanupManager.instance) {
      ErrorCleanupManager.instance = new ErrorCleanupManager();
    }
    return ErrorCleanupManager.instance;
  }

  async cleanupOldErrors(options: CleanupOptions = {}): Promise<void> {
    const {
      daysToKeep = 30,
      maxErrors = 10000,
      cleanupValidationErrors = true,
      cleanupLowSeverityErrors = true
    } = options;

    try {
      monitoring.startTiming('error_cleanup');

      // Clean up by age
      await this.cleanupByAge(daysToKeep);

      // Clean up by count
      await this.cleanupByCount(maxErrors);

      // Clean up validation errors if requested
      if (cleanupValidationErrors) {
        await this.cleanupValidationErrors();
      }

      // Clean up low severity errors if requested
      if (cleanupLowSeverityErrors) {
        await this.cleanupLowSeverityErrors();
      }

      monitoring.endTiming('error_cleanup');
      console.log('Error cleanup completed successfully');

    } catch (error) {
      monitoring.endTiming('error_cleanup');
      console.error('Error cleanup failed:', error);
      throw error;
    }
  }

  private async cleanupByAge(daysToKeep: number): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const { error } = await supabase
      .from('error_logs')
      .delete()
      .lt('created_at', cutoffDate.toISOString());

    if (error) {
      throw new Error(`Failed to cleanup old errors: ${error.message}`);
    }
  }

  private async cleanupByCount(maxErrors: number): Promise<void> {
    const { data: totalCount } = await supabase
      .from('error_logs')
      .select('id', { count: 'exact', head: true });

    if (totalCount && totalCount > maxErrors) {
      const excessCount = totalCount - maxErrors;

      const { error } = await supabase
        .from('error_logs')
        .delete()
        .order('created_at', { ascending: true })
        .limit(excessCount);

      if (error) {
        throw new Error(`Failed to cleanup excess errors: ${error.message}`);
      }
    }
  }

  private async cleanupValidationErrors(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7); // Keep validation errors for only 7 days

    const { error } = await supabase
      .from('error_logs')
      .delete()
      .eq('error_type', 'ValidationError')
      .lt('created_at', cutoffDate.toISOString());

    if (error) {
      throw new Error(`Failed to cleanup validation errors: ${error.message}`);
    }
  }

  private async cleanupLowSeverityErrors(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 14); // Keep low severity errors for only 14 days

    const { error } = await supabase
      .from('error_logs')
      .delete()
      .eq('severity', 'low')
      .lt('created_at', cutoffDate.toISOString());

    if (error) {
      throw new Error(`Failed to cleanup low severity errors: ${error.message}`);
    }
  }

  async getCleanupStatistics(): Promise<{
    totalErrors: number;
    oldestError: Date | null;
    newestError: Date | null;
    bySeverity: Record<string, number>;
  }> {
    const { data: errors } = await supabase
      .from('error_logs')
      .select('created_at, severity');

    if (!errors || errors.length === 0) {
      return {
        totalErrors: 0,
        oldestError: null,
        newestError: null,
        bySeverity: {}
      };
    }

    const dates = errors.map(e => new Date(e.created_at)).sort();
    const bySeverity = errors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalErrors: errors.length,
      oldestError: dates[0],
      newestError: dates[dates.length - 1],
      bySeverity
    };
  }
}

export const errorCleanupManager = ErrorCleanupManager.getInstance();
