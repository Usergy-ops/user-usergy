
/**
 * Unified rate limit manager - consolidates all rate limiting functionality
 */

import { RateLimitEngine } from './core';
import { getConfig } from './config';
import { RateLimitConfig, RateLimitResult } from './types';
import { monitoring } from '../monitoring';

export class RateLimitManager {
  private static instance: RateLimitManager;
  private standardEngine: RateLimitEngine;
  private enhancedEngine: RateLimitEngine;

  private constructor() {
    this.standardEngine = new RateLimitEngine(false);
    this.enhancedEngine = new RateLimitEngine(true);
  }

  public static getInstance(): RateLimitManager {
    if (!RateLimitManager.instance) {
      RateLimitManager.instance = new RateLimitManager();
    }
    return RateLimitManager.instance;
  }

  async checkLimit(
    identifier: string,
    action: string,
    enhanced: boolean = true,
    customConfig?: RateLimitConfig
  ): Promise<RateLimitResult> {
    const engine = enhanced ? this.enhancedEngine : this.standardEngine;
    const config = customConfig || getConfig(action);
    
    monitoring.startTiming(`rate_limit_${action}`);
    
    try {
      const result = await engine.checkRateLimit(identifier, action, config);
      
      monitoring.recordMetric('rate_limit_check', 1, {
        action,
        allowed: result.allowed.toString(),
        enhanced: enhanced.toString()
      });
      
      return result;
    } finally {
      monitoring.endTiming(`rate_limit_${action}`);
    }
  }

  async resetLimit(identifier: string, action: string, enhanced: boolean = true): Promise<void> {
    const engine = enhanced ? this.enhancedEngine : this.standardEngine;
    await engine.resetRateLimit(identifier, action);
  }

  async cleanup(): Promise<void> {
    await Promise.all([
      this.standardEngine.cleanup(),
      this.enhancedEngine.cleanup()
    ]);
  }
}

export const rateLimitManager = RateLimitManager.getInstance();
