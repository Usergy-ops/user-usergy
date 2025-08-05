
/**
 * Error queue management for batch processing
 */

import { supabase } from '@/integrations/supabase/client';
import { monitoring, trackUserAction } from '@/utils/monitoring';
import type { UnifiedError, ErrorContext, ErrorLogEntry } from './types';

export class ErrorQueue {
  private queue: Array<{
    error: UnifiedError;
    context: ErrorContext;
    timestamp: Date;
  }> = [];
  
  private isProcessing = false;
  private sessionId: string;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
    
    // Process error queue periodically
    setInterval(() => this.processQueue(), 5000);
  }

  addError(error: UnifiedError, context: ErrorContext): void {
    this.queue.push({
      error,
      context,
      timestamp: new Date()
    });

    // For critical errors, process immediately
    if (error.severity === 'critical' && !this.isProcessing) {
      this.processQueue();
    }
  }

  async processQueue(): Promise<void> {
    if (this.queue.length === 0 || this.isProcessing) return;

    this.isProcessing = true;
    const batch = this.queue.splice(0, 10); // Process up to 10 errors at once
    
    try {
      const errorLogs: ErrorLogEntry[] = batch.map(({ error, context, timestamp }) => ({
        error_type: error.code || error.name,
        error_message: error.message,
        error_stack: error.stack,
        severity: error.severity || 'medium',
        context: context.component || 'unknown',
        user_id: context.userId,
        session_id: context.sessionId || this.sessionId,
        metadata: {
          ...context.metadata,
          action: context.action,
          retryable: error.retryable,
          timestamp: timestamp.toISOString()
        }
      }));

      const { error: insertError } = await supabase
        .from('error_logs')
        .insert(errorLogs);

      if (insertError) {
        console.error('Failed to insert error logs:', insertError);
        // Re-add failed errors to queue for retry
        this.queue.unshift(...batch);
      } else {
        // Track successful error logging
        trackUserAction('errors_logged', {
          count: batch.length,
          session_id: this.sessionId
        });
      }

    } catch (error) {
      console.error('Error processing error queue:', error);
      // Re-add failed errors to queue for retry
      this.queue.unshift(...batch);
    } finally {
      this.isProcessing = false;
    }
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  clearQueue(): void {
    this.queue = [];
  }
}
