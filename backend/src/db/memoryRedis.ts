/**
 * In-memory implementation of the Redis subset used by this API.
 *
 * Used when no Redis server is available (e.g. shared hosting) or when
 * REDIS_MODE=memory is forced. Correct for single-process deployments
 * such as cPanel/Passenger Node.js apps.
 */

interface ValueEntry { value: string; expiresAt: number | null; }
interface SetEntry { members: Set<string>; expiresAt: number | null; }
interface ZSetEntry { entries: Array<{ score: number; member: string }>; expiresAt: number | null; }

const now = () => Date.now();
const expired = (expiresAt: number | null) => expiresAt !== null && expiresAt <= now();

export class MemoryRedisStore {
  private values = new Map<string, ValueEntry>();
  private sets = new Map<string, SetEntry>();
  private zsets = new Map<string, ZSetEntry>();
  private sweeper: ReturnType<typeof setInterval> | null;

  constructor() {
    this.sweeper = setInterval(() => this.sweep(), 60_000);
    if (this.sweeper && 'unref' in this.sweeper) (this.sweeper as NodeJS.Timeout).unref();
  }

  get status(): string {
    return 'ready';
  }

  readonly isMemory = true;

  sweep(): void {
    for (const [key, entry] of this.values) if (expired(entry.expiresAt)) this.values.delete(key);
    for (const [key, entry] of this.sets) if (expired(entry.expiresAt)) this.sets.delete(key);
    for (const [key, entry] of this.zsets) if (expired(entry.expiresAt)) this.zsets.delete(key);
  }

  async get(key: string): Promise<string | null> {
    const entry = this.values.get(key);
    if (!entry) return null;
    if (expired(entry.expiresAt)) {
      this.values.delete(key);
      return null;
    }
    return entry.value;
  }

  async setex(key: string, seconds: number, value: string): Promise<string> {
    this.values.set(key, { value, expiresAt: now() + seconds * 1000 });
    return 'OK';
  }

  async del(...keys: string[]): Promise<number> {
    let removed = 0;
    for (const key of keys) {
      if (this.values.delete(key)) removed += 1;
      if (this.sets.delete(key)) removed += 1;
      if (this.zsets.delete(key)) removed += 1;
    }
    return removed;
  }

  async keys(pattern: string): Promise<string[]> {
    const source = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
    const regex = new RegExp(`^${source}$`);
    const matches: string[] = [];
    for (const [key, entry] of this.values) {
      if (expired(entry.expiresAt)) {
        this.values.delete(key);
        continue;
      }
      if (regex.test(key)) matches.push(key);
    }
    return matches;
  }

  async sadd(key: string, ...members: string[]): Promise<number> {
    let entry = this.sets.get(key);
    if (!entry || expired(entry.expiresAt)) {
      entry = { members: new Set(), expiresAt: null };
      this.sets.set(key, entry);
    }
    let added = 0;
    for (const member of members) {
      if (!entry.members.has(member)) {
        entry.members.add(member);
        added += 1;
      }
    }
    return added;
  }

  async smembers(key: string): Promise<string[]> {
    const entry = this.sets.get(key);
    if (!entry) return [];
    if (expired(entry.expiresAt)) {
      this.sets.delete(key);
      return [];
    }
    return [...entry.members];
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    const entry = this.sets.get(key);
    if (!entry) return 0;
    let removed = 0;
    for (const member of members) {
      if (entry.members.delete(member)) removed += 1;
    }
    if (!entry.members.size) this.sets.delete(key);
    return removed;
  }

  async zrem(key: string, ...members: string[]): Promise<number> {
    const entry = this.zsets.get(key);
    if (!entry) return 0;
    const before = entry.entries.length;
    const memberSet = new Set(members);
    entry.entries = entry.entries.filter((item) => !memberSet.has(item.member));
    if (!entry.entries.length) this.zsets.delete(key);
    return before - entry.entries.length;
  }

  zremrangebyscore(key: string, min: number, max: number): number {
    const entry = this.zsets.get(key);
    if (!entry) return 0;
    const before = entry.entries.length;
    entry.entries = entry.entries.filter((item) => item.score < min || item.score > max);
    if (!entry.entries.length) this.zsets.delete(key);
    return before - entry.entries.length;
  }

  zcard(key: string): number {
    const entry = this.zsets.get(key);
    if (!entry) return 0;
    if (expired(entry.expiresAt)) {
      this.zsets.delete(key);
      return 0;
    }
    return entry.entries.length;
  }

  zadd(key: string, score: number, member: string): number {
    let entry = this.zsets.get(key);
    if (!entry || expired(entry.expiresAt)) {
      entry = { entries: [], expiresAt: null };
      this.zsets.set(key, entry);
    }
    const existing = entry.entries.find((item) => item.member === member);
    if (existing) {
      existing.score = score;
      return 0;
    }
    entry.entries.push({ score, member });
    return 1;
  }

  expire(key: string, seconds: number): number {
    const expiresAt = now() + seconds * 1000;
    let affected = 0;
    const value = this.values.get(key);
    const set = this.sets.get(key);
    const zset = this.zsets.get(key);
    if (value) {
      value.expiresAt = expiresAt;
      affected += 1;
    }
    if (set) {
      set.expiresAt = expiresAt;
      affected += 1;
    }
    if (zset) {
      zset.expiresAt = expiresAt;
      affected += 1;
    }
    return affected;
  }

  pipeline(): MemoryPipeline {
    return new MemoryPipeline(this);
  }

  async ping(): Promise<string> {
    return 'PONG';
  }

  async quit(): Promise<string> {
    this.close();
    return 'OK';
  }

  disconnect(): void {
    this.close();
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }

  private close(): void {
    if (this.sweeper) {
      clearInterval(this.sweeper);
      this.sweeper = null;
    }
  }
}

export class MemoryPipeline {
  private readonly commands: Array<() => [Error | null, unknown]> = [];

  constructor(private readonly store: MemoryRedisStore) {}

  zremrangebyscore(key: string, min: number, max: number): this {
    this.commands.push(() => [null, this.store.zremrangebyscore(key, min, max)]);
    return this;
  }

  zcard(key: string): this {
    this.commands.push(() => [null, this.store.zcard(key)]);
    return this;
  }

  zadd(key: string, score: number, member: string): this {
    this.commands.push(() => [null, this.store.zadd(key, score, member)]);
    return this;
  }

  expire(key: string, seconds: number): this {
    this.commands.push(() => [null, this.store.expire(key, seconds)]);
    return this;
  }

  async exec(): Promise<Array<[Error | null, unknown]> | null> {
    const results: Array<[Error | null, unknown]> = [];
    for (const command of this.commands) {
      try {
        results.push(command());
      } catch (error) {
        results.push([error instanceof Error ? error : new Error(String(error)), null]);
      }
    }
    return results;
  }
}
