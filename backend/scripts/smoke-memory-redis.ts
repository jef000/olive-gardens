import redisStore from '../src/db/redis';
import { MemoryRedisStore } from '../src/db/memoryRedis';

const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(`ASSERTION FAILED: ${message}`);
  console.log(`ok - ${message}`);
};

const run = async () => {
  assert(redisStore.isMemory === true, 'redisStore is the in-memory store (REDIS_MODE=memory)');
  assert((await redisStore.ping()) === 'PONG', 'ping works');

  await redisStore.setex('k1', 60, 'v1');
  assert((await redisStore.get('k1')) === 'v1', 'setex/get roundtrip');

  await redisStore.setex('k2', 1, 'gone');
  await new Promise((r) => setTimeout(r, 1100));
  assert((await redisStore.get('k2')) === null, 'TTL expiry enforced');

  await redisStore.sadd('s1', 'a', 'b');
  await redisStore.sadd('s1', 'b', 'c');
  const members = await redisStore.smembers('s1');
  assert(members.sort().join(',') === 'a,b,c', 'sadd/smembers');
  await redisStore.srem('s1', 'a');
  assert((await redisStore.smembers('s1')).sort().join(',') === 'b,c', 'srem');

  await redisStore.setex('refresh:token-abc', 60, JSON.stringify({ userId: 'u1' }));
  await redisStore.setex('refresh:token-xyz', 60, JSON.stringify({ userId: 'u2' }));
  const keys = await redisStore.keys('refresh:*');
  assert(keys.length === 2, `keys('refresh:*') returns both tokens`);

  const pipeline = redisStore.pipeline();
  pipeline.zremrangebyscore('rl:ip:1.2.3.4', 0, 1);
  pipeline.zcard('rl:ip:1.2.3.4');
  pipeline.zadd('rl:ip:1.2.3.4', Date.now(), `${Date.now()}`);
  pipeline.expire('rl:ip:1.2.3.4', 960);
  const results = await pipeline.exec();
  assert(results !== null && results.length === 4, 'pipeline executes 4 commands');
  assert(results![1][1] === 0, 'zcard was 0 before adding');
  assert(results![2][1] === 1, 'zadd added one member');

  const direct = redisStore as unknown as MemoryRedisStore;
  direct.zremrangebyscore('rl:ip:1.2.3.4', 0, Date.now() + 1000);
  assert(direct.zcard('rl:ip:1.2.3.4') === 0, 'zremrangebyscore removes entries within window');

  assert((await redisStore.healthCheck()) === true, 'healthCheck true');
  console.log('SMOKE TEST PASSED');
};

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
