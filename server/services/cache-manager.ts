import { createHash } from 'crypto';

/**
 * Intelligent caching system for expensive operations
 */
export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  expiresAt: number;
  hits: number;
  lastAccessed: number;
  tags: string[];
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  tags?: string[]; // Tags for cache invalidation
  maxSize?: number; // Maximum cache size
  serialize?: boolean; // Whether to serialize data
}

export class CacheManager {
  private cache = new Map<string, CacheEntry>();
  private readonly defaultTTL = 60 * 60 * 1000; // 1 hour
  private readonly maxCacheSize = 1000;
  private readonly cleanupInterval = 5 * 60 * 1000; // 5 minutes

  constructor() {
    // Start cleanup interval
    setInterval(() => this.cleanup(), this.cleanupInterval);
  }

  /**
   * Generate cache key from input parameters
   */
  private generateKey(prefix: string, params: any): string {
    const serialized = JSON.stringify(params, Object.keys(params).sort());
    const hash = createHash('sha256').update(serialized).digest('hex').substring(0, 16);
    return `${prefix}:${hash}`;
  }

  /**
   * Get cached data
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Update access statistics
    entry.hits++;
    entry.lastAccessed = Date.now();

    return entry.data as T;
  }

  /**
   * Set cached data
   */
  async set<T>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
    const ttl = options.ttl || this.defaultTTL;
    const now = Date.now();

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttl,
      hits: 0,
      lastAccessed: now,
      tags: options.tags || []
    };

    this.cache.set(key, entry);

    // Enforce cache size limit
    if (this.cache.size > (options.maxSize || this.maxCacheSize)) {
      this.evictLeastUsed();
    }
  }

  /**
   * Get or set cached data with a factory function
   */
  async getOrSet<T>(
    prefix: string,
    params: any,
    factory: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const key = this.generateKey(prefix, params);
    
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      console.log(`[Cache] Hit for ${prefix}:${key.split(':')[1]}`);
      return cached;
    }

    // Generate new data
    console.log(`[Cache] Miss for ${prefix}:${key.split(':')[1]} - generating...`);
    const data = await factory();
    
    // Cache the result
    await this.set(key, data, options);
    
    return data;
  }

  /**
   * Invalidate cache entries by tag
   */
  async invalidateByTag(tag: string): Promise<number> {
    let invalidated = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        this.cache.delete(key);
        invalidated++;
      }
    }

    console.log(`[Cache] Invalidated ${invalidated} entries with tag: ${tag}`);
    return invalidated;
  }

  /**
   * Invalidate cache entries by prefix
   */
  async invalidateByPrefix(prefix: string): Promise<number> {
    let invalidated = 0;
    
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        invalidated++;
      }
    }

    console.log(`[Cache] Invalidated ${invalidated} entries with prefix: ${prefix}`);
    return invalidated;
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`[Cache] Cleared ${size} entries`);
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const entries = Array.from(this.cache.values());
    const now = Date.now();
    
    return {
      totalEntries: this.cache.size,
      totalHits: entries.reduce((sum, entry) => sum + entry.hits, 0),
      averageAge: entries.length > 0 
        ? entries.reduce((sum, entry) => sum + (now - entry.timestamp), 0) / entries.length 
        : 0,
      expiredEntries: entries.filter(entry => now > entry.expiresAt).length,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[Cache] Cleaned up ${cleaned} expired entries`);
    }
  }

  /**
   * Evict least recently used entries
   */
  private evictLeastUsed(): void {
    const entries = Array.from(this.cache.entries());
    
    // Sort by last accessed time (oldest first)
    entries.sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);
    
    // Remove oldest 10% of entries
    const toRemove = Math.ceil(entries.length * 0.1);
    
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }

    console.log(`[Cache] Evicted ${toRemove} least used entries`);
  }

  /**
   * Estimate memory usage (rough calculation)
   */
  private estimateMemoryUsage(): number {
    let size = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      size += key.length * 2; // String characters are 2 bytes
      size += JSON.stringify(entry.data).length * 2;
      size += 64; // Overhead for entry metadata
    }

    return size;
  }
}

// Singleton instance
export const cacheManager = new CacheManager();

/**
 * Cache decorators for common operations
 */
export class CacheDecorators {
  /**
   * Cache AI validation results
   */
  static cacheValidation<T>(
    ttl: number = 24 * 60 * 60 * 1000 // 24 hours
  ) {
    return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      const originalMethod = descriptor.value;

      descriptor.value = async function(...args: any[]) {
        const params = {
          title: args[0],
          marketCategory: args[1],
          problemDescription: args[2],
          solutionDescription: args[3],
          targetAudience: args[4]
        };

        return cacheManager.getOrSet(
          'validation',
          params,
          () => originalMethod.apply(this, args),
          { 
            ttl,
            tags: ['ai-validation', `market:${params.marketCategory}`]
          }
        );
      };

      return descriptor;
    };
  }

  /**
   * Cache market intelligence results
   */
  static cacheMarketIntelligence<T>(
    ttl: number = 7 * 24 * 60 * 60 * 1000 // 7 days
  ) {
    return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      const originalMethod = descriptor.value;

      descriptor.value = async function(...args: any[]) {
        const params = {
          title: args[0],
          marketCategory: args[1],
          targetAudience: args[2]
        };

        return cacheManager.getOrSet(
          'market-intelligence',
          params,
          () => originalMethod.apply(this, args),
          { 
            ttl,
            tags: ['market-research', `market:${params.marketCategory}`]
          }
        );
      };

      return descriptor;
    };
  }

  /**
   * Cache competitive analysis results
   */
  static cacheCompetitiveAnalysis<T>(
    ttl: number = 7 * 24 * 60 * 60 * 1000 // 7 days
  ) {
    return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      const originalMethod = descriptor.value;

      descriptor.value = async function(...args: any[]) {
        const params = {
          title: args[0],
          marketCategory: args[1]
        };

        return cacheManager.getOrSet(
          'competitive-analysis',
          params,
          () => originalMethod.apply(this, args),
          { 
            ttl,
            tags: ['competitive-analysis', `market:${params.marketCategory}`]
          }
        );
      };

      return descriptor;
    };
  }

  /**
   * Cache founder matching results
   */
  static cacheFounderMatching<T>(
    ttl: number = 60 * 60 * 1000 // 1 hour
  ) {
    return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      const originalMethod = descriptor.value;

      descriptor.value = async function(...args: any[]) {
        const params = {
          userId: args[0],
          limit: args[1] || 10
        };

        return cacheManager.getOrSet(
          'founder-matching',
          params,
          () => originalMethod.apply(this, args),
          { 
            ttl,
            tags: ['founder-matching', `user:${params.userId}`]
          }
        );
      };

      return descriptor;
    };
  }
}

/**
 * Cache invalidation helpers
 */
export class CacheInvalidation {
  /**
   * Invalidate user-specific caches when user data changes
   */
  static async invalidateUserCaches(userId: string): Promise<void> {
    await cacheManager.invalidateByTag(`user:${userId}`);
  }

  /**
   * Invalidate market-specific caches when market data changes
   */
  static async invalidateMarketCaches(marketCategory: string): Promise<void> {
    await cacheManager.invalidateByTag(`market:${marketCategory}`);
  }

  /**
   * Invalidate all AI-related caches
   */
  static async invalidateAICaches(): Promise<void> {
    await cacheManager.invalidateByTag('ai-validation');
    await cacheManager.invalidateByTag('market-research');
    await cacheManager.invalidateByTag('competitive-analysis');
  }
}
