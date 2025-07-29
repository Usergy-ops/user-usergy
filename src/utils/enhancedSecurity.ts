/**
 * Enhanced security utilities with advanced threat detection
 */

import { supabase } from '@/integrations/supabase/client';
import { logSecurityEvent } from './security';
import { monitoring } from './monitoring';
import { handleCentralizedError } from './centralizedErrorHandling';

export interface SecurityThreat {
  type: 'brute_force' | 'sql_injection' | 'xss' | 'csrf' | 'suspicious_behavior';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: Record<string, any>;
  timestamp: Date;
}

export interface SecurityMetrics {
  threatCount: number;
  blockedAttempts: number;
  suspiciousIPs: string[];
  lastThreatDetected?: Date;
}

class EnhancedSecuritySystem {
  private threats: SecurityThreat[] = [];
  private suspiciousIPs: Set<string> = new Set();
  private blockedIPs: Set<string> = new Set();
  private rateLimitData: Map<string, { attempts: number; resetTime: number }> = new Map();

  // Detect and handle security threats
  async detectThreat(
    type: SecurityThreat['type'],
    details: Record<string, any>,
    userId?: string
  ): Promise<void> {
    try {
      const severity = this.calculateThreatSeverity(type, details);
      
      const threat: SecurityThreat = {
        type,
        severity,
        details,
        timestamp: new Date()
      };
      
      this.threats.push(threat);
      
      // Keep only last 1000 threats
      if (this.threats.length > 1000) {
        this.threats = this.threats.slice(-1000);
      }
      
      // Log to database
      await logSecurityEvent(`threat_detected_${type}`, {
        severity,
        details,
        threat_id: crypto.randomUUID()
      }, userId);
      
      // Record monitoring metric
      monitoring.recordMetric('security_threat_detected', 1, {
        threat_type: type,
        severity,
        user_id: userId || 'anonymous'
      });
      
      // Take action based on severity
      await this.handleThreatResponse(threat, userId);
      
    } catch (error) {
      await handleCentralizedError(error as Error, 'threat_detection', userId);
    }
  }

  // Calculate threat severity based on type and context
  private calculateThreatSeverity(
    type: SecurityThreat['type'],
    details: Record<string, any>
  ): SecurityThreat['severity'] {
    switch (type) {
      case 'brute_force':
        const attempts = details.attempts || 0;
        if (attempts > 20) return 'critical';
        if (attempts > 10) return 'high';
        if (attempts > 5) return 'medium';
        return 'low';
        
      case 'sql_injection':
      case 'xss':
        return 'high';
        
      case 'csrf':
        return 'medium';
        
      case 'suspicious_behavior':
        const suspicionScore = details.suspicion_score || 0;
        if (suspicionScore > 80) return 'high';
        if (suspicionScore > 60) return 'medium';
        return 'low';
        
      default:
        return 'low';
    }
  }

  // Handle threat response based on severity
  private async handleThreatResponse(threat: SecurityThreat, userId?: string): Promise<void> {
    try {
      switch (threat.severity) {
        case 'critical':
          // Immediate blocking and alerting
          if (threat.details.ip_address) {
            this.blockedIPs.add(threat.details.ip_address);
          }
          
          // Log critical security event
          await logSecurityEvent('critical_threat_response', {
            threat_type: threat.type,
            action: 'ip_blocked',
            details: threat.details
          }, userId);
          
          break;
          
        case 'high':
          // Add to suspicious IPs and increase monitoring
          if (threat.details.ip_address) {
            this.suspiciousIPs.add(threat.details.ip_address);
          }
          
          await logSecurityEvent('high_threat_response', {
            threat_type: threat.type,
            action: 'enhanced_monitoring',
            details: threat.details
          }, userId);
          
          break;
          
        case 'medium':
        case 'low':
          // Log for monitoring and analysis
          await logSecurityEvent('threat_logged', {
            threat_type: threat.type,
            severity: threat.severity,
            details: threat.details
          }, userId);
          
          break;
      }
    } catch (error) {
      console.error('Error in threat response handling:', error);
    }
  }

  // Check if IP is blocked
  isIPBlocked(ipAddress: string): boolean {
    return this.blockedIPs.has(ipAddress);
  }

  // Check if IP is suspicious
  isIPSuspicious(ipAddress: string): boolean {
    return this.suspiciousIPs.has(ipAddress);
  }

  // Advanced rate limiting with threat detection
  async checkAdvancedRateLimit(
    identifier: string,
    action: string,
    maxAttempts: number = 10,
    windowMs: number = 60000
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number; threatDetected: boolean }> {
    try {
      const now = Date.now();
      const key = `${identifier}:${action}`;
      const current = this.rateLimitData.get(key);
      
      // Reset if window expired
      if (!current || now > current.resetTime) {
        this.rateLimitData.set(key, {
          attempts: 1,
          resetTime: now + windowMs
        });
        
        return {
          allowed: true,
          remaining: maxAttempts - 1,
          resetTime: now + windowMs,
          threatDetected: false
        };
      }
      
      // Increment attempts
      current.attempts++;
      
      // Check for threat patterns
      let threatDetected = false;
      if (current.attempts > maxAttempts) {
        // Detect brute force
        await this.detectThreat('brute_force', {
          identifier,
          action,
          attempts: current.attempts,
          window_ms: windowMs,
          ip_address: identifier.includes('.') ? identifier : undefined
        });
        
        threatDetected = true;
      }
      
      return {
        allowed: current.attempts <= maxAttempts,
        remaining: Math.max(0, maxAttempts - current.attempts),
        resetTime: current.resetTime,
        threatDetected
      };
      
    } catch (error) {
      await handleCentralizedError(error as Error, 'advanced_rate_limit');
      return {
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + windowMs,
        threatDetected: true
      };
    }
  }

