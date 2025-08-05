
import { supabase } from '@/integrations/supabase/client';
import { monitoring } from '@/utils/monitoring';
import { createResourcePool } from './resourcePool';

/**
 * Query optimization utilities for better database performance
 */

// Connection pool for database operations
const dbConnectionPool = createResourcePool(
  () => ({ id: Math.random().toString(36), created: Date.now() }),
  (connection) => console.log('Releasing connection:', connection.id),
  5
);

// Optimized batch query executor
export const executeBatchQueries = async <T>(
  queries: Array<() => Promise<T>>,
  maxConcurrency: number = 3
): Promise<T[]> => {
  const results: T[] = [];
  const executing: Promise<void>[] = [];
  
  for (const query of queries) {
    const promise = (async () => {
      const connection = await dbConnectionPool.acquire();
      const startTime = performance.now();
      
      try {
        const result = await query();
        results.push(result);
        
        monitoring.recordMetric('batch_query_success', performance.now() - startTime, {
          connection_id: connection.id.toString()
        });
      } catch (error) {
        monitoring.recordMetric('batch_query_error', 1, {
          connection_id: connection.id.toString(),
          error: (error as Error).message
        });
        throw error;
      } finally {
        dbConnectionPool.release(connection);
      }
    })();
    
    executing.push(promise);
    
    // Limit concurrency
    if (executing.length >= maxConcurrency) {
      await Promise.race(executing);
      executing.splice(
        executing.findIndex(p => p === promise), 1
      );
    }
  }
  
  await Promise.all(executing);
  return results;
};

// Optimized profile queries with smart field selection
export const optimizedProfileQueries = {
  // Load only essential profile fields for initial render
  loadProfileSummary: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, full_name, email, avatar_url, completion_percentage, profile_completed, section_1_completed, section_2_completed, section_3_completed, section_4_completed, section_5_completed, section_6_completed')
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Load detailed profile data only when needed
  loadProfileDetails: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Optimized multi-table query with joins
  loadCompleteProfile: async (userId: string) => {
    const queries = [
      async () => {
        const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).single();
        if (error) throw error;
        return { data, error: null };
      },
      async () => {
        const { data, error } = await supabase.from('user_devices').select('*').eq('user_id', userId).maybeSingle();
        return { data, error };
      },
      async () => {
        const { data, error } = await supabase.from('user_tech_fluency').select('*').eq('user_id', userId).maybeSingle();
        return { data, error };
      },
      async () => {
        const { data, error } = await supabase.from('user_skills').select('*').eq('user_id', userId).maybeSingle();
        return { data, error };
      },
      async () => {
        const { data, error } = await supabase.from('consolidated_social_presence').select('*').eq('user_id', userId).maybeSingle();
        return { data, error };
      }
    ];
    
    const results = await Promise.all(queries.map(query => query()));
    
    return {
      profile: results[0]?.data,
      devices: results[1]?.data,
      techFluency: results[2]?.data,
      skills: results[3]?.data,
      socialPresence: results[4]?.data
    };
  }
};

// Query result caching with automatic invalidation
class QueryCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  
  set(key: string, data: any, ttl: number = 300000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }
  
  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
  
  clear(): void {
    this.cache.clear();
  }
}

export const queryCache = new QueryCache();

// Cached query wrapper
export const cachedQuery = async <T>(
  key: string,
  queryFn: () => Promise<T>,
  ttl: number = 300000
): Promise<T> => {
  // Check cache first
  const cached = queryCache.get(key);
  if (cached !== null) {
    monitoring.recordMetric('query_cache_hit', 1, { key });
    return cached;
  }
  
  // Execute query
  const startTime = performance.now();
  try {
    const result = await queryFn();
    queryCache.set(key, result, ttl);
    
    monitoring.recordMetric('query_cache_miss', performance.now() - startTime, { key });
    return result;
  } catch (error) {
    monitoring.recordMetric('query_cache_error', 1, { key, error: (error as Error).message });
    throw error;
  }
};
