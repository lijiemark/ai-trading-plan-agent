// Purpose: Simple deterministic in-memory TTL cache.

type CacheEntry<V> = {
  value: V;
  expiresAt: number;
};

export class TTLCache<K, V> {
  private readonly store = new Map<K, CacheEntry<V>>();

  get(key: K): V | undefined {
    const entry = this.store.get(key);
    if (!entry) {
      return undefined;
    }
    if (Date.now() >= entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: K, value: V, ttlMs: number): void {
    const expiresAt = Date.now() + Math.max(0, ttlMs);
    this.store.set(key, { value, expiresAt });
  }

  delete(key: K): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