  // SQL injection detection
  async detectSQLInjection(input: string, userId?: string): Promise<boolean> {
    const sqlPatterns = [
      /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b)/i,
      /(\bOR\b\s+\d+\s*=\s*\d+|\bAND\b\s+\d+\s*=\s*\d+)/i,
      /(';|";\s*--|\bxp_cmdshell\b|\bsp_executesql\b)/i,
      /(\bEXEC\b|\bEXECUTE\b)(\s|\+|\/\*.*\*\/)*\(/i
    ];
    
    const detected = sqlPatterns.some(pattern => pattern.test(input));
    
    if (detected) {
      await this.detectThreat('sql_injection', {
        input: input.substring(0, 100), // Log only first 100 chars for security
        patterns_matched: sqlPatterns.filter(p => p.test(input)).length
      }, userId);
    }
    
    return detected;
  }

  // XSS detection
  async detectXSS(input: string, userId?: string): Promise<boolean> {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/i,
      /on\w+\s*=\s*["'][^"']*["']/i,
      /<iframe|<object|<embed|<link|<meta/i,
      /expression\s*\(/i
    ];
    
    const detected = xssPatterns.some(pattern => pattern.test(input));
    
    if (detected) {
      await this.detectThreat('xss', {
        input: input.substring(0, 100),
        patterns_matched: xssPatterns.filter(p => p.test(input)).length
      }, userId);
    }
    
    return detected;
  }

  // Behavioral analysis for suspicious patterns
  async analyzeBehavior(
    actions: Array<{ action: string; timestamp: number; metadata?: any }>,
    userId?: string
  ): Promise<number> {
    let suspicionScore = 0;
    
    if (actions.length === 0) return suspicionScore;
    
    // Check for rapid fire requests
    const rapidRequests = actions.filter((action, index) => {
      if (index === 0) return false;
      return action.timestamp - actions[index - 1].timestamp < 100; // Less than 100ms apart
    });
    
    if (rapidRequests.length > 5) {
      suspicionScore += 30;
    }
    
    // Check for repeated failed actions
    const failedActions = actions.filter(action => action.metadata?.failed === true);
    if (failedActions.length > actions.length * 0.7) { // More than 70% failed
      suspicionScore += 40;
    }
    
    // Check for unusual patterns
    const uniqueActions = new Set(actions.map(a => a.action));
    if (uniqueActions.size === 1 && actions.length > 20) { // Same action repeated many times
      suspicionScore += 25;
    }
    
    // Check time patterns (too regular intervals might indicate bot)
    const intervals = actions.slice(1).map((action, index) => 
      action.timestamp - actions[index].timestamp
    );
    
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    
    if (variance < 10 && intervals.length > 10) { // Very consistent timing
      suspicionScore += 20;
    }
    
    // Log if suspicious
    if (suspicionScore > 50) {
      await this.detectThreat('suspicious_behavior', {
        suspicion_score: suspicionScore,
        rapid_requests: rapidRequests.length,
        failed_actions: failedActions.length,
        unique_actions: uniqueActions.size,
        total_actions: actions.length,
        avg_interval: avgInterval,
        variance
      }, userId);
    }
    
    return suspicionScore;
  }

  // Get security metrics
  getSecurityMetrics(): SecurityMetrics {
    const recentThreats = this.threats.filter(
      threat => Date.now() - threat.timestamp.getTime() < 24 * 60 * 60 * 1000 // Last 24 hours
    );
    
    return {
      threatCount: recentThreats.length,
      blockedAttempts: this.blockedIPs.size,
      suspiciousIPs: Array.from(this.suspiciousIPs),
      lastThreatDetected: this.threats.length > 0 ? this.threats[this.threats.length - 1].timestamp : undefined
    };
  }

  // Cleanup old data
  cleanup(maxAge: number = 24 * 60 * 60 * 1000) { // 24 hours
    const cutoff = new Date(Date.now() - maxAge);
    this.threats = this.threats.filter(threat => threat.timestamp > cutoff);
    
    // Clear old rate limit data
    const now = Date.now();
    for (const [key, data] of this.rateLimitData.entries()) {
      if (now > data.resetTime) {
        this.rateLimitData.delete(key);
      }
    }
  }

  // Get recent threats for analysis
  getRecentThreats(hours: number = 24): SecurityThreat[] {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    return this.threats.filter(threat => threat.timestamp.getTime() > cutoff);
  }
}

// Export singleton instance
export const enhancedSecurity = new EnhancedSecuritySystem();

// Convenience functions
export const detectThreat = enhancedSecurity.detectThreat.bind(enhancedSecurity);
export const checkAdvancedRateLimit = enhancedSecurity.checkAdvancedRateLimit.bind(enhancedSecurity);
export const detectSQLInjection = enhancedSecurity.detectSQLInjection.bind(enhancedSecurity);
export const detectXSS = enhancedSecurity.detectXSS.bind(enhancedSecurity);
export const analyzeBehavior = enhancedSecurity.analyzeBehavior.bind(enhancedSecurity);
export const getSecurityMetrics = enhancedSecurity.getSecurityMetrics.bind(enhancedSecurity);

// Start cleanup interval
setInterval(() => {
  enhancedSecurity.cleanup();
}, 60 * 60 * 1000); // Cleanup every hour
