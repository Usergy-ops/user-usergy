
/**
 * Core rate limiting engine
 */

import { RateLimitConfig, RateLimitResult } from './types';
import { RateLimitStorage } from './storage';
import { monitoring } from '../monitoring';

export class RateLimitEngine {
  private storage: RateLimitStorage;

  constructor(useEnhancedTable: boolean = true) {
    this.storage = new RateLimitStorage(useEnhancedTable);
  }

  async checkRateLimit(
    identifier: string,
    action: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const startTime = performance.now();
    
    try {
      monitoring.startTiming(`rate_limit_check_${action}`);
      
      const windowStart = new Date();
      windowStart.setMinutes(windowStart.getMinutes() - config.windowMinutes);
      
      const existingRecord = await this.storage.findRecord(identifier, action, windowStart);
      const now = new Date();
      
      // Check if currently blocked
      if (existingRecord?.blockedUntil && existingRecord.blockedUntil > now) {
        const escalationLevel = this.getEscalationLevel(existingRecord.metadata);
        
        const result: RateLimitResult = {
          allowed: false,
          attemptsRemaining: 0,
          resetTime: existingRecord.blockedUntil,
          blocked: true,
          blockedUntil: existingRecord.blockedUntil,
          escalationLevel
        };
        
        monitoring.recordMetric('rate_limit_blocked', 1, {
          action,
          identifier_type: identifier.includes('@') ? 'email' : 'user_id',
          escalation_level: escalationLevel.toString()
        });
        
        return result;
      }

      if (existingRecord) {
        return this.handleExistingRecord(existingRecord, config);
      } else {
        return this.createNewRecord(identifier, action, config);
      }
    } catch (error) {
      monitoring.logError(error as Error, 'rate_limiting_error', {
        identifier,
        action,
        config
      });
      
      // Default to allowing the request if rate limiting fails
      return {
        allowed: true,
        attemptsRemaining: config.maxAttempts - 1,
        resetTime: new Date(Date.now() + config.windowMinutes * 60 * 1000),
        blocked: false
      };
    } finally {
      monitoring.endTiming(`rate_limit_check_${action}`);
      
      const endTime = performance.now();
      monitoring.recordMetric('rate_limit_check_duration', endTime - startTime, {
        action,
        identifier_type: identifier.includes('@') ? 'email' : 'user_id'
      });
    }
  }

  private async handleExistingRecord(
    record: any,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const newAttempts = record.attempts + 1;
    let escalationLevel = this.getEscalationLevel(record.metadata);
    let blockDuration = config.blockDurationMinutes || 60;
    
    // Check for escalation rules
    if (config.escalationRules) {
      for (const rule of config.escalationRules) {
        if (newAttempts >= rule.attempts) {
          blockDuration = rule.blockDurationMinutes;
          escalationLevel = Math.max(escalationLevel, config.escalationRules.indexOf(rule) + 1);
        }
      }
    }
    
    const isBlocked = newAttempts > config.maxAttempts;
    const blockedUntil = isBlocked ? new Date(Date.now() + blockDuration * 60 * 1000) : undefined;
    
    // Update existing record
    await this.storage.updateRecord(record.id, {
      attempts: newAttempts,
      blockedUntil,
      metadata: {
        ...record.metadata,
        escalationLevel,
        lastAttempt: new Date().toISOString()
      }
    });

    const result: RateLimitResult = {
      allowed: !isBlocked,
      attemptsRemaining: Math.max(0, config.maxAttempts - newAttempts),
      resetTime: new Date(record.windowStart.getTime() + config.windowMinutes * 60 * 1000),
      blocked: isBlocked,
      blockedUntil,
      escalationLevel
    };

    monitoring.recordMetric('rate_limit_check', 1, {
      action: record.action,
      allowed: (!isBlocked).toString(),
      attempts_remaining: result.attemptsRemaining.toString(),
      escalation_level: escalationLevel.toString()
    });
    
    return result;
  }

  private async createNewRecord(
    identifier: string,
    action: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + config.windowMinutes * 60 * 1000);
    
    await this.storage.createRecord({
      identifier,
      action,
      attempts: 1,
      windowStart: now,
      windowEnd,
      metadata: {
        escalationLevel: 0,
        firstAttempt: now.toISOString()
      }
    });

    const result: RateLimitResult = {
      allowed: true,
      attemptsRemaining: config.maxAttempts - 1,
      resetTime: new Date(Date.now() + config.windowMinutes * 60 * 1000),
      blocked: false,
      escalationLevel: 0
    };

    monitoring.recordMetric('rate_limit_check', 1, {
      action,
      allowed: 'true',
      attempts_remaining: result.attemptsRemaining.toString(),
      escalation_level: '0'
    });
    
    return result;
  }

  private getEscalationLevel(metadata: Record<string, any> = {}): number {
    return typeof metadata.escalationLevel === 'number' ? metadata.escalationLevel : 0;
  }

  async resetRateLimit(identifier: string, action: string): Promise<void> {
    try {
      await this.storage.deleteRecord(identifier, action);
      monitoring.info(`Rate limit reset for ${action}`, 'rate_limiting', {
        identifier,
        action
      });
    } catch (error) {
      monitoring.logError(error as Error, 'reset_rate_limit_error', {
        identifier,
        action
      });
    }
  }

  async cleanup(): Promise<void> {
    await this.storage.cleanup();
  }
}
