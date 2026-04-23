// ============================================================================
// REPOSITORY INTERFACE - Cache
// ============================================================================

export interface ICacheRepository {
  /**
   * Get a value from cache
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Set a value in cache
   */
  set<T>(key: string, value: T, ttl?: number): Promise<void>;

  /**
   * Delete a value from cache
   */
  delete(key: string): Promise<void>;

  /**
   * Check if cache is connected
   */
  isConnected(): boolean;

  /**
   * Connect to cache
   */
  connect(): Promise<void>;

  /**
   * Disconnect from cache
   */
  disconnect(): Promise<void>;
}
